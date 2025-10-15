-- =====================================================================
-- CORREÇÃO: ERRO 500 AO CADASTRAR NOVOS USUÁRIOS
-- =====================================================================
-- Copie e cole este script inteiro no Supabase SQL Editor
-- =====================================================================

-- PASSO 1: Recriar função handle_new_user com tratamento de erros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil: % - %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;

-- PASSO 2: Garantir permissões na função
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- PASSO 3: Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASSO 4: Remover políticas RLS conflitantes
DROP POLICY IF EXISTS "Enable insert for new users" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow service role to insert profiles" ON public.user_profiles;

-- PASSO 5: Criar política RLS que permite inserção via trigger
CREATE POLICY "Allow service role to insert profiles"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);

-- PASSO 6: Adicionar política para usuários inserirem próprio perfil (backup)
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- PASSO 7: Garantir valores padrão na tabela
ALTER TABLE public.user_profiles 
  ALTER COLUMN full_name SET DEFAULT 'Usuário',
  ALTER COLUMN is_admin SET DEFAULT FALSE,
  ALTER COLUMN is_approved SET DEFAULT FALSE,
  ALTER COLUMN assigned_pracas SET DEFAULT '{}',
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- PASSO 8: Garantir permissões na tabela
GRANT INSERT ON public.user_profiles TO service_role;
GRANT SELECT ON public.user_profiles TO service_role;
GRANT SELECT ON public.user_profiles TO authenticated;

-- PASSO 9: Criar perfis para usuários que não têm (se houver)
INSERT INTO public.user_profiles (id, full_name, email)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Usuário'),
  au.email
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Finalizado! Agora teste o cadastro de um novo usuário

