-- =====================================================
-- CRIAR FUNÇÃO LISTAR_USUARIOS_ONLINE
-- Esta função lista usuários online baseado em atividades recentes
-- Execute este SQL no Supabase após criar a tabela user_activity
-- =====================================================

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS public.listar_usuarios_online();

-- Criar função para listar usuários online
CREATE OR REPLACE FUNCTION public.listar_usuarios_online()
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  current_tab TEXT,
  filters_applied JSONB,
  last_action_type TEXT,
  action_details TEXT,
  seconds_inactive INTEGER,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_timeout_minutes INTEGER := 5; -- Considerar online se atividade nos últimos 5 minutos
BEGIN
  RETURN QUERY
  WITH ultimas_atividades AS (
    -- Buscar última atividade de cada usuário
    SELECT DISTINCT ON (ua.user_id)
      ua.user_id,
      ua.tab_name AS current_tab,
      ua.filters_applied,
      ua.action_type AS last_action_type,
      ua.action_details,
      ua.created_at AS last_activity_at,
      EXTRACT(EPOCH FROM (NOW() - ua.created_at))::INTEGER AS seconds_inactive
    FROM public.user_activity ua
    WHERE ua.created_at >= NOW() - (v_timeout_minutes || ' minutes')::INTERVAL
    ORDER BY ua.user_id, ua.created_at DESC
  ),
  usuarios_com_dados AS (
    SELECT 
      ua.user_id,
      ua.current_tab,
      ua.filters_applied,
      ua.last_action_type,
      ua.action_details,
      ua.seconds_inactive,
      CASE 
        WHEN ua.seconds_inactive < 60 THEN TRUE
        ELSE FALSE
      END AS is_active,
      -- Buscar nome do usuário (prioridade: user_profiles > user_metadata > email)
      COALESCE(
        up.full_name,
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'fullName',
        SPLIT_PART(au.email, '@', 1)
      ) AS user_name,
      au.email AS user_email
    FROM ultimas_atividades ua
    INNER JOIN auth.users au ON au.id = ua.user_id
    LEFT JOIN public.user_profiles up ON up.id = ua.user_id
  )
  SELECT 
    ucd.user_id,
    ucd.user_name,
    ucd.user_email,
    ucd.current_tab,
    ucd.filters_applied,
    ucd.last_action_type,
    ucd.action_details,
    ucd.seconds_inactive,
    ucd.is_active
  FROM usuarios_com_dados ucd
  ORDER BY ucd.seconds_inactive ASC;
END;
$$;

-- Dar permissões para a função
GRANT EXECUTE ON FUNCTION public.listar_usuarios_online() TO authenticated;

-- Comentário
COMMENT ON FUNCTION public.listar_usuarios_online() IS 'Lista usuários online baseado em atividades recentes (últimos 5 minutos)';

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS PARA ADMINS VEREM TODAS AS ATIVIDADES
-- =====================================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Admins podem ver todas as atividades" ON public.user_activity;

-- Criar função auxiliar para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_user_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  v_is_admin BOOLEAN := FALSE;
  v_user_meta JSONB;
BEGIN
  -- Verificar em auth.users metadata
  SELECT raw_user_meta_data INTO v_user_meta
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_user_meta IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar campos is_admin ou isAdmin no metadata
  v_is_admin := COALESCE(
    (v_user_meta->>'is_admin')::boolean,
    (v_user_meta->>'isAdmin')::boolean,
    FALSE
  );
  
  -- Se não encontrou no metadata, tentar verificar através da função get_current_user_profile
  IF v_is_admin IS FALSE THEN
    BEGIN
      -- Tentar chamar get_current_user_profile se existir
      -- Nota: Esta função pode retornar JSONB ou uma estrutura diferente
      -- Se der erro, apenas retornar FALSE
      SELECT (get_current_user_profile()->>'is_admin')::boolean INTO v_is_admin;
      
      IF v_is_admin IS TRUE THEN
        RETURN TRUE;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Se a função não existir ou der erro, retornar o valor do metadata
      NULL;
    END;
  END IF;
  
  RETURN COALESCE(v_is_admin, FALSE);
END;
$$;

-- Dar permissões para a função auxiliar
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO authenticated;

-- Criar política para admins verem todas as atividades
CREATE POLICY "Admins podem ver todas as atividades" 
ON public.user_activity
FOR SELECT 
USING (
  -- Permitir se for o próprio usuário
  auth.uid() = user_id
  OR
  -- Permitir se for admin
  public.is_user_admin(auth.uid()) = TRUE
);

-- Verificar se funcionou
SELECT 'Função listar_usuarios_online criada com sucesso!' as status;

