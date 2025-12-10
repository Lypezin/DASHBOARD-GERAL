DROP FUNCTION IF EXISTS public.get_marketing_comparison_weekly(date, date, uuid, text);

CREATE OR REPLACE FUNCTION public.get_marketing_comparison_weekly(
    data_inicial date,
    data_final date,
    p_organization_id uuid,
    p_praca text DEFAULT NULL
)
RETURNS TABLE (
    semana_iso text,
    horas_ops bigint,
    horas_mkt bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH classification AS (
        SELECT 
            DISTINCT ON (id_entregador) 
            id_entregador,
            data_liberacao
        FROM dados_marketing
        WHERE organization_id = p_organization_id
          AND id_entregador IS NOT NULL
        ORDER BY id_entregador, data_liberacao DESC
    ),
    
    daily_data AS (
        SELECT
            to_char(dc.data_do_periodo, 'IYYY-"W"IW') as semana,
            
            CASE 
                WHEN c.id_entregador IS NOT NULL AND dc.data_do_periodo >= c.data_liberacao THEN true
                ELSE false
            END as is_mkt,
            
            COALESCE(dc.tempo_disponivel_absoluto_segundos, 0) as segundos
            
        FROM dados_corridas dc
        LEFT JOIN classification c ON dc.id_da_pessoa_entregadora = c.id_entregador
        WHERE dc.data_do_periodo BETWEEN data_inicial AND data_final
          -- Filter by org if possible, otherwise rely on courier/context matches
          -- AND dc.organization_id = p_organization_id
          AND (p_praca IS NULL OR UPPER(TRIM(dc.praca)) = UPPER(TRIM(p_praca)))
    )
    
    SELECT 
        dd.semana,
        ROUND(SUM(CASE WHEN NOT dd.is_mkt THEN dd.segundos ELSE 0 END) / 3600.0) as val_ops,
        ROUND(SUM(CASE WHEN dd.is_mkt THEN dd.segundos ELSE 0 END) / 3600.0) as val_mkt
    FROM daily_data dd
    GROUP BY 1
    ORDER BY 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketing_comparison_weekly(date, date, uuid, text) TO anon, authenticated, service_role;
