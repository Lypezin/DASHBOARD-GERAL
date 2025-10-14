-- =============================================================================
-- SOLUÇÃO DEFINITIVA - ENTREGADORES
-- =============================================================================
-- Corrigido os nomes corretos dos campos da tabela dados_corridas
-- =============================================================================

-- ETAPA 1: REMOVER FUNÇÕES PROBLEMÁTICAS
-- =============================================================================
DROP FUNCTION IF EXISTS public.listar_entregadores(integer, integer, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS pesquisar_entregadores(text) CASCADE;

-- ETAPA 2: CRIAR FUNÇÃO COM CAMPOS CORRETOS
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
  -- Query com os nomes CORRETOS dos campos
  SELECT jsonb_build_object(
    'entregadores', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id_entregador', entregador.id_entregador,
        'nome_entregador', entregador.nome_entregador,
        'corridas_ofertadas', entregador.corridas_ofertadas,
        'corridas_aceitas', entregador.corridas_aceitas,
        'corridas_rejeitadas', entregador.corridas_rejeitadas,
        'corridas_completadas', entregador.corridas_completadas,
        'aderencia_percentual', entregador.aderencia_percentual,
        'rejeicao_percentual', entregador.rejeicao_percentual
      )
    ), '[]'::jsonb),
    'total', COUNT(*)
  )
  INTO v_result
  FROM (
    SELECT 
      d.id_da_pessoa_entregadora as id_entregador,
      -- Campo correto: pessoa_entregadora (não nome_da_pessoa_entregadora)
      COALESCE(MAX(d.pessoa_entregadora), d.id_da_pessoa_entregadora) as nome_entregador,
      SUM(COALESCE(d.numero_de_corridas_ofertadas, 0))::integer as corridas_ofertadas,
      SUM(COALESCE(d.numero_de_corridas_aceitas, 0))::integer as corridas_aceitas,
      SUM(COALESCE(d.numero_de_corridas_rejeitadas, 0))::integer as corridas_rejeitadas,
      SUM(COALESCE(d.numero_de_corridas_completadas, 0))::integer as corridas_completadas,
      -- Calcular aderência: média de (tempo_disponivel_escalado / duracao_do_periodo)
      COALESCE(
        ROUND(
          AVG(
            CASE 
              WHEN COALESCE(d.duracao_segundos, 0) > 0 
              THEN (COALESCE(d.tempo_disponivel_escalado_segundos, 0)::numeric / d.duracao_segundos::numeric) * 100
              ELSE NULL
            END
          )::numeric, 2
        ), 0
      ) as aderencia_percentual,
      -- Calcular % de rejeição: (rejeitadas / ofertadas) * 100
      COALESCE(
        ROUND(
          CASE 
            WHEN SUM(COALESCE(d.numero_de_corridas_ofertadas, 0)) > 0 
            THEN (SUM(COALESCE(d.numero_de_corridas_rejeitadas, 0))::numeric / SUM(COALESCE(d.numero_de_corridas_ofertadas, 0))::numeric) * 100
            ELSE 0 
          END::numeric, 2
        ), 0
      ) as rejeicao_percentual
    FROM public.dados_corridas d
    WHERE d.id_da_pessoa_entregadora IS NOT NULL
      AND d.id_da_pessoa_entregadora != ''
      AND (p_ano IS NULL OR d.ano_iso = p_ano)
      AND (p_semana IS NULL OR d.semana_numero = p_semana)
      AND (p_praca IS NULL OR d.praca = p_praca)
      AND (p_sub_praca IS NULL OR d.sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR d.origem = p_origem)
    GROUP BY d.id_da_pessoa_entregadora
    HAVING COUNT(*) > 0
    ORDER BY aderencia_percentual DESC NULLS LAST
    LIMIT 500
  ) entregador;

  -- Se não encontrou nada, retornar estrutura vazia válida
  IF v_result IS NULL OR (v_result->'total')::integer = 0 THEN
    v_result := jsonb_build_object(
      'entregadores', '[]'::jsonb,
      'total', 0
    );
  END IF;

  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'entregadores', '[]'::jsonb,
    'total', 0,
    'error', SQLERRM
  );
END;
$$;

