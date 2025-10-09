-- =====================================================================
-- 🎨 MELHORAR ANÁLISE DETALHADA
-- Adicionar corridas ofertadas/aceitas/rejeitadas/completadas por:
-- - Dia
-- - Turno
-- - Sub-praça
-- - Origem
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
  -- Buscar dimensões PRIMEIRO
  v_dimensoes := public.listar_dimensoes_dashboard(p_ano, p_semana, p_praca, p_sub_praca, p_origem);
  
  -- ========================================================================
  -- TOTAIS GERAIS
  -- ========================================================================
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
  
  -- ========================================================================
  -- SEMANAL
  -- ========================================================================
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
  
  -- ========================================================================
  -- POR DIA (COM CORRIDAS!)
  -- ========================================================================
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
      END,
      'corridas_ofertadas', corridas_ofertadas,
      'corridas_aceitas', corridas_aceitas,
      'corridas_rejeitadas', corridas_rejeitadas,
      'corridas_completadas', corridas_completadas,
      'taxa_aceitacao', CASE 
        WHEN corridas_ofertadas > 0 
        THEN ROUND((corridas_aceitas::numeric / corridas_ofertadas::numeric * 100), 2)
        ELSE 0 
      END,
      'taxa_completude', CASE 
        WHEN corridas_aceitas > 0 
        THEN ROUND((corridas_completadas::numeric / corridas_aceitas::numeric * 100), 2)
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
      SUM(segundos_realizados) as segundos_realizados,
      SUM(total_corridas_ofertadas) as corridas_ofertadas,
      SUM(total_aceitas) as corridas_aceitas,
      SUM(total_rejeitadas) as corridas_rejeitadas,
      SUM(total_completadas) as corridas_completadas
    FROM public.mv_aderencia_agregada
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
    GROUP BY dia_semana
  ) sub;
  
  -- ========================================================================
  -- POR TURNO (COM CORRIDAS!)
  -- ========================================================================
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'periodo', turno,
      'horas_a_entregar', TO_CHAR((segundos_planejados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'horas_entregues', TO_CHAR((segundos_realizados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'aderencia_percentual', CASE 
        WHEN segundos_planejados > 0 
        THEN ROUND((segundos_realizados::numeric / segundos_planejados::numeric * 100), 2)
        ELSE 0 
      END,
      'corridas_ofertadas', corridas_ofertadas,
      'corridas_aceitas', corridas_aceitas,
      'corridas_rejeitadas', corridas_rejeitadas,
      'corridas_completadas', corridas_completadas,
      'taxa_aceitacao', CASE 
        WHEN corridas_ofertadas > 0 
        THEN ROUND((corridas_aceitas::numeric / corridas_ofertadas::numeric * 100), 2)
        ELSE 0 
      END,
      'taxa_completude', CASE 
        WHEN corridas_aceitas > 0 
        THEN ROUND((corridas_completadas::numeric / corridas_aceitas::numeric * 100), 2)
        ELSE 0 
      END
    ) ORDER BY segundos_planejados DESC
  ), '[]'::jsonb)
  INTO v_turno
  FROM (
    SELECT 
      turno,
      SUM(segundos_planejados) as segundos_planejados,
      SUM(segundos_realizados) as segundos_realizados,
      SUM(total_corridas_ofertadas) as corridas_ofertadas,
      SUM(total_aceitas) as corridas_aceitas,
      SUM(total_rejeitadas) as corridas_rejeitadas,
      SUM(total_completadas) as corridas_completadas
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
  
  -- ========================================================================
  -- POR SUB-PRAÇA (COM CORRIDAS!)
  -- ========================================================================
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'sub_praca', sub_praca,
      'horas_a_entregar', TO_CHAR((segundos_planejados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'horas_entregues', TO_CHAR((segundos_realizados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'aderencia_percentual', CASE 
        WHEN segundos_planejados > 0 
        THEN ROUND((segundos_realizados::numeric / segundos_planejados::numeric * 100), 2)
        ELSE 0 
      END,
      'corridas_ofertadas', corridas_ofertadas,
      'corridas_aceitas', corridas_aceitas,
      'corridas_rejeitadas', corridas_rejeitadas,
      'corridas_completadas', corridas_completadas,
      'taxa_aceitacao', CASE 
        WHEN corridas_ofertadas > 0 
        THEN ROUND((corridas_aceitas::numeric / corridas_ofertadas::numeric * 100), 2)
        ELSE 0 
      END,
      'taxa_completude', CASE 
        WHEN corridas_aceitas > 0 
        THEN ROUND((corridas_completadas::numeric / corridas_aceitas::numeric * 100), 2)
        ELSE 0 
      END
    ) ORDER BY segundos_planejados DESC
  ), '[]'::jsonb)
  INTO v_sub_praca
  FROM (
    SELECT 
      sub_praca,
      SUM(segundos_planejados) as segundos_planejados,
      SUM(segundos_realizados) as segundos_realizados,
      SUM(total_corridas_ofertadas) as corridas_ofertadas,
      SUM(total_aceitas) as corridas_aceitas,
      SUM(total_rejeitadas) as corridas_rejeitadas,
      SUM(total_completadas) as corridas_completadas
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
  
  -- ========================================================================
  -- POR ORIGEM (COM CORRIDAS!)
  -- ========================================================================
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'origem', origem,
      'horas_a_entregar', TO_CHAR((segundos_planejados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'horas_entregues', TO_CHAR((segundos_realizados / 3600.0)::numeric, 'FM999999999.00') || 'h',
      'aderencia_percentual', CASE 
        WHEN segundos_planejados > 0 
        THEN ROUND((segundos_realizados::numeric / segundos_planejados::numeric * 100), 2)
        ELSE 0 
      END,
      'corridas_ofertadas', corridas_ofertadas,
      'corridas_aceitas', corridas_aceitas,
      'corridas_rejeitadas', corridas_rejeitadas,
      'corridas_completadas', corridas_completadas,
      'taxa_aceitacao', CASE 
        WHEN corridas_ofertadas > 0 
        THEN ROUND((corridas_aceitas::numeric / corridas_ofertadas::numeric * 100), 2)
        ELSE 0 
      END,
      'taxa_completude', CASE 
        WHEN corridas_aceitas > 0 
        THEN ROUND((corridas_completadas::numeric / corridas_aceitas::numeric * 100), 2)
        ELSE 0 
      END
    ) ORDER BY segundos_planejados DESC
  ), '[]'::jsonb)
  INTO v_origem
  FROM (
    SELECT 
      origem,
      SUM(segundos_planejados) as segundos_planejados,
      SUM(segundos_realizados) as segundos_realizados,
      SUM(total_corridas_ofertadas) as corridas_ofertadas,
      SUM(total_aceitas) as corridas_aceitas,
      SUM(total_rejeitadas) as corridas_rejeitadas,
      SUM(total_completadas) as corridas_completadas
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
  
  -- ========================================================================
  -- RETORNAR RESULTADO
  -- ========================================================================
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

SELECT '✅ DASHBOARD_RESUMO ATUALIZADO COM CORRIDAS POR DIA/TURNO/SUB/ORIGEM!' as status;

