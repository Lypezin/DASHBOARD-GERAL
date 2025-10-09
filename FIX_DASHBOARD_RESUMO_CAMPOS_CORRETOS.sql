-- =====================================================================
-- 🔧 CORRIGIR dashboard_resumo PARA RETORNAR CAMPOS CORRETOS
-- =====================================================================

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
SET statement_timeout = '30000ms'
SET work_mem = '256MB'
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
  -- Buscar dimensões
  v_dimensoes := public.listar_dimensoes_dashboard(p_ano, p_semana, p_praca, p_sub_praca, p_origem);
  
  -- Totais gerais
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
  
  -- Agregação semanal (primeiro item será usado como aderência geral)
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
    ORDER BY ano_iso, semana_numero
  ) sub;
  
  -- Agregação por dia (mapear dia_semana corretamente)
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
  
  -- Agregação por turno (renomear turno para periodo)
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
    GROUP BY turno
  ) sub;
  
  -- Agregação por sub_praca
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
    GROUP BY sub_praca
  ) sub;
  
  -- Agregação por origem
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
    GROUP BY origem
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

-- Permissões
GRANT EXECUTE ON FUNCTION public.dashboard_resumo(integer, integer, text, text, text) TO anon, authenticated;

-- Teste
SELECT '✅ Testando dashboard_resumo com campos corretos' as info;
SELECT jsonb_pretty(public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL));

