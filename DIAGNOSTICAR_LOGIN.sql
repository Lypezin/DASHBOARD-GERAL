-- =====================================================================
-- DIAGNOSTICAR PROBLEMAS DE LOGIN
-- =====================================================================
-- Verifica se os usuários existem e estão ativos
-- =====================================================================

DO $$
DECLARE
  v_total_users BIGINT;
  v_total_profiles BIGINT;
  v_usuarios_sem_profile BIGINT;
  v_email_para_testar TEXT := 'SEU_EMAIL_AQUI@example.com'; -- SUBSTITUA PELO SEU EMAIL
  r RECORD;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'DIAGNÓSTICO DE LOGIN';
  RAISE NOTICE '=============================================================';
  
  -- Verificar usuários na tabela auth.users
  SELECT COUNT(*) INTO v_total_users
  FROM auth.users;
  
  RAISE NOTICE '✓ Total de usuários no sistema: %', v_total_users;
  
  -- Verificar profiles
  SELECT COUNT(*) INTO v_total_profiles
  FROM user_profiles;
  
  RAISE NOTICE '✓ Total de profiles: %', v_total_profiles;
  
  -- Verificar usuários sem profile
  SELECT COUNT(*) INTO v_usuarios_sem_profile
  FROM auth.users u
  LEFT JOIN user_profiles p ON u.id = p.id
  WHERE p.id IS NULL;
  
  IF v_usuarios_sem_profile > 0 THEN
    RAISE NOTICE '⚠ ATENÇÃO: % usuários sem profile!', v_usuarios_sem_profile;
  ELSE
    RAISE NOTICE '✓ Todos os usuários têm profile';
  END IF;
  
  -- Listar últimos 5 usuários criados
  RAISE NOTICE '';
  RAISE NOTICE 'Últimos 5 usuários cadastrados:';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  FOR r IN (
    SELECT 
      u.email,
      u.created_at,
      CASE WHEN u.confirmed_at IS NOT NULL THEN 'Confirmado' ELSE 'Não confirmado' END AS status_confirmacao,
      CASE WHEN p.id IS NOT NULL THEN 'Com profile' ELSE 'SEM PROFILE' END AS status_profile,
      COALESCE(p.nome, 'N/A') AS nome,
      COALESCE(p.is_admin::TEXT, 'N/A') AS is_admin
    FROM auth.users u
    LEFT JOIN user_profiles p ON u.id = p.id
    ORDER BY u.created_at DESC
    LIMIT 5
  )
  LOOP
    RAISE NOTICE 'Email: % | Nome: % | Admin: % | %', 
      r.email, r.nome, r.is_admin, r.status_profile;
  END LOOP;
  
  RAISE NOTICE '=============================================================';
  
END $$;


-- =====================================================================
-- VERIFICAR UM USUÁRIO ESPECÍFICO (OPCIONAL)
-- =====================================================================
-- Descomente e substitua o email para verificar um usuário específico

/*
DO $$
DECLARE
  v_email TEXT := 'SEU_EMAIL@example.com'; -- SUBSTITUA AQUI
  v_user_id UUID;
  v_tem_profile BOOLEAN;
  v_nome TEXT;
  v_is_admin BOOLEAN;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'VERIFICANDO USUÁRIO: %', v_email;
  RAISE NOTICE '=============================================================';
  
  -- Buscar na tabela auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ USUÁRIO NÃO ENCONTRADO NO AUTH!';
    RAISE NOTICE 'O email % não está cadastrado.', v_email;
    RETURN;
  END IF;
  
  RAISE NOTICE '✓ Usuário encontrado - ID: %', v_user_id;
  
  -- Verificar profile
  SELECT 
    p.id IS NOT NULL,
    COALESCE(p.nome, 'N/A'),
    COALESCE(p.is_admin, false)
  INTO v_tem_profile, v_nome, v_is_admin
  FROM auth.users u
  LEFT JOIN user_profiles p ON u.id = p.id
  WHERE u.id = v_user_id;
  
  IF v_tem_profile THEN
    RAISE NOTICE '✓ Profile existe';
    RAISE NOTICE '  Nome: %', v_nome;
    RAISE NOTICE '  Admin: %', v_is_admin;
  ELSE
    RAISE NOTICE '❌ PROFILE NÃO EXISTE!';
    RAISE NOTICE 'Criando profile...';
    
    -- Criar profile
    INSERT INTO user_profiles (id, email, nome, is_admin, status)
    VALUES (v_user_id, v_email, 'Usuário', false, 'pending');
    
    RAISE NOTICE '✓ Profile criado com sucesso!';
  END IF;
  
  RAISE NOTICE '=============================================================';
END $$;
*/

