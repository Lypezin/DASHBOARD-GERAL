-- Diagnostic queries to check master user access issues
-- Run these queries one by one in Supabase SQL Editor to diagnose the issue

-- 1. Check your master user profile
SELECT 
  id,
  email,
  full_name,
  role,
  is_admin,
  is_approved,
  organization_id,
  assigned_pracas
FROM public.user_profiles
WHERE role = 'master';

-- 2. Check what organization_ids exist in dados_corridas
SELECT DISTINCT organization_id, COUNT(*) as count
FROM public.dados_corridas
GROUP BY organization_id
ORDER BY count DESC
LIMIT 10;

-- 3. Check if there's data without organization filtering
SELECT COUNT(*) as total_corridas
FROM public.dados_corridas;

-- 4. Test get_current_user_profile function (should return your user as master with is_admin: true)
SELECT public.get_current_user_profile();

-- 5. Check existing RLS policies on dados_corridas
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
WHERE tablename = 'dados_corridas'
ORDER BY policyname;

-- 6. Check existing RLS policies on user_profiles
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
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 7. Check if dashboard_resumo function exists and its definition
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%dashboard%'
ORDER BY routine_name;

-- 8. Check all RPC functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
