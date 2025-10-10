-- =====================================================
-- PARTE 1: APENAS LIMPAR TUDO
-- =====================================================
-- Execute APENAS esta parte primeiro
-- Depois execute a PARTE_2_CRIAR_TUDO.sql

-- Dropar a tabela completamente
DROP TABLE IF EXISTS public.user_activities CASCADE;

-- Aguardar um momento
SELECT pg_sleep(1);

-- Remover TODAS as funções registrar_atividade
DO $$ 
DECLARE
    r RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE '🔍 Procurando funções registrar_atividade...';
    
    FOR r IN 
        SELECT oid::regprocedure::text as func_signature
        FROM pg_proc 
        WHERE proname = 'registrar_atividade' 
        AND pronamespace = 'public'::regnamespace
    LOOP
        v_count := v_count + 1;
        RAISE NOTICE '  Removendo: %', r.func_signature;
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
    
    IF v_count = 0 THEN
        RAISE NOTICE '  ✓ Nenhuma função encontrada';
    ELSE
        RAISE NOTICE '  ✓ Removidas % versões', v_count;
    END IF;
END $$;

-- Aguardar um momento
SELECT pg_sleep(1);

-- Remover TODAS as funções listar_usuarios_online
DO $$ 
DECLARE
    r RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE '🔍 Procurando funções listar_usuarios_online...';
    
    FOR r IN 
        SELECT oid::regprocedure::text as func_signature
        FROM pg_proc 
        WHERE proname = 'listar_usuarios_online' 
        AND pronamespace = 'public'::regnamespace
    LOOP
        v_count := v_count + 1;
        RAISE NOTICE '  Removendo: %', r.func_signature;
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
    
    IF v_count = 0 THEN
        RAISE NOTICE '  ✓ Nenhuma função encontrada';
    ELSE
        RAISE NOTICE '  ✓ Removidas % versões', v_count;
    END IF;
END $$;

-- Aguardar um momento
SELECT pg_sleep(1);

-- Remover TODAS as funções historico_atividades_usuario
DO $$ 
DECLARE
    r RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE '🔍 Procurando funções historico_atividades_usuario...';
    
    FOR r IN 
        SELECT oid::regprocedure::text as func_signature
        FROM pg_proc 
        WHERE proname = 'historico_atividades_usuario' 
        AND pronamespace = 'public'::regnamespace
    LOOP
        v_count := v_count + 1;
        RAISE NOTICE '  Removendo: %', r.func_signature;
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
    
    IF v_count = 0 THEN
        RAISE NOTICE '  ✓ Nenhuma função encontrada';
    ELSE
        RAISE NOTICE '  ✓ Removidas % versões', v_count;
    END IF;
END $$;

-- Aguardar um momento
SELECT pg_sleep(1);

-- Verificação final
DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_func1_count INT;
    v_func2_count INT;
    v_func3_count INT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_activities'
    ) INTO v_table_exists;
    
    SELECT COUNT(*) INTO v_func1_count
    FROM pg_proc 
    WHERE proname = 'registrar_atividade'
    AND pronamespace = 'public'::regnamespace;
    
    SELECT COUNT(*) INTO v_func2_count
    FROM pg_proc 
    WHERE proname = 'listar_usuarios_online'
    AND pronamespace = 'public'::regnamespace;
    
    SELECT COUNT(*) INTO v_func3_count
    FROM pg_proc 
    WHERE proname = 'historico_atividades_usuario'
    AND pronamespace = 'public'::regnamespace;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🧹 LIMPEZA CONCLUÍDA';
    RAISE NOTICE '========================================';
    
    IF NOT v_table_exists THEN
        RAISE NOTICE '✓ Tabela user_activities: REMOVIDA';
    ELSE
        RAISE WARNING '⚠ Tabela user_activities: AINDA EXISTE';
    END IF;
    
    IF v_func1_count = 0 THEN
        RAISE NOTICE '✓ registrar_atividade: REMOVIDA';
    ELSE
        RAISE WARNING '⚠ registrar_atividade: % versões ainda existem', v_func1_count;
    END IF;
    
    IF v_func2_count = 0 THEN
        RAISE NOTICE '✓ listar_usuarios_online: REMOVIDA';
    ELSE
        RAISE WARNING '⚠ listar_usuarios_online: % versões ainda existem', v_func2_count;
    END IF;
    
    IF v_func3_count = 0 THEN
        RAISE NOTICE '✓ historico_atividades_usuario: REMOVIDA';
    ELSE
        RAISE WARNING '⚠ historico_atividades_usuario: % versões ainda existem', v_func3_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '➡️  PRÓXIMO PASSO:';
    RAISE NOTICE '   Execute: PARTE_2_CRIAR_TUDO.sql';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

