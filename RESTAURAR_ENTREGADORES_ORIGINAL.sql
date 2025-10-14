-- =============================================================================
-- RESTAURAR FUNÇÃO ORIGINAL QUE FUNCIONAVA
-- =============================================================================
-- Voltando à versão simples e funcional da função listar_entregadores
-- =============================================================================

-- Remover qualquer versão problemática
DROP FUNCTION IF EXISTS public.listar_entregadores(integer, integer, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.listar_entregadores() CASCADE;

-- =============================================================================
-- VERSÃO ORIGINAL FUNCIONAL: listar_entregadores
-- =============================================================================

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
  -- Buscar dados dos entregadores com aderência calculada (VERSÃO ORIGINAL)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id_entregador', id_entregador,
      'nome_entregador', nome_entregador,
      'corridas_ofertadas', corridas_ofertadas,
      'corridas_aceitas', corridas_aceitas,
      'corridas_rejeitadas', corridas_rejeitadas,
      'corridas_completadas', corridas_completadas,
      'aderencia_percentual', aderencia_percentual,
      'rejeicao_percentual', rejeicao_percentual
    ) ORDER BY aderencia_percentual DESC NULLS LAST
  ), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT 
      id_da_pessoa_entregadora as id_entregador,
      COALESCE(MAX(nome_da_pessoa_entregadora), id_da_pessoa_entregadora) as nome_entregador,
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
      ) as aderencia_percentual,
      -- Calcular % de rejeição: (rejeitadas / ofertadas) * 100
      CASE 
        WHEN SUM(COALESCE(numero_de_corridas_ofertadas, 0)) > 0 
        THEN (SUM(COALESCE(numero_de_corridas_rejeitadas, 0))::numeric / SUM(COALESCE(numero_de_corridas_ofertadas, 0))::numeric) * 100
        ELSE 0 
      END as rejeicao_percentual
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

-- =============================================================================
-- FUNÇÃO DE PESQUISA SIMPLES: pesquisar_entregadores 
-- =============================================================================

CREATE OR REPLACE FUNCTION pesquisar_entregadores(
  termo_busca TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Pesquisa simples em todos os dados
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id_entregador', id_entregador,
            'nome_entregador', nome_entregador,
            'corridas_ofertadas', corridas_ofertadas,
            'corridas_aceitas', corridas_aceitas,
            'corridas_rejeitadas', corridas_rejeitadas,
            'corridas_completadas', corridas_completadas,
            'aderencia_percentual', aderencia_percentual,
            'rejeicao_percentual', rejeicao_percentual
        ) ORDER BY aderencia_percentual DESC NULLS LAST
    ), '[]'::jsonb)
    INTO v_result
    FROM (
        SELECT 
            id_da_pessoa_entregadora as id_entregador,
            COALESCE(MAX(nome_da_pessoa_entregadora), id_da_pessoa_entregadora) as nome_entregador,
            SUM(COALESCE(numero_de_corridas_ofertadas, 0)) as corridas_ofertadas,
            SUM(COALESCE(numero_de_corridas_aceitas, 0)) as corridas_aceitas,
            SUM(COALESCE(numero_de_corridas_rejeitadas, 0)) as corridas_rejeitadas,
            SUM(COALESCE(numero_de_corridas_completadas, 0)) as corridas_completadas,
            AVG(
                CASE 
                    WHEN COALESCE(duracao_segundos, 0) > 0 
                    THEN (COALESCE(tempo_disponivel_escalado_segundos, 0)::numeric / duracao_segundos::numeric) * 100
                    ELSE NULL
                END
            ) as aderencia_percentual,
            CASE 
                WHEN SUM(COALESCE(numero_de_corridas_ofertadas, 0)) > 0 
                THEN (SUM(COALESCE(numero_de_corridas_rejeitadas, 0))::numeric / SUM(COALESCE(numero_de_corridas_ofertadas, 0))::numeric) * 100
                ELSE 0 
            END as rejeicao_percentual
        FROM public.dados_corridas
        WHERE id_da_pessoa_entregadora IS NOT NULL
            AND (
                termo_busca IS NULL OR 
                LOWER(COALESCE(nome_da_pessoa_entregadora, id_da_pessoa_entregadora)) LIKE '%' || LOWER(termo_busca) || '%' OR
                LOWER(id_da_pessoa_entregadora) LIKE '%' || LOWER(termo_busca) || '%'
            )
        GROUP BY id_da_pessoa_entregadora
        HAVING COUNT(*) > 0
        ORDER BY 
            AVG(
                CASE 
                    WHEN COALESCE(duracao_segundos, 0) > 0 
                    THEN (COALESCE(tempo_disponivel_escalado_segundos, 0)::numeric / duracao_segundos::numeric) * 100
                    ELSE NULL
                END
            ) DESC NULLS LAST
        LIMIT 5000
    ) sub;

    RETURN jsonb_build_object(
        'entregadores', v_result,
        'total', jsonb_array_length(v_result)
    );
END;
$$;

-- =============================================================================
-- PERMISSÕES
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.listar_entregadores TO anon, authenticated;
GRANT EXECUTE ON FUNCTION pesquisar_entregadores TO anon, authenticated;

-- =============================================================================
-- TESTE IMEDIATO
-- =============================================================================

DO $$
DECLARE
    v_test jsonb;
    v_count integer;
BEGIN
    -- Testar dados básicos
    SELECT COUNT(*) INTO v_count FROM public.dados_corridas WHERE id_da_pessoa_entregadora IS NOT NULL;
    RAISE NOTICE 'Registros na tabela dados_corridas: %', v_count;
    
    -- Testar função sem filtros
    SELECT public.listar_entregadores() INTO v_test;
    RAISE NOTICE 'Resultado sem filtros - Total: %, Entregadores: %', 
        v_test->'total', 
        CASE WHEN jsonb_array_length(v_test->'entregadores') > 0 
             THEN 'ENCONTRADOS' 
             ELSE 'VAZIO' END;
    
    -- Verificar se as funções foram criadas
    IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'listar_entregadores') THEN
        RAISE NOTICE '✅ Função listar_entregadores: CRIADA';
    ELSE
        RAISE NOTICE '❌ Função listar_entregadores: ERRO';
    END IF;
    
    IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'pesquisar_entregadores') THEN
        RAISE NOTICE '✅ Função pesquisar_entregadores: CRIADA';
    ELSE
        RAISE NOTICE '❌ Função pesquisar_entregadores: ERRO';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔄 VERSÃO ORIGINAL RESTAURADA';
    RAISE NOTICE '   • Voltou à versão simples que funcionava';
    RAISE NOTICE '   • Removeu complexidades desnecessárias';
    RAISE NOTICE '   • Mantém compatibilidade com frontend';
    RAISE NOTICE '';
    
    IF (v_test->'total')::integer > 0 THEN
        RAISE NOTICE '🎉 SUCESSO! Entregadores encontrados: %', v_test->'total';
    ELSE
        RAISE NOTICE '⚠️  AINDA SEM DADOS - Verificar filtros ou dados na tabela';
    END IF;
END;
$$;
