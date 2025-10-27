-- =====================================================================
-- CRIAR FUNÇÃO get_current_user_profile
-- =====================================================================
-- Função que retorna o perfil do usuário atual
-- Necessária para o login funcionar
-- =====================================================================

-- Dropar se existir
DROP FUNCTION IF EXISTS public.get_current_user_profile();

-- Criar função
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile JSONB;
BEGIN
  -- Obter ID do usuário atual
  v_user_id := auth.uid();
  
  -- Se não houver usuário logado, retornar null
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Buscar profile do usuário
  SELECT jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'is_admin', COALESCE(p.is_admin, false),
    'assigned_pracas', COALESCE(p.assigned_pracas, ARRAY[]::TEXT[]),
    'status', COALESCE(p.status, 'pending')
  )
  INTO v_profile
  FROM user_profiles p
  WHERE p.id = v_user_id;
  
  -- Se não encontrar profile, retornar dados básicos
  IF v_profile IS NULL THEN
    SELECT jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'is_admin', false,
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
    -- Em caso de erro, retornar dados mínimos para não travar o login
    RETURN jsonb_build_object(
      'id', v_user_id,
      'email', 'unknown@email.com',
      'is_admin', false,
      'assigned_pracas', ARRAY[]::TEXT[],
      'status', 'pending',
      'error', SQLERRM
    );
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO anon;

-- Testar a função
DO $$
DECLARE
  v_result JSONB;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'TESTANDO get_current_user_profile';
  RAISE NOTICE '=============================================================';
  
  -- Tentar executar a função
  BEGIN
    SELECT get_current_user_profile() INTO v_result;
    RAISE NOTICE '✓ Função executada com sucesso';
    RAISE NOTICE '  Resultado: %', v_result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Erro ao executar: %', SQLERRM;
  END;
  
  RAISE NOTICE '=============================================================';
END $$;
