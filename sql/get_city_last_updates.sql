CREATE OR REPLACE FUNCTION public.get_city_last_updates(p_organization_id text DEFAULT NULL)
 RETURNS TABLE(city text, last_update_date text)
 LANGUAGE plpgsql
 SECURITY DEFINER
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

    -- Optimized query using Materialized View:
    -- 1. Filters by organization if present (using index if available)
    -- 2. Restricts to the last 6 months to avoid full table scan
    -- 3. Uses MAX directly with GROUP BY, which handles large datasets better than complex joins
    RETURN QUERY
    SELECT 
        dc.praca::text AS city,
        to_char(MAX(dc.data_do_periodo), 'YYYY-MM-DD"T"HH24:MI:SS') AS last_update_date
    FROM mv_dashboard_resumo dc
    WHERE 
        -- Organization filter
        (v_org_filter IS NULL OR dc.organization_id = v_org_filter)
        -- Date optimization: Look back only 6 months. 
        AND dc.data_do_periodo >= (CURRENT_DATE - INTERVAL '6 months')::date
    GROUP BY dc.praca
    ORDER BY city;
END;
$function$;
