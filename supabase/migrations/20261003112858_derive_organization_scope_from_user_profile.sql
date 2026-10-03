-- Authorization must derive organization scope from the canonical profile row.
-- Supabase user_metadata is editable by the user and must not authorize RLS or RPC data access.
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT profile.organization_id
  FROM public.user_profiles AS profile
  WHERE profile.id = (SELECT auth.uid());
$function$;
