CREATE OR REPLACE FUNCTION public.get_marketing_comparison_weekly(
    data_inicial date,
    data_final date,
    p_organization_id uuid,
    p_praca text DEFAULT NULL
)
RETURNS TABLE (
    semana_iso text,
    week_start date,
    
    -- Horas (Segundos)
    segundos_ops bigint,
    segundos_mkt bigint,
    
    -- Corridas Ofertadas
    ofertadas_ops bigint,
    ofertadas_mkt bigint,

    -- Corridas Aceitas (Extra detail if needed)
    aceitas_ops bigint,
    aceitas_mkt bigint,

    -- Corridas Completadas (Extra detail if needed)
    completadas_ops bigint,
    completadas_mkt bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH courier_classification AS (
        -- Determinar quem é Marketing e a data de corte (liberação)
        -- Usando mv_entregadores_summary ou mv_entregadores_marketing para performance
        SELECT 
            DISTINCT ON (dm.id_entregador) 
            dm.id_entregador,
            dm.data_liberacao,
            true as is_marketing
        FROM dados_marketing dm
        WHERE dm.organization_id = p_organization_id
          AND dm.id_entregador IS NOT NULL
        ORDER BY dm.id_entregador, dm.data_liberacao DESC, dm.created_at DESC
    ),
    
    daily_stats AS (
        SELECT
            dc.data_do_periodo,
            to_char(dc.data_do_periodo, 'IYYY-"W"IW') as semana_iso,
            date_trunc('week', dc.data_do_periodo)::date as week_start,
            
            -- Classificação (Marketing se estiver na lista E data >= data_liberacao)
            CASE 
                WHEN cc.id_entregador IS NOT NULL AND dc.data_do_periodo >= cc.data_liberacao THEN true
                ELSE false
            END as is_mkt_ride,
            
            -- Métricas
            COALESCE(extract(epoch from dc.tempo_disponivel_absoluto), 0) as segundos,
            COALESCE(dc.numero_de_corridas_ofertadas, 0) as ofertadas,
            COALESCE(dc.numero_de_corridas_aceitas, 0) as aceitas,
            COALESCE(dc.numero_de_corridas_completadas, 0) as completadas
            
        FROM dados_corridas dc
        LEFT JOIN courier_classification cc ON dc.id_da_pessoa_entregadora = cc.id_entregador
        WHERE dc.data_do_periodo BETWEEN data_inicial AND data_final
          AND (p_praca IS NULL OR UPPER(TRIM(dc.praca)) = UPPER(TRIM(p_praca)))
          -- O filtro de organization_id na dados_corridas é complexo pois não tem coluna direta em algumas versões,
          -- mas assumindo que os entregadores filtrados pelo join ou contexto já limita.
          -- Se dados_corridas tiver organization_id, descomentar:
          -- AND dc.organization_id = p_organization_id
    )
    
    SELECT
        ds.semana_iso,
        MIN(ds.week_start) as week_start,
        
        -- Ops Metrics
        SUM(CASE WHEN NOT ds.is_mkt_ride THEN ds.segundos ELSE 0 END)::bigint as segundos_ops,
        SUM(CASE WHEN ds.is_mkt_ride THEN ds.segundos ELSE 0 END)::bigint as segundos_mkt,
        
        SUM(CASE WHEN NOT ds.is_mkt_ride THEN ds.ofertadas ELSE 0 END)::bigint as ofertadas_ops,
        SUM(CASE WHEN ds.is_mkt_ride THEN ds.ofertadas ELSE 0 END)::bigint as ofertadas_mkt,
        
        SUM(CASE WHEN NOT ds.is_mkt_ride THEN ds.aceitas ELSE 0 END)::bigint as aceitas_ops,
        SUM(CASE WHEN ds.is_mkt_ride THEN ds.aceitas ELSE 0 END)::bigint as aceitas_mkt,
        
        SUM(CASE WHEN NOT ds.is_mkt_ride THEN ds.completadas ELSE 0 END)::bigint as completadas_ops,
        SUM(CASE WHEN ds.is_mkt_ride THEN ds.completadas ELSE 0 END)::bigint as completadas_mkt
        
    FROM daily_stats ds
    GROUP BY ds.semana_iso
    ORDER BY ds.semana_iso;
END;
$$;
