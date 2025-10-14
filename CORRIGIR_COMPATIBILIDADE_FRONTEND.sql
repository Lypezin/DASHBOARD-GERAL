-- =============================================================================
-- CORREÇÃO DE COMPATIBILIDADE COM O FRONTEND
-- =============================================================================
-- Corrige funções para retornarem exatamente o que o frontend espera
-- =============================================================================

-- REMOVER FUNÇÕES PROBLEMÁTICAS
-- =============================================================================
DROP FUNCTION IF EXISTS public.listar_entregadores(integer, integer, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.listar_valores_entregadores(integer, integer, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS pesquisar_valores_entregadores(integer, integer, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS pesquisar_entregadores(integer, integer, text, text, text, text) CASCADE;

-- =============================================================================
-- RECRIAR: listar_entregadores - RETORNA JSONB como o frontend espera
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
  v_result jsonb;
  v_has_filters boolean;
  v_limit_clause text;
BEGIN
  -- Verificar se há filtros específicos
  v_has_filters := (p_ano IS NOT NULL OR p_semana IS NOT NULL OR p_praca IS NOT NULL OR p_sub_praca IS NOT NULL OR p_origem IS NOT NULL);
  
  -- Definir limite dinamicamente
  IF v_has_filters THEN
    v_limit_clause := ''; -- Sem limite quando há filtros
  ELSE
    v_limit_clause := 'LIMIT 500'; -- Limite apenas na visualização geral
  END IF;

  -- Buscar dados dos entregadores com aderência calculada
  EXECUTE format('
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        ''id_entregador'', id_entregador,
        ''nome_entregador'', nome_entregador,
        ''corridas_ofertadas'', corridas_ofertadas,
        ''corridas_aceitas'', corridas_aceitas,
        ''corridas_rejeitadas'', corridas_rejeitadas,
        ''corridas_completadas'', corridas_completadas,
        ''aderencia_percentual'', aderencia_percentual,
        ''rejeicao_percentual'', rejeicao_percentual
      ) ORDER BY aderencia_percentual DESC NULLS LAST
    ), ''[]''::jsonb)
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
      WHERE ($1 IS NULL OR ano_iso = $1)
        AND ($2 IS NULL OR semana_numero = $2)
        AND ($3 IS NULL OR praca = $3)
        AND ($4 IS NULL OR sub_praca = $4)
        AND ($5 IS NULL OR origem = $5)
        AND id_da_pessoa_entregadora IS NOT NULL
      GROUP BY id_da_pessoa_entregadora
      HAVING COUNT(*) > 0
      ORDER BY 
        CASE 
          WHEN AVG(
            CASE 
              WHEN COALESCE(duracao_segundos, 0) > 0 
              THEN (COALESCE(tempo_disponivel_escalado_segundos, 0)::numeric / duracao_segundos::numeric) * 100
              ELSE NULL
            END
          ) IS NOT NULL THEN AVG(
            CASE 
              WHEN COALESCE(duracao_segundos, 0) > 0 
              THEN (COALESCE(tempo_disponivel_escalado_segundos, 0)::numeric / duracao_segundos::numeric) * 100
              ELSE NULL
            END
          ) 
          ELSE -1 
        END DESC NULLS LAST
      %s
    ) sub', v_limit_clause)
  INTO v_result
  USING p_ano, p_semana, p_praca, p_sub_praca, p_origem;

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
-- RECRIAR: listar_valores_entregadores - RETORNA ARRAY diretamente
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
  v_limit_clause TEXT;
