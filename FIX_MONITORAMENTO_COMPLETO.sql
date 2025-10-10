-- =====================================================
-- FIX SISTEMA DE MONITORAMENTO - EXECUTÁVEL MÚLTIPLAS VEZES
-- =====================================================
-- Este script pode ser executado quantas vezes forem necessárias
-- Ele vai recriar tudo do zero se necessário

-- =====================================================
-- 1. DROPAR OBJETOS EXISTENTES (se existirem)
-- =====================================================

-- Dropar funções (todas as possíveis versões)
DROP FUNCTION IF EXISTS public.registrar_atividade(UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.registrar_atividade(TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.registrar_atividade CASCADE;
DROP FUNCTION IF EXISTS public.listar_usuarios_online() CASCADE;
DROP FUNCTION IF EXISTS public.historico_atividades_usuario(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) CASCADE;

-- Dropar políticas RLS
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias atividades" ON public.user_activities;
DROP POLICY IF EXISTS "Admins podem ver todas as atividades" ON public.user_activities;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias atividades" ON public.user_activities;

-- Dropar tabela
DROP TABLE IF EXISTS public.user_activities;

-- =====================================================
-- 2. CRIAR TABELA user_activities
-- =====================================================

CREATE TABLE public.user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    action_type TEXT NOT NULL, -- 'login', 'tab_change', 'filter_change', 'heartbeat'
    action_details TEXT,
    tab_name TEXT,
    filters_applied JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    CONSTRAINT valid_action_type CHECK (action_type IN ('login', 'tab_change', 'filter_change', 'heartbeat', 'logout'))
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_session ON public.user_activities(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_action_type ON public.user_activities(action_type);

-- =====================================================
-- 3. HABILITAR RLS
-- =====================================================

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CRIAR POLÍTICAS RLS
-- =====================================================

-- Política 1: Usuários podem inserir suas próprias atividades
CREATE POLICY "Usuários podem inserir suas próprias atividades"
    ON public.user_activities
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política 2: Admins podem ver todas as atividades
CREATE POLICY "Admins podem ver todas as atividades"
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
CREATE POLICY "Usuários podem ver suas próprias atividades"
    ON public.user_activities
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- 5. FUNÇÃO: registrar_atividade
-- =====================================================

CREATE OR REPLACE FUNCTION public.registrar_atividade(
    p_user_id UUID,
    p_user_email TEXT,
    p_action_type TEXT,
    p_action_details TEXT DEFAULT NULL,
    p_filters_applied JSONB DEFAULT '{}'::jsonb,
    p_tab_name TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_activity_id UUID;
    v_result JSONB;
BEGIN
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
        user_agent,
        created_at
    )
    VALUES (
        p_user_id,
        p_user_email,
        p_action_type,
        p_action_details,
        p_filters_applied,
        p_tab_name,
        p_session_id,
        p_user_agent,
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

-- =====================================================
-- 6. FUNÇÃO: listar_usuarios_online
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

-- =====================================================
-- 7. FUNÇÃO: historico_atividades_usuario
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

-- =====================================================
-- 8. CONCEDER PERMISSÕES
-- =====================================================

-- Permitir execução das funções para usuários autenticados
GRANT EXECUTE ON FUNCTION public.registrar_atividade TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_usuarios_online TO authenticated;
GRANT EXECUTE ON FUNCTION public.historico_atividades_usuario TO authenticated;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Verificação final
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema de monitoramento criado/atualizado com sucesso!';
    RAISE NOTICE '📊 Tabela user_activities: OK';
    RAISE NOTICE '🔐 Políticas RLS: OK';
    RAISE NOTICE '⚙️ Funções RPC: OK';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Próximos passos:';
    RAISE NOTICE '1. Teste o monitoramento acessando a aba "Monitoramento" como admin';
    RAISE NOTICE '2. Verifique se as atividades estão sendo registradas no console (F12)';
    RAISE NOTICE '3. Abra outra conta em navegador anônimo para testar o tracking';
END $$;

