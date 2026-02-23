-- Optimizing: resumo_semanal_pedidos
CREATE OR REPLACE FUNCTION public.resumo_semanal_pedidos(p_ano integer, p_organization_id text, p_pracas text[] DEFAULT NULL::text[])
 RETURNS TABLE(ano integer, semana integer, total_drivers bigint, total_slots bigint, total_pedidos bigint, total_sh numeric, aderencia_media numeric, utr numeric, aderencia numeric, rejeite numeric)
 LANGUAGE plpgsql
 SET search_path TO ''
STABLE
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
        FROM public.dados_corridas dc
        WHERE dc.organization_id = v_org_filter
          AND (p_ano IS NULL OR dc.ano_iso = p_ano)
          AND (p_pracas IS NULL OR dc.praca = ANY(p_pracas))
        GROUP BY dc.ano_iso, dc.semana_numero
    ),
    dashboard_stats AS (
        SELECT 
            mv.ano_iso,
            mv.semana_iso,
            SUM(mv.total_completadas) as total_pedidos,
            SUM(mv.segundos_realizados) as total_seconds_realized,
            SUM(mv.segundos_planejados) as total_seconds_planned,
            SUM(mv.total_ofertadas) as total_ofertadas,
            SUM(mv.total_rejeitadas) as total_rejeitadas
        FROM public.mv_dashboard_resumo mv
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
        CASE 
            WHEN ds.total_seconds_realized > 0 
            THEN (ds.total_pedidos::numeric / (ds.total_seconds_realized::numeric / 3600))
            ELSE 0
        END AS utr,
        CASE 
            WHEN ds.total_seconds_planned > 0 
            THEN (ds.total_seconds_realized::numeric / ds.total_seconds_planned::numeric * 100)
            ELSE 0
        END AS aderencia,
        CASE 
            WHEN ds.total_ofertadas > 0 
            THEN (ds.total_rejeitadas::numeric / ds.total_ofertadas::numeric * 100)
            ELSE 0
        END AS rejeite
    FROM dashboard_stats ds
    LEFT JOIN entregador_stats es ON ds.ano_iso = es.ano_iso AND ds.semana_iso = es.semana_numero
    ORDER BY ds.ano_iso DESC, ds.semana_iso DESC;
END;
$function$
;

-- Optimizing: sync_user_organization_to_metadata
CREATE OR REPLACE FUNCTION public.sync_user_organization_to_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
  current_org_id UUID;
BEGIN
  -- Obter organization_id do user_profiles
  SELECT organization_id INTO current_org_id
  FROM public.user_profiles
  WHERE id = NEW.id;
  
  -- Atualizar user_metadata no Supabase Auth
  -- Nota: Esta atualização será feita via API do Supabase no frontend
  -- pois não temos acesso direto ao auth.users aqui
  
  RETURN NEW;
END;
$function$
;

-- Optimizing: top_usuarios_ativos
CREATE OR REPLACE FUNCTION public.top_usuarios_ativos(p_limite integer DEFAULT 10, p_data_inicio timestamp with time zone DEFAULT (now() - '24:00:00'::interval), p_data_fim timestamp with time zone DEFAULT now())
 RETURNS TABLE(user_id uuid, user_name text, user_email text, total_acoes bigint, abas_diferentes bigint, ultima_atividade timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH atividades_usuario AS (
    SELECT 
      ua.user_id,
      COUNT(*) as total_acoes,
      COUNT(DISTINCT ua.tab_name) as abas_diferentes,
      MAX(ua.created_at) as ultima_atividade
    FROM public.user_activity ua
    WHERE ua.created_at BETWEEN p_data_inicio AND p_data_fim
    GROUP BY ua.user_id
  )
  SELECT 
    au_stats.user_id,
    COALESCE(
      up.full_name,
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'fullName',
      SPLIT_PART(au.email::TEXT, '@', 1)
    )::TEXT as user_name,
    au.email::TEXT as user_email,
    au_stats.total_acoes,
    au_stats.abas_diferentes,
    au_stats.ultima_atividade
  FROM atividades_usuario au_stats
  INNER JOIN auth.users au ON au.id = au_stats.user_id
  LEFT JOIN public.user_profiles up ON up.id = au_stats.user_id
  ORDER BY au_stats.total_acoes DESC
  LIMIT p_limite;
END;
$function$
;

