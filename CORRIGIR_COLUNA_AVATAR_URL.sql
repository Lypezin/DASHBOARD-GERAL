-- =====================================================================
-- CORRIGIR COLUNA avatar_url NA TABELA user_profiles
-- =====================================================================
-- Este script verifica e cria a coluna avatar_url se ela não existir
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

-- 2. Verificar se a coluna avatar_url existe e criá-la se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
    AND column_name = 'avatar_url'
  ) THEN
    RAISE NOTICE 'Coluna avatar_url não existe. Criando...';
    
    ALTER TABLE public.user_profiles
    ADD COLUMN avatar_url TEXT;
    
    RAISE NOTICE 'Coluna avatar_url criada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna avatar_url já existe.';
  END IF;
END $$;

-- 3. Verificar se a coluna created_at existe e criá-la se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
    AND column_name = 'created_at'
  ) THEN
    RAISE NOTICE 'Coluna created_at não existe. Criando...';
    
    ALTER TABLE public.user_profiles
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    
    RAISE NOTICE 'Coluna created_at criada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna created_at já existe.';
  END IF;
END $$;

-- 4. Verificar se a coluna updated_at existe e criá-la se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
    AND column_name = 'updated_at'
  ) THEN
    RAISE NOTICE 'Coluna updated_at não existe. Criando...';
    
    ALTER TABLE public.user_profiles
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    
    RAISE NOTICE 'Coluna updated_at criada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna updated_at já existe.';
  END IF;
END $$;

-- 5. Verificar estrutura final da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 6. Verificar se há constraint de foreign key para auth.users
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conrelid = 'public.user_profiles'::regclass
  AND contype = 'f';

-- =====================================================================
-- FIM DA CORREÇÃO
-- =====================================================================

