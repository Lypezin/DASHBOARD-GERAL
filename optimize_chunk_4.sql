-- Optimizing: get_fluxo_semanal
CREATE OR REPLACE FUNCTION public.get_fluxo_semanal(p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id uuid DEFAULT NULL::uuid, p_praca text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
    v_start_date date;
    v_end_date date;
    v_org_uuid uuid;
    v_result json;
    v_max_last_active_week date;
BEGIN
    v_start_date := COALESCE(p_data_inicial, date_trunc('year', CURRENT_DATE)::date);
    v_end_date := COALESCE(p_data_final, CURRENT_DATE);
    v_org_uuid := COALESCE(p_organization_id, '00000000-0000-0000-0000-000000000001'::uuid);

    -- Get max active week globally to determine churn threshold
    SELECT MAX(last_active_week) INTO v_max_last_active_week FROM mv_entregadores_summary;

    WITH 
    weeks AS (
        SELECT to_char(d, 'IYYY-"W"IW') as semana_iso,
               d as week_date
        FROM generate_series(
            date_trunc('week', v_start_date),
            date_trunc('week', v_end_date),
            '1 week'::interval
        ) d
    ),
    
    -- Step 1: Get weekly rides per driver (for Entradas/Saidas)
    driver_weekly_rides AS (
        SELECT 
            id_entregador,
            to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW') as week_date,
            SUM(corridas_completadas) as weekly_rides,
            max(nome_entregador) as nome,
            -- Check is_marketing (global property of the driver)
            COALESCE(bool_or(EXISTS (
                SELECT 1 
                FROM dados_marketing dm 
                WHERE dm.id_entregador = mv_corridas_agregadas.id_entregador 
                  AND dm.organization_id = mv_corridas_agregadas.organization_id
            )), false) AS is_marketing
        FROM mv_corridas_agregadas
        WHERE organization_id = v_org_uuid
          AND (p_praca IS NULL OR praca = p_praca)
        GROUP BY id_entregador, to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW')
    ),

    -- Step 2: Compute cumulative rides per driver over time
    driver_cumulative AS (
        SELECT 
            id_entregador,
            week_date,
            weekly_rides,
            nome,
            is_marketing,
            SUM(weekly_rides) OVER (
                PARTITION BY id_entregador 
                ORDER BY week_date
            ) as cumulative_rides
        FROM driver_weekly_rides
    ),

    -- Step 3: Find activation week = first week where cumulative >= 30
    activation_weeks AS (
        SELECT DISTINCT ON (id_entregador)
            id_entregador,
            week_date as activation_week
        FROM driver_cumulative
        WHERE cumulative_rides >= 30
        ORDER BY id_entregador, week_date
    ),

    -- Step 4: Build filtered_summary using activation_weeks
    filtered_summary AS (
        SELECT 
            dwr.id_entregador,
            aw.activation_week,
            max(dwr.week_date) as last_active_week,
            SUM(dwr.weekly_rides)::bigint as total_rides,
            bool_or(dwr.is_marketing) AS is_marketing,
            max(dwr.nome) as nome
        FROM driver_weekly_rides dwr
        LEFT JOIN activation_weeks aw ON dwr.id_entregador = aw.id_entregador
        GROUP BY dwr.id_entregador, aw.activation_week
    ),
    
    entradas_grouped AS (
        SELECT 
            to_char(activation_week, 'IYYY-"W"IW') as semana_iso,
            COUNT(*) FILTER (WHERE is_marketing) as qtd_mkt,
            COUNT(*) FILTER (WHERE NOT is_marketing) as qtd_ops,
            array_agg(nome) FILTER (WHERE is_marketing) as nomes_mkt,
            array_agg(nome) FILTER (WHERE NOT is_marketing) as nomes_ops
        FROM filtered_summary
        WHERE activation_week IS NOT NULL
          AND activation_week >= v_start_date
          AND activation_week <= v_end_date
        GROUP BY 1
    ),
    
    saidas_grouped AS (
        SELECT 
            to_char(last_active_week, 'IYYY-"W"IW') as semana_iso,
            COUNT(*) FILTER (WHERE is_marketing) as qtd_mkt_matured,
            COUNT(*) FILTER (WHERE NOT is_marketing) as qtd_ops_matured,
            -- "Novice" churn: less than 30 rides
            COUNT(*) FILTER (WHERE is_marketing AND total_rides < 30) as qtd_mkt_novice,
            COUNT(*) FILTER (WHERE NOT is_marketing AND total_rides < 30) as qtd_ops_novice,
            array_agg(nome) FILTER (WHERE is_marketing) as nomes_mkt_matured,
            array_agg(nome) FILTER (WHERE NOT is_marketing) as nomes_ops_matured,
            array_agg(nome) FILTER (WHERE is_marketing AND total_rides < 30) as nomes_mkt_novice,
            array_agg(nome) FILTER (WHERE NOT is_marketing AND total_rides < 30) as nomes_ops_novice
        FROM filtered_summary
        WHERE last_active_week >= v_start_date
          AND last_active_week <= v_end_date
          AND last_active_week < v_max_last_active_week
        GROUP BY 1
    ),

    -- Retomada with LAG (fast)
    mv_weeks_ordered AS (
       SELECT 
          id_entregador, 
          to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW') as week_start_date,
          LAG(to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW')) 
              OVER (PARTITION BY id_entregador ORDER BY to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW')) as prev_week_date
       FROM mv_corridas_agregadas
       WHERE organization_id = v_org_uuid
         AND (p_praca IS NULL OR praca = p_praca)
    ),
    retomada_raw AS (
       SELECT 
           mw.week_start_date,
           mw.id_entregador,
           mw.prev_week_date as origin_date
       FROM mv_weeks_ordered mw
       WHERE mw.week_start_date >= v_start_date
         AND mw.week_start_date <= v_end_date
         AND (mw.prev_week_date IS NULL OR mw.prev_week_date < (mw.week_start_date - interval '1 week'))
         AND EXISTS (
             SELECT 1 FROM filtered_summary s 
             WHERE s.id_entregador = mw.id_entregador 
               AND s.activation_week IS NOT NULL
               AND s.activation_week < mw.week_start_date
         )
    ),
    retomada_breakdown AS (
        SELECT 
            to_char(r.week_start_date, 'IYYY-"W"IW') as semana_iso,
            to_char(r.origin_date, 'IYYY-"W"IW') as origin_week,
            COUNT(*) as qtd
        FROM retomada_raw r
        WHERE r.origin_date IS NOT NULL
        GROUP BY 1, 2
    ),
    retomada_grouped AS (
       SELECT 
           to_char(r.week_start_date, 'IYYY-"W"IW') as semana_iso,
           COUNT(*) FILTER (WHERE e.is_marketing) as qtd_mkt,
           COUNT(*) FILTER (WHERE NOT e.is_marketing) as qtd_ops,
           array_agg(e.nome) FILTER (WHERE e.is_marketing) as nomes_mkt,
           array_agg(e.nome) FILTER (WHERE NOT e.is_marketing) as nomes_ops
       FROM retomada_raw r
       JOIN filtered_summary e ON r.id_entregador = e.id_entregador
       GROUP BY 1
    ),
    retomada_json AS (
        SELECT
            semana_iso,
            jsonb_object_agg(origin_week, qtd) as origin_json
        FROM retomada_breakdown
        GROUP BY 1
    ),

    -- BASE ATIVA: distinct drivers per week (Filtered by Praca + Rides > 0)
    base_ativa_raw AS (
        SELECT 
            to_char(to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW'), 'IYYY-"W"IW') as semana_iso,
            COUNT(DISTINCT id_entregador) as base_ativa
        FROM mv_corridas_agregadas
        WHERE organization_id = v_org_uuid
          AND (p_praca IS NULL OR praca = p_praca)
          AND to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW') >= v_start_date
          AND to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW') <= v_end_date
          AND corridas_completadas > 0
        GROUP BY 1
    ),

    result AS (
        SELECT 
            w.semana_iso as semana,
            (COALESCE(e.qtd_mkt, 0) + COALESCE(e.qtd_ops, 0))::bigint as entradas_total,
            COALESCE(e.qtd_mkt, 0)::bigint as entradas_mkt_count,
            COALESCE(e.nomes_mkt, ARRAY[]::text[]) as nomes_entradas_mkt,
            COALESCE(e.nomes_ops, ARRAY[]::text[]) as nomes_entradas_ops,
            (COALESCE(s.qtd_mkt_matured, 0) + COALESCE(s.qtd_ops_matured, 0))::bigint as saidas_total,
            COALESCE(s.qtd_mkt_matured, 0)::bigint as saidas_mkt_count,
            COALESCE(s.nomes_mkt_matured, ARRAY[]::text[]) as nomes_saidas_mkt,
            COALESCE(s.nomes_ops_matured, ARRAY[]::text[]) as nomes_saidas_ops,
            (COALESCE(s.qtd_mkt_novice, 0) + COALESCE(s.qtd_ops_novice, 0))::bigint as saidas_novos_total,
            COALESCE(s.nomes_mkt_novice, ARRAY[]::text[]) as nomes_saidas_novos_mkt,
            COALESCE(s.nomes_ops_novice, ARRAY[]::text[]) as nomes_saidas_ops,
            (COALESCE(r.qtd_mkt, 0) + COALESCE(r.qtd_ops, 0))::bigint as retomada_total,
            COALESCE(r.qtd_mkt, 0)::bigint as retomada_mkt_count,
            COALESCE(r.nomes_mkt, ARRAY[]::text[]) as nomes_retomada_mkt,
            COALESCE(r.nomes_ops, ARRAY[]::text[]) as nomes_retomada_ops,
            COALESCE(rj.origin_json, '{}'::jsonb) as retomada_origins,
            -- SALDO: Entradas - Saidas (SEM Retomada)
            ((COALESCE(e.qtd_mkt, 0) + COALESCE(e.qtd_ops, 0)) - 
             (COALESCE(s.qtd_mkt_matured, 0) + COALESCE(s.qtd_ops_matured, 0)))::bigint as saldo,
            -- BASE ATIVA
            COALESCE(ba.base_ativa, 0)::bigint as base_ativa,
            -- VARIACAO DA BASE (delta vs previous week via window function)
            (COALESCE(ba.base_ativa, 0) - COALESCE(
                LAG(ba.base_ativa) OVER (ORDER BY w.semana_iso), 
                ba.base_ativa
            ))::bigint as variacao_base
        FROM weeks w
        LEFT JOIN entradas_grouped e ON w.semana_iso = e.semana_iso
        LEFT JOIN saidas_grouped s ON w.semana_iso = s.semana_iso
        LEFT JOIN retomada_grouped r ON w.semana_iso = r.semana_iso
        LEFT JOIN retomada_json rj ON r.semana_iso = rj.semana_iso
        LEFT JOIN base_ativa_raw ba ON w.semana_iso = ba.semana_iso
        ORDER BY w.semana_iso
    )
    SELECT json_agg(row_to_json(result)) INTO v_result FROM result;
    RETURN COALESCE(v_result, '[]'::json);
END;
$function$
;

-- Optimizing: get_gamification_leaderboard
CREATE OR REPLACE FUNCTION public.get_gamification_leaderboard()
 RETURNS TABLE(rank bigint, user_name text, avatar_url text, pracas text, total_badges bigint, badges_list jsonb, current_streak integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        RANK() OVER (ORDER BY COUNT(ub.badge_slug) DESC, s.login_streak DESC) as rank,
        COALESCE(p.full_name, split_part(u.email, '@', 1)) as user_name,
        p.avatar_url,
        CASE 
            WHEN p.is_admin = true OR p.role = 'admin' THEN 'Todas'
            WHEN p.assigned_pracas IS NULL OR jsonb_array_length(to_jsonb(p.assigned_pracas)) = 0 THEN 'Sem Acesso'
            ELSE (
                SELECT string_agg(value, ', ')
                FROM jsonb_array_elements_text(to_jsonb(p.assigned_pracas))
            )
        END as pracas,
        COUNT(ub.badge_slug) as total_badges,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'slug', b.slug,
                    'icon', b.icon,
                    'name', b.name,
                    'description', b.description,
                    'category', b.category
                )
            ) FILTER (WHERE b.slug IS NOT NULL),
            '[]'::jsonb
        ) as badges_list,
        COALESCE(s.login_streak, 0) as current_streak
    FROM auth.users u
    JOIN public.user_profiles p ON p.id = u.id
    LEFT JOIN public.gamification_user_stats s ON s.user_id = u.id
    LEFT JOIN public.gamification_user_badges ub ON ub.user_id = u.id
    LEFT JOIN public.gamification_badges b ON ub.badge_slug = b.slug
    GROUP BY u.id, p.id, s.login_streak
    ORDER BY total_badges DESC, current_streak DESC;
END;
$function$
;

-- Optimizing: get_marketing_cities_data
CREATE OR REPLACE FUNCTION public.get_marketing_cities_data(data_envio_inicial text DEFAULT NULL::text, data_envio_final text DEFAULT NULL::text, data_liberacao_inicial text DEFAULT NULL::text, data_liberacao_final text DEFAULT NULL::text, rodou_dia_inicial text DEFAULT NULL::text, rodou_dia_final text DEFAULT NULL::text, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(cidade text, enviado bigint, liberado bigint, rodando_inicio bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
    v_org_uuid uuid;
BEGIN
    -- Safe cast with Fallback
    BEGIN
        v_org_uuid := p_organization_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_org_uuid := NULL; -- Default to NULL if invalid (or specific ID if preferred)
    END;

    RETURN QUERY
    WITH normalized_data AS (
        SELECT 
            -- Apply the split logic for ABC 2.0
            CASE 
                WHEN regiao_atuacao = 'ABC 2.0' AND sub_praca_abc IN ('Vila Aquino', 'São Caetano') THEN 'Santo André'
                WHEN regiao_atuacao = 'ABC 2.0' AND sub_praca_abc IN ('Diadema', 'Nova petrópolis', 'Rudge Ramos') THEN 'São Bernardo'
                ELSE regiao_atuacao
            END as cidade_nome,
            data_envio,
            data_liberacao,
            rodou_dia,
            organization_id
        FROM public.dados_marketing
    )
    SELECT 
        nd.cidade_nome as cidade,
        COUNT(CASE WHEN nd.data_envio IS NOT NULL 
            AND (data_envio_inicial IS NULL OR nd.data_envio >= data_envio_inicial::date)
            AND (data_envio_final IS NULL OR nd.data_envio <= data_envio_final::date)
            THEN 1 END)::bigint as enviado,
        COUNT(CASE WHEN nd.data_liberacao IS NOT NULL 
            AND (data_liberacao_inicial IS NULL OR nd.data_liberacao >= data_liberacao_inicial::date)
            AND (data_liberacao_final IS NULL OR nd.data_liberacao <= data_liberacao_final::date)
            THEN 1 END)::bigint as liberado,
        COUNT(CASE WHEN nd.rodou_dia IS NOT NULL 
            AND (rodou_dia_inicial IS NULL OR nd.rodou_dia >= rodou_dia_inicial::date)
            AND (rodou_dia_final IS NULL OR nd.rodou_dia <= rodou_dia_final::date)
            THEN 1 END)::bigint as rodando_inicio
    FROM normalized_data nd
    WHERE (v_org_uuid IS NULL OR nd.organization_id = v_org_uuid)
    GROUP BY nd.cidade_nome;
END;
$function$
;

-- Optimizing: get_marketing_comparison_weekly
CREATE OR REPLACE FUNCTION public.get_marketing_comparison_weekly(data_inicial date DEFAULT CURRENT_DATE, data_final date DEFAULT CURRENT_DATE, p_organization_id uuid DEFAULT NULL::uuid, p_praca text DEFAULT NULL::text)
 RETURNS TABLE(semana_iso text, segundos_ops bigint, segundos_mkt bigint, ofertadas_ops bigint, ofertadas_mkt bigint, aceitas_ops bigint, aceitas_mkt bigint, concluidas_ops bigint, concluidas_mkt bigint, rejeitadas_ops bigint, rejeitadas_mkt bigint, valor_ops numeric, valor_mkt numeric, entregadores_ops bigint, entregadores_mkt bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
    v_praca text;
BEGIN
    v_praca := NULLIF(NULLIF(NULLIF(p_praca, 'null'), 'undefined'), '');
    
    IF v_praca IS NOT NULL THEN
        v_praca := UPPER(TRIM(v_praca));
    END IF;

    RETURN QUERY
    WITH marketing_ids AS (
        SELECT DISTINCT id_entregador
        FROM public.dados_marketing
        WHERE (p_organization_id IS NULL OR organization_id = p_organization_id)
          AND id_entregador IS NOT NULL
          AND data_liberacao IS NOT NULL 
    ),
    daily_data AS (
        SELECT
            to_char(dc.data_do_periodo, 'IYYY-"W"IW') as semana,
            CASE 
                WHEN m.id_entregador IS NOT NULL THEN true
                ELSE false
            END as is_mkt,
            COALESCE(dc.tempo_disponivel_absoluto_segundos, 0) as segundos,
            COALESCE(dc.numero_de_corridas_ofertadas, 0) as ofertadas,
            COALESCE(dc.numero_de_corridas_aceitas, 0) as aceitas,
            COALESCE(dc.numero_de_corridas_completadas, 0) as concluidas,
            COALESCE(dc.numero_de_corridas_rejeitadas, 0) as rejeitadas,
            COALESCE(dc.soma_das_taxas_das_corridas_aceitas, 0) / 100.0 as valor,
            dc.id_da_pessoa_entregadora
        FROM public.dados_corridas dc
        LEFT JOIN marketing_ids m ON dc.id_da_pessoa_entregadora = m.id_entregador
        WHERE dc.data_do_periodo BETWEEN data_inicial AND data_final
          AND (p_organization_id IS NULL OR dc.organization_id = p_organization_id)
          AND (v_praca IS NULL OR dc.praca = v_praca)
    )
    SELECT 
        dd.semana,
        SUM(CASE WHEN NOT dd.is_mkt THEN dd.segundos ELSE 0 END)::bigint,
        SUM(CASE WHEN dd.is_mkt THEN dd.segundos ELSE 0 END)::bigint,
        SUM(CASE WHEN NOT dd.is_mkt THEN dd.ofertadas ELSE 0 END)::bigint,
        SUM(CASE WHEN dd.is_mkt THEN dd.ofertadas ELSE 0 END)::bigint,
        SUM(CASE WHEN NOT dd.is_mkt THEN dd.aceitas ELSE 0 END)::bigint,
        SUM(CASE WHEN dd.is_mkt THEN dd.aceitas ELSE 0 END)::bigint,
        SUM(CASE WHEN NOT dd.is_mkt THEN dd.concluidas ELSE 0 END)::bigint,
        SUM(CASE WHEN dd.is_mkt THEN dd.concluidas ELSE 0 END)::bigint,
        SUM(CASE WHEN NOT dd.is_mkt THEN dd.rejeitadas ELSE 0 END)::bigint,
        SUM(CASE WHEN dd.is_mkt THEN dd.rejeitadas ELSE 0 END)::bigint,
        ROUND(SUM(CASE WHEN NOT dd.is_mkt THEN dd.valor ELSE 0 END)::numeric, 2),
        ROUND(SUM(CASE WHEN dd.is_mkt THEN dd.valor ELSE 0 END)::numeric, 2),
        COUNT(DISTINCT CASE WHEN NOT dd.is_mkt THEN dd.id_da_pessoa_entregadora ELSE NULL END)::bigint,
        COUNT(DISTINCT CASE WHEN dd.is_mkt THEN dd.id_da_pessoa_entregadora ELSE NULL END)::bigint
    FROM daily_data dd
    GROUP BY 1
    ORDER BY 1;
END;
$function$
;

-- Optimizing: get_marketing_totals
CREATE OR REPLACE FUNCTION public.get_marketing_totals(data_envio_inicial date DEFAULT NULL::date, data_envio_final date DEFAULT NULL::date, data_liberacao_inicial date DEFAULT NULL::date, data_liberacao_final date DEFAULT NULL::date, rodou_dia_inicial date DEFAULT NULL::date, rodou_dia_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(criado bigint, enviado bigint, liberado bigint, rodando_inicio bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
    v_org_uuid uuid;
BEGIN
    -- Safe cast with Fallback
    BEGIN
        v_org_uuid := p_organization_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_org_uuid := NULL;
    END;

    RETURN QUERY
    SELECT
        -- Criado (total na tabela, filtrado apenas por org)
        COUNT(*)::bigint,
        
        -- Enviado
        COUNT(*) FILTER (
            WHERE data_envio IS NOT NULL
            AND (data_envio_inicial IS NULL OR data_envio >= data_envio_inicial)
            AND (data_envio_final IS NULL OR data_envio <= data_envio_final)
        )::bigint,
         
        -- Liberado
        COUNT(*) FILTER (
            WHERE data_liberacao IS NOT NULL
            AND (data_liberacao_inicial IS NULL OR data_liberacao >= data_liberacao_inicial)
            AND (data_liberacao_final IS NULL OR data_liberacao <= data_liberacao_final)
        )::bigint,
         
        -- Rodando Inicio
        COUNT(*) FILTER (
            WHERE rodou_dia IS NOT NULL
            AND (rodou_dia_inicial IS NULL OR rodou_dia >= rodou_dia_inicial)
            AND (rodou_dia_final IS NULL OR rodou_dia <= rodou_dia_final)
        )::bigint
    FROM dados_marketing
    WHERE (v_org_uuid IS NULL OR organization_id = v_org_uuid);
END;
$function$
;

