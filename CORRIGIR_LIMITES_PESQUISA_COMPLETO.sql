-- =============================================================================
-- CORREÇÃO COMPLETA DOS LIMITES DE PESQUISA - SEM CONFLITOS
-- =============================================================================
-- Remove e recria todas as funções com as assinaturas corretas
-- =============================================================================

-- PRIMEIRO: DROP todas as funções existentes que podem ter conflito
-- =============================================================================

-- Remover todas as versões da função listar_entregadores
DROP FUNCTION IF EXISTS public.listar_entregadores(integer, integer, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.listar_entregadores() CASCADE;

-- Remover todas as versões da função listar_valores_entregadores  
DROP FUNCTION IF EXISTS public.listar_valores_entregadores(integer, integer, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.listar_valores_entregadores(integer, integer, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.listar_valores_entregadores() CASCADE;

-- Remover funções de pesquisa se existirem
DROP FUNCTION IF EXISTS pesquisar_valores_entregadores(integer, integer, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS pesquisar_entregadores(integer, integer, text, text, text, text) CASCADE;

-- =============================================================================
-- RECRIAR: Função listar_entregadores SEM LIMITE quando há filtros
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
BEGIN
  -- Verificar se há filtros específicos
  v_has_filters := (p_ano IS NOT NULL OR p_semana IS NOT NULL OR p_praca IS NOT NULL OR p_sub_praca IS NOT NULL OR p_origem IS NOT NULL);

  -- Buscar dados dos entregadores com aderência calculada
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
    -- Aplicar limite apenas se NÃO há filtros específicos
    LIMIT CASE WHEN v_has_filters THEN NULL ELSE 500 END
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
-- RECRIAR: Função listar_valores_entregadores SEM LIMITE quando há filtros
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
    numero_corridas_aceitas INTEGER,
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
  -- Verificar se há filtros específicos
  v_has_filters := (p_ano IS NOT NULL OR p_semana IS NOT NULL OR p_praca IS NOT NULL OR p_sub_praca IS NOT NULL OR p_origem IS NOT NULL OR p_turno IS NOT NULL);

  RETURN QUERY
  SELECT 
    d.id_da_pessoa_entregadora::TEXT as id_entregador,
    COALESCE(MAX(d.pessoa_entregadora), d.id_da_pessoa_entregadora::TEXT) as nome_entregador,
    ROUND((SUM(COALESCE(d.soma_das_taxas_das_corridas_aceitas, 0)) / 100.0)::numeric, 2) as total_taxas,
    SUM(COALESCE(d.numero_de_corridas_aceitas, 0)) as numero_corridas_aceitas,
    CASE 
      WHEN SUM(COALESCE(d.numero_de_corridas_aceitas, 0)) > 0 
      THEN ROUND(((SUM(COALESCE(d.soma_das_taxas_das_corridas_aceitas, 0)) / 100.0) / SUM(COALESCE(d.numero_de_corridas_aceitas, 0)))::numeric, 2)
      ELSE 0
    END as taxa_media
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
  -- Aplicar limite apenas se NÃO há filtros específicos
  LIMIT CASE WHEN v_has_filters THEN NULL ELSE 1000 END;
END;
$$;

-- =============================================================================
-- CRIAR: Função pesquisar_valores_entregadores para busca ampla
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
    numero_corridas_aceitas INTEGER,
    taxa_media NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(s.id_da_pessoa_entregadora, 'N/A')::TEXT AS id_entregador,
        COALESCE(MAX(s.pessoa_entregadora), COALESCE(s.id_da_pessoa_entregadora, 'Desconhecido'))::TEXT AS nome_entregador,
        COALESCE(SUM(s.soma_das_taxas_das_corridas_aceitas) / 100.0, 0)::NUMERIC AS total_taxas,
        COALESCE(SUM(s.numero_de_corridas_aceitas), 0)::INTEGER AS numero_corridas_aceitas,
        CASE 
            WHEN SUM(s.numero_de_corridas_aceitas) > 0 
            THEN (SUM(s.soma_das_taxas_das_corridas_aceitas) / 100.0) / SUM(s.numero_de_corridas_aceitas)
            ELSE 0
        END::NUMERIC AS taxa_media
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
-- CRIAR: Função pesquisar_entregadores para busca ampla
-- =============================================================================

CREATE OR REPLACE FUNCTION pesquisar_entregadores(
    p_ano INTEGER DEFAULT NULL,
    p_semana INTEGER DEFAULT NULL,
    p_praca TEXT DEFAULT NULL,
    p_sub_praca TEXT DEFAULT NULL,
    p_origem TEXT DEFAULT NULL,
    termo_busca TEXT DEFAULT NULL
)
RETURNS TABLE(
    entregadores JSONB,
    total INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_entregadores JSONB;
    v_total INTEGER;
BEGIN
    -- Calcular entregadores filtrados por pesquisa
    WITH entregadores_data AS (
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
    )
    SELECT 
        COALESCE(jsonb_agg(
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
        ), '[]'::jsonb),
        COUNT(*)::INTEGER
    INTO v_entregadores, v_total
    FROM entregadores_data e;

    RETURN QUERY SELECT v_entregadores, COALESCE(v_total, 0);
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
-- COMENTÁRIOS
-- =============================================================================

COMMENT ON FUNCTION public.listar_entregadores IS 'Lista entregadores - sem limite quando há filtros, com limite 500 na visualização geral';
COMMENT ON FUNCTION public.listar_valores_entregadores IS 'Lista valores - sem limite quando há filtros, com limite 1000 na visualização geral';
COMMENT ON FUNCTION pesquisar_valores_entregadores IS 'Pesquisa valores com limite 5000 para busca ampla';
COMMENT ON FUNCTION pesquisar_entregadores IS 'Pesquisa entregadores com limite 5000 para busca ampla';

-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================

-- Testar se as funções foram criadas corretamente
DO $$
BEGIN
    RAISE NOTICE '✅ Função listar_entregadores: %', 
        CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'listar_entregadores') 
        THEN 'CRIADA' ELSE '❌ ERRO' END;
    
    RAISE NOTICE '✅ Função listar_valores_entregadores: %', 
        CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'listar_valores_entregadores') 
        THEN 'CRIADA' ELSE '❌ ERRO' END;
    
    RAISE NOTICE '✅ Função pesquisar_valores_entregadores: %', 
        CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'pesquisar_valores_entregadores') 
        THEN 'CRIADA' ELSE '❌ ERRO' END;
    
    RAISE NOTICE '✅ Função pesquisar_entregadores: %', 
        CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'pesquisar_entregadores') 
        THEN 'CRIADA' ELSE '❌ ERRO' END;
    
    RAISE NOTICE '🎉 CORREÇÃO CONCLUÍDA! Agora a pesquisa funcionará para QUALQUER entregador no sistema.';
END;
$$;
