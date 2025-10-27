-- =====================================================================
-- BLOCO 3: Criar dashboard_resumo (PARTE 1/2)
-- =====================================================================
-- Execute este bloco depois do BLOCO 2
-- ATENÇÃO: Esta é apenas a PARTE 1, execute BLOCO 4 em seguida
-- =====================================================================

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
SET statement_timeout = '25s'
SET work_mem = '32MB'
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := true;
  v_assigned_pracas TEXT[] := ARRAY[]::TEXT[];
  v_limite INTEGER := 3;
  v_tem_filtro BOOLEAN := FALSE;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    BEGIN
      SELECT COALESCE(is_admin, true), COALESCE(assigned_pracas, ARRAY[]::TEXT[])
      INTO v_is_admin, v_assigned_pracas
      FROM user_profiles WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  
  v_tem_filtro := (p_ano IS NOT NULL OR p_semana IS NOT NULL OR p_praca IS NOT NULL OR p_sub_praca IS NOT NULL OR p_origem IS NOT NULL);
  
  IF v_tem_filtro THEN
    v_limite := 52;
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
        AND (v_is_admin OR praca = ANY(v_assigned_pracas))
    ),
    'semanal', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'semana', semana,
        'horas_a_entregar', horas_a_entregar,
        'horas_entregues', horas_entregues,
        'aderencia_percentual', aderencia_percentual
      ) ORDER BY ano_iso DESC, semana_numero DESC)
      FROM (
        SELECT 
          ano_iso,
          semana_numero,
          ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana,
          ROUND(
            (SELECT SUM(EXTRACT(EPOCH FROM duracao_do_periodo::INTERVAL) * numero_minimo_de_entregadores_regulares_na_escala)
             FROM (
               SELECT DISTINCT data_do_periodo, periodo, duracao_do_periodo, numero_minimo_de_entregadores_regulares_na_escala
               FROM dados_corridas dc2
               WHERE dc2.ano_iso = dc.ano_iso
                 AND dc2.semana_numero = dc.semana_numero
                 AND (p_praca IS NULL OR dc2.praca = p_praca)
                 AND (p_sub_praca IS NULL OR dc2.sub_praca = p_sub_praca)
                 AND (p_origem IS NULL OR dc2.origem = p_origem)
                 AND (v_is_admin OR dc2.praca = ANY(v_assigned_pracas))
             ) periodos_distintos
            ) / 3600.0, 2
          )::TEXT AS horas_a_entregar,
          ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE 
              WHEN (SELECT SUM(EXTRACT(EPOCH FROM duracao_do_periodo::INTERVAL) * numero_minimo_de_entregadores_regulares_na_escala)
                    FROM (SELECT DISTINCT data_do_periodo, periodo, duracao_do_periodo, numero_minimo_de_entregadores_regulares_na_escala
                          FROM dados_corridas dc2
                          WHERE dc2.ano_iso = dc.ano_iso AND dc2.semana_numero = dc.semana_numero
                            AND (p_praca IS NULL OR dc2.praca = p_praca)
                            AND (p_sub_praca IS NULL OR dc2.sub_praca = p_sub_praca)
                            AND (p_origem IS NULL OR dc2.origem = p_origem)
                            AND (v_is_admin OR dc2.praca = ANY(v_assigned_pracas))
                         ) pd) > 0
              THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / 
                    (SELECT SUM(EXTRACT(EPOCH FROM duracao_do_periodo::INTERVAL) * numero_minimo_de_entregadores_regulares_na_escala)
                     FROM (SELECT DISTINCT data_do_periodo, periodo, duracao_do_periodo, numero_minimo_de_entregadores_regulares_na_escala
                           FROM dados_corridas dc2
                           WHERE dc2.ano_iso = dc.ano_iso AND dc2.semana_numero = dc.semana_numero
                             AND (p_praca IS NULL OR dc2.praca = p_praca)
                             AND (p_sub_praca IS NULL OR dc2.sub_praca = p_sub_praca)
                             AND (p_origem IS NULL OR dc2.origem = p_origem)
                             AND (v_is_admin OR dc2.praca = ANY(v_assigned_pracas))
                          ) pd)::NUMERIC * 100)
              ELSE 0
            END, 1
          ) AS aderencia_percentual
        FROM dados_corridas dc
        WHERE (p_ano IS NULL OR dc.ano_iso = p_ano)
          AND (p_semana IS NULL OR dc.semana_numero = p_semana)
          AND (p_praca IS NULL OR dc.praca = p_praca)
          AND (p_sub_praca IS NULL OR dc.sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR dc.origem = p_origem)
          AND (v_is_admin OR dc.praca = ANY(v_assigned_pracas))
          AND dc.ano_iso IS NOT NULL 
          AND dc.semana_numero IS NOT NULL
        GROUP BY dc.ano_iso, dc.semana_numero
        ORDER BY dc.ano_iso DESC, dc.semana_numero DESC
        LIMIT v_limite
      ) s
    ), '[]'::jsonb),
    'dia', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'dia_iso', dia_iso,
        'dia_da_semana', dia_da_semana,
        'horas_a_entregar', horas_a_entregar,
        'horas_entregues', horas_entregues,
        'aderencia_percentual', aderencia_percentual,
        'corridas_ofertadas', corridas_ofertadas,
        'corridas_aceitas', corridas_aceitas,
        'corridas_rejeitadas', corridas_rejeitadas,
        'corridas_completadas', corridas_completadas,
        'taxa_aceitacao', taxa_aceitacao,
        'taxa_completude', taxa_completude
      ) ORDER BY dia_iso)
      FROM (
        SELECT 
          EXTRACT(ISODOW FROM data_do_periodo)::INTEGER AS dia_iso,
          CASE EXTRACT(ISODOW FROM data_do_periodo)
            WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta'
            WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado' WHEN 7 THEN 'Domingo'
          END AS dia_da_semana,
          ROUND(SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE WHEN SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) > 0 
            THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / SUM(COALESCE(tempo_disponivel_escalado_segundos, 0))::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS aderencia_percentual,
          SUM(COALESCE(numero_de_corridas_ofertadas, 0)) AS corridas_ofertadas,
          SUM(COALESCE(numero_de_corridas_aceitas, 0)) AS corridas_aceitas,
          SUM(COALESCE(numero_de_corridas_rejeitadas, 0)) AS corridas_rejeitadas,
          SUM(COALESCE(numero_de_corridas_completadas, 0)) AS corridas_completadas,
          ROUND(
            CASE WHEN SUM(COALESCE(numero_de_corridas_ofertadas, 0)) > 0 
            THEN (SUM(COALESCE(numero_de_corridas_aceitas, 0))::NUMERIC / SUM(COALESCE(numero_de_corridas_ofertadas, 0))::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS taxa_aceitacao,
          ROUND(
            CASE WHEN SUM(COALESCE(numero_de_corridas_aceitas, 0)) > 0 
            THEN (SUM(COALESCE(numero_de_corridas_completadas, 0))::NUMERIC / SUM(COALESCE(numero_de_corridas_aceitas, 0))::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS taxa_completude
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_semana IS NULL OR semana_numero = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR origem = p_origem)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
        GROUP BY EXTRACT(ISODOW FROM data_do_periodo)
      ) d
    ), '[]'::jsonb),
    'turno', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'turno', turno,
        'periodo', periodo,
        'horas_a_entregar', horas_a_entregar,
        'horas_entregues', horas_entregues,
        'aderencia_percentual', aderencia_percentual,
        'corridas_completadas', corridas_completadas
      ))
      FROM (
        SELECT 
          COALESCE(periodo, 'Sem Turno') AS turno,
          periodo,
          ROUND(SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE WHEN SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) > 0 
            THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / SUM(COALESCE(tempo_disponivel_escalado_segundos, 0))::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS aderencia_percentual,
          SUM(COALESCE(numero_de_corridas_completadas, 0)) AS corridas_completadas
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_semana IS NULL OR semana_numero = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR origem = p_origem)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
        GROUP BY periodo
      ) t
    ), '[]'::jsonb)

-- =====================================================================
-- ⚠️ ATENÇÃO: Esta é apenas PARTE 1/2 da função
-- Execute o BLOCO 4 para completar
-- =====================================================================

