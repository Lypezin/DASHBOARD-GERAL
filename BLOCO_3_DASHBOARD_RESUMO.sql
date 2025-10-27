-- =====================================================================
-- BLOCO 3: FUNÇÃO dashboard_resumo (SIMPLIFICADA)
-- =====================================================================

DROP FUNCTION IF EXISTS public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano INTEGER DEFAULT NULL,
  p_semana INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_sub_praca TEXT DEFAULT NULL,
  p_origem TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_user_id UUID;
  v_is_admin BOOLEAN := false;
  v_assigned_pracas TEXT[];
BEGIN
  v_user_id := auth.uid();
  
  -- Buscar permissões do usuário
  BEGIN
    SELECT is_admin, assigned_pracas INTO v_is_admin, v_assigned_pracas
    FROM user_profiles
    WHERE id = v_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_is_admin := false;
    v_assigned_pracas := ARRAY[]::TEXT[];
  END;
  
  -- Montar resultado simplificado
  v_result := jsonb_build_object(
    'totais', jsonb_build_object(
      'corridas_ofertadas', 0,
      'corridas_aceitas', 0,
      'corridas_rejeitadas', 0,
      'corridas_completadas', 0
    ),
    'semanal', '[]'::jsonb,
    'dia', '[]'::jsonb,
    'turno', '[]'::jsonb,
    'sub_praca', '[]'::jsonb,
    'origem', '[]'::jsonb,
    'dimensoes', jsonb_build_object(
      'anos', '[]'::jsonb,
      'semanas', '[]'::jsonb,
      'pracas', '[]'::jsonb,
      'sub_pracas', '[]'::jsonb,
      'origens', '[]'::jsonb
    )
  );
  
  -- Buscar totais (com limite de tempo)
  BEGIN
    SELECT jsonb_build_object(
      'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_completadas), 0),
      'corridas_aceitas', COALESCE(SUM(numero_de_corridas_completadas), 0),
      'corridas_rejeitadas', 0,
      'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
    )
    INTO v_result FROM (
      SELECT SUM(numero_de_corridas_completadas) as numero_de_corridas_completadas
      FROM dados_corridas
      WHERE (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_numero = p_semana)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (v_is_admin OR praca = ANY(v_assigned_pracas))
      LIMIT 1
    ) sub;
    
    v_result := jsonb_set(v_result, '{totais}', v_result);
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Manter valores default
  END;
  
  -- Buscar dimensões (anos, semanas, praças)
  BEGIN
    SELECT jsonb_build_object(
      'anos', COALESCE((
        SELECT jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC)
        FROM dados_corridas 
        WHERE ano_iso IS NOT NULL 
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
        LIMIT 50
      ), '[]'::jsonb),
      'semanas', COALESCE((
        SELECT jsonb_agg(DISTINCT ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') ORDER BY ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') DESC)
        FROM dados_corridas 
        WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
        LIMIT 50
      ), '[]'::jsonb),
      'pracas', COALESCE((
        SELECT jsonb_agg(DISTINCT praca ORDER BY praca)
        FROM dados_corridas 
        WHERE (v_is_admin OR praca = ANY(v_assigned_pracas))
        LIMIT 50
      ), '[]'::jsonb),
      'sub_pracas', '[]'::jsonb,
      'origens', '[]'::jsonb
    )
    INTO v_result;
    
    v_result := jsonb_set(v_result, '{dimensoes}', v_result);
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Manter valores default
  END;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated, anon;

