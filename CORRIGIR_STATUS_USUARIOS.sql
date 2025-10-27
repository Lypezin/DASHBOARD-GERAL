-- =====================================================================
-- CORRIGIR STATUS DE USUÁRIOS
-- =====================================================================
-- Corrige o status de aprovação dos usuários
-- =====================================================================

DO $$
DECLARE
  v_total_usuarios BIGINT;
  v_usuarios_aprovados BIGINT;
  v_usuarios_pendentes BIGINT;
  r RECORD;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'DIAGNÓSTICO DE STATUS DOS USUÁRIOS';
  RAISE NOTICE '=============================================================';
  
  -- Total de usuários
  SELECT COUNT(*) INTO v_total_usuarios FROM user_profiles;
  RAISE NOTICE 'Total de usuários: %', v_total_usuarios;
  
  -- Usuários aprovados
  SELECT COUNT(*) INTO v_usuarios_aprovados 
  FROM user_profiles 
  WHERE status = 'approved';
  RAISE NOTICE 'Usuários aprovados: %', v_usuarios_aprovados;
  
  -- Usuários pendentes
  SELECT COUNT(*) INTO v_usuarios_pendentes 
  FROM user_profiles 
  WHERE status = 'pending' OR status IS NULL;
  RAISE NOTICE 'Usuários pendentes: %', v_usuarios_pendentes;
  
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'CORRIGINDO STATUS';
  RAISE NOTICE '=============================================================';
  
  -- Aprovar todos os usuários que já existem
  UPDATE user_profiles
  SET status = 'approved'
  WHERE status IS NULL OR status = 'pending';
  
  RAISE NOTICE '✓ Todos os usuários foram aprovados';
  
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'STATUS APÓS CORREÇÃO';
  RAISE NOTICE '=============================================================';
  
  -- Mostrar usuários
  FOR r IN (
    SELECT 
      email,
      status,
      is_admin,
      assigned_pracas
    FROM user_profiles
    ORDER BY email
  )
  LOOP
    RAISE NOTICE 'Email: % | Status: % | Admin: %', r.email, r.status, r.is_admin;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA! Tente fazer login novamente.';
  RAISE NOTICE '=============================================================';
  
END $$;

