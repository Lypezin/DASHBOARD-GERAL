CREATE OR REPLACE FUNCTION public.get_city_last_updates(p_organization_id text DEFAULT NULL)
 RETURNS TABLE(city text, last_update_date text)
 LANGUAGE plpgsql
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

    -- Return grouped max dates
    RETURN QUERY
    SELECT 
        dc.praca::text AS city,
        to_char(MAX(dc.data_do_periodo), 'YYYY-MM-DD"T"HH24:MI:SS') AS last_update_date
    FROM dados_corridas dc
    WHERE (v_org_filter IS NULL OR dc.organization_id = v_org_filter)
    GROUP BY dc.praca
    ORDER BY city;
END;
$function$;
