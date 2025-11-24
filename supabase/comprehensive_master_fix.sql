-- COMPREHENSIVE FIX FOR MASTER ROLE DATA ACCESS (Fixed)
-- Execute this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: DIAGNOSTICS (Check what's wrong)
-- ============================================

-- Check master user profile
DO $$
DECLARE
  v_master_count INTEGER;
  v_master_org UUID;
  v_master_approved BOOLEAN;
  v_master_email TEXT;
BEGIN
  SELECT COUNT(*) INTO v_master_count
  FROM public.user_profiles
  WHERE role = 'master';
  
  -- Get first master user details
  SELECT organization_id, is_approved, email
  INTO v_master_org, v_master_approved, v_master_email
  FROM public.user_profiles
  WHERE role = 'master'
  LIMIT 1;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'DIAGNOSTICS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Master users found: %', v_master_count;
  RAISE NOTICE 'Master email: %', COALESCE(v_master_email, 'NONE');
  RAISE NOTICE 'Master organization_id: %', COALESCE(v_master_org::TEXT, 'NULL');
  RAISE NOTICE 'Master is_approved: %', COALESCE(v_master_approved::TEXT, 'NULL');
  
  IF v_master_count = 0 THEN
    RAISE NOTICE 'WARNING: No master user found!';
  END IF;
  
  IF v_master_org IS NULL THEN
    RAISE NOTICE 'WARNING: Master user has NULL organization_id - FIXING NOW...';
  END IF;
END $$;

-- Check if there's data in dados_corridas
DO $$
DECLARE
  v_total_records BIGINT;
  v_orgs_with_data TEXT;
  v_null_org_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total_records FROM public.dados_corridas;
  
  SELECT string_agg(DISTINCT organization_id::TEXT, ', ')
  INTO v_orgs_with_data
  FROM public.dados_corridas
  WHERE organization_id IS NOT NULL
  LIMIT 10;
  
  SELECT COUNT(*) INTO v_null_org_count
  FROM public.dados_corridas
  WHERE organization_id IS NULL;
  
  RAISE NOTICE 'Total records in dados_corridas: %', v_total_records;
  RAISE NOTICE 'Records with NULL organization_id: %', v_null_org_count;
  RAISE NOTICE 'Organization IDs with data: %', COALESCE(v_orgs_with_data, 'ALL NULL');
END $$;

-- ============================================
-- STEP 2: FIX MASTER USER PROFILE
-- ============================================

-- Update master user to have default organization if NULL
UPDATE public.user_profiles
SET 
  organization_id = '00000000-0000-0000-0000-000000000001',
  is_approved = true,
  is_admin = true
WHERE role = 'master' 
  AND (organization_id IS NULL OR is_approved IS NOT TRUE OR is_admin IS NOT TRUE);

-- Ensure all admin/master users are marked as admin
UPDATE public.user_profiles
SET is_admin = true
WHERE role IN ('master', 'admin')
  AND is_admin IS NOT TRUE;

-- Show result
DO $$
DECLARE
  v_updated_org UUID;
  v_updated_email TEXT;
BEGIN
  SELECT organization_id, email
  INTO v_updated_org, v_updated_email
  FROM public.user_profiles
  WHERE role = 'master'
  LIMIT 1;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'MASTER USER UPDATED';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Master email: %', v_updated_email;
  RAISE NOTICE 'Master organization_id: %', v_updated_org;
END $$;

-- ============================================
-- STEP 3: UPDATE RLS POLICIES ON DADOS_CORRIDAS
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only view their organization data" ON public.dados_corridas;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.dados_corridas;
DROP POLICY IF EXISTS "Admin and Master see all, others see org data" ON public.dados_corridas;

-- Create comprehensive policy: Admins/Masters see all, others see their org
CREATE POLICY "Admin and Master see all, others see org data"
ON public.dados_corridas
FOR SELECT
USING (
  -- Allow if user is admin or master
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'master')
  )
  OR
  -- Or if the data belongs to user's organization
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND organization_id = dados_corridas.organization_id
  )
  OR
  -- Or if organization_id is NULL (legacy data)
  organization_id IS NULL
);

RAISE NOTICE 'RLS policy created: Admin and Master see all data';

-- ============================================
-- STEP 4: UPDATE RLS POLICIES ON USER_PROFILES
-- ============================================

-- Ensure the user_profiles policy allows master/admin to see all
DROP POLICY IF EXISTS "Admins and Masters can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

CREATE POLICY "Admins and Masters can view all profiles"
ON public.user_profiles
FOR SELECT
USING (
  -- Admins and masters can see all
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
    AND up.role IN ('admin', 'master')
  )
  OR
  -- Users can see their own profile
  id = auth.uid()
);

RAISE NOTICE 'RLS policy created: Master/Admin can view all user profiles';

-- ============================================
-- STEP 5: ENSURE INSERT/UPDATE POLICIES EXIST
-- ============================================

-- Allow authenticated users to insert data (for upload functionality)
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.dados_corridas;
CREATE POLICY "Authenticated users can insert"
ON public.dados_corridas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- STEP 6: GRANT ACCESS TO MATERIALIZED VIEWS
-- ============================================

-- Ensure authenticated users can read materialized views
GRANT SELECT ON public.mv_aderencia_agregada TO authenticated;

-- Refresh materialized view if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_matviews 
    WHERE schemaname = 'public' 
    AND matviewname = 'mv_aderencia_agregada'
  ) THEN
    REFRESH MATERIALIZED VIEW public.mv_aderencia_agregada;
    RAISE NOTICE 'Materialized view mv_aderencia_agregada refreshed';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not refresh materialized view: %', SQLERRM;
END $$;

-- ============================================
-- STEP 7: VERIFICATION
-- ============================================

-- Verify the fix
DO $$
DECLARE
  v_master_exists BOOLEAN;
  v_data_count BIGINT;
  v_master_org UUID;
  v_master_email TEXT;
BEGIN
  -- Check if there's a master user
  SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE role = 'master')
  INTO v_master_exists;
  
  IF NOT v_master_exists THEN
    RAISE NOTICE 'ERROR: No master user found. Please create a master user first.';
    RETURN;
  END IF;
  
  -- Get master details
  SELECT organization_id, email
  INTO v_master_org, v_master_email
  FROM public.user_profiles
  WHERE role = 'master'
  LIMIT 1;
  
  -- Check if dados_corridas has data
  SELECT COUNT(*) INTO v_data_count FROM public.dados_corridas;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'FINAL VERIFICATION';
  RAISE NOTICE '==============================================';
  
  IF v_data_count = 0 THEN
    RAISE NOTICE 'WARNING: No data in dados_corridas table!';
    RAISE NOTICE 'You need to upload data first.';
  ELSE
    RAISE NOTICE 'SUCCESS: Found % records in dados_corridas', v_data_count;
  END IF;
  
  RAISE NOTICE 'Master user: %', v_master_email;
  RAISE NOTICE 'Master organization_id: %', v_master_org;
  
  -- Final status
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'FIX APPLIED SUCCESSFULLY!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Log out of your application';
  RAISE NOTICE '2. Log back in with your master account';
  RAISE NOTICE '3. The dashboard should now show all data';
  RAISE NOTICE '==============================================';
END $$;
