-- =====================================================================
-- OTIMIZAR SEM RECRIAR (Mantém dados existentes)
-- =====================================================================
-- Adiciona índices e otimiza funções sem perder dados
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'OTIMIZANDO SEM RECRIAR DADOS';
  RAISE NOTICE '=============================================================';
END $$;

-- =====================================================================
-- 1. VERIFICAR SE MV EXISTE
-- =====================================================================
DO $$
DECLARE
  v_exists BOOLEAN;
  v_count BIGINT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣  VERIFICANDO MV';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  SELECT EXISTS(
    SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_aderencia_agregada'
  ) INTO v_exists;
  
  IF v_exists THEN
    SELECT COUNT(*) INTO v_count FROM mv_aderencia_agregada;
    RAISE NOTICE '✓ MV existe com % registros', v_count;
  ELSE
    RAISE NOTICE '❌ MV NÃO EXISTE! Execute CRIAR_E_POPULAR_MV.sql primeiro';
  END IF;
END $$;

-- =====================================================================
-- 2. CRIAR ÍNDICES (se não existirem)
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  CRIANDO ÍNDICES';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

-- Índices em dados_corridas
CREATE INDEX IF NOT EXISTS idx_dados_corridas_praca_semana 
ON dados_corridas (praca, ano_iso, semana_numero);

CREATE INDEX IF NOT EXISTS idx_dados_corridas_data 
ON dados_corridas (data_do_periodo);

CREATE INDEX IF NOT EXISTS idx_dados_corridas_pessoa 
ON dados_corridas (pessoa_entregadora);

-- Índices em MV (se existir)
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_aderencia_agregada') THEN
    -- Verificar quais colunas existem
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'mv_aderencia_agregada' AND column_name = 'praca') THEN
      CREATE INDEX IF NOT EXISTS idx_mv_praca ON mv_aderencia_agregada (praca);
    END IF;
    
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'mv_aderencia_agregada' AND column_name = 'data_do_periodo') THEN
      CREATE INDEX IF NOT EXISTS idx_mv_data ON mv_aderencia_agregada (data_do_periodo);
    END IF;
    
    RAISE NOTICE '✓ Índices da MV criados';
  END IF;
END $$;

-- =====================================================================
-- 3. ATUALIZAR ESTATÍSTICAS
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  ATUALIZANDO ESTATÍSTICAS';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

ANALYZE dados_corridas;
ANALYZE user_profiles;

DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_aderencia_agregada') THEN
    ANALYZE mv_aderencia_agregada;
    RAISE NOTICE '✓ Estatísticas atualizadas';
  END IF;
END $$;

-- =====================================================================
-- 4. OTIMIZAR FUNÇÕES RPC
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  OTIMIZANDO FUNÇÕES';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

-- Função get_current_user_profile
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
    'is_admin', COALESCE(p.is_admin, false),
    'assigned_pracas', COALESCE(p.assigned_pracas, ARRAY[]::TEXT[]),
    'status', COALESCE(p.status, 'pending')
  )
  INTO v_profile
  FROM user_profiles p
  WHERE p.id = v_user_id;
  
  RETURN COALESCE(v_profile, jsonb_build_object(
    'id', v_user_id,
    'email', 'unknown',
    'is_admin', false,
    'assigned_pracas', ARRAY[]::TEXT[],
    'status', 'pending'
  ));
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'id', v_user_id,
      'email', 'error',
      'is_admin', false,
      'assigned_pracas', ARRAY[]::TEXT[],
      'status', 'error'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated, anon;

-- =====================================================================
-- 5. VERIFICAR FUNÇÃO listar_todas_semanas
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'listar_todas_semanas') THEN
    RAISE NOTICE '⚠ Função listar_todas_semanas não existe, criando...';
    
    CREATE OR REPLACE FUNCTION public.listar_todas_semanas()
    RETURNS JSONB
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    AS $func$
      SELECT COALESCE(
        jsonb_agg(DISTINCT ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') ORDER BY ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') DESC),
        '[]'::JSONB
      )
      FROM dados_corridas
      WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL;
    $func$;
    
    GRANT EXECUTE ON FUNCTION public.listar_todas_semanas() TO authenticated, anon;
  END IF;
END $$;

-- =====================================================================
-- RESUMO
-- =====================================================================
DO $$
DECLARE
  v_count_mv BIGINT := 0;
  v_count_dados BIGINT;
  v_count_evolucao BIGINT := 0;
  v_mv_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'RESUMO DA OTIMIZAÇÃO';
  RAISE NOTICE '=============================================================';
  
  -- Verificar MV
  SELECT EXISTS(SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_aderencia_agregada') INTO v_mv_exists;
  
  IF v_mv_exists THEN
    SELECT COUNT(*) INTO v_count_mv FROM mv_aderencia_agregada;
    RAISE NOTICE '✓ mv_aderencia_agregada: % registros', v_count_mv;
  ELSE
    RAISE NOTICE '❌ mv_aderencia_agregada NÃO EXISTE';
  END IF;
  
  SELECT COUNT(*) INTO v_count_dados FROM dados_corridas;
  RAISE NOTICE '✓ dados_corridas: % registros', v_count_dados;
  
  IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'evolucao_agregada') THEN
    SELECT COUNT(*) INTO v_count_evolucao FROM evolucao_agregada;
    RAISE NOTICE '✓ evolucao_agregada: % registros', v_count_evolucao;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  
  IF NOT v_mv_exists THEN
    RAISE NOTICE '❌ MV NÃO EXISTE!';
    RAISE NOTICE '   Execute: CRIAR_E_POPULAR_MV.sql';
  ELSIF v_count_mv = 0 THEN
    RAISE NOTICE '⚠ MV VAZIA!';
    RAISE NOTICE '   Execute: ATUALIZAR_MV_SALVADOR.sql';
  ELSE
    RAISE NOTICE '✅ SISTEMA OTIMIZADO!';
    RAISE NOTICE '   Teste o dashboard agora';
  END IF;
  
  RAISE NOTICE '=============================================================';
END $$;

