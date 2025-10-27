-- =====================================================================
-- DIAGNOSTICAR PROBLEMAS DE LOGIN - VERSÃO SIMPLES
-- =====================================================================

-- Passo 1: Verificar estrutura da tabela user_profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Passo 2: Contar usuários
SELECT 
  'Total usuários auth' as tipo,
  COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
  'Total profiles' as tipo,
  COUNT(*) as total
FROM user_profiles;

-- Passo 3: Listar últimos 5 usuários (sem coluna nome)
SELECT 
  u.email,
  u.created_at,
  CASE WHEN u.confirmed_at IS NOT NULL THEN 'Confirmado' ELSE 'Não confirmado' END AS status,
  CASE WHEN p.id IS NOT NULL THEN 'Com profile' ELSE 'SEM PROFILE' END AS tem_profile,
  COALESCE(p.is_admin::TEXT, 'N/A') AS is_admin
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- Passo 4: Verificar usuários sem profile
SELECT 
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL;

