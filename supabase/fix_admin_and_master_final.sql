-- ============================================================================
-- FIX: Admin Page + Marketing Access + Remove Master Role References
-- ============================================================================
-- Issues Fixed:
-- 1. Admin page not loading users (ambiguous role column)
-- 2. Organizations tab error (is_global_admin checking master role)
-- 3. mv_dashboard_resumo not tracked in refresh control
-- 4. Remove all references to 'master' role
-- ============================================================================

-- 1. Fix list_all_users - remove ambiguous column reference
CREATE OR REPLACE FUNCTION public.list_all_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  role text,
  is_admin boolean,
  is_approved boolean,
  created_at timestamptz,
  approved_at timestamptz,
  organization_id uuid,
  assigned_pracas text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user is admin (use qualified column name to avoid ambiguity)
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
$function$;

-- 2. Fix list_pending_users
CREATE OR REPLACE FUNCTION public.list_pending_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  role text,
  is_admin boolean,
  is_approved boolean,
  created_at timestamptz,
  approved_at timestamptz,
  organization_id uuid,
  assigned_pracas text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  WHERE p.is_approved = false
  ORDER BY p.created_at DESC;
END;
$function$;

-- 3. Fix is_global_admin - remove master role check
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    );
$$;

-- 4. Add mv_dashboard_resumo to refresh control
INSERT INTO mv_refresh_control (mv_name, needs_refresh)
VALUES ('mv_dashboard_resumo', false)
ON CONFLICT (mv_name) DO NOTHING;

-- ============================================================================
-- Verification Queries (Run these to verify the fixes)
-- ============================================================================

-- Verify list_all_users works
-- SELECT COUNT(*) as total_users FROM list_all_users();

-- Verify is_global_admin works
-- SELECT is_global_admin() as is_admin;

-- Verify mv_dashboard_resumo is tracked
-- SELECT * FROM mv_refresh_control WHERE mv_name = 'mv_dashboard_resumo';

-- ============================================================================
-- Notes:
-- - Admin page should now load users correctly
-- - Organizations tab should work for admin users
-- - Marketing users should have full access (handled by hasFullCityAccess in frontend)
-- - mv_dashboard_resumo will now be refreshed when "Atualizar" button is clicked
-- ============================================================================
