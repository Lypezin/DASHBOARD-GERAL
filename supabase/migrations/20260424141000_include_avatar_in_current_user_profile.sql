create or replace function public.get_current_user_profile()
returns json
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_profile json;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return null;
  end if;

  select json_build_object(
    'id', id,
    'email', email,
    'full_name', full_name,
    'role', role,
    'is_admin', (role in ('admin', 'master')),
    'is_approved', is_approved,
    'organization_id', organization_id,
    'assigned_pracas', assigned_pracas,
    'avatar_url', avatar_url
  ) into v_profile
  from public.user_profiles
  where id = v_user_id;

  return v_profile;
end;
$function$;
