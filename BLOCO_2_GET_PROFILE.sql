-- =====================================================================
-- BLOCO 2: FUNÇÃO get_current_user_profile
-- =====================================================================

DROP FUNCTION IF EXISTS public.get_current_user_profile();

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_id UUID;
  v_profile JSONB;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'is_admin', COALESCE(p.is_admin, false),
    'is_approved', COALESCE(p.is_approved, true),
    'assigned_pracas', COALESCE(p.assigned_pracas, ARRAY[]::TEXT[])
  )
  INTO v_profile
  FROM user_profiles p
  WHERE p.id = v_user_id;
  
  RETURN COALESCE(v_profile, jsonb_build_object(
    'id', v_user_id,
    'email', 'unknown',
    'full_name', NULL,
    'is_admin', false,
    'is_approved', true,
    'assigned_pracas', ARRAY[]::TEXT[]
  ));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated, anon;

