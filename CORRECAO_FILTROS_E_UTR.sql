-- =====================================================================
-- 🔧 CORREÇÃO: Filtros, UTR e Timeout SP
-- =====================================================================

-- PROBLEMA 1: Admin sem filtro de praça + PROBLEMA 2: Filtros não atualizam
-- SOLUÇÃO: A função listar_dimensoes_dashboard já filtra corretamente
-- O problema está no frontend (será corrigido no page.tsx)

-- PROBLEMA 3: UTR não mostrando sub, turno, origem
-- SOLUÇÃO: Remover os LIMIT muito baixos e garantir que dados apareçam

DROP FUNCTION IF EXISTS public.calcular_utr(integer, integer, text, text, text) CASCADE;

CREATE OR REPLACE FUNCTION public.calcular_utr(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET statement_timeout = '180000ms'
SET work_mem = '256MB'
AS $$
DECLARE
  v_result jsonb;
  v_utr_geral jsonb;
  v_utr_praca jsonb;
  v_utr_sub_praca jsonb;
  v_utr_origem jsonb;
  v_utr_turno jsonb;
BEGIN
  -- UTR Geral (sem LIMIT)
  SELECT jsonb_build_object(
    'tempo_horas', ROUND((SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0)::numeric, 2),
    'corridas', SUM(COALESCE(numero_de_corridas_completadas, 0)),
    'utr', CASE 
      WHEN SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) > 0 
      THEN ROUND((SUM(COALESCE(numero_de_corridas_completadas, 0))::numeric / (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0)), 2)
      ELSE 0 
    END
  )
  INTO v_utr_geral
  FROM public.dados_corridas
  WHERE (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem);

  -- UTR por Praça (LIMIT aumentado para 50)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'praca', praca,
      'tempo_horas', tempo_horas,
      'corridas', corridas,
      'utr', utr
    ) ORDER BY utr DESC
  ), '[]'::jsonb)
  INTO v_utr_praca
  FROM (
    SELECT 
      praca,
      ROUND((SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0)::numeric, 2) as tempo_horas,
      SUM(COALESCE(numero_de_corridas_completadas, 0)) as corridas,
      CASE 
        WHEN SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) > 0 
        THEN ROUND((SUM(COALESCE(numero_de_corridas_completadas, 0))::numeric / (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0)), 2)
        ELSE 0 
      END as utr
    FROM public.dados_corridas
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
      AND praca IS NOT NULL
    GROUP BY praca
    ORDER BY utr DESC
    LIMIT 50
  ) sub;

  -- UTR por Sub-praça (LIMIT aumentado para 100)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'sub_praca', sub_praca,
      'tempo_horas', tempo_horas,
      'corridas', corridas,
      'utr', utr
    ) ORDER BY utr DESC
  ), '[]'::jsonb)
  INTO v_utr_sub_praca
  FROM (
    SELECT 
      sub_praca,
      ROUND((SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0)::numeric, 2) as tempo_horas,
      SUM(COALESCE(numero_de_corridas_completadas, 0)) as corridas,
      CASE 
        WHEN SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) > 0 
        THEN ROUND((SUM(COALESCE(numero_de_corridas_completadas, 0))::numeric / (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0)), 2)
        ELSE 0 
      END as utr
    FROM public.dados_corridas
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
      AND sub_praca IS NOT NULL
    GROUP BY sub_praca
    ORDER BY utr DESC
    LIMIT 100
  ) sub;

  -- UTR por Origem (LIMIT aumentado para 200)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'origem', origem,
      'tempo_horas', tempo_horas,
      'corridas', corridas,
      'utr', utr
    ) ORDER BY utr DESC
  ), '[]'::jsonb)
  INTO v_utr_origem
  FROM (
    SELECT 
      origem,
      ROUND((SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0)::numeric, 2) as tempo_horas,
      SUM(COALESCE(numero_de_corridas_completadas, 0)) as corridas,
      CASE 
        WHEN SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) > 0 
        THEN ROUND((SUM(COALESCE(numero_de_corridas_completadas, 0))::numeric / (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0)), 2)
        ELSE 0 
      END as utr
    FROM public.dados_corridas
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
      AND origem IS NOT NULL
    GROUP BY origem
    ORDER BY utr DESC
    LIMIT 200
  ) sub;

  -- UTR por Turno (LIMIT aumentado para 50)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'turno', turno,
      'tempo_horas', tempo_horas,
      'corridas', corridas,
      'utr', utr
    ) ORDER BY utr DESC
  ), '[]'::jsonb)
  INTO v_utr_turno
  FROM (
    SELECT 
      periodo as turno,
      ROUND((SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0)::numeric, 2) as tempo_horas,
      SUM(COALESCE(numero_de_corridas_completadas, 0)) as corridas,
      CASE 
        WHEN SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) > 0 
        THEN ROUND((SUM(COALESCE(numero_de_corridas_completadas, 0))::numeric / (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0)), 2)
        ELSE 0 
      END as utr
    FROM public.dados_corridas
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
      AND periodo IS NOT NULL
    GROUP BY periodo
    ORDER BY utr DESC
    LIMIT 50
  ) sub;

  -- Montar resultado
  v_result := jsonb_build_object(
    'geral', v_utr_geral,
    'praca', v_utr_praca,
    'sub_praca', v_utr_sub_praca,
    'origem', v_utr_origem,
    'turno', v_utr_turno
  );

  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro em calcular_utr: %', SQLERRM;
  RETURN jsonb_build_object(
    'geral', jsonb_build_object('tempo_horas', 0, 'corridas', 0, 'utr', 0),
    'praca', '[]'::jsonb,
    'sub_praca', '[]'::jsonb,
    'origem', '[]'::jsonb,
    'turno', '[]'::jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.calcular_utr(integer, integer, text, text, text) TO anon, authenticated;

-- PROBLEMA 4: SP só carrega semana 22 (timeout)
-- SOLUÇÃO: Aumentar LIMIT dos totais e otimizar agregações

DROP FUNCTION IF EXISTS public.dashboard_resumo(integer, integer, text, text, text) CASCADE;

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET statement_timeout = '240000ms'
SET work_mem = '512MB'
AS $$
DECLARE
  v_result jsonb;
  v_totais jsonb;
  v_semanal jsonb;
  v_dia jsonb;
  v_turno jsonb;
  v_sub_praca jsonb;
  v_origem jsonb;
  v_dimensoes jsonb;
BEGIN
  -- Buscar dimensões PRIMEIRO (são rápidas)
  v_dimensoes := public.listar_dimensoes_dashboard(p_ano, p_semana, p_praca, p_sub_praca, p_origem);
  
  -- Totais gerais (SEM LIMIT - usar índices)
  SELECT jsonb_build_object(
    'corridas_ofertadas', COALESCE(SUM(total_corridas_ofertadas), 0),
    'corridas_aceitas', COALESCE(SUM(total_aceitas), 0),
    'corridas_rejeitadas', COALESCE(SUM(total_rejeitadas), 0),
    'corridas_completadas', COALESCE(SUM(total_completadas), 0)
  )
  INTO v_totais
  FROM public.mv_aderencia_agregada
  WHERE (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem);
  
  -- Agregação semanal (limitada a 52 semanas)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'semana', 'S' || LPAD(semana_numero::text, 2, '0'),
      'horas_a_entregar', TO_CHAR((segundos_planejados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'horas_entregues', TO_CHAR((segundos_realizados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'aderencia_percentual', CASE 
        WHEN segundos_planejados > 0 
        THEN ROUND((segundos_realizados::numeric / segundos_planejados::numeric * 100), 2)
        ELSE 0 
      END
    )
  ), '[]'::jsonb)
  INTO v_semanal
  FROM (
    SELECT 
      ano_iso,
      semana_numero,
      SUM(segundos_planejados) as segundos_planejados,
      SUM(segundos_realizados) as segundos_realizados
    FROM public.mv_aderencia_agregada
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
    GROUP BY ano_iso, semana_numero
    ORDER BY ano_iso DESC, semana_numero DESC
    LIMIT 52
  ) sub;
  
  -- Agregação por dia (7 dias)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'dia_iso', CASE TRIM(dia_semana)
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        WHEN 'Sunday' THEN 7
        ELSE 0
      END,
      'dia_da_semana', CASE TRIM(dia_semana)
        WHEN 'Monday' THEN 'Segunda'
        WHEN 'Tuesday' THEN 'Terça'
        WHEN 'Wednesday' THEN 'Quarta'
        WHEN 'Thursday' THEN 'Quinta'
        WHEN 'Friday' THEN 'Sexta'
        WHEN 'Saturday' THEN 'Sábado'
        WHEN 'Sunday' THEN 'Domingo'
        ELSE dia_semana
      END,
      'horas_a_entregar', TO_CHAR((segundos_planejados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'horas_entregues', TO_CHAR((segundos_realizados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'aderencia_percentual', CASE 
        WHEN segundos_planejados > 0 
        THEN ROUND((segundos_realizados::numeric / segundos_planejados::numeric * 100), 2)
        ELSE 0 
      END
    ) ORDER BY CASE TRIM(dia_semana)
      WHEN 'Monday' THEN 1
      WHEN 'Tuesday' THEN 2
      WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4
      WHEN 'Friday' THEN 5
      WHEN 'Saturday' THEN 6
      WHEN 'Sunday' THEN 7
      ELSE 8
    END
  ), '[]'::jsonb)
  INTO v_dia
  FROM (
    SELECT 
      dia_semana,
      SUM(segundos_planejados) as segundos_planejados,
      SUM(segundos_realizados) as segundos_realizados
    FROM public.mv_aderencia_agregada
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
    GROUP BY dia_semana
  ) sub;
  
  -- Agregação por turno (aumentado para 50)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'periodo', turno,
      'horas_a_entregar', TO_CHAR((segundos_planejados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'horas_entregues', TO_CHAR((segundos_realizados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'aderencia_percentual', CASE 
        WHEN segundos_planejados > 0 
        THEN ROUND((segundos_realizados::numeric / segundos_planejados::numeric * 100), 2)
        ELSE 0 
      END
    ) ORDER BY segundos_planejados DESC
  ), '[]'::jsonb)
  INTO v_turno
  FROM (
    SELECT 
      turno,
      SUM(segundos_planejados) as segundos_planejados,
      SUM(segundos_realizados) as segundos_realizados
    FROM public.mv_aderencia_agregada
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
      AND turno IS NOT NULL
    GROUP BY turno
    ORDER BY SUM(segundos_planejados) DESC
    LIMIT 50
  ) sub;
  
  -- Agregação por sub_praca (aumentado para 100)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'sub_praca', sub_praca,
      'horas_a_entregar', TO_CHAR((segundos_planejados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'horas_entregues', TO_CHAR((segundos_realizados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'aderencia_percentual', CASE 
        WHEN segundos_planejados > 0 
        THEN ROUND((segundos_realizados::numeric / segundos_planejados::numeric * 100), 2)
        ELSE 0 
      END
    ) ORDER BY segundos_planejados DESC
  ), '[]'::jsonb)
  INTO v_sub_praca
  FROM (
    SELECT 
      sub_praca,
      SUM(segundos_planejados) as segundos_planejados,
      SUM(segundos_realizados) as segundos_realizados
    FROM public.mv_aderencia_agregada
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
      AND sub_praca IS NOT NULL
    GROUP BY sub_praca
    ORDER BY SUM(segundos_planejados) DESC
    LIMIT 100
  ) sub;
  
  -- Agregação por origem (aumentado para 200)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'origem', origem,
      'horas_a_entregar', TO_CHAR((segundos_planejados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'horas_entregues', TO_CHAR((segundos_realizados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'aderencia_percentual', CASE 
        WHEN segundos_planejados > 0 
        THEN ROUND((segundos_realizados::numeric / segundos_planejados::numeric * 100), 2)
        ELSE 0 
      END
    ) ORDER BY segundos_planejados DESC
  ), '[]'::jsonb)
  INTO v_origem
  FROM (
    SELECT 
      origem,
      SUM(segundos_planejados) as segundos_planejados,
      SUM(segundos_realizados) as segundos_realizados
    FROM public.mv_aderencia_agregada
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
      AND origem IS NOT NULL
    GROUP BY origem
    ORDER BY SUM(segundos_planejados) DESC
    LIMIT 200
  ) sub;
  
  -- Montar resultado final
  v_result := jsonb_build_object(
    'totais', v_totais,
    'semanal', v_semanal,
    'dia', v_dia,
    'turno', v_turno,
    'sub_praca', v_sub_praca,
    'origem', v_origem,
    'dimensoes', v_dimensoes
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro em dashboard_resumo: %', SQLERRM;
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'totais', jsonb_build_object(
      'corridas_ofertadas', 0,
      'corridas_aceitas', 0,
      'corridas_rejeitadas', 0,
      'corridas_completadas', 0
    ),
    'semanal', '[]'::jsonb,
    'dia', '[]'::jsonb,
    'turno', '[]'::jsonb,
    'sub_praca', '[]'::jsonb,
    'origem', '[]'::jsonb,
    'dimensoes', v_dimensoes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(integer, integer, text, text, text) TO anon, authenticated;

SELECT '✅ CORREÇÕES APLICADAS' as status;
SELECT '- UTR: LIMIT aumentado (50, 100, 200, 50)' as correcao_1;
SELECT '- Dashboard: Timeout 240s (4 minutos)' as correcao_2;
SELECT '- Dashboard: LIMIT aumentado (50, 100, 200)' as correcao_3;

