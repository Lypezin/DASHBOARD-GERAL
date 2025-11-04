-- =====================================================================
-- CONFIGURAÇÃO PARA FOTO DE PERFIL
-- =====================================================================
-- Este script cria a estrutura necessária para armazenar fotos de perfil
-- =====================================================================

-- 1. Criar tabela user_profiles se não existir
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS
-- Política para SELECT: usuários podem ver apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Política para INSERT: usuários podem criar apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política para UPDATE: usuários podem atualizar apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Criar função para atualizar avatar
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

-- 5. Dar permissões para a função
GRANT EXECUTE ON FUNCTION public.update_user_avatar(UUID, TEXT)
  TO authenticated;

-- 6. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_profiles_updated_at();

-- 7. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);

-- =====================================================================
-- CONFIGURAÇÃO DO SUPABASE STORAGE
-- =====================================================================
-- PASSO 1: Criar o bucket "avatars" no Supabase Storage
-- 
-- 1. Vá para: https://supabase.com/dashboard/project/[SEU_PROJETO]/storage/buckets
-- 2. Clique em "New bucket"
-- 3. Nome: "avatars"
-- 4. Público: Sim (para permitir acesso público às imagens)
-- 5. File size limit: 5MB (ou o tamanho que preferir)
-- 6. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
--
-- PASSO 2: Executar o arquivo CONFIGURAR_STORAGE_AVATARS.sql
-- 
-- Após criar o bucket, execute o arquivo CONFIGURAR_STORAGE_AVATARS.sql
-- que contém todas as políticas de segurança necessárias.
-- =====================================================================