BEGIN
  -- Verificar se há filtros específicos
  v_has_filters := (p_ano IS NOT NULL OR p_semana IS NOT NULL OR p_praca IS NOT NULL OR p_sub_praca IS NOT NULL OR p_origem IS NOT NULL OR p_turno IS NOT NULL);
  
  -- Definir limite dinamicamente
  IF v_has_filters THEN
    v_limit_clause := ''; -- Sem limite quando há filtros
  ELSE
    v_limit_clause := 'LIMIT 1000'; -- Limite apenas na visualização geral
  END IF;

  RETURN QUERY
  EXECUTE format('
    SELECT 
      d.id_da_pessoa_entregadora::TEXT as id_entregador,
      COALESCE(MAX(d.pessoa_entregadora), d.id_da_pessoa_entregadora::TEXT) as nome_entregador,
      ROUND((SUM(COALESCE(d.soma_das_taxas_das_corridas_aceitas, 0)) / 100.0)::numeric, 2) as total_taxas,
      SUM(COALESCE(d.numero_de_corridas_aceitas, 0))::BIGINT as numero_corridas_aceitas,
      CASE 
        WHEN SUM(COALESCE(d.numero_de_corridas_aceitas, 0)) > 0 
        THEN ROUND(((SUM(COALESCE(d.soma_das_taxas_das_corridas_aceitas, 0)) / 100.0) / SUM(COALESCE(d.numero_de_corridas_aceitas, 0)))::numeric, 2)
        ELSE 0
      END as taxa_media
    FROM public.dados_corridas d
    WHERE 1=1
      AND ($1 IS NULL OR EXTRACT(YEAR FROM d.data_do_periodo) = $1)
      AND ($2 IS NULL OR d.semana_numero = $2)
      AND ($3 IS NULL OR d.praca = $3)
      AND ($4 IS NULL OR d.sub_praca = $4)
      AND ($5 IS NULL OR d.origem = $5)
      AND ($6 IS NULL OR d.periodo = $6)
      AND d.id_da_pessoa_entregadora IS NOT NULL
      AND d.data_do_periodo IS NOT NULL
    GROUP BY d.id_da_pessoa_entregadora
    HAVING SUM(COALESCE(d.soma_das_taxas_das_corridas_aceitas, 0)) > 0
    ORDER BY total_taxas DESC
    %s', v_limit_clause)
  USING p_ano, p_semana, p_praca, p_sub_praca, p_origem, p_turno;
END;
$$;

-- =============================================================================
-- RECRIAR: pesquisar_valores_entregadores para busca ampla
-- =============================================================================

CREATE OR REPLACE FUNCTION pesquisar_valores_entregadores(
  p_ano INTEGER DEFAULT NULL,
  p_semana INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_sub_praca TEXT DEFAULT NULL,
  p_origem TEXT DEFAULT NULL,
  termo_busca TEXT DEFAULT NULL
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
        COALESCE(MAX(s.pessoa_entregadora), COALESCE(s.id_da_pessoa_entregadora, 'Desconhecido'))::TEXT AS nome_entregador,
        COALESCE(ROUND((SUM(s.soma_das_taxas_das_corridas_aceitas) / 100.0)::NUMERIC, 2), 0) AS total_taxas,
        COALESCE(SUM(s.numero_de_corridas_aceitas), 0)::BIGINT AS numero_corridas_aceitas,
        CASE 
            WHEN SUM(s.numero_de_corridas_aceitas) > 0 
            THEN ROUND(((SUM(s.soma_das_taxas_das_corridas_aceitas) / 100.0) / SUM(s.numero_de_corridas_aceitas))::NUMERIC, 2)
            ELSE 0
        END AS taxa_media
    FROM public.dados_corridas s
    WHERE
        (p_ano IS NULL OR EXTRACT(ISOYEAR FROM s.data_do_periodo)::INTEGER = p_ano) AND
        (p_semana IS NULL OR s.semana_numero = p_semana) AND
        (p_praca IS NULL OR s.praca = p_praca) AND
        (p_sub_praca IS NULL OR s.sub_praca = p_sub_praca) AND
        (p_origem IS NULL OR s.origem = p_origem) AND
        (
            termo_busca IS NULL OR 
            LOWER(COALESCE(s.pessoa_entregadora, s.id_da_pessoa_entregadora, '')) LIKE '%' || LOWER(termo_busca) || '%' OR
            LOWER(s.id_da_pessoa_entregadora) LIKE '%' || LOWER(termo_busca) || '%'
        ) AND
        s.id_da_pessoa_entregadora IS NOT NULL
    GROUP BY s.id_da_pessoa_entregadora
    HAVING SUM(s.numero_de_corridas_aceitas) > 0
    ORDER BY total_taxas DESC
    LIMIT 5000; -- Limite alto para permitir pesquisa ampla
END;
$$;

-- =============================================================================
-- RECRIAR: pesquisar_entregadores para busca ampla
-- =============================================================================

CREATE OR REPLACE FUNCTION pesquisar_entregadores(
  p_ano INTEGER DEFAULT NULL,
  p_semana INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_sub_praca TEXT DEFAULT NULL,
  p_origem TEXT DEFAULT NULL,
  termo_busca TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Buscar entregadores com pesquisa
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id_entregador', e.id_entregador,
            'nome_entregador', e.nome_entregador,
            'corridas_ofertadas', e.corridas_ofertadas,
            'corridas_aceitas', e.corridas_aceitas,
            'corridas_rejeitadas', e.corridas_rejeitadas,
            'corridas_completadas', e.corridas_completadas,
            'aderencia_percentual', ROUND(e.aderencia_percentual::NUMERIC, 2),
            'rejeicao_percentual', ROUND(e.rejeicao_percentual::NUMERIC, 2)
        )
    ), '[]'::jsonb)
    INTO v_result
    FROM (
        SELECT 
            COALESCE(s.id_da_pessoa_entregadora, 'N/A')::TEXT AS id_entregador,
            COALESCE(MAX(s.pessoa_entregadora), COALESCE(s.id_da_pessoa_entregadora, 'Desconhecido'))::TEXT AS nome_entregador,
            SUM(COALESCE(s.numero_de_corridas_ofertadas, 0)) AS corridas_ofertadas,
            SUM(COALESCE(s.numero_de_corridas_aceitas, 0)) AS corridas_aceitas,
            SUM(COALESCE(s.numero_de_corridas_rejeitadas, 0)) AS corridas_rejeitadas,
            SUM(COALESCE(s.numero_de_corridas_completadas, 0)) AS corridas_completadas,
            AVG(
                CASE 
                    WHEN COALESCE(s.duracao_segundos, 0) > 0 
                    THEN (COALESCE(s.tempo_disponivel_escalado_segundos, 0)::numeric / s.duracao_segundos::numeric) * 100
                    ELSE NULL
                END
            ) AS aderencia_percentual,
            CASE 
                WHEN SUM(COALESCE(s.numero_de_corridas_ofertadas, 0)) > 0 
                THEN (SUM(COALESCE(s.numero_de_corridas_rejeitadas, 0))::NUMERIC / SUM(COALESCE(s.numero_de_corridas_ofertadas, 0))) * 100
                ELSE 0
            END AS rejeicao_percentual
        FROM public.dados_corridas s
        WHERE
            (p_ano IS NULL OR EXTRACT(ISOYEAR FROM s.data_do_periodo)::INTEGER = p_ano) AND
            (p_semana IS NULL OR s.semana_numero = p_semana) AND
            (p_praca IS NULL OR s.praca = p_praca) AND
            (p_sub_praca IS NULL OR s.sub_praca = p_sub_praca) AND
            (p_origem IS NULL OR s.origem = p_origem) AND
            (
                termo_busca IS NULL OR 
                LOWER(COALESCE(s.pessoa_entregadora, s.id_da_pessoa_entregadora, '')) LIKE '%' || LOWER(termo_busca) || '%' OR
                LOWER(s.id_da_pessoa_entregadora) LIKE '%' || LOWER(termo_busca) || '%'
            ) AND
            s.id_da_pessoa_entregadora IS NOT NULL
        GROUP BY s.id_da_pessoa_entregadora
        HAVING SUM(s.numero_de_corridas_aceitas) > 0 OR SUM(s.numero_de_corridas_ofertadas) > 0
        ORDER BY 
            CASE 
                WHEN AVG(
                    CASE 
                        WHEN COALESCE(s.duracao_segundos, 0) > 0 
                        THEN (COALESCE(s.tempo_disponivel_escalado_segundos, 0)::numeric / s.duracao_segundos::numeric) * 100
                        ELSE NULL
                    END
                ) IS NOT NULL THEN AVG(
                    CASE 
                        WHEN COALESCE(s.duracao_segundos, 0) > 0 
                        THEN (COALESCE(s.tempo_disponivel_escalado_segundos, 0)::numeric / s.duracao_segundos::numeric) * 100
                        ELSE NULL
                    END
                ) 
                ELSE -1 
            END DESC NULLS LAST
        LIMIT 5000 -- Limite alto para permitir pesquisa ampla
    ) e;

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
GRANT EXECUTE ON FUNCTION public.listar_valores_entregadores TO anon, authenticated;
GRANT EXECUTE ON FUNCTION pesquisar_valores_entregadores TO anon, authenticated;
GRANT EXECUTE ON FUNCTION pesquisar_entregadores TO anon, authenticated;

