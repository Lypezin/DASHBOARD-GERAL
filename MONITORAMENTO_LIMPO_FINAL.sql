-- =====================================================
-- SISTEMA DE MONITORAMENTO - INSTALAÇÃO LIMPA
-- =====================================================
-- Execute este script completo de uma vez
-- Ele vai limpar tudo e instalar do zero

-- =====================================================
-- PASSO 1: LIMPAR TUDO (COM FORÇA)
-- =====================================================

-- Dropar a tabela e tudo que depende dela
DROP TABLE IF EXISTS public.user_activities CASCADE;

-- Remover TODAS as funções registrar_atividade (qualquer versão)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure 
        FROM pg_proc 
        WHERE proname = 'registrar_atividade' 
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
    END LOOP;
END $$;

-- Remover TODAS as funções listar_usuarios_online (qualquer versão)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure 
        FROM pg_proc 
        WHERE proname = 'listar_usuarios_online' 
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
    END LOOP;
END $$;

-- Remover TODAS as funções historico_atividades_usuario (qualquer versão)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure 
        FROM pg_proc 
        WHERE proname = 'historico_atividades_usuario' 
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
    END LOOP;
END $$;

-- =====================================================
-- PASSO 2: CRIAR TABELA
-- =====================================================

CREATE TABLE public.user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    action_type TEXT NOT NULL,
    action_details TEXT,
    tab_name TEXT,
    filters_applied JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    CONSTRAINT valid_action_type CHECK (action_type IN ('login', 'tab_change', 'filter_change', 'heartbeat', 'logout'))
);

-- =====================================================
-- PASSO 3: CRIAR ÍNDICES
-- =====================================================

CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX idx_user_activities_session ON public.user_activities(session_id);
CREATE INDEX idx_user_activities_action_type ON public.user_activities(action_type);

-- =====================================================
-- PASSO 4: HABILITAR RLS E CRIAR POLÍTICAS
-- =====================================================

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_activities_insert_own"
    ON public.user_activities
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_activities_select_admin"
    ON public.user_activities
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

CREATE POLICY "user_activities_select_own"
    ON public.user_activities
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- PASSO 5: CRIAR FUNÇÃO registrar_atividade
-- =====================================================

CREATE OR REPLACE FUNCTION public.registrar_atividade(
    p_action_type TEXT,
    p_action_details TEXT DEFAULT NULL,
    p_tab_name TEXT DEFAULT NULL,
    p_filters_applied JSONB DEFAULT '{}'::jsonb,
    p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_activity_id UUID;
    v_user_id UUID;
    v_user_email TEXT;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();
    
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;
    
    IF p_action_type NOT IN ('login', 'tab_change', 'filter_change', 'heartbeat', 'logout') THEN
        RAISE EXCEPTION 'Tipo de ação inválido: %', p_action_type;
    END IF;

    INSERT INTO public.user_activities (
        user_id,
        user_email,
        action_type,
        action_details,
        filters_applied,
        tab_name,
        session_id,
        created_at
    )
    VALUES (
        v_user_id,
        v_user_email,
        p_action_type,
        p_action_details,
        p_filters_applied,
        p_tab_name,
        p_session_id,
        NOW()
    )
    RETURNING id INTO v_activity_id;

    v_result := jsonb_build_object(
        'success', true,
        'activity_id', v_activity_id,
        'message', 'Atividade registrada com sucesso'
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Erro ao registrar atividade'
        );
END;
$$;

-- =====================================================
-- PASSO 6: CRIAR FUNÇÃO listar_usuarios_online
-- =====================================================

CREATE OR REPLACE FUNCTION public.listar_usuarios_online()
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    current_tab TEXT,
    filters_applied JSONB,
    last_activity TIMESTAMP WITH TIME ZONE,
    session_id TEXT,
    is_active BOOLEAN,
    last_action_type TEXT,
    time_since_last_activity INTERVAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem listar usuários online';
    END IF;

    RETURN QUERY
    WITH latest_activities AS (
        SELECT DISTINCT ON (ua.user_id, ua.session_id)
            ua.user_id,
            ua.user_email,
            ua.tab_name,
            ua.filters_applied,
            ua.created_at,
            ua.session_id,
            ua.action_type,
            NOW() - ua.created_at AS time_inactive
        FROM public.user_activities ua
        WHERE ua.created_at > NOW() - INTERVAL '5 minutes'
        ORDER BY ua.user_id, ua.session_id, ua.created_at DESC
    )
    SELECT
        la.user_id,
        la.user_email,
        la.tab_name,
        la.filters_applied,
        la.created_at,
        la.session_id,
        (la.time_inactive < INTERVAL '2 minutes') AS is_active,
        la.action_type,
        la.time_inactive
    FROM latest_activities la
    ORDER BY la.created_at DESC;

END;
$$;

-- =====================================================
-- PASSO 7: CRIAR FUNÇÃO historico_atividades_usuario
-- =====================================================

CREATE OR REPLACE FUNCTION public.historico_atividades_usuario(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    id UUID,
    action_type TEXT,
    action_details TEXT,
    tab_name TEXT,
    filters_applied JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    session_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.is_admin = true OR auth.uid() = p_user_id)
    ) THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;

    RETURN QUERY
    SELECT
        ua.id,
        ua.action_type,
        ua.action_details,
        ua.tab_name,
        ua.filters_applied,
        ua.created_at,
        ua.session_id
    FROM public.user_activities ua
    WHERE ua.user_id = p_user_id
      AND ua.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY ua.created_at DESC
    LIMIT 1000;

END;
$$;

-- =====================================================
-- PASSO 8: CONCEDER PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION public.registrar_atividade TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_usuarios_online TO authenticated;
GRANT EXECUTE ON FUNCTION public.historico_atividades_usuario TO authenticated;

-- =====================================================
-- PASSO 9: VERIFICAÇÃO FINAL
-- =====================================================

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
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ INSTALAÇÃO CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    IF v_table_exists THEN
        RAISE NOTICE '✓ Tabela user_activities: OK';
    ELSE
        RAISE WARNING '✗ Tabela user_activities: ERRO';
    END IF;
    
    IF v_func1_count = 1 THEN
        RAISE NOTICE '✓ registrar_atividade: OK (1 versão)';
    ELSIF v_func1_count > 1 THEN
        RAISE WARNING '⚠ registrar_atividade: % versões (deveria ser 1)', v_func1_count;
    ELSE
        RAISE WARNING '✗ registrar_atividade: NÃO ENCONTRADA';
    END IF;
    
    IF v_func2_count = 1 THEN
        RAISE NOTICE '✓ listar_usuarios_online: OK (1 versão)';
    ELSIF v_func2_count > 1 THEN
        RAISE WARNING '⚠ listar_usuarios_online: % versões (deveria ser 1)', v_func2_count;
    ELSE
        RAISE WARNING '✗ listar_usuarios_online: NÃO ENCONTRADA';
    END IF;
    
    IF v_func3_count = 1 THEN
        RAISE NOTICE '✓ historico_atividades_usuario: OK (1 versão)';
    ELSIF v_func3_count > 1 THEN
        RAISE WARNING '⚠ historico_atividades_usuario: % versões (deveria ser 1)', v_func3_count;
    ELSE
        RAISE WARNING '✗ historico_atividades_usuario: NÃO ENCONTRADA';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎯 TUDO PRONTO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Acesse o dashboard como admin';
    RAISE NOTICE '2. Clique na aba "Monitoramento"';
    RAISE NOTICE '3. Abra outro navegador/conta';
    RAISE NOTICE '4. Você verá o usuário online!';
    RAISE NOTICE '';
END $$;

