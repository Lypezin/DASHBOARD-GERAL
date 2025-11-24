-- Primeiro remover a função existente se ela existir
DROP FUNCTION IF EXISTS public.revoke_user_access(uuid);

-- Função para revogar acesso de um usuário
CREATE OR REPLACE FUNCTION public.revoke_user_access(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar o perfil do usuário para remover aprovação
  UPDATE public.user_profiles
  SET 
    is_approved = false,
    assigned_pracas = '{}',
    role = 'user',
    approved_at = NULL,
    organization_id = NULL
  WHERE id = user_id;
  
  -- Se não encontrou o usuário, lançar erro
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
END;
$$;

-- Permitir que apenas admins executem esta função
GRANT EXECUTE ON FUNCTION public.revoke_user_access(uuid) TO authenticated;
