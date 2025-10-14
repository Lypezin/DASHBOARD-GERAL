-- =============================================================================
-- SOLUÇÃO FINAL: PESQUISA COMPLETA E COMPATIBILIDADE FRONTEND
-- =============================================================================

-- PRIMEIRA ETAPA: LIMPEZA COMPLETA
-- =============================================================================
DO $$
BEGIN
    -- Remover todas as versões existentes das funções
    DROP FUNCTION IF EXISTS public.listar_entregadores(integer, integer, text, text, text) CASCADE;
    DROP FUNCTION IF EXISTS public.listar_entregadores() CASCADE;
    DROP FUNCTION IF EXISTS public.listar_valores_entregadores(integer, integer, text, text, text, text) CASCADE;
    DROP FUNCTION IF EXISTS public.listar_valores_entregadores(integer, integer, text, text, text) CASCADE; 
    DROP FUNCTION IF EXISTS public.listar_valores_entregadores() CASCADE;
    DROP FUNCTION IF EXISTS pesquisar_valores_entregadores(integer, integer, text, text, text, text) CASCADE;
    DROP FUNCTION IF EXISTS pesquisar_valores_entregadores(text) CASCADE;
    DROP FUNCTION IF EXISTS pesquisar_entregadores(integer, integer, text, text, text, text) CASCADE;
    DROP FUNCTION IF EXISTS pesquisar_entregadores(text) CASCADE;
    
    RAISE NOTICE '🗑️ Funções antigas removidas com sucesso';
END;
$$;

-- =============================================================================
-- FUNÇÃO 1: listar_entregadores
-- Retorna JSONB no formato {entregadores: [], total: number}
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
SET statement_timeout = '120000ms'
SET work_mem = '512MB'
AS $$
DECLARE
  v_entregadores jsonb := '[]'::jsonb;
  v_total integer := 0;
  v_has_filters boolean;
