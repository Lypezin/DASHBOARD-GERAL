-- =====================================================================
-- CORRIGIR RECURSÃO INFINITA EM user_profiles
-- =====================================================================
-- O problema: as políticas RLS de user_profiles estavam causando recursão
-- A solução: políticas mais simples sem subqueries que acessam a própria tabela
-- =====================================================================

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas antigas
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

-- 3. Reabilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas simples SEM recursão
-- Usuários podem ler seu próprio perfil
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  USING (id = auth.uid());

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (id = auth.uid());

-- 5. Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles'
ORDER BY policyname;
