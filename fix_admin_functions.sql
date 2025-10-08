-- =====================================================================
-- CORREÇÃO DAS FUNÇÕES DE ADMINISTRAÇÃO
-- =====================================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================================

-- Função para listar usuários pendentes (CORRIGIDA)
DROP FUNCTION IF EXISTS public.list_pending_users();
CREATE OR REPLACE FUNCTION public.list_pending_users()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  assigned_pracas TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT 
    up.id,
    up.full_name,
    up.email,
    up.created_at,
    up.assigned_pracas
  FROM public.user_profiles up
  WHERE up.is_approved = FALSE
  ORDER BY up.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_pending_users() 
  TO authenticated;


-- Função para listar todos os usuários (CORRIGIDA)
DROP FUNCTION IF EXISTS public.list_all_users();
CREATE OR REPLACE FUNCTION public.list_all_users()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  is_admin BOOLEAN,
  is_approved BOOLEAN,
  assigned_pracas TEXT[],
  created_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT 
    up.id,
    up.full_name,
    up.email,
    up.is_admin,
    up.is_approved,
    up.assigned_pracas,
    up.created_at,
    up.approved_at
  FROM public.user_profiles up
  ORDER BY up.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_all_users() 
  TO authenticated;


-- Função para aprovar usuário (CORRIGIDA)
DROP FUNCTION IF EXISTS public.approve_user(UUID, TEXT[]);
CREATE OR REPLACE FUNCTION public.approve_user(
  user_id UUID,
  pracas TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Atualizar o usuário
  UPDATE public.user_profiles
  SET 
    is_approved = TRUE,
    assigned_pracas = pracas,
    approved_at = NOW(),
    approved_by = auth.uid()
  WHERE id = user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_user(UUID, TEXT[]) 
  TO authenticated;


-- Função para atualizar praças de um usuário (CORRIGIDA)
DROP FUNCTION IF EXISTS public.update_user_pracas(UUID, TEXT[]);
CREATE OR REPLACE FUNCTION public.update_user_pracas(
  user_id UUID,
  pracas TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Atualizar as praças
  UPDATE public.user_profiles
  SET assigned_pracas = pracas
  WHERE id = user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_pracas(UUID, TEXT[]) 
  TO authenticated;


-- Função para revogar acesso de um usuário (CORRIGIDA)
DROP FUNCTION IF EXISTS public.revoke_user_access(UUID);
CREATE OR REPLACE FUNCTION public.revoke_user_access(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Revogar acesso
  UPDATE public.user_profiles
  SET 
    is_approved = FALSE,
    assigned_pracas = '{}'
  WHERE id = user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_user_access(UUID) 
  TO authenticated;


-- =====================================================================
-- VERIFICAÇÃO
-- =====================================================================
SELECT 
  'Funções corrigidas' as status,
  COUNT(*) as total
FROM pg_proc 
WHERE proname IN (
  'list_pending_users',
  'list_all_users',
  'approve_user',
  'update_user_pracas',
  'revoke_user_access'
)
AND pronamespace = 'public'::regnamespace;
