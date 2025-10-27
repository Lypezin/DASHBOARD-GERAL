-- =====================================================================
-- BLOCO 1: APROVAR USUÁRIOS
-- =====================================================================

-- Aprovar todos os usuários
UPDATE user_profiles SET is_approved = true;

-- Verificar
SELECT 
  email,
  is_approved,
  is_admin
FROM user_profiles
ORDER BY email;

