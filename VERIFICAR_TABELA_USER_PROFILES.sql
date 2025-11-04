-- =====================================================================
-- VERIFICAÇÃO E CORREÇÃO DA TABELA user_profiles
-- =====================================================================
-- Execute este script para verificar se a tabela existe e corrigir
-- qualquer problema de configuração
-- =====================================================================

-- 1. Verificar se a tabela existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
  ) THEN
    RAISE NOTICE 'Tabela user_profiles não existe. Criando...';
    
    -- Criar tabela
    CREATE TABLE public.user_profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE 'Tabela user_profiles criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela user_profiles já existe.';
  END IF;
END $$;

-- 2. Verificar e habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- 4. Criar políticas RLS corretas
-- Política para SELECT: usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Política para INSERT: usuários podem criar apenas seu próprio perfil
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

-- 5. Criar ou substituir função update_user_avatar
-- Usamos CREATE OR REPLACE para sempre garantir que a função está atualizada
CREATE OR REPLACE FUNCTION public.update_user_avatar(
  p_user_id UUID,
  p_avatar_url TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário está tentando atualizar seu próprio perfil
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Você só pode atualizar seu próprio perfil';
  END IF;

  -- Upsert (insert ou update) do perfil
  INSERT INTO public.user_profiles (id, avatar_url, updated_at)
  VALUES (p_user_id, p_avatar_url, NOW())
  ON CONFLICT (id)
  DO UPDATE SET
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
END;
$$;

-- Dar permissões para a função
GRANT EXECUTE ON FUNCTION public.update_user_avatar(UUID, TEXT)
  TO authenticated;

-- 6. Criar função do trigger
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 7. Criar ou substituir trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_profiles_updated_at();

-- 8. Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);

-- 9. Verificar estrutura final
SELECT 
  'Tabela user_profiles' as item,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
    ) THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status
UNION ALL
SELECT 
  'RLS habilitado' as item,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'user_profiles'
      AND n.nspname = 'public'
      AND c.relrowsecurity = true
    ) THEN '✅ Habilitado'
    ELSE '❌ Não habilitado'
  END as status
UNION ALL
SELECT 
  'Políticas RLS' as item,
  COUNT(*)::text || ' políticas criadas' as status
FROM pg_policies
WHERE tablename = 'user_profiles';

-- =====================================================================
-- FIM DA VERIFICAÇÃO
-- =====================================================================

