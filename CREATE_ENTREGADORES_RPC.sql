-- =====================================================================
-- 📊 NOVA GUIA: Entregadores
-- =====================================================================

-- Função para listar entregadores com aderência
DROP FUNCTION IF EXISTS public.listar_entregadores(integer, integer, text, text, text) CASCADE;

CREATE OR REPLACE FUNCTION public.listar_entregadores(
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
SET statement_timeout = '60000ms'
SET work_mem = '256MB'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Buscar dados dos entregadores com aderência calculada
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'pessoa_entregadora', pessoa_entregadora,
      'corridas_ofertadas', corridas_ofertadas,
      'corridas_aceitas', corridas_aceitas,
      'corridas_rejeitadas', corridas_rejeitadas,
      'corridas_completadas', corridas_completadas,
      'aderencia_percentual', aderencia_percentual
    ) ORDER BY aderencia_percentual DESC NULLS LAST
  ), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT 
      id_da_pessoa_entregadora as pessoa_entregadora,
      SUM(COALESCE(numero_de_corridas_ofertadas, 0)) as corridas_ofertadas,
      SUM(COALESCE(numero_de_corridas_aceitas, 0)) as corridas_aceitas,
      SUM(COALESCE(numero_de_corridas_rejeitadas, 0)) as corridas_rejeitadas,
      SUM(COALESCE(numero_de_corridas_completadas, 0)) as corridas_completadas,
      -- Calcular aderência: média de (tempo_disponivel_escalado / duracao_do_periodo)
      AVG(
        CASE 
          WHEN COALESCE(duracao_segundos, 0) > 0 
          THEN (COALESCE(tempo_disponivel_escalado_segundos, 0)::numeric / duracao_segundos::numeric) * 100
          ELSE NULL
        END
      ) as aderencia_percentual
    FROM public.dados_corridas
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
      AND id_da_pessoa_entregadora IS NOT NULL
    GROUP BY id_da_pessoa_entregadora
    HAVING COUNT(*) > 0
    LIMIT 500
  ) sub;

  RETURN jsonb_build_object(
    'entregadores', v_result,
    'total', jsonb_array_length(v_result)
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro em listar_entregadores: %', SQLERRM;
  RETURN jsonb_build_object(
    'entregadores', '[]'::jsonb,
    'total', 0,
    'error', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_entregadores(integer, integer, text, text, text) TO anon, authenticated;

-- Teste
SELECT '✅ FUNÇÃO CRIADA!' as status;
SELECT '🧪 TESTANDO COM GUARULHOS S35...' as info;
SELECT public.listar_entregadores(NULL, 35, 'GUARULHOS', NULL, NULL) as resultado_teste;

