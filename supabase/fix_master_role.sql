-- Fix master role access
-- Updated to handle return type changes by dropping functions first

-- 1. Update get_current_user_profile to handle master role
DROP FUNCTION IF EXISTS public.get_current_user_profile();

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile json;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', id,
    'email', email,
    'full_name', full_name,
    'role', role,
    'is_admin', (role IN ('admin', 'master')),
    'is_approved', is_approved,
    'organization_id', organization_id
  ) INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id;

  RETURN v_profile;
END;
$$;

-- 2. Update list_all_users to allow master role
DROP FUNCTION IF EXISTS public.list_all_users();

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
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user is admin or master
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_role NOT IN ('admin', 'master') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    (p.role IN ('admin', 'master')) as is_admin,
    p.is_approved,
    p.created_at,
    p.approved_at,
    p.organization_id,
    p.assigned_pracas
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- 3. Update list_pending_users to allow master role
DROP FUNCTION IF EXISTS public.list_pending_users();

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
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user is admin or master
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_role NOT IN ('admin', 'master') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    (p.role IN ('admin', 'master')) as is_admin,
    p.is_approved,
    p.created_at,
    p.approved_at,
    p.organization_id,
    p.assigned_pracas
  FROM public.profiles p
  WHERE p.is_approved = false
  ORDER BY p.created_at DESC;
END;
$$;

-- 4. Ensure RLS policies allow master to access profiles
DO $$
BEGIN
  -- Check if policy exists before creating/updating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins and Masters can view all profiles'
  ) THEN
    CREATE POLICY "Admins and Masters can view all profiles" 
    ON public.profiles 
    FOR SELECT 
    USING (
      auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE role IN ('admin', 'master')
      )
    );
  END IF;
END
$$;

-- 5. Ensure RLS policies allow master to access data tables
DO $$
BEGIN
  -- dados_corridas
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dados_corridas' 
    AND policyname = 'Admins and Masters can view all dados_corridas'
  ) THEN
    CREATE POLICY "Admins and Masters can view all dados_corridas" 
    ON public.dados_corridas 
    FOR SELECT 
    USING (
      auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE role IN ('admin', 'master')
      )
    );
  END IF;

  -- mv_aderencia_agregada
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mv_aderencia_agregada' 
    AND policyname = 'Admins and Masters can view all mv_aderencia_agregada'
  ) THEN
    CREATE POLICY "Admins and Masters can view all mv_aderencia_agregada" 
    ON public.mv_aderencia_agregada 
    FOR SELECT 
    USING (
      auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE role IN ('admin', 'master')
      )
    );
  END IF;
END
$$;
