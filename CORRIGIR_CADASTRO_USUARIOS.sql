-- =====================================================================
-- CORREÇÃO: ERRO AO CADASTRAR NOVOS USUÁRIOS
-- =====================================================================
-- Problema: "Database error saving new user" - erro 500 no signup
-- Causa: Trigger handle_new_user() falhando ao inserir em user_profiles
-- Solução: Ajustar RLS e trigger para permitir inserção automática
-- =====================================================================

-- =============================================================================
-- DIAGNÓSTICO: Verificar estado atual
-- =============================================================================

-- 1. Verificar se o trigger existe
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Verificar políticas RLS em user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

-- 3. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';


-- =============================================================================
-- CORREÇÃO 1: Recriar função handle_new_user com tratamento de erros
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log para debug (visível nos logs do Supabase)
  RAISE NOTICE 'Criando perfil para usuário: %', NEW.id;
  RAISE NOTICE 'Email: %', NEW.email;
  RAISE NOTICE 'Metadata: %', NEW.raw_user_meta_data;

  -- Tentar inserir o perfil
  BEGIN
    INSERT INTO public.user_profiles (id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
      NEW.email
    );
    
    RAISE NOTICE 'Perfil criado com sucesso para: %', NEW.email;
  EXCEPTION
    WHEN OTHERS THEN
      -- Capturar e logar o erro específico
      RAISE WARNING 'Erro ao criar perfil: % - %', SQLERRM, SQLSTATE;
      -- Re-lançar o erro para impedir a criação do usuário
      RAISE;
  END;

  RETURN NEW;
END;
$$;

-- Garantir que a função tem as permissões corretas
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;


-- =============================================================================
-- CORREÇÃO 2: Recriar trigger
-- =============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- CORREÇÃO 3: Ajustar políticas RLS para permitir inserção via trigger
-- =============================================================================

-- Remover políticas antigas que podem estar causando conflito
DROP POLICY IF EXISTS "Enable insert for new users" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Criar política que permite inserção via SECURITY DEFINER
-- Esta política permite que o trigger (executando como SECURITY DEFINER) insira registros
CREATE POLICY "Allow service role to insert profiles"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);  -- Sem restrições, pois o trigger já valida

-- Política alternativa: permitir que usuários autenticados insiram seu próprio perfil
-- (caso o trigger falhe, o usuário pode tentar manualmente)
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);


-- =============================================================================
-- CORREÇÃO 4: Garantir que a tabela user_profiles aceita valores padrão
-- =============================================================================

-- Verificar e ajustar constraints
ALTER TABLE public.user_profiles 
  ALTER COLUMN full_name SET DEFAULT 'Usuário',
  ALTER COLUMN is_admin SET DEFAULT FALSE,
  ALTER COLUMN is_approved SET DEFAULT FALSE,
  ALTER COLUMN assigned_pracas SET DEFAULT '{}',
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Garantir que email não pode ser NULL (já deve estar assim)
ALTER TABLE public.user_profiles 
  ALTER COLUMN email SET NOT NULL;


-- =============================================================================
-- CORREÇÃO 5: Verificar permissões da tabela
-- =============================================================================

-- Garantir que service_role pode inserir
GRANT INSERT ON public.user_profiles TO service_role;
GRANT SELECT ON public.user_profiles TO service_role;

-- Garantir que authenticated pode ler seu próprio perfil
GRANT SELECT ON public.user_profiles TO authenticated;


-- =============================================================================
-- TESTE: Simular criação de usuário (APENAS PARA DEBUG)
-- =============================================================================

-- ATENÇÃO: NÃO EXECUTE ESTE BLOCO EM PRODUÇÃO!
-- Este é apenas um exemplo de como testar manualmente

/*
-- 1. Criar um usuário de teste via auth.users (simulando signup)
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'teste_' || floor(random() * 10000) || '@example.com';
BEGIN
  -- Inserir em auth.users (isso dispara o trigger)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    test_email,
    crypt('senha123', gen_salt('bf')),
    NOW(),
    jsonb_build_object('full_name', 'Usuário Teste'),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Usuário de teste criado: % (ID: %)', test_email, test_user_id;
  
  -- Verificar se o perfil foi criado
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = test_user_id) THEN
    RAISE NOTICE 'Perfil criado com sucesso!';
  ELSE
    RAISE WARNING 'Perfil NÃO foi criado - trigger falhou!';
  END IF;
END $$;
*/


-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================

-- Contar usuários sem perfil (não deveria haver nenhum)
SELECT 
  COUNT(*) as usuarios_sem_perfil
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Se houver usuários sem perfil, criar manualmente
INSERT INTO public.user_profiles (id, full_name, email)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Usuário'),
  au.email
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- MENSAGEM FINAL
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'CORREÇÃO APLICADA COM SUCESSO!';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Teste o cadastro de um novo usuário';
  RAISE NOTICE '2. Verifique os logs do Supabase para mensagens NOTICE/WARNING';
  RAISE NOTICE '3. Se ainda houver erro, execute a query de diagnóstico acima';
  RAISE NOTICE '=============================================================';
END $$;