-- ETAPA 3: CRIAR FUNÇÃO DE PESQUISA
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
    SELECT jsonb_build_object(
        'entregadores', COALESCE(jsonb_agg(
            jsonb_build_object(
                'id_entregador', entregador.id_entregador,
                'nome_entregador', entregador.nome_entregador,
                'corridas_ofertadas', entregador.corridas_ofertadas,
                'corridas_aceitas', entregador.corridas_aceitas,
                'corridas_rejeitadas', entregador.corridas_rejeitadas,
                'corridas_completadas', entregador.corridas_completadas,
                'aderencia_percentual', entregador.aderencia_percentual,
                'rejeicao_percentual', entregador.rejeicao_percentual
            )
        ), '[]'::jsonb),
        'total', COUNT(*)
    )
    INTO v_result
    FROM (
        SELECT 
            d.id_da_pessoa_entregadora as id_entregador,
            -- Campo correto: pessoa_entregadora
            COALESCE(MAX(d.pessoa_entregadora), d.id_da_pessoa_entregadora) as nome_entregador,
            SUM(COALESCE(d.numero_de_corridas_ofertadas, 0))::integer as corridas_ofertadas,
            SUM(COALESCE(d.numero_de_corridas_aceitas, 0))::integer as corridas_aceitas,
            SUM(COALESCE(d.numero_de_corridas_rejeitadas, 0))::integer as corridas_rejeitadas,
            SUM(COALESCE(d.numero_de_corridas_completadas, 0))::integer as corridas_completadas,
            COALESCE(
                ROUND(
                    AVG(
                        CASE 
                            WHEN COALESCE(d.duracao_segundos, 0) > 0 
                            THEN (COALESCE(d.tempo_disponivel_escalado_segundos, 0)::numeric / d.duracao_segundos::numeric) * 100
                            ELSE NULL
                        END
                    )::numeric, 2
                ), 0
            ) as aderencia_percentual,
            COALESCE(
                ROUND(
                    CASE 
                        WHEN SUM(COALESCE(d.numero_de_corridas_ofertadas, 0)) > 0 
                        THEN (SUM(COALESCE(d.numero_de_corridas_rejeitadas, 0))::numeric / SUM(COALESCE(d.numero_de_corridas_ofertadas, 0))::numeric) * 100
                        ELSE 0 
                    END::numeric, 2
                ), 0
            ) as rejeicao_percentual
        FROM public.dados_corridas d
        WHERE d.id_da_pessoa_entregadora IS NOT NULL
            AND d.id_da_pessoa_entregadora != ''
            AND (
                termo_busca IS NULL OR 
                termo_busca = '' OR
                LOWER(COALESCE(d.pessoa_entregadora, d.id_da_pessoa_entregadora)) LIKE '%' || LOWER(TRIM(termo_busca)) || '%'
            )
        GROUP BY d.id_da_pessoa_entregadora
        HAVING COUNT(*) > 0
        ORDER BY aderencia_percentual DESC NULLS LAST
        LIMIT 5000
    ) entregador;

    IF v_result IS NULL THEN
        v_result := jsonb_build_object('entregadores', '[]'::jsonb, 'total', 0);
    END IF;

    RETURN v_result;
END;
$$;

-- ETAPA 4: PERMISSÕES
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.listar_entregadores TO anon, authenticated;
GRANT EXECUTE ON FUNCTION pesquisar_entregadores TO anon, authenticated;

-- ETAPA 5: TESTE FINAL
-- =============================================================================

DO $$
DECLARE
    v_test jsonb;
    v_total integer;
    v_sample RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICAÇÃO DE DADOS ===';
    
    -- Verificar dados na tabela
    SELECT COUNT(*) INTO v_total FROM public.dados_corridas WHERE id_da_pessoa_entregadora IS NOT NULL;
    RAISE NOTICE '📊 Total de registros com entregadores: %', v_total;
    
    -- Mostrar amostra
    SELECT * INTO v_sample FROM public.dados_corridas WHERE id_da_pessoa_entregadora IS NOT NULL LIMIT 1;
    IF FOUND THEN
        RAISE NOTICE '📋 Amostra:';
        RAISE NOTICE '   ID: %', v_sample.id_da_pessoa_entregadora;
        RAISE NOTICE '   Nome: %', v_sample.pessoa_entregadora;
        RAISE NOTICE '   Corridas Aceitas: %', v_sample.numero_de_corridas_aceitas;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTE DA FUNÇÃO ===';
    
    -- Testar função
    SELECT public.listar_entregadores() INTO v_test;
    v_total := COALESCE((v_test->'total')::integer, 0);
    
    RAISE NOTICE '🧪 Resultado do teste:';
    RAISE NOTICE '   Total de entregadores: %', v_total;
    
    IF v_total > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅✅✅ SUCESSO! ✅✅✅';
        RAISE NOTICE '   A função está retornando % entregadores', v_total;
        RAISE NOTICE '   A guia deveria funcionar agora!';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Ainda sem resultados';
        RAISE NOTICE '   Debug: %', v_test;
        RAISE NOTICE '';
    END IF;
    
    RAISE NOTICE '🔧 CORREÇÃO APLICADA:';
    RAISE NOTICE '   ✓ Campo pessoa_entregadora (não nome_da_pessoa_entregadora)';
    RAISE NOTICE '   ✓ Estrutura JSONB correta: {entregadores: [], total: N}';
    RAISE NOTICE '   ✓ Tratamento robusto de erros';
    RAISE NOTICE '   ✓ Compatível com frontend React';
END;
$$;