-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Função listar_entregadores: %', 
        CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'listar_entregadores') 
        THEN 'CRIADA - Retorna JSONB com entregadores e total' ELSE '❌ ERRO' END;
    
    RAISE NOTICE '✅ Função listar_valores_entregadores: %', 
        CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'listar_valores_entregadores') 
        THEN 'CRIADA - Retorna TABLE com valores' ELSE '❌ ERRO' END;
    
    RAISE NOTICE '✅ Função pesquisar_valores_entregadores: %', 
        CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'pesquisar_valores_entregadores') 
        THEN 'CRIADA - Retorna TABLE para pesquisa' ELSE '❌ ERRO' END;
    
    RAISE NOTICE '✅ Função pesquisar_entregadores: %', 
        CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'pesquisar_entregadores') 
        THEN 'CRIADA - Retorna JSONB para pesquisa' ELSE '❌ ERRO' END;
    
    RAISE NOTICE '🎉 CORREÇÃO DE COMPATIBILIDADE CONCLUÍDA!';
    RAISE NOTICE '📋 RESUMO:';
    RAISE NOTICE '   • listar_entregadores: Limites dinâmicos (500 sem filtros, ilimitado com filtros)';
    RAISE NOTICE '   • listar_valores_entregadores: Limites dinâmicos (1000 sem filtros, ilimitado com filtros)';
    RAISE NOTICE '   • pesquisar_*: Limite alto (5000) para pesquisa ampla';
    RAISE NOTICE '   • Tipos compatíveis com frontend (BIGINT, NUMERIC, JSONB)';
END;
$$;
