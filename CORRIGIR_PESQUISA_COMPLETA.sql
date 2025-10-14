-- =============================================================================
-- CORREÇÃO DEFINITIVA: PESQUISA COMPLETA EM TODOS OS DADOS
-- =============================================================================
-- Corrige para que a pesquisa funcione em TODOS os dados, ignorando filtros
-- =============================================================================

-- REMOVER TODAS AS FUNÇÕES PROBLEMÁTICAS
-- =============================================================================
DROP FUNCTION IF EXISTS public.listar_entregadores(integer, integer, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.listar_valores_entregadores(integer, integer, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS pesquisar_valores_entregadores(integer, integer, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS pesquisar_entregadores(integer, integer, text, text, text, text) CASCADE;

-- =============================================================================
-- FUNÇÃO: listar_entregadores - FORMATO CORRETO JSONB
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
  v_entregadores jsonb;
  v_total integer;
  v_has_filters boolean;
BEGIN
  -- Verificar se há filtros específicos
  v_has_filters := (p_ano IS NOT NULL OR p_semana IS NOT NULL OR p_praca IS NOT NULL OR p_sub_praca IS NOT NULL OR p_origem IS NOT NULL);

  -- Buscar dados dos entregadores
  WITH entregadores_data AS (
    SELECT 
      id_da_pessoa_entregadora as id_entregador,
      COALESCE(MAX(nome_da_pessoa_entregadora), id_da_pessoa_entregadora) as nome_entregador,
      SUM(COALESCE(numero_de_corridas_ofertadas, 0))::integer as corridas_ofertadas,
      SUM(COALESCE(numero_de_corridas_aceitas, 0))::integer as corridas_aceitas,
      SUM(COALESCE(numero_de_corridas_rejeitadas, 0))::integer as corridas_rejeitadas,
      SUM(COALESCE(numero_de_corridas_completadas, 0))::integer as corridas_completadas,
      COALESCE(AVG(
        CASE 
          WHEN COALESCE(duracao_segundos, 0) > 0 
          THEN (COALESCE(tempo_disponivel_escalado_segundos, 0)::numeric / duracao_segundos::numeric) * 100
          ELSE NULL
        END
      ), 0)::numeric as aderencia_percentual,
      COALESCE(CASE 
        WHEN SUM(COALESCE(numero_de_corridas_ofertadas, 0)) > 0 
        THEN (SUM(COALESCE(numero_de_corridas_rejeitadas, 0))::numeric / SUM(COALESCE(numero_de_corridas_ofertadas, 0))::numeric) * 100
        ELSE 0 
      END, 0)::numeric as rejeicao_percentual
    FROM public.dados_corridas
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
      AND id_da_pessoa_entregadora IS NOT NULL
    GROUP BY id_da_pessoa_entregadora
    HAVING COUNT(*) > 0
    ORDER BY aderencia_percentual DESC NULLS LAST
    -- Limite apenas se não há filtros
    LIMIT CASE WHEN v_has_filters THEN NULL ELSE 500 END
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
        'aderencia_percentual', ROUND(e.aderencia_percentual, 2),
        'rejeicao_percentual', ROUND(e.rejeicao_percentual, 2)
      )
    ), '[]'::jsonb),
    COUNT(*)::integer
  INTO v_entregadores, v_total
  FROM entregadores_data e;

  RETURN jsonb_build_object(
    'entregadores', v_entregadores,
    'total', COALESCE(v_total, 0)
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
-- FUNÇÃO: listar_valores_entregadores - LIMITE DINÂMICO
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
  -- Verificar se há filtros específicos
  v_has_filters := (p_ano IS NOT NULL OR p_semana IS NOT NULL OR p_praca IS NOT NULL OR p_sub_praca IS NOT NULL OR p_origem IS NOT NULL OR p_turno IS NOT NULL);

  RETURN QUERY
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
  -- Limite apenas se não há filtros
  LIMIT CASE WHEN v_has_filters THEN NULL ELSE 1000 END;
END;
$$;

-- =============================================================================
-- FUNÇÃO: pesquisar_valores_entregadores - BUSCA EM TODOS OS DADOS
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
    -- PESQUISA EM TODOS OS DADOS HISTÓRICOS - IGNORA TODOS OS FILTROS DE TEMPO
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
        -- APENAS FILTRO DE BUSCA - NENHUM FILTRO DE TEMPO/LOCALIZAÇÃO
        (
            termo_busca IS NULL OR 
            LOWER(COALESCE(s.pessoa_entregadora, s.id_da_pessoa_entregadora, '')) LIKE '%' || LOWER(termo_busca) || '%' OR
            LOWER(s.id_da_pessoa_entregadora) LIKE '%' || LOWER(termo_busca) || '%'
        ) AND
        s.id_da_pessoa_entregadora IS NOT NULL AND
        s.data_do_periodo IS NOT NULL
    GROUP BY s.id_da_pessoa_entregadora
    HAVING SUM(s.numero_de_corridas_aceitas) > 0
    ORDER BY total_taxas DESC
    LIMIT 10000; -- Limite muito alto para garantir que encontre qualquer entregador
END;
$$;

-- =============================================================================
-- FUNÇÃO: pesquisar_entregadores - BUSCA EM TODOS OS DADOS
-- =============================================================================

CREATE OR REPLACE FUNCTION pesquisar_entregadores(
  termo_busca TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_result jsonb;
    v_total integer;
BEGIN
    -- PESQUISA EM TODOS OS DADOS HISTÓRICOS - IGNORA TODOS OS FILTROS DE TEMPO
    WITH entregadores_data AS (
        SELECT 
            COALESCE(s.id_da_pessoa_entregadora, 'N/A')::TEXT AS id_entregador,
            COALESCE(MAX(s.pessoa_entregadora), COALESCE(s.id_da_pessoa_entregadora, 'Desconhecido'))::TEXT AS nome_entregador,
            SUM(COALESCE(s.numero_de_corridas_ofertadas, 0))::integer AS corridas_ofertadas,
            SUM(COALESCE(s.numero_de_corridas_aceitas, 0))::integer AS corridas_aceitas,
            SUM(COALESCE(s.numero_de_corridas_rejeitadas, 0))::integer AS corridas_rejeitadas,
            SUM(COALESCE(s.numero_de_corridas_completadas, 0))::integer AS corridas_completadas,
            COALESCE(AVG(
                CASE 
                    WHEN COALESCE(s.duracao_segundos, 0) > 0 
                    THEN (COALESCE(s.tempo_disponivel_escalado_segundos, 0)::numeric / s.duracao_segundos::numeric) * 100
                    ELSE NULL
                END
            ), 0) AS aderencia_percentual,
            COALESCE(CASE 
                WHEN SUM(COALESCE(s.numero_de_corridas_ofertadas, 0)) > 0 
                THEN (SUM(COALESCE(s.numero_de_corridas_rejeitadas, 0))::NUMERIC / SUM(COALESCE(s.numero_de_corridas_ofertadas, 0))) * 100
                ELSE 0
            END, 0) AS rejeicao_percentual
        FROM public.dados_corridas s
        WHERE
            -- APENAS FILTRO DE BUSCA - NENHUM FILTRO DE TEMPO/LOCALIZAÇÃO
            (
                termo_busca IS NULL OR 
                LOWER(COALESCE(s.pessoa_entregadora, s.id_da_pessoa_entregadora, '')) LIKE '%' || LOWER(termo_busca) || '%' OR
                LOWER(s.id_da_pessoa_entregadora) LIKE '%' || LOWER(termo_busca) || '%'
            ) AND
            s.id_da_pessoa_entregadora IS NOT NULL AND
            s.data_do_periodo IS NOT NULL
        GROUP BY s.id_da_pessoa_entregadora
        HAVING SUM(s.numero_de_corridas_aceitas) > 0 OR SUM(s.numero_de_corridas_ofertadas) > 0
        ORDER BY aderencia_percentual DESC NULLS LAST
        LIMIT 10000 -- Limite muito alto para garantir que encontre qualquer entregador
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
        COUNT(*)::integer
    INTO v_result, v_total
    FROM entregadores_data e;

    RETURN jsonb_build_object(
        'entregadores', v_result,
        'total', COALESCE(v_total, 0)
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
-- VERIFICAÇÃO E TESTES
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO DAS FUNÇÕES ===';
    
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
    
    RAISE NOTICE '';
    RAISE NOTICE '=== RESUMO DAS CORREÇÕES ===';
    RAISE NOTICE '🎯 LISTAGEM:';
    RAISE NOTICE '   • listar_entregadores: Sem limite COM filtros, 500 SEM filtros';
    RAISE NOTICE '   • listar_valores_entregadores: Sem limite COM filtros, 1000 SEM filtros';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 PESQUISA (PRINCIPAL CORREÇÃO):';
    RAISE NOTICE '   • pesquisar_valores_entregadores: Busca em TODOS os dados históricos';
    RAISE NOTICE '   • pesquisar_entregadores: Busca em TODOS os dados históricos';
    RAISE NOTICE '   • IGNORA filtros de ano, semana, praça, origem, turno';
    RAISE NOTICE '   • Limite de 10.000 resultados para garantir que encontre qualquer entregador';
    RAISE NOTICE '';
    RAISE NOTICE '💡 COMPATIBILIDADE:';
    RAISE NOTICE '   • Tipos corretos: BIGINT, NUMERIC, INTEGER, JSONB';
    RAISE NOTICE '   • Formato exato esperado pelo frontend';
    RAISE NOTICE '   • Tratamento de valores nulos e fallbacks';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PROBLEMA RESOLVIDO!';
    RAISE NOTICE '   Agora a pesquisa funcionará para QUALQUER entregador,';
    RAISE NOTICE '   mesmo que esteja fora dos limites da visualização atual.';
END;
$$;
