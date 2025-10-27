-- =====================================================================
-- BLOCO 1: Criar função listar_todas_semanas
-- =====================================================================
-- Execute este bloco primeiro
-- =====================================================================

DROP FUNCTION IF EXISTS public.listar_todas_semanas();

CREATE OR REPLACE FUNCTION public.listar_todas_semanas()
RETURNS INTEGER[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := true;
  v_assigned_pracas TEXT[] := ARRAY[]::TEXT[];
  v_semanas INTEGER[];
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    BEGIN
      SELECT COALESCE(is_admin, true), COALESCE(assigned_pracas, ARRAY[]::TEXT[])
      INTO v_is_admin, v_assigned_pracas
      FROM user_profiles WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  
  SELECT ARRAY_AGG(DISTINCT semana_numero ORDER BY semana_numero DESC)
  INTO v_semanas
  FROM dados_corridas
  WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND semana_numero IS NOT NULL;
  
  RETURN COALESCE(v_semanas, ARRAY[]::INTEGER[]);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_todas_semanas() TO authenticated, anon;

-- =====================================================================
-- ✅ CONCLUÍDO: Função listar_todas_semanas criada
-- =====================================================================

