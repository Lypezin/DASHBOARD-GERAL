-- Update resumo_semanal_drivers to handle organization_id robustly
CREATE OR REPLACE FUNCTION public.resumo_semanal_drivers(p_ano integer, p_organization_id text, p_pracas text[])
 RETURNS TABLE(ano integer, semana integer, total_drivers bigint, total_slots bigint)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_org_filter uuid;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

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

    IF v_org_filter IS NULL THEN
        -- Fallback to a zero UUID or return empty
         RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        dc.ano_iso::integer AS ano,
        dc.semana_numero::integer AS semana,
        COUNT(DISTINCT dc.id_da_pessoa_entregadora) AS total_drivers,
        SUM(dc.numero_minimo_de_entregadores_regulares_na_escala)::bigint AS total_slots
    FROM dados_corridas dc
    WHERE dc.organization_id = v_org_filter
      AND (p_ano IS NULL OR dc.ano_iso = p_ano)
      AND (p_pracas IS NULL OR dc.praca = ANY(p_pracas))
      AND dc.numero_de_corridas_completadas > 0
    GROUP BY dc.ano_iso, dc.semana_numero
    ORDER BY dc.ano_iso DESC, dc.semana_numero DESC;
END;
$function$;

-- Update resumo_semanal_pedidos to handle organization_id robustly
CREATE OR REPLACE FUNCTION public.resumo_semanal_pedidos(p_ano integer, p_organization_id text, p_pracas text[])
 RETURNS TABLE(ano integer, semana integer, total_drivers bigint, total_slots bigint, total_pedidos bigint, total_sh numeric, aderencia_media numeric, utr numeric, aderencia numeric, rejeite numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_org_filter uuid;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

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
    
    IF v_org_filter IS NULL THEN
         RETURN;
    END IF;

    RETURN QUERY
    WITH entregador_stats AS (
        -- Source 1: Dados Corridas for active drivers and avg adherence
        -- Filtered by organization and pracas
        SELECT 
            dc.ano_iso,
            dc.semana_numero,
            COUNT(DISTINCT dc.id_da_pessoa_entregadora) as active_drivers,
            SUM(dc.numero_minimo_de_entregadores_regulares_na_escala) as total_min_slots,
            AVG(
                CASE 
                    WHEN dc.numero_de_corridas_ofertadas > 0 
                    THEN (dc.numero_de_corridas_aceitas::numeric / dc.numero_de_corridas_ofertadas::numeric * 100)
                    ELSE 0
                END
            ) as avg_individual_adherence
        FROM dados_corridas dc
        WHERE dc.organization_id = v_org_filter
          AND (p_ano IS NULL OR dc.ano_iso = p_ano)
          AND (p_pracas IS NULL OR dc.praca = ANY(p_pracas))
        GROUP BY dc.ano_iso, dc.semana_numero
    ),
    dashboard_stats AS (
        -- Source 2: MV Dashboard Resumo for global metrics (Adherence 8-12%, UTR, Rejeite)
        -- Must aggregate by week/year to match the granularity
        SELECT 
            mv.ano_iso,
            mv.semana_iso,
            SUM(mv.total_completadas) as total_pedidos,
            SUM(mv.segundos_realizados) as total_seconds_realized,
            SUM(mv.segundos_planejados) as total_seconds_planned,
            SUM(mv.total_ofertadas) as total_ofertadas,
            SUM(mv.total_rejeitadas) as total_rejeitadas
        FROM mv_dashboard_resumo mv
        WHERE mv.organization_id = v_org_filter
          AND (p_ano IS NULL OR mv.ano_iso = p_ano)
          AND (p_pracas IS NULL OR mv.praca = ANY(p_pracas))
        GROUP BY mv.ano_iso, mv.semana_iso
    )
    SELECT 
        ds.ano_iso::integer AS ano,
        ds.semana_iso::integer AS semana,
        COALESCE(es.active_drivers, 0)::bigint AS total_drivers,
        COALESCE(es.total_min_slots, 0)::bigint AS total_slots,
        COALESCE(ds.total_pedidos, 0)::bigint,
        (COALESCE(ds.total_seconds_realized, 0) / 3600)::numeric AS total_sh,
        COALESCE(es.avg_individual_adherence, 0)::numeric AS aderencia_media,
        -- UTR: Completadas / (Realized Seconds / 3600)
        CASE 
            WHEN ds.total_seconds_realized > 0 
            THEN (ds.total_pedidos::numeric / (ds.total_seconds_realized::numeric / 3600))
            ELSE 0
        END AS utr,
        -- Aderencia Global: Realized / Planned * 100 (Matches Dashboard Tab)
        CASE 
            WHEN ds.total_seconds_planned > 0 
            THEN (ds.total_seconds_realized::numeric / ds.total_seconds_planned::numeric * 100)
            ELSE 0
        END AS aderencia,
        -- Rejeite: Rejeitadas / Ofertadas * 100
        CASE 
            WHEN ds.total_ofertadas > 0 
            THEN (ds.total_rejeitadas::numeric / ds.total_ofertadas::numeric * 100)
            ELSE 0
        END AS rejeite
    FROM dashboard_stats ds
    LEFT JOIN entregador_stats es ON ds.ano_iso = es.ano_iso AND ds.semana_iso = es.semana_numero
    ORDER BY ds.ano_iso DESC, ds.semana_iso DESC;
END;
$function$;
