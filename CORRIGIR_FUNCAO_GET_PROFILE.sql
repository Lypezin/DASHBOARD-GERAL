-- =====================================================================
-- CORRIGIR FUNÇÃO get_current_user_profile
-- =====================================================================
-- Adiciona o campo is_approved que estava faltando
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'CORRIGINDO FUNÇÃO get_current_user_profile';
  RAISE NOTICE '=============================================================';
END $$;

-- Dropar função antiga
DROP FUNCTION IF EXISTS public.get_current_user_profile();

-- Recriar com is_approved
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
  
  -- Buscar profile com is_approved baseado no status
  SELECT jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'is_admin', COALESCE(p.is_admin, false),
    'is_approved', CASE WHEN p.status = 'approved' THEN true ELSE false END,
    'assigned_pracas', COALESCE(p.assigned_pracas, ARRAY[]::TEXT[]),
    'status', COALESCE(p.status, 'pending')
  )
  INTO v_profile
  FROM user_profiles p
  WHERE p.id = v_user_id;
  
  -- Se não encontrar profile, retornar dados básicos não aprovados
  IF v_profile IS NULL THEN
    SELECT jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'is_admin', false,
      'is_approved', false,
      'assigned_pracas', ARRAY[]::TEXT[],
      'status', 'pending'
    )
    INTO v_profile
    FROM auth.users u
    WHERE u.id = v_user_id;
  END IF;
  
  RETURN v_profile;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar usuário não aprovado
    RETURN jsonb_build_object(
      'id', v_user_id,
      'email', 'error',
      'is_admin', false,
      'is_approved', false,
      'assigned_pracas', ARRAY[]::TEXT[],
      'status', 'error',
      'error_message', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated, anon;

-- Testar a função
DO $$
DECLARE
  v_result JSONB;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'TESTANDO FUNÇÃO';
  RAISE NOTICE '=============================================================';
  
  BEGIN
    SELECT get_current_user_profile() INTO v_result;
    RAISE NOTICE '✓ Função executada';
    RAISE NOTICE '  Resultado: %', v_result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠ Erro (normal se não houver usuário logado): %', SQLERRM;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '✅ FUNÇÃO CORRIGIDA!';
  RAISE NOTICE 'Agora execute: CORRIGIR_STATUS_USUARIOS.sql';
  RAISE NOTICE '=============================================================';
END $$;

