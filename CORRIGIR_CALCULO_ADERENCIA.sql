-- =====================================================================
-- CORRIGIR CÁLCULO DE ADERÊNCIA - REPLICAR LÓGICA DO EXCEL
-- =====================================================================
-- Horas a Entregar = SUM(DISTINCT duracao_do_periodo * numero_minimo)
-- Horas Entregues = SUM(tempo_disponivel_absoluto_segundos)
-- =====================================================================

DROP FUNCTION IF EXISTS public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano INTEGER DEFAULT NULL,
  p_semana INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_sub_praca TEXT DEFAULT NULL,
  p_origem TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET statement_timeout = '120s'
SET work_mem = '256MB'
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := true;
  v_assigned_pracas TEXT[] := ARRAY[]::TEXT[];
  v_limite_semanas INTEGER := 15;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    BEGIN
      SELECT 
        COALESCE(is_admin, true),
        COALESCE(assigned_pracas, ARRAY[]::TEXT[])
      INTO v_is_admin, v_assigned_pracas
      FROM user_profiles
      WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
      v_is_admin := true;
      v_assigned_pracas := ARRAY[]::TEXT[];
    END;
  END IF;
  
  IF v_is_admin AND p_ano IS NULL AND p_semana IS NULL AND p_praca IS NULL THEN
    v_limite_semanas := 52;
  END IF;
  
  RETURN jsonb_build_object(
    'totais', (
      SELECT jsonb_build_object(
        'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
        'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
        'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
        'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
      )
      FROM dados_corridas
      WHERE (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_numero = p_semana)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
        AND (p_origem IS NULL OR origem = p_origem)
        AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
    ),
    'semanal', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana,
          ROUND(horas_a_entregar / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE 
              WHEN horas_a_entregar > 0 
              THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / horas_a_entregar::NUMERIC * 100)
              ELSE 0 
            END, 1
          ) AS aderencia_percentual
        FROM (
          -- Subconsulta para calcular horas a entregar (remover duplicadas)
          SELECT 
            dc.ano_iso,
            dc.semana_numero,
            dc.tempo_disponivel_absoluto_segundos,
            (
              SELECT SUM(DISTINCT duracao_do_periodo * numero_minimo_de_entregadores_regulares_na_escala)
              FROM dados_corridas dc2
              WHERE dc2.ano_iso = dc.ano_iso
                AND dc2.semana_numero = dc.semana_numero
                AND (p_praca IS NULL OR dc2.praca = p_praca)
                AND (p_sub_praca IS NULL OR dc2.sub_praca = p_sub_praca)
                AND (p_origem IS NULL OR dc2.origem = p_origem)
                AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc2.praca = ANY(v_assigned_pracas)))
            ) AS horas_a_entregar
          FROM dados_corridas dc
          WHERE (p_ano IS NULL OR dc.ano_iso = p_ano)
            AND (p_praca IS NULL OR dc.praca = p_praca)
            AND (p_sub_praca IS NULL OR dc.sub_praca = p_sub_praca)
            AND (p_origem IS NULL OR dc.origem = p_origem)
            AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc.praca = ANY(v_assigned_pracas)))
            AND dc.ano_iso IS NOT NULL 
            AND dc.semana_numero IS NOT NULL
        ) subq
        GROUP BY ano_iso, semana_numero, horas_a_entregar
        ORDER BY ano_iso DESC, semana_numero DESC
        LIMIT v_limite_semanas
      ) t
    ), '[]'::jsonb),
    'dia', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          EXTRACT(ISODOW FROM data_do_periodo)::INTEGER AS dia_iso,
          CASE EXTRACT(ISODOW FROM data_do_periodo)::INTEGER
            WHEN 1 THEN 'Segunda'
            WHEN 2 THEN 'Terça'
            WHEN 3 THEN 'Quarta'
            WHEN 4 THEN 'Quinta'
            WHEN 5 THEN 'Sexta'
            WHEN 6 THEN 'Sábado'
            WHEN 7 THEN 'Domingo'
          END AS dia_da_semana,
          ROUND(horas_a_entregar / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE 
              WHEN horas_a_entregar > 0 
              THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / horas_a_entregar::NUMERIC * 100)
              ELSE 0 
            END, 1
          ) AS aderencia_percentual,
          COALESCE(SUM(numero_de_corridas_ofertadas), 0) AS corridas_ofertadas,
          COALESCE(SUM(numero_de_corridas_aceitas), 0) AS corridas_aceitas,
          COALESCE(SUM(numero_de_corridas_rejeitadas), 0) AS corridas_rejeitadas,
          COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas,
          ROUND(
            CASE 
              WHEN SUM(COALESCE(numero_de_corridas_ofertadas, 0)) > 0 
              THEN (SUM(COALESCE(numero_de_corridas_aceitas, 0))::NUMERIC / 
                    SUM(COALESCE(numero_de_corridas_ofertadas, 0))::NUMERIC * 100)
              ELSE 0 
            END, 1
          ) AS taxa_aceitacao,
          ROUND(
            CASE 
              WHEN SUM(COALESCE(numero_de_corridas_aceitas, 0)) > 0 
              THEN (SUM(COALESCE(numero_de_corridas_completadas, 0))::NUMERIC / 
                    SUM(COALESCE(numero_de_corridas_aceitas, 0))::NUMERIC * 100)
              ELSE 0 
            END, 1
          ) AS taxa_completude
        FROM (
          SELECT 
            dc.data_do_periodo,
            dc.numero_de_corridas_ofertadas,
            dc.numero_de_corridas_aceitas,
            dc.numero_de_corridas_rejeitadas,
            dc.numero_de_corridas_completadas,
            dc.tempo_disponivel_absoluto_segundos,
            (
              SELECT SUM(DISTINCT duracao_do_periodo * numero_minimo_de_entregadores_regulares_na_escala)
              FROM dados_corridas dc2
              WHERE dc2.data_do_periodo = dc.data_do_periodo
                AND (p_ano IS NULL OR dc2.ano_iso = p_ano)
                AND (p_semana IS NULL OR dc2.semana_numero = p_semana)
                AND (p_praca IS NULL OR dc2.praca = p_praca)
                AND (p_sub_praca IS NULL OR dc2.sub_praca = p_sub_praca)
                AND (p_origem IS NULL OR dc2.origem = p_origem)
                AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc2.praca = ANY(v_assigned_pracas)))
            ) AS horas_a_entregar
          FROM dados_corridas dc
          WHERE (p_ano IS NULL OR dc.ano_iso = p_ano)
            AND (p_semana IS NULL OR dc.semana_numero = p_semana)
            AND (p_praca IS NULL OR dc.praca = p_praca)
            AND (p_sub_praca IS NULL OR dc.sub_praca = p_sub_praca)
            AND (p_origem IS NULL OR dc.origem = p_origem)
            AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc.praca = ANY(v_assigned_pracas)))
            AND dc.data_do_periodo IS NOT NULL
        ) subq
        GROUP BY EXTRACT(ISODOW FROM data_do_periodo), horas_a_entregar
        ORDER BY dia_iso
      ) t
    ), '[]'::jsonb),
    'turno', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          periodo,
          ROUND(horas_a_entregar / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE 
              WHEN horas_a_entregar > 0 
              THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / horas_a_entregar::NUMERIC * 100)
              ELSE 0 
            END, 1
          ) AS aderencia_percentual,
          COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas
        FROM (
          SELECT 
            dc.periodo,
            dc.numero_de_corridas_completadas,
            dc.tempo_disponivel_absoluto_segundos,
            (
              SELECT SUM(DISTINCT duracao_do_periodo * numero_minimo_de_entregadores_regulares_na_escala)
              FROM dados_corridas dc2
              WHERE dc2.periodo = dc.periodo
                AND (p_ano IS NULL OR dc2.ano_iso = p_ano)
                AND (p_semana IS NULL OR dc2.semana_numero = p_semana)
                AND (p_praca IS NULL OR dc2.praca = p_praca)
                AND (p_sub_praca IS NULL OR dc2.sub_praca = p_sub_praca)
                AND (p_origem IS NULL OR dc2.origem = p_origem)
                AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc2.praca = ANY(v_assigned_pracas)))
            ) AS horas_a_entregar
          FROM dados_corridas dc
          WHERE (p_ano IS NULL OR dc.ano_iso = p_ano)
            AND (p_semana IS NULL OR dc.semana_numero = p_semana)
            AND (p_praca IS NULL OR dc.praca = p_praca)
            AND (p_sub_praca IS NULL OR dc.sub_praca = p_sub_praca)
            AND (p_origem IS NULL OR dc.origem = p_origem)
            AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc.praca = ANY(v_assigned_pracas)))
            AND dc.periodo IS NOT NULL
        ) subq
        GROUP BY periodo, horas_a_entregar
        ORDER BY periodo
      ) t
    ), '[]'::jsonb),
    'sub_praca', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          sub_praca,
          ROUND(horas_a_entregar / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE 
              WHEN horas_a_entregar > 0 
              THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / horas_a_entregar::NUMERIC * 100)
              ELSE 0 
            END, 1
          ) AS aderencia_percentual,
          COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas
        FROM (
          SELECT 
            dc.sub_praca,
            dc.numero_de_corridas_completadas,
            dc.tempo_disponivel_absoluto_segundos,
            (
              SELECT SUM(DISTINCT duracao_do_periodo * numero_minimo_de_entregadores_regulares_na_escala)
              FROM dados_corridas dc2
              WHERE dc2.sub_praca = dc.sub_praca
                AND (p_ano IS NULL OR dc2.ano_iso = p_ano)
                AND (p_semana IS NULL OR dc2.semana_numero = p_semana)
                AND (p_praca IS NULL OR dc2.praca = p_praca)
                AND (p_sub_praca IS NULL OR dc2.sub_praca = p_sub_praca)
                AND (p_origem IS NULL OR dc2.origem = p_origem)
                AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc2.praca = ANY(v_assigned_pracas)))
            ) AS horas_a_entregar
          FROM dados_corridas dc
          WHERE (p_ano IS NULL OR dc.ano_iso = p_ano)
            AND (p_semana IS NULL OR dc.semana_numero = p_semana)
            AND (p_praca IS NULL OR dc.praca = p_praca)
            AND (p_sub_praca IS NULL OR dc.sub_praca = p_sub_praca)
            AND (p_origem IS NULL OR dc.origem = p_origem)
            AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc.praca = ANY(v_assigned_pracas)))
            AND dc.sub_praca IS NOT NULL
        ) subq
        GROUP BY sub_praca, horas_a_entregar
        ORDER BY corridas_completadas DESC
        LIMIT 50
      ) t
    ), '[]'::jsonb),
    'origem', '[]'::jsonb,
    'dimensoes', jsonb_build_object(
      'anos', (
        SELECT COALESCE(jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC), '[]'::jsonb)
        FROM dados_corridas
        WHERE ano_iso IS NOT NULL
          AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
      ),
      'semanas', (
        SELECT COALESCE(jsonb_agg(DISTINCT ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') 
               ORDER BY ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') DESC), '[]'::jsonb)
        FROM dados_corridas
        WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL
          AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
      ),
      'pracas', (
        SELECT COALESCE(jsonb_agg(DISTINCT praca ORDER BY praca), '[]'::jsonb)
        FROM dados_corridas
        WHERE praca IS NOT NULL
          AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
      ),
      'sub_pracas', (
        SELECT COALESCE(jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca), '[]'::jsonb)
        FROM dados_corridas
        WHERE sub_praca IS NOT NULL
          AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
      ),
      'origens', '[]'::jsonb
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated, anon;

-- =====================================================================
-- SUCESSO! Execute este SQL no Supabase
-- Agora os cálculos de aderência seguem a mesma lógica do Excel:
-- 1. Remove duplicadas de (data, periodo, duracao, numero_minimo)
-- 2. Calcula horas_a_entregar = duracao * numero_minimo
-- 3. Calcula horas_entregues = soma de tempo_disponivel_absoluto
-- =====================================================================

