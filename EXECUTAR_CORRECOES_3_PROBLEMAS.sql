-- =====================================================================
-- CORREÇÕES URGENTES - 3 PROBLEMAS (SEM TESTE INICIAL)
-- =====================================================================
-- Execute este SQL completo de uma vez
-- =====================================================================

-- =====================================================================
-- PROBLEMA 2: Criar/Verificar função listar_todas_semanas
-- =====================================================================

DROP FUNCTION IF EXISTS public.listar_todas_semanas();

CREATE OR REPLACE FUNCTION public.listar_todas_semanas()
RETURNS INTEGER[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := true;
  v_assigned_pracas TEXT[] := ARRAY[]::TEXT[];
  v_semanas INTEGER[];
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
  
  SELECT ARRAY_AGG(DISTINCT semana_numero ORDER BY semana_numero DESC)
  INTO v_semanas
  FROM dados_corridas
  WHERE (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
    AND semana_numero IS NOT NULL;
  
  RETURN COALESCE(v_semanas, ARRAY[]::INTEGER[]);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_todas_semanas() TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_todas_semanas() TO anon;

-- =====================================================================
-- PROBLEMA 3: Otimizar dashboard_resumo para admin
-- =====================================================================

-- Criar índice composto para queries de admin
CREATE INDEX IF NOT EXISTS idx_dados_corridas_admin_optimized 
ON dados_corridas (praca, ano_iso, semana_numero) 
INCLUDE (
  tempo_disponivel_absoluto_segundos,
  numero_de_corridas_ofertadas,
  numero_de_corridas_aceitas,
  numero_de_corridas_rejeitadas,
  numero_de_corridas_completadas
);

-- Atualizar estatísticas
ANALYZE dados_corridas;

-- Recriar dashboard_resumo com otimizações agressivas
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
SET statement_timeout = '45s'
SET work_mem = '64MB'
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := true;
  v_assigned_pracas TEXT[] := ARRAY[]::TEXT[];
  v_limite_semanas INTEGER := 10; -- Reduzido de 15 para 10
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
  
  -- Se tiver QUALQUER filtro, aumentar limite
  IF p_ano IS NOT NULL OR p_semana IS NOT NULL OR p_praca IS NOT NULL THEN
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
          ROUND(horas_a_entregar_total / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(horas_entregues_total / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE 
              WHEN horas_a_entregar_total > 0 
              THEN (horas_entregues_total::NUMERIC / horas_a_entregar_total::NUMERIC * 100)
              ELSE 0 
            END, 1
          ) AS aderencia_percentual
        FROM (
          SELECT
            dc.ano_iso,
            dc.semana_numero,
            (
              SELECT SUM(EXTRACT(EPOCH FROM duracao_do_periodo::INTERVAL) * numero_minimo_de_entregadores_regulares_na_escala)
              FROM (
                SELECT DISTINCT
                  data_do_periodo,
                  periodo,
                  duracao_do_periodo,
                  numero_minimo_de_entregadores_regulares_na_escala
                FROM dados_corridas dc2
                WHERE dc2.ano_iso = dc.ano_iso
                  AND dc2.semana_numero = dc.semana_numero
                  AND (p_praca IS NULL OR dc2.praca = p_praca)
                  AND (p_sub_praca IS NULL OR dc2.sub_praca = p_sub_praca)
                  AND (p_origem IS NULL OR dc2.origem = p_origem)
                  AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc2.praca = ANY(v_assigned_pracas)))
              ) periodos_unicos
            ) AS horas_a_entregar_total,
            SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) AS horas_entregues_total
          FROM dados_corridas dc
          WHERE (p_ano IS NULL OR dc.ano_iso = p_ano)
            AND (p_semana IS NULL OR dc.semana_numero = p_semana)
            AND (p_praca IS NULL OR dc.praca = p_praca)
            AND (p_sub_praca IS NULL OR dc.sub_praca = p_sub_praca)
            AND (p_origem IS NULL OR dc.origem = p_origem)
            AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc.praca = ANY(v_assigned_pracas)))
            AND dc.ano_iso IS NOT NULL 
            AND dc.semana_numero IS NOT NULL
          GROUP BY dc.ano_iso, dc.semana_numero
        ) calc
        ORDER BY ano_iso DESC, semana_numero DESC
        LIMIT v_limite_semanas
      ) t
    ), '[]'::jsonb),
    'dia', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          dia_iso,
          dia_da_semana,
          ROUND(horas_a_entregar_total / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(horas_entregues_total / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE 
              WHEN horas_a_entregar_total > 0 
              THEN (horas_entregues_total::NUMERIC / horas_a_entregar_total::NUMERIC * 100)
              ELSE 0 
            END, 1
          ) AS aderencia_percentual,
          corridas_ofertadas,
          corridas_aceitas,
          corridas_rejeitadas,
          corridas_completadas,
          ROUND(
            CASE 
              WHEN corridas_ofertadas > 0 
              THEN (corridas_aceitas::NUMERIC / corridas_ofertadas::NUMERIC * 100)
              ELSE 0 
            END, 1
          ) AS taxa_aceitacao,
          ROUND(
            CASE 
              WHEN corridas_aceitas > 0 
              THEN (corridas_completadas::NUMERIC / corridas_aceitas::NUMERIC * 100)
              ELSE 0 
            END, 1
          ) AS taxa_completude
        FROM (
          SELECT
            EXTRACT(ISODOW FROM data_do_periodo)::INTEGER AS dia_iso,
            CASE EXTRACT(ISODOW FROM data_do_periodo)
              WHEN 1 THEN 'Segunda'
              WHEN 2 THEN 'Terça'
              WHEN 3 THEN 'Quarta'
              WHEN 4 THEN 'Quinta'
              WHEN 5 THEN 'Sexta'
              WHEN 6 THEN 'Sábado'
              WHEN 7 THEN 'Domingo'
            END AS dia_da_semana,
            (
              SELECT SUM(EXTRACT(EPOCH FROM duracao_do_periodo::INTERVAL) * numero_minimo_de_entregadores_regulares_na_escala)
              FROM (
                SELECT DISTINCT
                  data_do_periodo,
                  periodo,
                  duracao_do_periodo,
                  numero_minimo_de_entregadores_regulares_na_escala
                FROM dados_corridas dc2
                WHERE EXTRACT(ISODOW FROM dc2.data_do_periodo) = dia_calc.dia_iso_group
                  AND (p_ano IS NULL OR dc2.ano_iso = p_ano)
                  AND (p_semana IS NULL OR dc2.semana_numero = p_semana)
                  AND (p_praca IS NULL OR dc2.praca = p_praca)
                  AND (p_sub_praca IS NULL OR dc2.sub_praca = p_sub_praca)
                  AND (p_origem IS NULL OR dc2.origem = p_origem)
                  AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc2.praca = ANY(v_assigned_pracas)))
              ) periodos_unicos
            ) AS horas_a_entregar_total,
            SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) AS horas_entregues_total,
            SUM(COALESCE(numero_de_corridas_ofertadas, 0)) AS corridas_ofertadas,
            SUM(COALESCE(numero_de_corridas_aceitas, 0)) AS corridas_aceitas,
            SUM(COALESCE(numero_de_corridas_rejeitadas, 0)) AS corridas_rejeitadas,
            SUM(COALESCE(numero_de_corridas_completadas, 0)) AS corridas_completadas
          FROM (
            SELECT 
              data_do_periodo,
              EXTRACT(ISODOW FROM data_do_periodo)::INTEGER AS dia_iso_group,
              tempo_disponivel_absoluto_segundos,
              numero_de_corridas_ofertadas,
              numero_de_corridas_aceitas,
              numero_de_corridas_rejeitadas,
              numero_de_corridas_completadas
            FROM dados_corridas
            WHERE (p_ano IS NULL OR ano_iso = p_ano)
              AND (p_semana IS NULL OR semana_numero = p_semana)
              AND (p_praca IS NULL OR praca = p_praca)
              AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
              AND (p_origem IS NULL OR origem = p_origem)
              AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
          ) dia_calc
          GROUP BY dia_iso, dia_da_semana, dia_iso_group
        ) calc
        ORDER BY dia_iso
      ) t
    ), '[]'::jsonb),
    'turno', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          COALESCE(periodo, 'Sem Turno') AS turno,
          periodo,
          ROUND(horas_a_entregar_total / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(horas_entregues_total / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE 
              WHEN horas_a_entregar_total > 0 
              THEN (horas_entregues_total::NUMERIC / horas_a_entregar_total::NUMERIC * 100)
              ELSE 0 
            END, 1
          ) AS aderencia_percentual,
          corridas_completadas
        FROM (
          SELECT
            dc.periodo,
            (
              SELECT SUM(EXTRACT(EPOCH FROM duracao_do_periodo::INTERVAL) * numero_minimo_de_entregadores_regulares_na_escala)
              FROM (
                SELECT DISTINCT
                  data_do_periodo,
                  periodo,
                  duracao_do_periodo,
                  numero_minimo_de_entregadores_regulares_na_escala
                FROM dados_corridas dc2
                WHERE COALESCE(dc2.periodo, 'Sem Turno') = COALESCE(dc.periodo, 'Sem Turno')
                  AND (p_ano IS NULL OR dc2.ano_iso = p_ano)
                  AND (p_semana IS NULL OR dc2.semana_numero = p_semana)
                  AND (p_praca IS NULL OR dc2.praca = p_praca)
                  AND (p_sub_praca IS NULL OR dc2.sub_praca = p_sub_praca)
                  AND (p_origem IS NULL OR dc2.origem = p_origem)
                  AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc2.praca = ANY(v_assigned_pracas)))
              ) periodos_unicos
            ) AS horas_a_entregar_total,
            SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) AS horas_entregues_total,
            SUM(COALESCE(numero_de_corridas_completadas, 0)) AS corridas_completadas
          FROM dados_corridas dc
          WHERE (p_ano IS NULL OR dc.ano_iso = p_ano)
            AND (p_semana IS NULL OR dc.semana_numero = p_semana)
            AND (p_praca IS NULL OR dc.praca = p_praca)
            AND (p_sub_praca IS NULL OR dc.sub_praca = p_sub_praca)
            AND (p_origem IS NULL OR dc.origem = p_origem)
            AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc.praca = ANY(v_assigned_pracas)))
          GROUP BY dc.periodo
        ) calc
        ORDER BY turno
      ) t
    ), '[]'::jsonb),
    'origem', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          origem,
          ROUND(horas_entregues_total / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE 
              WHEN total_corridas > 0 
              THEN (corridas_completadas::NUMERIC / total_corridas::NUMERIC * 100)
              ELSE 0 
            END, 1
          ) AS taxa_completude,
          total_corridas,
          corridas_completadas
        FROM (
          SELECT
            dc.origem,
            SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) AS horas_entregues_total,
            SUM(COALESCE(numero_de_corridas_ofertadas, 0)) AS total_corridas,
            SUM(COALESCE(numero_de_corridas_completadas, 0)) AS corridas_completadas
          FROM dados_corridas dc
          WHERE (p_ano IS NULL OR dc.ano_iso = p_ano)
            AND (p_semana IS NULL OR dc.semana_numero = p_semana)
            AND (p_praca IS NULL OR dc.praca = p_praca)
            AND (p_sub_praca IS NULL OR dc.sub_praca = p_sub_praca)
            AND (p_origem IS NULL OR dc.origem = p_origem)
            AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc.praca = ANY(v_assigned_pracas)))
            AND dc.origem IS NOT NULL
          GROUP BY dc.origem
        ) calc
        ORDER BY corridas_completadas DESC
      ) t
    ), '[]'::jsonb),
    'sub_praca', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          sub_praca,
          ROUND(horas_a_entregar_total / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(horas_entregues_total / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE 
              WHEN horas_a_entregar_total > 0 
              THEN (horas_entregues_total::NUMERIC / horas_a_entregar_total::NUMERIC * 100)
              ELSE 0 
            END, 1
          ) AS aderencia_percentual,
          corridas_completadas
        FROM (
          SELECT
            dc.sub_praca,
            (
              SELECT SUM(EXTRACT(EPOCH FROM duracao_do_periodo::INTERVAL) * numero_minimo_de_entregadores_regulares_na_escala)
              FROM (
                SELECT DISTINCT
                  data_do_periodo,
                  periodo,
                  duracao_do_periodo,
                  numero_minimo_de_entregadores_regulares_na_escala
                FROM dados_corridas dc2
                WHERE dc2.sub_praca = dc.sub_praca
                  AND (p_ano IS NULL OR dc2.ano_iso = p_ano)
                  AND (p_semana IS NULL OR dc2.semana_numero = p_semana)
                  AND (p_praca IS NULL OR dc2.praca = p_praca)
                  AND (p_origem IS NULL OR dc2.origem = p_origem)
                  AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc2.praca = ANY(v_assigned_pracas)))
              ) periodos_unicos
            ) AS horas_a_entregar_total,
            SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) AS horas_entregues_total,
            SUM(COALESCE(numero_de_corridas_completadas, 0)) AS corridas_completadas
          FROM dados_corridas dc
          WHERE (p_ano IS NULL OR dc.ano_iso = p_ano)
            AND (p_semana IS NULL OR dc.semana_numero = p_semana)
            AND (p_praca IS NULL OR dc.praca = p_praca)
            AND (p_sub_praca IS NULL OR dc.sub_praca = p_sub_praca)
            AND (p_origem IS NULL OR dc.origem = p_origem)
            AND (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND dc.praca = ANY(v_assigned_pracas)))
            AND dc.sub_praca IS NOT NULL
          GROUP BY dc.sub_praca
        ) calc
        ORDER BY corridas_completadas DESC
      ) t
    ), '[]'::jsonb),
    'dimensoes', (
      SELECT jsonb_build_object(
        'anos', COALESCE((
          SELECT jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC)
          FROM dados_corridas
          WHERE (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
            AND ano_iso IS NOT NULL
        ), '[]'::jsonb),
        'semanas', COALESCE((
          SELECT jsonb_agg(semana_formatada ORDER BY ano_iso DESC, semana_numero DESC)
          FROM (
            SELECT DISTINCT
              ano_iso,
              semana_numero,
              ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana_formatada
            FROM dados_corridas
            WHERE (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
              AND ano_iso IS NOT NULL
              AND semana_numero IS NOT NULL
          ) semanas_distintas
        ), '[]'::jsonb),
        'pracas', COALESCE((
          SELECT jsonb_agg(DISTINCT praca ORDER BY praca)
          FROM dados_corridas
          WHERE (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
            AND praca IS NOT NULL
        ), '[]'::jsonb),
        'sub_pracas', COALESCE((
          SELECT jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca)
          FROM dados_corridas
          WHERE (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
            AND sub_praca IS NOT NULL
        ), '[]'::jsonb),
        'origens', COALESCE((
          SELECT jsonb_agg(DISTINCT origem ORDER BY origem)
          FROM dados_corridas
          WHERE (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
            AND origem IS NOT NULL
        ), '[]'::jsonb)
      )
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO anon;

-- =====================================================================
-- ✅ FIM DAS CORREÇÕES
-- =====================================================================

