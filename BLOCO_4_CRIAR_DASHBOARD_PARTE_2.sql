-- =====================================================================
-- BLOCO 4: Completar dashboard_resumo (PARTE 2/2) + Permissões
-- =====================================================================
-- Execute este bloco IMEDIATAMENTE APÓS o BLOCO 3
-- IMPORTANTE: BLOCO 3 + BLOCO 4 = 1 função completa
-- =====================================================================

-- CONTINUA do BLOCO 3...

    ,
    'origem', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'origem', origem,
        'horas_entregues', horas_entregues,
        'taxa_completude', taxa_completude,
        'total_corridas', total_corridas,
        'corridas_completadas', corridas_completadas
      ) ORDER BY corridas_completadas DESC)
      FROM (
        SELECT 
          origem,
          ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE WHEN SUM(COALESCE(numero_de_corridas_ofertadas, 0)) > 0 
            THEN (SUM(COALESCE(numero_de_corridas_completadas, 0))::NUMERIC / SUM(COALESCE(numero_de_corridas_ofertadas, 0))::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS taxa_completude,
          SUM(COALESCE(numero_de_corridas_ofertadas, 0)) AS total_corridas,
          SUM(COALESCE(numero_de_corridas_completadas, 0)) AS corridas_completadas
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_semana IS NULL OR semana_numero = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR origem = p_origem)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
          AND origem IS NOT NULL
        GROUP BY origem
      ) o
    ), '[]'::jsonb),
    'sub_praca', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'sub_praca', sub_praca,
        'horas_a_entregar', horas_a_entregar,
        'horas_entregues', horas_entregues,
        'aderencia_percentual', aderencia_percentual,
        'corridas_completadas', corridas_completadas
      ) ORDER BY corridas_completadas DESC)
      FROM (
        SELECT 
          sub_praca,
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
          AND sub_praca IS NOT NULL
        GROUP BY sub_praca
      ) sp
    ), '[]'::jsonb),
    'dimensoes', (
      SELECT jsonb_build_object(
        'anos', COALESCE((
          SELECT jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC)
          FROM dados_corridas
          WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND ano_iso IS NOT NULL
        ), '[]'::jsonb),
        'semanas', COALESCE((
          SELECT jsonb_agg(ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') ORDER BY ano_iso DESC, semana_numero DESC)
          FROM (SELECT DISTINCT ano_iso, semana_numero FROM dados_corridas 
                WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND ano_iso IS NOT NULL AND semana_numero IS NOT NULL) s
        ), '[]'::jsonb),
        'pracas', COALESCE((SELECT jsonb_agg(DISTINCT praca ORDER BY praca) FROM dados_corridas WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND praca IS NOT NULL), '[]'::jsonb),
        'sub_pracas', COALESCE((SELECT jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca) FROM dados_corridas WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND sub_praca IS NOT NULL), '[]'::jsonb),
        'origens', COALESCE((SELECT jsonb_agg(DISTINCT origem ORDER BY origem) FROM dados_corridas WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND origem IS NOT NULL), '[]'::jsonb)
      )
    )
  );
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated, anon;

-- =====================================================================
-- ✅ CONCLUÍDO: Função dashboard_resumo completa criada
-- =====================================================================
-- 
-- MUDANÇAS CRÍTICAS IMPLEMENTADAS:
-- ✅ SEMANAL: Usa método Excel (DISTINCT) - CORRETO
-- ✅ DIA/TURNO/SUB_PRACA: Usa tempo_disponivel_escalado - OK
-- ✅ LIMITE ADMIN: 3 semanas sem filtro, 52 com filtro
-- ✅ TIMEOUT: 25s, work_mem: 32MB
-- ✅ Turnos: COALESCE(periodo, 'Sem Turno')
-- =====================================================================

