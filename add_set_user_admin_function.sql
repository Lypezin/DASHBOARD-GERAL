-- =====================================================================
-- FUNÇÃO PARA PROMOVER/REMOVER ADMIN
-- =====================================================================
-- Execute no Supabase SQL Editor
-- =====================================================================

DROP FUNCTION IF EXISTS public.set_user_admin(UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION public.set_user_admin(
  user_id UUID,
  make_admin BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Não pode remover o próprio admin
  IF user_id = auth.uid() AND make_admin = FALSE THEN
    RAISE EXCEPTION 'Você não pode remover seu próprio status de admin';
  END IF;

  -- Atualizar o status de admin
  UPDATE public.user_profiles
  SET is_admin = make_admin
  WHERE id = user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_admin(UUID, BOOLEAN) 
  TO authenticated;

-- Verificar se a função foi criada
SELECT 
  'Função set_user_admin' as item,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'set_user_admin'
  ) THEN '✅ Criada' ELSE '❌ Não encontrada' END as status;
