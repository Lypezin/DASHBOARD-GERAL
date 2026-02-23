-- Optimizing: get_city_last_updates
CREATE OR REPLACE FUNCTION public.get_city_last_updates(p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(city text, last_update_date text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
STABLE
AS $function$
DECLARE
    v_org_filter uuid;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    -- Determine Organization ID
    IF p_organization_id IS NOT NULL AND p_organization_id != '' THEN
        BEGIN 
            v_org_filter := p_organization_id::uuid; 
        EXCEPTION WHEN OTHERS THEN 
            SELECT organization_id INTO v_org_filter 
            FROM public.user_profiles 
            WHERE id = v_user_id;
        END;
    ELSE
        SELECT organization_id INTO v_org_filter 
        FROM public.user_profiles 
        WHERE id = v_user_id;
    END IF;

    -- Bifurcação das queries para otimizar o uso do índice idx_mv_dashboard_org no Query Planner
    IF v_org_filter IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            dc.praca::text AS city,
            to_char(MAX(dc.data_do_periodo), 'YYYY-MM-DD"T"HH24:MI:SS') AS last_update_date
        FROM public.mv_dashboard_resumo dc
        WHERE 
            dc.organization_id = v_org_filter
            AND dc.data_do_periodo >= (CURRENT_DATE - INTERVAL '6 months')::date
        GROUP BY dc.praca
        ORDER BY city;
    ELSE
        RETURN QUERY
        SELECT 
            dc.praca::text AS city,
            to_char(MAX(dc.data_do_periodo), 'YYYY-MM-DD"T"HH24:MI:SS') AS last_update_date
        FROM public.mv_dashboard_resumo dc
        WHERE 
            dc.data_do_periodo >= (CURRENT_DATE - INTERVAL '6 months')::date
        GROUP BY dc.praca
        ORDER BY city;
    END IF;
END;
$function$
;

-- Optimizing: get_current_user_profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
  v_user_id uuid;
  v_profile json;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', id,
    'email', email,
    'full_name', full_name,
    'role', role,
    'is_admin', (role IN ('admin', 'master')),
    'is_approved', is_approved,
    'organization_id', organization_id,
    'assigned_pracas', assigned_pracas
  ) INTO v_profile
  FROM public.user_profiles
  WHERE id = v_user_id;

  RETURN v_profile;
END;
$function$
;

-- Optimizing: get_entregadores_details
CREATE OR REPLACE FUNCTION public.get_entregadores_details(p_organization_id uuid DEFAULT NULL::uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_tipo text DEFAULT 'ALL'::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_search text DEFAULT NULL::text, p_praca text DEFAULT NULL::text)
 RETURNS TABLE(id_entregador text, nome text, regiao_atuacao text, total_segundos bigint, total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
    v_tipo text;
    v_praca text;
BEGIN
    -- Sanitize inputs
    v_tipo := UPPER(TRIM(p_tipo));
    v_praca := NULLIF(NULLIF(NULLIF(p_praca, 'null'), 'undefined'), '');

    RETURN QUERY
    WITH active_drivers_activity AS (
        SELECT 
            dc.id_da_pessoa_entregadora as id_entregador,
            MAX(dc.pessoa_entregadora) as nome_corrida,
            COALESCE(SUM(dc.tempo_disponivel_absoluto_segundos), 0) as total_segundos,
            COALESCE(SUM(dc.numero_de_corridas_ofertadas), 0) as total_ofertadas,
            COALESCE(SUM(dc.numero_de_corridas_aceitas), 0) as total_aceitas,
            COALESCE(SUM(dc.numero_de_corridas_completadas), 0) as total_completadas,
            COALESCE(SUM(dc.numero_de_corridas_rejeitadas), 0) as total_rejeitadas
        FROM dados_corridas dc
        WHERE (p_organization_id IS NULL OR dc.organization_id = p_organization_id)
        AND (p_start_date IS NULL OR dc.data_do_periodo >= p_start_date)
        AND (p_end_date IS NULL OR dc.data_do_periodo <= p_end_date)
        -- ADD PRACA FILTER
        AND (v_praca IS NULL OR UPPER(TRIM(dc.praca)) = UPPER(TRIM(v_praca)))
        GROUP BY dc.id_da_pessoa_entregadora
    ),
    marketing_ids AS (
        SELECT DISTINCT dmkt.id_entregador 
        FROM dados_marketing dmkt
        WHERE (p_organization_id IS NULL OR dmkt.organization_id = p_organization_id)
        AND dmkt.id_entregador IS NOT NULL
        AND dmkt.data_liberacao IS NOT NULL
    ),
    driver_metadata AS (
        SELECT DISTINCT ON (dmkt.id_entregador) 
            dmkt.id_entregador, 
            dmkt.nome, 
            dmkt.regiao_atuacao 
        FROM dados_marketing dmkt
        WHERE (p_organization_id IS NULL OR dmkt.organization_id = p_organization_id)
        ORDER BY dmkt.id_entregador, dmkt.rodou_dia DESC
    ),
    enriched_drivers AS (
        SELECT 
            ada.id_entregador,
            COALESCE(dm.nome, ada.nome_corrida, 'Desconhecido') as nome,
            COALESCE(dm.regiao_atuacao, '-') as regiao_atuacao,
            ada.total_segundos,
            ada.total_ofertadas,
            ada.total_aceitas,
            ada.total_completadas,
            ada.total_rejeitadas
        FROM active_drivers_activity ada
        LEFT JOIN driver_metadata dm ON ada.id_entregador = dm.id_entregador
    ),
    filtered_final AS (
        SELECT 
            ed.id_entregador,
            ed.nome,
            ed.regiao_atuacao,
            ed.total_segundos,
            ed.total_ofertadas,
            ed.total_aceitas,
            ed.total_completadas,
            ed.total_rejeitadas
        FROM enriched_drivers ed
        WHERE
            (p_search IS NULL OR ed.nome ILIKE '%' || p_search || '%' OR ed.id_entregador ILIKE '%' || p_search || '%')
            AND
            CASE
                WHEN v_tipo = 'MARKETING' THEN EXISTS (SELECT 1 FROM marketing_ids mkt WHERE mkt.id_entregador = ed.id_entregador)
                WHEN v_tipo = 'OPERATIONAL' THEN NOT EXISTS (SELECT 1 FROM marketing_ids mkt WHERE mkt.id_entregador = ed.id_entregador)
                ELSE TRUE
            END
    ),
    total_rows AS (
        SELECT COUNT(*) as cnt FROM filtered_final
    )
    SELECT
        ff.id_entregador::text,
        ff.nome::text,
        ff.regiao_atuacao::text,
        ff.total_segundos::bigint,
        ff.total_ofertadas::bigint,
        ff.total_aceitas::bigint,
        ff.total_completadas::bigint,
        ff.total_rejeitadas::bigint,
        tr.cnt::bigint
    FROM filtered_final ff
    CROSS JOIN total_rows tr
    ORDER BY ff.total_segundos DESC, ff.nome
    LIMIT p_limit
    OFFSET p_offset;
END;
$function$
;

-- Optimizing: get_entregadores_details
CREATE OR REPLACE FUNCTION public.get_entregadores_details(p_organization_id uuid DEFAULT NULL::uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_tipo text DEFAULT 'ALL'::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_search text DEFAULT NULL::text)
 RETURNS TABLE(id_entregador text, nome text, regiao_atuacao text, total_segundos bigint, total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
    v_tipo text;
BEGIN
    -- Sanitize inputs
    v_tipo := UPPER(TRIM(p_tipo));

    RETURN QUERY
    WITH active_drivers_activity AS (
        SELECT 
            dc.id_da_pessoa_entregadora as id_entregador,
            MAX(dc.pessoa_entregadora) as nome_corrida,
            -- MATCH SUMMARY LOGIC: Use absolute seconds, not scaled
            COALESCE(SUM(dc.tempo_disponivel_absoluto_segundos), 0) as total_segundos,
            COALESCE(SUM(dc.numero_de_corridas_ofertadas), 0) as total_ofertadas,
            COALESCE(SUM(dc.numero_de_corridas_aceitas), 0) as total_aceitas,
            COALESCE(SUM(dc.numero_de_corridas_completadas), 0) as total_completadas,
            COALESCE(SUM(dc.numero_de_corridas_rejeitadas), 0) as total_rejeitadas
        FROM dados_corridas dc
        WHERE (p_organization_id IS NULL OR dc.organization_id = p_organization_id)
        AND (p_start_date IS NULL OR dc.data_do_periodo >= p_start_date)
        AND (p_end_date IS NULL OR dc.data_do_periodo <= p_end_date)
        GROUP BY dc.id_da_pessoa_entregadora
    ),
    marketing_ids AS (
        -- MATCH SUMMARY LOGIC: Use dados_marketing with data_liberacao check
        SELECT DISTINCT dmkt.id_entregador 
        FROM dados_marketing dmkt
        WHERE (p_organization_id IS NULL OR dmkt.organization_id = p_organization_id)
        AND dmkt.id_entregador IS NOT NULL
        AND dmkt.data_liberacao IS NOT NULL
    ),
    driver_metadata AS (
        SELECT DISTINCT ON (dmkt.id_entregador) 
            dmkt.id_entregador, 
            dmkt.nome, 
            dmkt.regiao_atuacao 
        FROM dados_marketing dmkt
        WHERE (p_organization_id IS NULL OR dmkt.organization_id = p_organization_id)
        ORDER BY dmkt.id_entregador, dmkt.rodou_dia DESC
    ),
    enriched_drivers AS (
        SELECT 
            ada.id_entregador,
            COALESCE(dm.nome, ada.nome_corrida, 'Desconhecido') as nome,
            COALESCE(dm.regiao_atuacao, '-') as regiao_atuacao,
            ada.total_segundos,
            ada.total_ofertadas,
            ada.total_aceitas,
            ada.total_completadas,
            ada.total_rejeitadas
        FROM active_drivers_activity ada
        LEFT JOIN driver_metadata dm ON ada.id_entregador = dm.id_entregador
    ),
    filtered_final AS (
        SELECT 
            ed.id_entregador,
            ed.nome,
            ed.regiao_atuacao,
            ed.total_segundos,
            ed.total_ofertadas,
            ed.total_aceitas,
            ed.total_completadas,
            ed.total_rejeitadas
        FROM enriched_drivers ed
        WHERE
            (p_search IS NULL OR ed.nome ILIKE '%' || p_search || '%' OR ed.id_entregador ILIKE '%' || p_search || '%')
            AND
            CASE
                WHEN v_tipo = 'MARKETING' THEN EXISTS (SELECT 1 FROM marketing_ids mkt WHERE mkt.id_entregador = ed.id_entregador)
                WHEN v_tipo = 'OPERATIONAL' THEN NOT EXISTS (SELECT 1 FROM marketing_ids mkt WHERE mkt.id_entregador = ed.id_entregador)
                ELSE TRUE
            END
    ),
    total_rows AS (
        SELECT COUNT(*) as cnt FROM filtered_final
    )
    SELECT
        ff.id_entregador::text,
        ff.nome::text,
        ff.regiao_atuacao::text,
        ff.total_segundos::bigint,
        ff.total_ofertadas::bigint,
        ff.total_aceitas::bigint,
        ff.total_completadas::bigint,
        ff.total_rejeitadas::bigint,
        tr.cnt::bigint
    FROM filtered_final ff
    CROSS JOIN total_rows tr
    ORDER BY ff.total_segundos DESC, ff.nome
    LIMIT p_limit
    OFFSET p_offset;
END;
$function$
;

-- Optimizing: get_entregadores_marketing
CREATE OR REPLACE FUNCTION public.get_entregadores_marketing(p_organization_id uuid DEFAULT NULL::uuid, rodou_dia_inicial date DEFAULT NULL::date, rodou_dia_final date DEFAULT NULL::date, data_inicio_inicial date DEFAULT NULL::date, data_inicio_final date DEFAULT NULL::date, cidade text DEFAULT NULL::text)
 RETURNS TABLE(id_entregador text, nome text, total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, total_segundos bigint, ultima_data text, dias_sem_rodar integer, regiao_atuacao text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
STABLE
AS $function$
BEGIN
    -- Se houver filtro de data de início/fim das corridas, precisamos agregar dados_corridas dinamicamente
    IF data_inicio_inicial IS NOT NULL OR data_inicio_final IS NOT NULL THEN
        RETURN QUERY
        WITH entregadores_filtrados AS (
            SELECT 
                mv.id_entregador, 
                mv.nome, 
                mv.regiao_atuacao,
                mv.ultima_data as mv_ultima_data
            FROM public.mv_entregadores_marketing mv
            WHERE (p_organization_id IS NULL OR mv.organization_id = p_organization_id)
              AND (cidade IS NULL OR UPPER(mv.regiao_atuacao) = UPPER(cidade))
              AND (
                  (rodou_dia_inicial IS NULL AND rodou_dia_final IS NULL)
                  OR EXISTS (
                      SELECT 1 FROM public.dados_marketing dm
                      WHERE dm.id_entregador = mv.id_entregador
                        AND (p_organization_id IS NULL OR dm.organization_id = p_organization_id)
                        AND (rodou_dia_inicial IS NULL OR dm.rodou_dia >= rodou_dia_inicial)
                        AND (rodou_dia_final IS NULL OR dm.rodou_dia <= rodou_dia_final)
                  )
              )
        ),
        stats_dinamicas AS (
            SELECT
                dc.id_da_pessoa_entregadora,
                SUM(COALESCE(dc.numero_de_corridas_ofertadas, 0))::bigint as oferta,
                SUM(COALESCE(dc.numero_de_corridas_aceitas, 0))::bigint as aceite,
                SUM(COALESCE(dc.numero_de_corridas_completadas, 0))::bigint as completa,
                SUM(COALESCE(dc.numero_de_corridas_rejeitadas, 0))::bigint as rejeitada,
                SUM(COALESCE(dc.tempo_disponivel_absoluto_segundos, 0))::bigint as segundos,
                MAX(dc.data_do_periodo) as max_data
            FROM public.dados_corridas dc
            WHERE dc.id_da_pessoa_entregadora IN (SELECT ef.id_entregador FROM entregadores_filtrados ef)
              AND (p_organization_id IS NULL OR dc.organization_id = p_organization_id)
              AND (data_inicio_inicial IS NULL OR dc.data_do_periodo >= data_inicio_inicial)
              AND (data_inicio_final IS NULL OR dc.data_do_periodo <= data_inicio_final)
            GROUP BY dc.id_da_pessoa_entregadora
        )
        SELECT
            ef.id_entregador,
            ef.nome,
            COALESCE(sd.oferta, 0),
            COALESCE(sd.aceite, 0),
            COALESCE(sd.completa, 0),
            COALESCE(sd.rejeitada, 0),
            COALESCE(sd.segundos, 0),
            -- Usa a maior data entre a MV (geral) e a filtrada, ou apenas a filtrada se preferir
            -- Aqui vamos retornar a ultima data DESTE PERIODO filtrado
            COALESCE(sd.max_data::TEXT, NULL),
            CASE 
                WHEN sd.max_data IS NOT NULL THEN (CURRENT_DATE - sd.max_data)::INT
                ELSE NULL 
            END,
            ef.regiao_atuacao
        FROM entregadores_filtrados ef
        LEFT JOIN stats_dinamicas sd ON ef.id_entregador = sd.id_da_pessoa_entregadora;
    
    ELSE
        -- Sem filtro de data nas corridas, usa a MV direto (muito mais rápido)
        RETURN QUERY
        SELECT
            mv.id_entregador,
            mv.nome,
            mv.total_ofertadas,
            mv.total_aceitas,
            mv.total_completadas,
            mv.total_rejeitadas,
            mv.total_segundos,
            mv.ultima_data::TEXT,
            CASE 
                WHEN mv.ultima_data IS NOT NULL THEN (CURRENT_DATE - mv.ultima_data)::INT
                ELSE NULL 
            END,
            mv.regiao_atuacao
        FROM public.mv_entregadores_marketing mv
        WHERE (p_organization_id IS NULL OR mv.organization_id = p_organization_id)
          AND (cidade IS NULL OR UPPER(mv.regiao_atuacao) = UPPER(cidade))
          AND (
              (rodou_dia_inicial IS NULL AND rodou_dia_final IS NULL)
              OR EXISTS (
                  SELECT 1 FROM public.dados_marketing dm
                  WHERE dm.id_entregador = mv.id_entregador
                    AND (p_organization_id IS NULL OR dm.organization_id = p_organization_id)
                    AND (rodou_dia_inicial IS NULL OR dm.rodou_dia >= rodou_dia_inicial)
                    AND (rodou_dia_final IS NULL OR dm.rodou_dia <= rodou_dia_final)
              )
          );
    END IF;
END;
$function$
;

