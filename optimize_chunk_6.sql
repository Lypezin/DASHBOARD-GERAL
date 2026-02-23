-- Optimizing: historico_atividades_usuario
CREATE OR REPLACE FUNCTION public.historico_atividades_usuario(p_user_id uuid, p_start_date timestamp with time zone DEFAULT (now() - '7 days'::interval), p_end_date timestamp with time zone DEFAULT now())
 RETURNS TABLE(id uuid, action_type text, action_details text, tab_name text, filters_applied jsonb, created_at timestamp with time zone, session_id text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.is_admin = true OR auth.uid() = p_user_id)
    ) THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;

    RETURN QUERY
    SELECT
        ua.id,
        ua.action_type,
        ua.action_details,
        ua.tab_name,
        ua.filters_applied,
        ua.created_at,
        ua.session_id
    FROM public.user_activities ua
    WHERE ua.user_id = p_user_id
      AND ua.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY ua.created_at DESC
    LIMIT 1000;

END;
$function$
;

-- Optimizing: is_admin_or_master
CREATE OR REPLACE FUNCTION public.is_admin_or_master()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  RETURN v_role IN ('admin', 'master');
END;
$function$
;

-- Optimizing: is_global_admin
CREATE OR REPLACE FUNCTION public.is_global_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    );
$function$
;

-- Optimizing: list_all_users
CREATE OR REPLACE FUNCTION public.list_all_users()
 RETURNS TABLE(id uuid, full_name text, email text, role text, is_admin boolean, is_approved boolean, created_at timestamp with time zone, approved_at timestamp with time zone, organization_id uuid, assigned_pracas text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user is admin
  SELECT (up.role = 'admin' OR up.is_admin = true) INTO v_is_admin
  FROM public.user_profiles up
  WHERE up.id = v_user_id;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    (p.role = 'admin' OR p.is_admin = true) as is_admin,
    p.is_approved,
    p.created_at,
    p.approved_at,
    p.organization_id,
    p.assigned_pracas
  FROM public.user_profiles p
  ORDER BY p.created_at DESC;
END;
$function$
;

-- Optimizing: list_all_users_optimized
CREATE OR REPLACE FUNCTION public.list_all_users_optimized()
 RETURNS TABLE(id uuid, full_name text, email text, is_admin boolean, is_approved boolean, assigned_pracas text[], created_at timestamp with time zone, approved_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        COALESCE(up.full_name, au.email)::TEXT as full_name,
        au.email::TEXT,
        COALESCE(up.is_admin, FALSE) as is_admin,
        COALESCE(up.is_approved, FALSE) as is_approved,
        COALESCE(up.assigned_pracas, ARRAY[]::TEXT[]) as assigned_pracas,
        COALESCE(up.created_at, au.created_at) as created_at,
        up.approved_at
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE au.deleted_at IS NULL
    ORDER BY 
        CASE WHEN up.is_approved = FALSE THEN 0 ELSE 1 END,
        up.created_at DESC NULLS LAST;
END;
$function$
;

