-- =====================================================================
-- CORREÇÃO COMPLETA DA TABELA user_profiles
-- =====================================================================
-- Este script corrige TODOS os problemas da tabela user_profiles:
-- 1. Cria a tabela se não existir (com todas as colunas corretas)
-- 2. Adiciona colunas faltantes se a tabela já existir
-- 3. Remove constraints NOT NULL desnecessárias
-- 4. Configura as políticas RLS corretamente
-- 5. Atualiza a função update_user_avatar
-- =====================================================================

-- =====================================================================
-- PASSO 1: VERIFICAR E CRIAR/CORRIGIR A TABELA
-- =====================================================================

-- Remover constraints NOT NULL problemáticas se existirem
DO $$
BEGIN
  -- Remover NOT NULL de email se existir
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
    AND column_name = 'email'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.user_profiles ALTER COLUMN email DROP NOT NULL;
    RAISE NOTICE 'Constraint NOT NULL removida da coluna email';
  END IF;
END $$;

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas faltantes se não existirem
DO $$
BEGIN
  -- Adicionar avatar_url se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN avatar_url TEXT;
    RAISE NOTICE 'Coluna avatar_url adicionada';
  END IF;

  -- Adicionar created_at se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Coluna created_at adicionada';
  END IF;

  -- Adicionar updated_at se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Coluna updated_at adicionada';
  END IF;

  -- Se a coluna email existir, garantir que não seja NOT NULL
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
    AND column_name = 'email'
  ) THEN
    -- Verificar se é NOT NULL e remover se for
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
      AND column_name = 'email'
      AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE public.user_profiles ALTER COLUMN email DROP NOT NULL;
      RAISE NOTICE 'Constraint NOT NULL removida da coluna email';
    END IF;
  END IF;
END $$;

-- =====================================================================
-- PASSO 2: HABILITAR RLS
-- =====================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- PASSO 3: REMOVER POLÍTICAS ANTIGAS
-- =====================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- =====================================================================
-- PASSO 4: CRIAR POLÍTICAS RLS CORRETAS
-- =====================================================================

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

-- =====================================================================
-- PASSO 5: CRIAR/ATUALIZAR FUNÇÃO update_user_avatar
-- =====================================================================

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
  -- IMPORTANTE: Não incluir colunas que não existem ou que têm constraints
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

-- =====================================================================
-- PASSO 6: CRIAR TRIGGER PARA updated_at
-- =====================================================================

-- Criar função do trigger
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_profiles_updated_at();

-- =====================================================================
-- PASSO 7: CRIAR ÍNDICE
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);

-- =====================================================================
-- PASSO 8: VERIFICAÇÃO FINAL
-- =====================================================================

-- Verificar estrutura da tabela
SELECT 
  'Estrutura da tabela' as verificação,
  column_name as coluna,
  data_type as tipo,
  is_nullable as nullable,
  column_default as default_value
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
  'Políticas RLS' as verificação,
  COUNT(*)::text || ' políticas criadas' as status
FROM pg_policies
WHERE tablename = 'user_profiles';

-- =====================================================================
-- FIM DA CORREÇÃO
-- =====================================================================

