-- =============================================================================
-- FUNÇÕES DE PESQUISA PERFORMÁTICA
-- =============================================================================
-- Estas funções permitem pesquisar entregadores em todos os dados do banco
-- de forma performática, utilizando índices e filtragem eficiente.
-- =============================================================================

-- 1. FUNÇÃO: pesquisar_valores_entregadores
-- Pesquisa valores de entregadores por nome ou ID
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
        COALESCE(s.id_entregador, 'N/A')::TEXT AS id_entregador,
        COALESCE(s.nome_entregador, 'Desconhecido')::TEXT AS nome_entregador,
        COALESCE(SUM(s.soma_das_taxas_das_corridas_aceitas) / 100.0, 0)::NUMERIC AS total_taxas,
        COALESCE(SUM(s.total_aceitas), 0)::INTEGER AS numero_corridas_aceitas,
        CASE 
            WHEN SUM(s.total_aceitas) > 0 
            THEN (SUM(s.soma_das_taxas_das_corridas_aceitas) / 100.0) / SUM(s.total_aceitas)
            ELSE 0
        END::NUMERIC AS taxa_media
    FROM public.dados_corridas s
    WHERE
        (p_ano IS NULL OR EXTRACT(ISOYEAR FROM s.data_do_periodo)::INTEGER = p_ano) AND
        (p_semana IS NULL OR EXTRACT(WEEK FROM s.data_do_periodo)::INTEGER = p_semana) AND
        (p_praca IS NULL OR s.praca = p_praca) AND
        (p_sub_praca IS NULL OR s.sub_praca = p_sub_praca) AND
        (p_origem IS NULL OR s.origem = p_origem) AND
        (
            termo_busca IS NULL OR 
            LOWER(s.nome_entregador) LIKE '%' || LOWER(termo_busca) || '%' OR
            LOWER(s.id_entregador) LIKE '%' || LOWER(termo_busca) || '%'
        )
    GROUP BY s.id_entregador, s.nome_entregador
    HAVING SUM(s.total_aceitas) > 0
    ORDER BY total_taxas DESC
    LIMIT 100;
END;
$$;

-- 2. FUNÇÃO: pesquisar_entregadores
-- Pesquisa entregadores com estatísticas completas por nome ou ID
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
            COALESCE(s.id_entregador, 'N/A')::TEXT AS id_entregador,
            COALESCE(s.nome_entregador, 'Desconhecido')::TEXT AS nome_entregador,
            COALESCE(SUM(s.total_ofertadas), 0) AS corridas_ofertadas,
            COALESCE(SUM(s.total_aceitas), 0) AS corridas_aceitas,
            COALESCE(SUM(s.total_rejeitadas), 0) AS corridas_rejeitadas,
            COALESCE(SUM(s.total_completadas), 0) AS corridas_completadas,
            CASE 
                WHEN SUM(s.horas_a_entregar) > 0 
                THEN (SUM(s.horas_entregues) / SUM(s.horas_a_entregar)) * 100
                ELSE 0
            END AS aderencia_percentual,
            CASE 
                WHEN SUM(s.total_ofertadas) > 0 
                THEN (SUM(s.total_rejeitadas)::NUMERIC / SUM(s.total_ofertadas)) * 100
                ELSE 0
            END AS rejeicao_percentual
        FROM public.mv_aderencia_agregada s
        WHERE
            (p_ano IS NULL OR s.ano_iso = p_ano) AND
            (p_semana IS NULL OR s.semana_numero = p_semana) AND
            (p_praca IS NULL OR s.praca = p_praca) AND
            (p_sub_praca IS NULL OR s.sub_praca = p_sub_praca) AND
            (p_origem IS NULL OR s.origem = p_origem) AND
            (
                termo_busca IS NULL OR 
                LOWER(s.nome_entregador) LIKE '%' || LOWER(termo_busca) || '%' OR
                LOWER(s.id_entregador) LIKE '%' || LOWER(termo_busca) || '%'
            )
        GROUP BY s.id_entregador, s.nome_entregador
        HAVING SUM(s.total_aceitas) > 0 OR SUM(s.total_ofertadas) > 0
        ORDER BY aderencia_percentual DESC
        LIMIT 100
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

GRANT EXECUTE ON FUNCTION pesquisar_valores_entregadores TO authenticated;
GRANT EXECUTE ON FUNCTION pesquisar_valores_entregadores TO anon;

GRANT EXECUTE ON FUNCTION pesquisar_entregadores TO authenticated;
GRANT EXECUTE ON FUNCTION pesquisar_entregadores TO anon;

-- =============================================================================
-- ÍNDICES PARA OTIMIZAÇÃO DE PESQUISA
-- =============================================================================

-- Criar índices para melhorar performance de pesquisa por nome e ID
CREATE INDEX IF NOT EXISTS idx_dados_corridas_nome_entregador_lower 
ON public.dados_corridas (LOWER(nome_entregador));

CREATE INDEX IF NOT EXISTS idx_dados_corridas_id_entregador_lower 
ON public.dados_corridas (LOWER(id_entregador));

CREATE INDEX IF NOT EXISTS idx_mv_aderencia_nome_entregador_lower 
ON public.mv_aderencia_agregada (LOWER(nome_entregador));

CREATE INDEX IF NOT EXISTS idx_mv_aderencia_id_entregador_lower 
ON public.mv_aderencia_agregada (LOWER(id_entregador));

COMMENT ON FUNCTION pesquisar_valores_entregadores IS 'Pesquisa valores de entregadores por nome ou ID com filtros opcionais';
COMMENT ON FUNCTION pesquisar_entregadores IS 'Pesquisa entregadores com estatísticas completas por nome ou ID';

