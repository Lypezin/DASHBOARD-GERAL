-- Optimizing: listar_evolucao_semanal
CREATE OR REPLACE FUNCTION public.listar_evolucao_semanal(p_ano integer, p_limite_semanas integer DEFAULT 12, p_praca text DEFAULT NULL::text)
 RETURNS TABLE(ano integer, semana integer, semana_label text, corridas_ofertadas bigint, corridas_aceitas bigint, corridas_completadas bigint, corridas_rejeitadas bigint, total_segundos numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
  -- ⚠️ OTIMIZAÇÃO: EXIGIR filtro de ano para evitar scan completo
  IF p_ano IS NULL THEN
    RAISE EXCEPTION 'Filtro de ano (p_ano) é obrigatório para evitar timeout';
  END IF;

  RETURN QUERY
  WITH filtered_data AS (
    SELECT
      ano_iso,
      semana_iso AS semana_numero,
      total_ofertadas,
      total_aceitas,
      total_completadas,
      total_rejeitadas,
      segundos_realizados AS tempo_segundos
    FROM public.mv_dashboard_resumo
    WHERE ano_iso = p_ano
      AND (
        p_praca IS NULL
        OR p_praca = ''
        OR (p_praca NOT LIKE '%,%' AND praca = p_praca)
        OR (p_praca LIKE '%,%' AND praca = ANY(string_to_array(p_praca, ',')))
      )
  ),
  semana_agg AS (
    SELECT
      filtered_data.ano_iso,
      semana_numero,
      SUM(total_ofertadas) AS total_ofertadas,
      SUM(total_aceitas) AS total_aceitas,
      SUM(total_completadas) AS total_completadas,
      SUM(total_rejeitadas) AS total_rejeitadas,
      SUM(tempo_segundos) AS total_segundos
    FROM filtered_data
    GROUP BY filtered_data.ano_iso, semana_numero
    HAVING SUM(total_ofertadas) > 0 OR SUM(total_aceitas) > 0 OR SUM(total_completadas) > 0
  )
  SELECT
    s.ano_iso::INTEGER AS ano,
    s.semana_numero AS semana,
    'Semana ' || LPAD(s.semana_numero::TEXT, 2, '0') AS semana_label,
    s.total_ofertadas::BIGINT AS corridas_ofertadas,
    s.total_aceitas::BIGINT AS corridas_aceitas,
    s.total_completadas::BIGINT AS corridas_completadas,
    s.total_rejeitadas::BIGINT AS corridas_rejeitadas,
    s.total_segundos::NUMERIC AS total_segundos
  FROM semana_agg s
  ORDER BY s.ano_iso ASC, s.semana_numero ASC
  LIMIT p_limite_semanas;
END;
$function$
;

-- Optimizing: listar_evolucao_semanal
CREATE OR REPLACE FUNCTION public.listar_evolucao_semanal(p_ano integer, p_praca text DEFAULT NULL::text, p_limite_semanas integer DEFAULT 53)
 RETURNS TABLE(ano integer, semana integer, semana_label text, corridas_ofertadas bigint, corridas_aceitas bigint, corridas_completadas bigint, corridas_rejeitadas bigint, total_segundos numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
  -- ⚠️ OTIMIZAÇÃO: EXIGIR filtro de ano para evitar scan completo
  IF p_ano IS NULL THEN
    RAISE EXCEPTION 'Filtro de ano (p_ano) é obrigatório para evitar timeout';
  END IF;

  RETURN QUERY
  WITH filtered_data AS (
    SELECT
      ano_iso,
      semana_iso AS semana_numero,
      total_ofertadas,
      total_aceitas,
      total_completadas,
      total_rejeitadas,
      segundos_realizados AS tempo_segundos
    FROM public.tb_dashboard_resumo
    WHERE ano_iso = p_ano
      AND (
        p_praca IS NULL
        OR p_praca = ''
        OR (p_praca NOT LIKE '%,%' AND praca = p_praca)
        OR (p_praca LIKE '%,%' AND praca = ANY(string_to_array(p_praca, ',')))
      )
  ),
  semana_agg AS (
    SELECT
      filtered_data.ano_iso,
      semana_numero,
      SUM(total_ofertadas) AS total_ofertadas,
      SUM(total_aceitas) AS total_aceitas,
      SUM(total_completadas) AS total_completadas,
      SUM(total_rejeitadas) AS total_rejeitadas,
      SUM(tempo_segundos) AS total_segundos
    FROM filtered_data
    GROUP BY filtered_data.ano_iso, semana_numero
    HAVING SUM(total_ofertadas) > 0 OR SUM(total_aceitas) > 0 OR SUM(total_completadas) > 0
  )
  SELECT
    s.ano_iso::INTEGER AS ano,
    s.semana_numero AS semana,
    'Semana ' || LPAD(s.semana_numero::TEXT, 2, '0') AS semana_label,
    s.total_ofertadas::BIGINT AS corridas_ofertadas,
    s.total_aceitas::BIGINT AS corridas_aceitas,
    s.total_completadas::BIGINT AS corridas_completadas,
    s.total_rejeitadas::BIGINT AS corridas_rejeitadas,
    s.total_segundos::NUMERIC AS total_segundos
  FROM semana_agg s
  ORDER BY s.ano_iso ASC, s.semana_numero ASC
  LIMIT p_limite_semanas;
END;
$function$
;

-- Optimizing: listar_todas_semanas
CREATE OR REPLACE FUNCTION public.listar_todas_semanas()
 RETURNS TABLE(semana integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT semana_iso
  FROM public.mv_dashboard_resumo
  WHERE semana_iso IS NOT NULL
  ORDER BY semana_iso DESC;
END;
$function$
;

-- Optimizing: pesquisar_entregadores
CREATE OR REPLACE FUNCTION public.pesquisar_entregadores(termo_busca text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
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
$function$
;

-- Optimizing: pesquisar_valores_entregadores
CREATE OR REPLACE FUNCTION public.pesquisar_valores_entregadores(termo_busca text)
 RETURNS TABLE(id_entregador text, nome_entregador text, total_taxas numeric, numero_corridas_aceitas bigint, taxa_media numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
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
$function$
;

