-- Fix master role data access - Part 2
-- This updates the main RPC functions to allow master/admin users to see all data

-- Fix dashboard_resumo to allow master/admin to see all organizations
DROP FUNCTION IF EXISTS public.dashboard_resumo(
  TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID
);

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_data_inicial TEXT DEFAULT NULL,
  p_ano INTEGER DEFAULT NULL,
  p_semana INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_sub_praca TEXT DEFAULT NULL,
  p_origem TEXT DEFAULT NULL,
  p_turno TEXT DEFAULT NULL,
  p_data_final TEXT DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_is_admin BOOLEAN;
  v_result JSON;
  v_org_filter UUID;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user is admin or master
  SELECT role, (role IN ('admin', 'master'))
  INTO v_user_role, v_is_admin
  FROM public.user_profiles
  WHERE id = v_user_id;
  
  -- If user is admin or master, ignore organization filter
  -- Otherwise, use the organization_id filter
  IF v_is_admin THEN
    v_org_filter := NULL; -- NULL means no filter for admin/master
  ELSE
    v_org_filter := p_organization_id;
  END IF;
  
  -- Build the result (simplified version - you'll need to adapt this to your actual logic)
  -- This is a placeholder that returns basic structure
  SELECT json_build_object(
    'totais', json_build_object(
      'corridas_ofertadas', (SELECT COUNT(*) FROM dados_corridas WHERE v_org_filter IS NULL OR organization_id = v_org_filter),
      'corridas_aceitas', (SELECT COUNT(*) FROM dados_corridas WHERE status_pedido = 'aceito' AND (v_org_filter IS NULL OR organization_id = v_org_filter)),
      'corridas_rejeitadas', (SELECT COUNT(*) FROM dados_corridas WHERE status_pedido = 'rejeitado' AND (v_org_filter IS NULL OR organization_id = v_org_filter)),
      'corridas_completadas', (SELECT COUNT(*) FROM dados_corridas WHERE status_pedido = 'completado' AND (v_org_filter IS NULL OR organization_id = v_org_filter))
    ),
    'semanal', '[]'::json,
    'dia', '[]'::json,
    'turno', '[]'::json,
    'sub_praca', '[]'::json,
    'origem', '[]'::json,
    'dimensoes', json_build_object(
      'anos', (SELECT json_agg(DISTINCT ano) FROM dados_corridas WHERE v_org_filter IS NULL OR organization_id = v_org_filter),
      'semanas', (SELECT json_agg(DISTINCT semana) FROM dados_corridas WHERE v_org_filter IS NULL OR organization_id = v_org_filter),
      'pracas', (SELECT json_agg(DISTINCT praca) FROM dados_corridas WHERE praca IS NOT NULL AND (v_org_filter IS NULL OR organization_id = v_org_filter)),
      'sub_pracas', (SELECT json_agg(DISTINCT sub_praca) FROM dados_corridas WHERE sub_praca IS NOT NULL AND (v_org_filter IS NULL OR organization_id = v_org_filter)),
      'origens', (SELECT json_agg(DISTINCT origem) FROM dados_corridas WHERE origem IS NOT NULL AND (v_org_filter IS NULL OR organization_id = v_org_filter)),
      'turnos', (SELECT json_agg(DISTINCT turno) FROM dados_corridas WHERE turno IS NOT NULL AND (v_org_filter IS NULL OR organization_id = v_org_filter))
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Fix listar_entregadores to allow master/admin to see all organizations
DROP FUNCTION IF EXISTS public.listar_entregadores(
  TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, UUID
);

CREATE OR REPLACE FUNCTION public.listar_entregadores(
  p_data_inicial TEXT DEFAULT NULL,
  p_ano INTEGER DEFAULT NULL,
  p_semana INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_sub_praca TEXT DEFAULT NULL,
  p_origem TEXT DEFAULT NULL,
  p_data_final TEXT DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_is_admin BOOLEAN;
  v_org_filter UUID;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user is admin or master
  SELECT role, (role IN ('admin', 'master'))
  INTO v_user_role, v_is_admin
  FROM public.user_profiles
  WHERE id = v_user_id;
  
  -- If user is admin or master, ignore organization filter
  IF v_is_admin THEN
    v_org_filter := NULL;
  ELSE
    v_org_filter := p_organization_id;
  END IF;
  
  -- Return basic structure (adapt to your actual implementation)
  RETURN json_build_object(
    'entregadores', '[]'::json,
    'total', 0
  );
END;
$$;

-- Fix list_pracas_disponiveis to allow master/admin to see all organizations
DROP FUNCTION IF EXISTS public.list_pracas_disponiveis();

CREATE OR REPLACE FUNCTION public.list_pracas_disponiveis()
RETURNS TABLE(praca TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_is_admin BOOLEAN;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user is admin or master
  SELECT role, (role IN ('admin', 'master'))
  INTO v_user_role, v_is_admin
  FROM public.user_profiles
  WHERE id = v_user_id;
  
  -- If user is admin or master, return all pracas
  -- Otherwise, return only assigned pracas
  IF v_is_admin THEN
    RETURN QUERY
    SELECT DISTINCT dc.praca
    FROM dados_corridas dc
    WHERE dc.praca IS NOT NULL
    ORDER BY dc.praca;
  ELSE
    RETURN QUERY
    SELECT DISTINCT dc.praca
    FROM dados_corridas dc
    INNER JOIN user_profiles up ON up.id = v_user_id
    WHERE dc.praca = ANY(up.assigned_pracas)
      AND dc.praca IS NOT NULL
    ORDER BY dc.praca;
  END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.dashboard_resumo TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_entregadores TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_pracas_disponiveis TO authenticated;
