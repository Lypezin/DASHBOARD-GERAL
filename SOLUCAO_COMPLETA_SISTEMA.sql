-- =====================================================================
-- SOLUÇÃO COMPLETA DO SISTEMA
-- =====================================================================
-- Recria tudo do zero de forma funcional
-- Execute TUDO de uma vez
-- =====================================================================

-- Configurações
SET maintenance_work_mem = '512MB';
SET work_mem = '256MB';

DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'RECONSTRUINDO SISTEMA';
  RAISE NOTICE '=============================================================';
END $$;

-- =====================================================================
-- 1. APROVAR TODOS OS USUÁRIOS
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣  APROVANDO USUÁRIOS';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  UPDATE user_profiles SET is_approved = true;
  
  RAISE NOTICE '✓ Usuários aprovados';
END $$;

-- =====================================================================
-- 2. CRIAR FUNÇÃO get_current_user_profile
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  CRIANDO FUNÇÃO get_current_user_profile';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

DROP FUNCTION IF EXISTS public.get_current_user_profile();

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_id UUID;
  v_profile JSONB;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'is_admin', COALESCE(p.is_admin, false),
    'is_approved', COALESCE(p.is_approved, true),
    'assigned_pracas', COALESCE(p.assigned_pracas, ARRAY[]::TEXT[])
  )
  INTO v_profile
  FROM user_profiles p
  WHERE p.id = v_user_id;
  
  RETURN COALESCE(v_profile, jsonb_build_object(
    'id', v_user_id,
    'email', 'unknown',
    'full_name', NULL,
    'is_admin', false,
    'is_approved', true,
    'assigned_pracas', ARRAY[]::TEXT[]
  ));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated, anon;

-- =====================================================================
-- 3. CRIAR FUNÇÃO dashboard_resumo SIMPLES (usa dados_corridas direto)
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  CRIANDO dashboard_resumo';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

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
SET work_mem = '256MB'
AS $$
DECLARE
  v_result JSONB;
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_assigned_pracas TEXT[];
  v_base_query TEXT;
