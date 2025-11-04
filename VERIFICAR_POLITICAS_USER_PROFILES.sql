-- =====================================================================
-- VERIFICAÇÃO E CORREÇÃO DAS POLÍTICAS RLS DA TABELA user_profiles
-- =====================================================================
-- Este script verifica se as políticas RLS estão corretas e permitem
-- INSERT mesmo quando o registro não existe ainda
-- =====================================================================

-- 1. Verificar se a tabela existe e tem RLS habilitado
SELECT 
  'Tabela existe' as verificação,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
    ) THEN '✅ Sim'
    ELSE '❌ Não'
  END as status
UNION ALL
SELECT 
  'RLS habilitado' as verificação,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'user_profiles'
      AND n.nspname = 'public'
      AND c.relrowsecurity = true
    ) THEN '✅ Sim'
    ELSE '❌ Não'
  END as status;

-- 2. Verificar políticas existentes
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd;

-- 3. Garantir que as políticas estão corretas
-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Política para SELECT: usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Política para INSERT: usuários podem criar apenas seu próprio perfil
-- IMPORTANTE: Permite INSERT mesmo se o registro não existir
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política para UPDATE: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Verificar se a função update_user_avatar permite INSERT
-- Se a função já existe, vamos garantir que ela faz INSERT corretamente
-- IMPORTANTE: O search_path deve incluir 'auth' para acessar auth.users
CREATE OR REPLACE FUNCTION public.update_user_avatar(
  p_user_id UUID,
  p_avatar_url TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Verificar se o usuário está tentando atualizar seu próprio perfil
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Você só pode atualizar seu próprio perfil';
  END IF;

  -- Verificar se o usuário existe em auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Upsert (insert ou update) do perfil
  -- Usando INSERT ... ON CONFLICT para garantir que funciona mesmo se o registro não existir
  INSERT INTO public.user_profiles (id, avatar_url, updated_at)
  VALUES (p_user_id, p_avatar_url, NOW())
  ON CONFLICT (id)
  DO UPDATE SET
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
    
  -- Verificar se o registro foi criado/atualizado
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Erro ao salvar avatar';
  END IF;
END;
$$;

-- 5. Verificar estrutura final
SELECT 
  'Políticas RLS' as verificação,
  COUNT(*)::text || ' políticas criadas' as status
FROM pg_policies
WHERE tablename = 'user_profiles';

-- 6. Teste: Verificar se um usuário pode fazer INSERT/UPDATE
-- (Execute este teste como um usuário autenticado no frontend)
-- SELECT auth.uid() as current_user_id;

-- =====================================================================
-- NOTA IMPORTANTE:
-- =====================================================================
-- Se o problema persistir, verifique:
-- 1. Se o usuário está autenticado (auth.uid() não é NULL)
-- 2. Se o ID do usuário no upsert corresponde ao auth.uid()
-- 3. Se há algum trigger ou constraint impedindo a inserção
-- =====================================================================

