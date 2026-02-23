-- Optimizing: get_origens_by_praca
CREATE OR REPLACE FUNCTION public.get_origens_by_praca(p_pracas text[])
 RETURNS SETOF text
 LANGUAGE plpgsql
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT DISTINCT mv.origem
    FROM public.mv_dashboard_resumo mv
    WHERE mv.praca IS NOT NULL
      AND mv.origem IS NOT NULL
      AND (p_pracas IS NULL OR array_length(p_pracas, 1) IS NULL OR mv.praca = ANY(p_pracas))
    ORDER BY mv.origem;
END;
$function$
;

-- Optimizing: get_pending_mvs
CREATE OR REPLACE FUNCTION public.get_pending_mvs()
 RETURNS TABLE(mv_name text, priority integer, needs_refresh boolean, last_refresh timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        mrc.mv_name,
        CASE mrc.mv_name
            -- Tier 1: Core Dashboard (Fast & Critical)
            WHEN 'mv_dashboard_resumo' THEN 1
            WHEN 'mv_dashboard_aderencia_metricas' THEN 1
            WHEN 'mv_aderencia_agregada' THEN 1
            
            -- Tier 2: Aggregated lists
            WHEN 'mv_entregadores_agregados' THEN 2
            WHEN 'mv_valores_entregadores_agregados' THEN 2
            
            -- Tier 3: Details (Large)
            WHEN 'mv_corridas_detalhe' THEN 3
            WHEN 'mv_entregue_detalhe' THEN 3
            WHEN 'mv_planejado_detalhe' THEN 3
            
            -- Default
            ELSE 4
        END as priority,
        mrc.needs_refresh,
        mrc.last_refresh
    FROM mv_refresh_control mrc
    WHERE mrc.needs_refresh = true
        AND mrc.refresh_in_progress = false
    ORDER BY 
        priority ASC,
        mrc.mv_name ASC;
END;
$function$
;

-- Optimizing: get_semanas_data_v2
CREATE OR REPLACE FUNCTION public.get_semanas_data_v2(ano_param integer)
 RETURNS TABLE(data_do_periodo date)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
  SELECT DISTINCT data_do_periodo
  FROM dados_corridas
  WHERE EXTRACT(YEAR FROM data_do_periodo) = ano_param
  ORDER BY data_do_periodo DESC;
$function$
;

-- Optimizing: get_subpracas_by_praca
CREATE OR REPLACE FUNCTION public.get_subpracas_by_praca(p_pracas text[])
 RETURNS SETOF text
 LANGUAGE plpgsql
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT DISTINCT mv.sub_praca
    FROM public.mv_dashboard_resumo mv
    WHERE mv.praca IS NOT NULL
      AND mv.sub_praca IS NOT NULL
      AND (p_pracas IS NULL OR array_length(p_pracas, 1) IS NULL OR mv.praca = ANY(p_pracas))
    ORDER BY mv.sub_praca;
END;
$function$
;

-- Optimizing: get_turnos_by_praca
CREATE OR REPLACE FUNCTION public.get_turnos_by_praca(p_pracas text[])
 RETURNS SETOF text
 LANGUAGE plpgsql
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT DISTINCT mv.turno
    FROM public.mv_dashboard_resumo mv
    WHERE mv.praca IS NOT NULL
      AND mv.turno IS NOT NULL
      AND (p_pracas IS NULL OR array_length(p_pracas, 1) IS NULL OR mv.praca = ANY(p_pracas))
    ORDER BY mv.turno;
END;
$function$
;

