-- =====================================================================
-- SOLUÇÃO FINAL PARA PROBLEMA DE LOGIN
-- =====================================================================
-- Aprova todos os usuários e corrige a função
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'CORRIGINDO SISTEMA DE APROVAÇÃO';
  RAISE NOTICE '=============================================================';
END $$;

-- =====================================================================
-- 1. APROVAR TODOS OS USUÁRIOS EXISTENTES
-- =====================================================================
DO $$
DECLARE
  v_total BIGINT;
  v_aprovados BIGINT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣  APROVANDO USUÁRIOS';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  SELECT COUNT(*) INTO v_total FROM user_profiles;
  SELECT COUNT(*) INTO v_aprovados FROM user_profiles WHERE is_approved = true;
  
  RAISE NOTICE 'Total de usuários: %', v_total;
  RAISE NOTICE 'Já aprovados: %', v_aprovados;
  
  -- Aprovar todos
  UPDATE user_profiles SET is_approved = true;
  
  RAISE NOTICE '✓ Todos os % usuários foram aprovados', v_total;
END $$;

-- =====================================================================
-- 2. CORRIGIR FUNÇÃO get_current_user_profile
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  CORRIGINDO FUNÇÃO';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

DROP FUNCTION IF EXISTS public.get_current_user_profile();

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_id UUID;
  v_profile JSONB;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Buscar profile usando is_approved (boolean)
  SELECT jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'is_admin', COALESCE(p.is_admin, false),
    'is_approved', COALESCE(p.is_approved, false),
    'assigned_pracas', COALESCE(p.assigned_pracas, ARRAY[]::TEXT[])
  )
  INTO v_profile
  FROM user_profiles p
  WHERE p.id = v_user_id;
  
  -- Se não encontrar profile, retornar dados básicos
  IF v_profile IS NULL THEN
    SELECT jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'full_name', NULL,
      'is_admin', false,
      'is_approved', false,
      'assigned_pracas', ARRAY[]::TEXT[]
    )
    INTO v_profile
    FROM auth.users u
    WHERE u.id = v_user_id;
  END IF;
  
  RETURN v_profile;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar dados mínimos
    RETURN jsonb_build_object(
      'id', v_user_id,
      'email', 'error',
      'full_name', NULL,
      'is_admin', false,
      'is_approved', false,
      'assigned_pracas', ARRAY[]::TEXT[],
      'error_message', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated, anon;

-- =====================================================================
-- 3. VERIFICAR RESULTADO
-- =====================================================================
DO $$
DECLARE
  r RECORD;
  v_result JSONB;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  VERIFICANDO USUÁRIOS';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  FOR r IN (
    SELECT 
      email,
      full_name,
      is_admin,
      is_approved,
      assigned_pracas
    FROM user_profiles
    ORDER BY email
  )
  LOOP
    RAISE NOTICE 'Email: % | Aprovado: % | Admin: %', 
      r.email, 
      r.is_approved, 
      r.is_admin;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  TESTANDO FUNÇÃO';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  BEGIN
    SELECT get_current_user_profile() INTO v_result;
    RAISE NOTICE '✓ Função executada com sucesso';
    IF v_result IS NOT NULL THEN
      RAISE NOTICE '  Resultado: %', v_result;
    ELSE
      RAISE NOTICE '  (Nenhum usuário logado - normal)';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠ Erro ao testar: %', SQLERRM;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA!';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Todos os usuários foram aprovados.';
  RAISE NOTICE 'Tente fazer login novamente no dashboard!';
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
END $$;

