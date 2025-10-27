-- =====================================================================
-- DIAGNÓSTICO COMPLETO DO SISTEMA
-- =====================================================================
-- Verifica tudo que pode estar causando o carregamento infinito
-- =====================================================================

DO $$
DECLARE
  v_count BIGINT;
  v_exists BOOLEAN;
  v_funcoes_faltando TEXT[] := '{}';
  r RECORD;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'DIAGNÓSTICO COMPLETO DO SISTEMA';
  RAISE NOTICE '=============================================================';
  
  -- =====================================================================
  -- 1. VERIFICAR MATERIALIZED VIEW
  -- =====================================================================
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣  VERIFICANDO MATERIALIZED VIEW';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  SELECT COUNT(*) INTO v_count FROM pg_matviews WHERE matviewname = 'mv_aderencia_agregada';
  
  IF v_count > 0 THEN
    RAISE NOTICE '✓ mv_aderencia_agregada existe';
    
    -- Verificar se tem dados
    SELECT COUNT(*) INTO v_count FROM mv_aderencia_agregada;
    RAISE NOTICE '  Registros: %', v_count;
    
    IF v_count = 0 THEN
      RAISE NOTICE '  ⚠ MV ESTÁ VAZIA! Execute ATUALIZAR_MV_SALVADOR.sql';
    END IF;
  ELSE
    RAISE NOTICE '❌ mv_aderencia_agregada NÃO EXISTE!';
  END IF;
  
  -- =====================================================================
  -- 2. VERIFICAR TABELA evolucao_agregada
  -- =====================================================================
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  VERIFICANDO TABELA EVOLUÇÃO';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  SELECT COUNT(*) INTO v_count 
  FROM information_schema.tables 
  WHERE table_name = 'evolucao_agregada';
  
  IF v_count > 0 THEN
    RAISE NOTICE '✓ evolucao_agregada existe';
    
    SELECT COUNT(*) INTO v_count FROM evolucao_agregada;
    RAISE NOTICE '  Registros: %', v_count;
    
    IF v_count = 0 THEN
      RAISE NOTICE '  ⚠ TABELA VAZIA! Execute SOLUCAO_EVOLUCAO_100_PORCENTO.sql';
    END IF;
  ELSE
    RAISE NOTICE '❌ evolucao_agregada NÃO EXISTE!';
    RAISE NOTICE '   Execute SOLUCAO_EVOLUCAO_100_PORCENTO.sql';
  END IF;
  
  -- =====================================================================
  -- 3. VERIFICAR FUNÇÕES RPC CRÍTICAS
  -- =====================================================================
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  VERIFICANDO FUNÇÕES RPC';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  -- Funções essenciais que o sistema precisa
  FOR r IN (
    SELECT unnest(ARRAY[
      'get_current_user_profile',
      'dashboard_resumo',
      'listar_todas_semanas',
      'listar_entregadores',
      'listar_valores_entregadores',
      'listar_usuarios_online',
      'calcular_utr',
      'listar_evolucao_mensal',
      'listar_evolucao_semanal',
      'listar_anos_disponiveis'
    ]) AS funcao
  )
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM pg_proc 
      WHERE proname = r.funcao
    ) INTO v_exists;
    
    IF v_exists THEN
      RAISE NOTICE '  ✓ %', r.funcao;
    ELSE
      RAISE NOTICE '  ❌ % - FALTANDO!', r.funcao;
      v_funcoes_faltando := array_append(v_funcoes_faltando, r.funcao);
    END IF;
  END LOOP;
  
  -- =====================================================================
  -- 4. VERIFICAR PERMISSÕES (GRANT EXECUTE)
  -- =====================================================================
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  VERIFICANDO PERMISSÕES';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  SELECT COUNT(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'dashboard_resumo',
      'listar_todas_semanas',
      'get_current_user_profile'
    );
  
  RAISE NOTICE '  Funções principais encontradas: %', v_count;
  
  -- =====================================================================
  -- 5. VERIFICAR TABELAS ESSENCIAIS
  -- =====================================================================
  RAISE NOTICE '';
  RAISE NOTICE '5️⃣  VERIFICANDO TABELAS';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  -- user_profiles
  SELECT COUNT(*) INTO v_count FROM user_profiles;
  RAISE NOTICE '  ✓ user_profiles: % registros', v_count;
  
  -- dados_corridas
  SELECT COUNT(*) INTO v_count FROM dados_corridas;
  RAISE NOTICE '  ✓ dados_corridas: % registros', v_count;
  
  -- =====================================================================
  -- RESUMO E AÇÕES NECESSÁRIAS
  -- =====================================================================
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'RESUMO DO DIAGNÓSTICO';
  RAISE NOTICE '=============================================================';
  
  IF array_length(v_funcoes_faltando, 1) > 0 THEN
    RAISE NOTICE '❌ FUNÇÕES FALTANDO: %', v_funcoes_faltando;
    RAISE NOTICE '';
    RAISE NOTICE '📋 AÇÕES NECESSÁRIAS:';
    
    IF 'get_current_user_profile' = ANY(v_funcoes_faltando) THEN
      RAISE NOTICE '  1. Execute: CRIAR_FUNCAO_USER_PROFILE.sql';
    END IF;
    
    IF 'listar_evolucao_mensal' = ANY(v_funcoes_faltando) OR 
       'listar_evolucao_semanal' = ANY(v_funcoes_faltando) THEN
      RAISE NOTICE '  2. Execute: SOLUCAO_EVOLUCAO_100_PORCENTO.sql';
    END IF;
  ELSE
    RAISE NOTICE '✅ TODAS AS FUNÇÕES EXISTEM';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  
END $$;