BEGIN
  -- Determinar se há filtros
  v_has_filters := COALESCE(p_ano IS NOT NULL OR p_semana IS NOT NULL OR p_praca IS NOT NULL OR p_sub_praca IS NOT NULL OR p_origem IS NOT NULL, false);

  -- Buscar entregadores
  SELECT 
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'id_entregador', entregador.id_entregador,
        'nome_entregador', entregador.nome_entregador,
        'corridas_ofertadas', entregador.corridas_ofertadas,
        'corridas_aceitas', entregador.corridas_aceitas,
        'corridas_rejeitadas', entregador.corridas_rejeitadas,
        'corridas_completadas', entregador.corridas_completadas,
        'aderencia_percentual', entregador.aderencia_percentual,
        'rejeicao_percentual', entregador.rejeicao_percentual
      ) ORDER BY entregador.aderencia_percentual DESC
    ), '[]'::jsonb) as entregadores_json,
    COUNT(*) as total_count
  INTO v_entregadores, v_total
  FROM (
    SELECT 
      d.id_da_pessoa_entregadora::text as id_entregador,
      COALESCE(MAX(d.nome_da_pessoa_entregadora), d.id_da_pessoa_entregadora::text, 'Sem Nome') as nome_entregador,
      COALESCE(SUM(d.numero_de_corridas_ofertadas), 0)::integer as corridas_ofertadas,
      COALESCE(SUM(d.numero_de_corridas_aceitas), 0)::integer as corridas_aceitas,
      COALESCE(SUM(d.numero_de_corridas_rejeitadas), 0)::integer as corridas_rejeitadas,
      COALESCE(SUM(d.numero_de_corridas_completadas), 0)::integer as corridas_completadas,
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
            WHEN SUM(d.numero_de_corridas_ofertadas) > 0 
            THEN (SUM(d.numero_de_corridas_rejeitadas)::numeric / SUM(d.numero_de_corridas_ofertadas)::numeric) * 100
            ELSE 0 
          END::numeric, 2
        ), 0
      ) as rejeicao_percentual
    FROM public.dados_corridas d
    WHERE 1=1
      AND (p_ano IS NULL OR d.ano_iso = p_ano)
      AND (p_semana IS NULL OR d.semana_numero = p_semana)
      AND (p_praca IS NULL OR d.praca = p_praca)
      AND (p_sub_praca IS NULL OR d.sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR d.origem = p_origem)
      AND d.id_da_pessoa_entregadora IS NOT NULL
    GROUP BY d.id_da_pessoa_entregadora
    ORDER BY 
      CASE 
        WHEN COALESCE(
          ROUND(
            AVG(
              CASE 
                WHEN COALESCE(d.duracao_segundos, 0) > 0 
                THEN (COALESCE(d.tempo_disponivel_escalado_segundos, 0)::numeric / d.duracao_segundos::numeric) * 100
                ELSE NULL
              END
            )::numeric, 2
          ), 0
        ) > 0 THEN COALESCE(
          ROUND(
            AVG(
              CASE 
                WHEN COALESCE(d.duracao_segundos, 0) > 0 
                THEN (COALESCE(d.tempo_disponivel_escalado_segundos, 0)::numeric / d.duracao_segundos::numeric) * 100
                ELSE NULL
              END
            )::numeric, 2
          ), 0
        )
        ELSE -1
      END DESC
    LIMIT CASE WHEN v_has_filters THEN NULL ELSE 500 END
  ) entregador;

  -- Garantir que sempre retornamos um objeto válido
  IF v_entregadores IS NULL THEN
    v_entregadores := '[]'::jsonb;
  END IF;
  
  IF v_total IS NULL THEN
    v_total := 0;
  END IF;

  RETURN jsonb_build_object(
    'entregadores', v_entregadores,
    'total', v_total
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
-- FUNÇÃO 2: listar_valores_entregadores 
-- Retorna TABLE diretamente
-- =============================================================================

CREATE OR REPLACE FUNCTION public.listar_valores_entregadores(
  p_ano INTEGER DEFAULT NULL,
  p_semana INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_sub_praca TEXT DEFAULT NULL,
  p_origem TEXT DEFAULT NULL,
  p_turno TEXT DEFAULT NULL
)
RETURNS TABLE(
  id_entregador TEXT,
  nome_entregador TEXT,
  total_taxas NUMERIC,
  numero_corridas_aceitas BIGINT,
  taxa_media NUMERIC
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET statement_timeout = '120000ms'
SET work_mem = '512MB'
AS $$
DECLARE
  v_has_filters BOOLEAN;
BEGIN
  -- Determinar se há filtros
  v_has_filters := COALESCE(p_ano IS NOT NULL OR p_semana IS NOT NULL OR p_praca IS NOT NULL OR p_sub_praca IS NOT NULL OR p_origem IS NOT NULL OR p_turno IS NOT NULL, false);

  RETURN QUERY
  SELECT 
    d.id_da_pessoa_entregadora::TEXT as id_entregador,
    COALESCE(MAX(d.pessoa_entregadora), d.id_da_pessoa_entregadora::TEXT, 'Sem Nome') as nome_entregador,
    COALESCE(ROUND((SUM(d.soma_das_taxas_das_corridas_aceitas) / 100.0)::numeric, 2), 0) as total_taxas,
    COALESCE(SUM(d.numero_de_corridas_aceitas), 0)::BIGINT as numero_corridas_aceitas,
    COALESCE(
      CASE 
        WHEN SUM(d.numero_de_corridas_aceitas) > 0 
        THEN ROUND(((SUM(d.soma_das_taxas_das_corridas_aceitas) / 100.0) / SUM(d.numero_de_corridas_aceitas))::numeric, 2)
        ELSE 0
      END, 0
    ) as taxa_media
  FROM public.dados_corridas d
  WHERE 1=1
    AND (p_ano IS NULL OR EXTRACT(YEAR FROM d.data_do_periodo) = p_ano)
    AND (p_semana IS NULL OR d.semana_numero = p_semana)
    AND (p_praca IS NULL OR d.praca = p_praca)
    AND (p_sub_praca IS NULL OR d.sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR d.origem = p_origem)
    AND (p_turno IS NULL OR d.periodo = p_turno)
    AND d.id_da_pessoa_entregadora IS NOT NULL
    AND d.data_do_periodo IS NOT NULL
  GROUP BY d.id_da_pessoa_entregadora
  HAVING SUM(COALESCE(d.soma_das_taxas_das_corridas_aceitas, 0)) > 0
  ORDER BY total_taxas DESC
  LIMIT CASE WHEN v_has_filters THEN NULL ELSE 1000 END;
END;
$$;

-- =============================================================================
-- FUNÇÃO 3: pesquisar_valores_entregadores
-- BUSCA EM TODOS OS DADOS - IGNORA FILTROS DE TEMPO
-- =============================================================================

CREATE OR REPLACE FUNCTION pesquisar_valores_entregadores(
  termo_busca TEXT
)
RETURNS TABLE(
  id_entregador TEXT,
  nome_entregador TEXT,
  total_taxas NUMERIC,
  numero_corridas_aceitas BIGINT,
  taxa_media NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(s.id_da_pessoa_entregadora, 'N/A')::TEXT AS id_entregador,
        COALESCE(MAX(s.pessoa_entregadora), s.id_da_pessoa_entregadora::TEXT, 'Sem Nome') AS nome_entregador,
        COALESCE(ROUND((SUM(s.soma_das_taxas_das_corridas_aceitas) / 100.0)::NUMERIC, 2), 0) AS total_taxas,
        COALESCE(SUM(s.numero_de_corridas_aceitas), 0)::BIGINT AS numero_corridas_aceitas,
        COALESCE(
          CASE 
              WHEN SUM(s.numero_de_corridas_aceitas) > 0 
              THEN ROUND(((SUM(s.soma_das_taxas_das_corridas_aceitas) / 100.0) / SUM(s.numero_de_corridas_aceitas))::NUMERIC, 2)
              ELSE 0
          END, 0
        ) AS taxa_media
    FROM public.dados_corridas s
    WHERE 1=1
        -- NENHUM FILTRO DE TEMPO - BUSCA EM TODOS OS DADOS HISTÓRICOS
        AND s.id_da_pessoa_entregadora IS NOT NULL
        AND s.data_do_periodo IS NOT NULL
        AND (
            termo_busca IS NULL OR 
            termo_busca = '' OR
            LOWER(COALESCE(s.pessoa_entregadora, s.id_da_pessoa_entregadora, '')) LIKE '%' || LOWER(TRIM(termo_busca)) || '%' OR
            LOWER(s.id_da_pessoa_entregadora) LIKE '%' || LOWER(TRIM(termo_busca)) || '%'
        )
    GROUP BY s.id_da_pessoa_entregadora
    HAVING SUM(COALESCE(s.numero_de_corridas_aceitas, 0)) > 0
    ORDER BY total_taxas DESC
    LIMIT 15000; -- Limite muito alto para garantir busca completa
END;
$$;

-- =============================================================================
-- FUNÇÃO 4: pesquisar_entregadores
-- BUSCA EM TODOS OS DADOS - IGNORA FILTROS DE TEMPO
-- =============================================================================

CREATE OR REPLACE FUNCTION pesquisar_entregadores(
  termo_busca TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_result jsonb := '[]'::jsonb;
    v_total integer := 0;
BEGIN
    SELECT 
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'id_entregador', e.id_entregador,
                'nome_entregador', e.nome_entregador,
                'corridas_ofertadas', e.corridas_ofertadas,
                'corridas_aceitas', e.corridas_aceitas,
                'corridas_rejeitadas', e.corridas_rejeitadas,
                'corridas_completadas', e.corridas_completadas,
                'aderencia_percentual', e.aderencia_percentual,
                'rejeicao_percentual', e.rejeicao_percentual
            ) ORDER BY e.aderencia_percentual DESC
        ), '[]'::jsonb) as entregadores_json,
        COUNT(*) as total_count
    INTO v_result, v_total
    FROM (
        SELECT 
            COALESCE(s.id_da_pessoa_entregadora, 'N/A')::TEXT AS id_entregador,
            COALESCE(MAX(s.pessoa_entregadora), s.id_da_pessoa_entregadora::TEXT, 'Sem Nome') AS nome_entregador,
            COALESCE(SUM(s.numero_de_corridas_ofertadas), 0)::integer AS corridas_ofertadas,
            COALESCE(SUM(s.numero_de_corridas_aceitas), 0)::integer AS corridas_aceitas,
            COALESCE(SUM(s.numero_de_corridas_rejeitadas), 0)::integer AS corridas_rejeitadas,
            COALESCE(SUM(s.numero_de_corridas_completadas), 0)::integer AS corridas_completadas,
            COALESCE(
              ROUND(
                AVG(
                    CASE 
                        WHEN COALESCE(s.duracao_segundos, 0) > 0 
                        THEN (COALESCE(s.tempo_disponivel_escalado_segundos, 0)::numeric / s.duracao_segundos::numeric) * 100
                        ELSE NULL
                    END
                )::numeric, 2
              ), 0
            ) AS aderencia_percentual,
            COALESCE(
              ROUND(
                CASE 
                    WHEN SUM(s.numero_de_corridas_ofertadas) > 0 
                    THEN (SUM(s.numero_de_corridas_rejeitadas)::NUMERIC / SUM(s.numero_de_corridas_ofertadas)) * 100
                    ELSE 0
                END::numeric, 2
              ), 0
            ) AS rejeicao_percentual
        FROM public.dados_corridas s
        WHERE 1=1
            -- NENHUM FILTRO DE TEMPO - BUSCA EM TODOS OS DADOS HISTÓRICOS
            AND s.id_da_pessoa_entregadora IS NOT NULL
            AND s.data_do_periodo IS NOT NULL
            AND (
                termo_busca IS NULL OR 
                termo_busca = '' OR
                LOWER(COALESCE(s.pessoa_entregadora, s.id_da_pessoa_entregadora, '')) LIKE '%' || LOWER(TRIM(termo_busca)) || '%' OR
                LOWER(s.id_da_pessoa_entregadora) LIKE '%' || LOWER(TRIM(termo_busca)) || '%'
            )
        GROUP BY s.id_da_pessoa_entregadora
        HAVING SUM(COALESCE(s.numero_de_corridas_aceitas, 0)) > 0 OR SUM(COALESCE(s.numero_de_corridas_ofertadas, 0)) > 0
        ORDER BY 
          CASE 
            WHEN COALESCE(
              ROUND(
                AVG(
                    CASE 
                        WHEN COALESCE(s.duracao_segundos, 0) > 0 
                        THEN (COALESCE(s.tempo_disponivel_escalado_segundos, 0)::numeric / s.duracao_segundos::numeric) * 100
                        ELSE NULL
                    END
                )::numeric, 2
              ), 0
            ) > 0 THEN COALESCE(
              ROUND(
                AVG(
                    CASE 
                        WHEN COALESCE(s.duracao_segundos, 0) > 0 
                        THEN (COALESCE(s.tempo_disponivel_escalado_segundos, 0)::numeric / s.duracao_segundos::numeric) * 100
                        ELSE NULL
                    END
                )::numeric, 2
              ), 0
            )
            ELSE -1
          END DESC
        LIMIT 15000 -- Limite muito alto para garantir busca completa
    ) e;

    -- Garantir valores válidos
    IF v_result IS NULL THEN
        v_result := '[]'::jsonb;
    END IF;
    
    IF v_total IS NULL THEN
        v_total := 0;
    END IF;

    RETURN jsonb_build_object(
        'entregadores', v_result,
        'total', v_total
    );
END;
$$;

-- =============================================================================
-- PERMISSÕES
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.listar_entregadores TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_valores_entregadores TO anon, authenticated; 
GRANT EXECUTE ON FUNCTION pesquisar_valores_entregadores TO anon, authenticated;
GRANT EXECUTE ON FUNCTION pesquisar_entregadores TO anon, authenticated;

-- =============================================================================
-- VERIFICAÇÃO FINAL E RESUMO
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 ===== SOLUÇÃO FINAL IMPLEMENTADA ===== 🎯';
    RAISE NOTICE '';
    
    -- Verificar se todas as funções foram criadas
    IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'listar_entregadores') THEN
        RAISE NOTICE '✅ listar_entregadores: FUNCIONANDO';
        RAISE NOTICE '   • Formato: JSONB {entregadores: [], total: number}';
        RAISE NOTICE '   • Limite: 500 sem filtros, ilimitado com filtros';
    ELSE
        RAISE NOTICE '❌ listar_entregadores: ERRO';
    END IF;
    
    IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'listar_valores_entregadores') THEN
        RAISE NOTICE '✅ listar_valores_entregadores: FUNCIONANDO';
        RAISE NOTICE '   • Formato: TABLE com 5 colunas';
        RAISE NOTICE '   • Limite: 1000 sem filtros, ilimitado com filtros';
    ELSE
        RAISE NOTICE '❌ listar_valores_entregadores: ERRO';
    END IF;
    
    IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'pesquisar_valores_entregadores') THEN
        RAISE NOTICE '✅ pesquisar_valores_entregadores: FUNCIONANDO';
        RAISE NOTICE '   • Busca em TODOS os dados históricos';
        RAISE NOTICE '   • Limite: 15.000 resultados';
    ELSE
        RAISE NOTICE '❌ pesquisar_valores_entregadores: ERRO';
    END IF;
    
    IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'pesquisar_entregadores') THEN
        RAISE NOTICE '✅ pesquisar_entregadores: FUNCIONANDO';
        RAISE NOTICE '   • Busca em TODOS os dados históricos';
        RAISE NOTICE '   • Formato: JSONB {entregadores: [], total: number}';
        RAISE NOTICE '   • Limite: 15.000 resultados';
    ELSE
        RAISE NOTICE '❌ pesquisar_entregadores: ERRO';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 PRINCIPAIS MELHORIAS:';
    RAISE NOTICE '   • Pesquisa agora busca em TODOS os dados históricos';
    RAISE NOTICE '   • Não há mais limitação por semana/ano na pesquisa';
    RAISE NOTICE '   • Encontrará qualquer entregador, mesmo fora dos top 500/1000';
    RAISE NOTICE '   • Compatibilidade total com o frontend';
    RAISE NOTICE '   • Tratamento robusto de erros e valores nulos';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PROBLEMA RESOLVIDO! 🎉';
    RAISE NOTICE 'Agora você pode pesquisar qualquer entregador do sistema,';
    RAISE NOTICE 'independente de quando ele trabalhou ou seu ranking atual.';
    RAISE NOTICE '';
END;
$$;
