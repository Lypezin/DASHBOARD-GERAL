-- =====================================================================
-- VERIFICAR E CORRIGIR user_profiles
-- =====================================================================
-- Verifica estrutura e adiciona coluna status se necessário
-- =====================================================================

-- Ver estrutura atual
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Adicionar coluna status se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN status TEXT DEFAULT 'approved';
    RAISE NOTICE '✓ Coluna status adicionada';
  ELSE
    RAISE NOTICE '✓ Coluna status já existe';
  END IF;
END $$;

-- Atualizar todos os registros existentes para approved
UPDATE user_profiles SET status = 'approved' WHERE status IS NULL OR status = '';

-- Verificar resultado
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'USUÁRIOS APÓS CORREÇÃO';
  RAISE NOTICE '=============================================================';
  
  FOR r IN (
    SELECT 
      email,
      COALESCE(status, 'N/A') as status,
      is_admin
    FROM user_profiles
    ORDER BY email
  )
  LOOP
    RAISE NOTICE 'Email: % | Status: % | Admin: %', r.email, r.status, r.is_admin;
  END LOOP;
  
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '✅ TODOS OS USUÁRIOS ESTÃO APROVADOS!';
  RAISE NOTICE '=============================================================';
END $$;

