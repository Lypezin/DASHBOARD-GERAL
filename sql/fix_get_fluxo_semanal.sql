CREATE OR REPLACE FUNCTION public.get_fluxo_semanal(p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id uuid DEFAULT NULL::uuid, p_praca text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
    -- This ensures that "last active week" is compared against the global latest data, not local max
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
    
    -- Dynamically build summary based on filters (Praca)
    filtered_summary AS (
        SELECT 
            id_entregador,
            min(to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW')) as activation_week,
            max(to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW')) as last_active_week,
            count(*) as total_rides,
            -- Check "is_marketing" status (global property of the driver)
            COALESCE(bool_or((EXISTS ( 
                SELECT 1 
                FROM dados_marketing dm 
                WHERE dm.id_entregador = mv_corridas_agregadas.id_entregador 
                  AND dm.organization_id = mv_corridas_agregadas.organization_id
            ))), false) AS is_marketing,
            -- Optimization: Aggregating names here might be expensive if many rows, but necessary for distinct names
            max(nome_entregador) as nome
        FROM mv_corridas_agregadas
        WHERE organization_id = v_org_uuid
          AND (p_praca IS NULL OR praca = p_praca)
        GROUP BY id_entregador
    ),
    
    entradas_grouped AS (
        SELECT 
            to_char(activation_week, 'IYYY-"W"IW') as semana_iso,
            COUNT(*) FILTER (WHERE is_marketing) as qtd_mkt,
            COUNT(*) FILTER (WHERE NOT is_marketing) as qtd_ops,
            array_agg(nome) FILTER (WHERE is_marketing) as nomes_mkt,
            array_agg(nome) FILTER (WHERE NOT is_marketing) as nomes_ops
        FROM filtered_summary
        WHERE activation_week >= v_start_date
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
          AND last_active_week < v_max_last_active_week -- Only count as churn if not active in the very last week available
        GROUP BY 1
    ),

    -- Retomada with LAG (fast)
    -- Must filter mv_weeks_ordered by PRACA as well
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
             -- Use filtered_summary to check previous activation
             SELECT 1 FROM filtered_summary s 
             WHERE s.id_entregador = mw.id_entregador 
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

    -- BASE ATIVA: distinct drivers per week (Filtered by Praca)
    base_ativa_raw AS (
        SELECT 
            to_char(to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW'), 'IYYY-"W"IW') as semana_iso,
            COUNT(DISTINCT id_entregador) as base_ativa
        FROM mv_corridas_agregadas
        WHERE organization_id = v_org_uuid
          AND (p_praca IS NULL OR praca = p_praca)
          AND to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW') >= v_start_date
          AND to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW') <= v_end_date
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
