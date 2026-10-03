-- Administrative authorization comes from the server-controlled profile row.
-- Do not treat the user-editable auth.users.raw_user_meta_data as an admin source.
CREATE OR REPLACE FUNCTION public.is_user_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles AS profile
    WHERE profile.id = p_user_id
      AND (
        profile.is_admin IS TRUE
        OR lower(coalesce(profile.role, '')) IN ('admin', 'master')
      )
  );
$function$;