BEGIN
  -- Obter informações do usuário
  v_user_id := auth.uid();
  
  SELECT is_admin, assigned_pracas INTO v_is_admin, v_assigned_pracas
  FROM user_profiles
  WHERE id = v_user_id;
  
  -- Query base com filtros
  v_base_query := 'FROM dados_corridas WHERE 1=1 ';
  
  IF p_ano IS NOT NULL THEN
    v_base_query := v_base_query || ' AND ano_iso = ' || p_ano;
  END IF;
  
  IF p_semana IS NOT NULL THEN
    v_base_query := v_base_query || ' AND semana_numero = ' || p_semana;
  END IF;
  
  IF p_praca IS NOT NULL THEN
    v_base_query := v_base_query || ' AND praca = ' || quote_literal(p_praca);
  END IF;
  
  IF p_sub_praca IS NOT NULL THEN
    v_base_query := v_base_query || ' AND sub_praca = ' || quote_literal(p_sub_praca);
  END IF;
  
  -- Filtro de permissões
  IF NOT v_is_admin AND v_assigned_pracas IS NOT NULL AND array_length(v_assigned_pracas, 1) > 0 THEN
    v_base_query := v_base_query || ' AND praca = ANY(' || quote_literal(v_assigned_pracas::TEXT) || '::TEXT[])';
  END IF;
  
  -- Montar resultado
  SELECT jsonb_build_object(
    'totais', (
      SELECT jsonb_build_object(
        'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_completadas), 0),
        'corridas_aceitas', COALESCE(SUM(numero_de_corridas_completadas), 0),
        'corridas_rejeitadas', 0,
        'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
      )
      FROM dados_corridas
      WHERE (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_numero = p_semana)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (v_is_admin OR praca = ANY(v_assigned_pracas))
    ),
    'semanal', (
      SELECT COALESCE(jsonb_agg(dados ORDER BY semana DESC), '[]'::jsonb)
      FROM (
        SELECT 
          ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana,
          ROUND(SUM(tempo_disponivel_absoluto_segundos) / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(tempo_em_corrida_absoluto_segundos) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(
            CASE WHEN SUM(tempo_disponivel_absoluto_segundos) > 0 
            THEN (SUM(tempo_em_corrida_absoluto_segundos)::NUMERIC / SUM(tempo_disponivel_absoluto_segundos)::NUMERIC * 100)
            ELSE 0 END, 1
          ) AS aderencia_percentual
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
          AND ano_iso IS NOT NULL
          AND semana_numero IS NOT NULL
        GROUP BY ano_iso, semana_numero
        ORDER BY ano_iso DESC, semana_numero DESC
        LIMIT 10
      ) dados
    ),
    'dia', '[]'::jsonb,
    'turno', '[]'::jsonb,
    'sub_praca', '[]'::jsonb,
    'origem', '[]'::jsonb,
    'dimensoes', jsonb_build_object(
      'anos', (
        SELECT COALESCE(jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC), '[]'::jsonb) 
        FROM dados_corridas 
        WHERE ano_iso IS NOT NULL 
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
      ),
      'semanas', (
        SELECT COALESCE(jsonb_agg(DISTINCT ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') ORDER BY ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') DESC), '[]'::jsonb) 
        FROM dados_corridas 
        WHERE ano_iso IS NOT NULL 
          AND semana_numero IS NOT NULL
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
      ),
      'pracas', (
        SELECT COALESCE(jsonb_agg(DISTINCT praca ORDER BY praca), '[]'::jsonb) 
        FROM dados_corridas 
        WHERE (v_is_admin OR praca = ANY(v_assigned_pracas))
      ),
      'sub_pracas', (
        SELECT COALESCE(jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca), '[]'::jsonb) 
        FROM dados_corridas 
        WHERE sub_praca IS NOT NULL 
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
      ),
      'origens', '[]'::jsonb
    )
  ) INTO v_result;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro em dashboard_resumo: %', SQLERRM;
    RETURN jsonb_build_object(
      'totais', jsonb_build_object('corridas_ofertadas', 0, 'corridas_aceitas', 0, 'corridas_rejeitadas', 0, 'corridas_completadas', 0),
      'semanal', '[]'::jsonb,
      'dia', '[]'::jsonb,
      'turno', '[]'::jsonb,
      'sub_praca', '[]'::jsonb,
      'origem', '[]'::jsonb,
      'dimensoes', jsonb_build_object('anos', '[]'::jsonb, 'semanas', '[]'::jsonb, 'pracas', '[]'::jsonb, 'sub_pracas', '[]'::jsonb, 'origens', '[]'::jsonb),
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated, anon;

-- =====================================================================
-- 4. CRIAR FUNÇÃO listar_todas_semanas
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  CRIANDO listar_todas_semanas';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

DROP FUNCTION IF EXISTS public.listar_todas_semanas();

CREATE OR REPLACE FUNCTION public.listar_todas_semanas()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    jsonb_agg(DISTINCT ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') ORDER BY ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') DESC),
    '[]'::JSONB
  )
  FROM dados_corridas
  WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.listar_todas_semanas() TO authenticated, anon;

-- =====================================================================
-- 5. VERIFICAR RESULTADO
-- =====================================================================
DO $$
DECLARE
  v_count_dados BIGINT;
  v_count_users BIGINT;
  v_pracas TEXT[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'VERIFICAÇÃO FINAL';
  RAISE NOTICE '=============================================================';
  
  SELECT COUNT(*) INTO v_count_dados FROM dados_corridas;
  RAISE NOTICE '✓ dados_corridas: % registros', v_count_dados;
  
  SELECT COUNT(*) INTO v_count_users FROM user_profiles WHERE is_approved = true;
  RAISE NOTICE '✓ Usuários aprovados: %', v_count_users;
  
  SELECT array_agg(DISTINCT praca) INTO v_pracas FROM dados_corridas LIMIT 5;
  RAISE NOTICE '✓ Praças disponíveis: %', v_pracas;
  
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '✅ SISTEMA PRONTO!';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Recarregue o dashboard e faça login';
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
END $$;

