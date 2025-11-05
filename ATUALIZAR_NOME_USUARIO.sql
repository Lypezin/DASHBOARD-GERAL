-- Função para atualizar o nome completo do usuário
-- Atualiza tanto no auth.users (user_metadata) quanto na tabela user_profiles

CREATE OR REPLACE FUNCTION update_user_full_name(
  p_user_id UUID,
  p_full_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Atualizar user_metadata no auth.users
  UPDATE auth.users
  SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', p_full_name),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Atualizar na tabela user_profiles se existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    INSERT INTO public.user_profiles (id, full_name, updated_at)
    VALUES (p_user_id, p_full_name, NOW())
    ON CONFLICT (id) 
    DO UPDATE SET 
      full_name = p_full_name,
      updated_at = NOW();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Nome atualizado com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION update_user_full_name(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION update_user_full_name(UUID, TEXT) IS 'Atualiza o nome completo do usuário no auth.users e na tabela user_profiles';

