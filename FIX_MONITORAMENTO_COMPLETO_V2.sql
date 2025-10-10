-- =====================================================
-- FIX SISTEMA DE MONITORAMENTO - VERSÃO 2
-- =====================================================
-- Script completo e seguro para executar múltiplas vezes
-- Remove todas as versões antigas antes de recriar

-- =====================================================
-- 1. DROPAR TABELA E TUDO QUE DEPENDE DELA
-- =====================================================

-- Dropar a tabela CASCADE vai remover também as policies e funções que dependem dela
DROP TABLE IF EXISTS public.user_activities CASCADE;

-- =====================================================
-- 2. DROPAR FUNÇÕES MANUALMENTE (caso não tenham sido removidas)
-- =====================================================

-- Dropar todas as possíveis versões da função registrar_atividade
DO $$ 
BEGIN
    -- Dropar função com parâmetros p_user_id
    EXECUTE 'DROP FUNCTION IF EXISTS public.registrar_atividade(UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) CASCADE';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ 
BEGIN
    -- Dropar função sem p_user_id (versão antiga)
    EXECUTE 'DROP FUNCTION IF EXISTS public.registrar_atividade(TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) CASCADE';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Dropar todas as possíveis versões da função listar_usuarios_online
DO $$ 
BEGIN
    EXECUTE 'DROP FUNCTION IF EXISTS public.listar_usuarios_online() CASCADE';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Dropar todas as possíveis versões da função historico_atividades_usuario
DO $$ 
BEGIN
    EXECUTE 'DROP FUNCTION IF EXISTS public.historico_atividades_usuario(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) CASCADE';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- =====================================================
-- 3. CRIAR TABELA user_activities
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

-- Comentário na tabela
COMMENT ON TABLE public.user_activities IS 'Registra todas as atividades dos usuários no sistema para monitoramento';

-- =====================================================
-- 4. CRIAR ÍNDICES
-- =====================================================

CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX idx_user_activities_session ON public.user_activities(session_id);
CREATE INDEX idx_user_activities_action_type ON public.user_activities(action_type);

-- =====================================================
-- 5. HABILITAR RLS
-- =====================================================

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CRIAR POLÍTICAS RLS
-- =====================================================

-- Política 1: Usuários podem inserir suas próprias atividades
CREATE POLICY "user_activities_insert_own"
    ON public.user_activities
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política 2: Admins podem ver todas as atividades
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

-- Política 3: Usuários podem ver suas próprias atividades
CREATE POLICY "user_activities_select_own"
    ON public.user_activities
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- 7. FUNÇÃO: registrar_atividade
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
    -- Obter ID e email do usuário atual
    v_user_id := auth.uid();
    
    -- Buscar email do usuário
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;
    
    -- Validar action_type
    IF p_action_type NOT IN ('login', 'tab_change', 'filter_change', 'heartbeat', 'logout') THEN
        RAISE EXCEPTION 'Tipo de ação inválido: %', p_action_type;
    END IF;

    -- Inserir atividade
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

    -- Retornar resultado
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

COMMENT ON FUNCTION public.registrar_atividade IS 'Registra uma atividade do usuário atual no sistema';

-- =====================================================
-- 8. FUNÇÃO: listar_usuarios_online
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
    -- Verificar se o usuário é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem listar usuários online';
    END IF;

    -- Retornar usuários ativos nas últimas 5 minutos
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

COMMENT ON FUNCTION public.listar_usuarios_online IS 'Lista todos os usuários online nos últimos 5 minutos (apenas para admins)';

-- =====================================================
-- 9. FUNÇÃO: historico_atividades_usuario
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
    -- Verificar se o usuário é admin ou está consultando suas próprias atividades
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.is_admin = true OR auth.uid() = p_user_id)
    ) THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;

    -- Retornar histórico
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

COMMENT ON FUNCTION public.historico_atividades_usuario IS 'Retorna histórico de atividades de um usuário específico';

-- =====================================================
-- 10. CONCEDER PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION public.registrar_atividade TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_usuarios_online TO authenticated;
GRANT EXECUTE ON FUNCTION public.historico_atividades_usuario TO authenticated;

-- =====================================================
-- 11. VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_func1_exists BOOLEAN;
    v_func2_exists BOOLEAN;
    v_func3_exists BOOLEAN;
BEGIN
    -- Verificar se a tabela existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_activities'
    ) INTO v_table_exists;
    
    -- Verificar se as funções existem
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'registrar_atividade'
    ) INTO v_func1_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'listar_usuarios_online'
    ) INTO v_func2_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'historico_atividades_usuario'
    ) INTO v_func3_exists;
    
    -- Mensagens de verificação
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SISTEMA DE MONITORAMENTO INSTALADO';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    IF v_table_exists THEN
        RAISE NOTICE '✓ Tabela user_activities: CRIADA';
    ELSE
        RAISE WARNING '✗ Tabela user_activities: FALHOU';
    END IF;
    
    IF v_func1_exists THEN
        RAISE NOTICE '✓ Função registrar_atividade: CRIADA';
    ELSE
        RAISE WARNING '✗ Função registrar_atividade: FALHOU';
    END IF;
    
    IF v_func2_exists THEN
        RAISE NOTICE '✓ Função listar_usuarios_online: CRIADA';
    ELSE
        RAISE WARNING '✗ Função listar_usuarios_online: FALHOU';
    END IF;
    
    IF v_func3_exists THEN
        RAISE NOTICE '✓ Função historico_atividades_usuario: CRIADA';
    ELSE
        RAISE WARNING '✗ Função historico_atividades_usuario: FALHOU';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Acesse o dashboard como admin';
    RAISE NOTICE '2. Vá para a aba "Monitoramento"';
    RAISE NOTICE '3. Abra outra conta em navegador anônimo';
    RAISE NOTICE '4. Verifique se o usuário aparece online';
    RAISE NOTICE '';
END $$;

