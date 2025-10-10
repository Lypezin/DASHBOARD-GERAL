-- =========================================================================
-- SISTEMA DE MONITORAMENTO EM TEMPO REAL
-- =========================================================================
-- Este script cria a infraestrutura necessária para monitorar
-- atividades dos usuários em tempo real (apenas para admins)
-- =========================================================================

-- =========================================================================
-- SEÇÃO 1: Criar Tabela de Atividades
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.user_activities (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    action_type TEXT NOT NULL, -- 'login', 'logout', 'tab_change', 'filter_change', 'heartbeat'
    action_details JSONB DEFAULT '{}'::jsonb,
    tab_name TEXT,
    filters_applied JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON public.user_activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_session ON public.user_activities(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(action_type);

-- =========================================================================
-- SEÇÃO 2: RPC para Registrar Atividade
-- =========================================================================

CREATE OR REPLACE FUNCTION public.registrar_atividade(
    p_action_type TEXT,
    p_action_details JSONB DEFAULT '{}'::jsonb,
    p_tab_name TEXT DEFAULT NULL,
    p_filters_applied JSONB DEFAULT '{}'::jsonb,
    p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_result JSONB;
BEGIN
    -- Pegar o usuário atual
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
    END IF;
    
    -- Pegar email do usuário
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;
    
    -- Inserir atividade
    INSERT INTO public.user_activities (
        user_id,
        user_email,
        action_type,
        action_details,
        tab_name,
        filters_applied,
        session_id
    )
    VALUES (
        v_user_id,
        v_user_email,
        p_action_type,
        p_action_details,
        p_tab_name,
        p_filters_applied,
        p_session_id
    );
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =========================================================================
-- SEÇÃO 3: RPC para Listar Usuários Online e Atividades Recentes
-- =========================================================================

CREATE OR REPLACE FUNCTION public.listar_usuarios_online(
    p_minutos_inatividade INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_usuarios JSONB;
BEGIN
    -- Verificar se o usuário é admin
    SELECT is_admin INTO v_is_admin
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF v_is_admin IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Acesso negado. Apenas administradores podem acessar esta função.'
        );
    END IF;
    
    -- Buscar usuários online (últimos X minutos)
    WITH ultimas_atividades AS (
        SELECT DISTINCT ON (user_id)
            user_id,
            user_email,
            action_type,
            action_details,
            tab_name,
            filters_applied,
            timestamp,
            session_id
        FROM public.user_activities
        WHERE timestamp >= NOW() - (p_minutos_inatividade || ' minutes')::INTERVAL
        ORDER BY user_id, timestamp DESC
    ),
    usuarios_info AS (
        SELECT 
            ua.user_id,
            ua.user_email,
            up.nome as nome_usuario,
            up.assigned_pracas,
            ua.action_type as ultima_acao,
            ua.tab_name as aba_atual,
            ua.filters_applied,
            ua.timestamp as ultima_atividade,
            EXTRACT(EPOCH FROM (NOW() - ua.timestamp)) as segundos_desde_ultima_atividade,
            (
                SELECT COUNT(*)
                FROM public.user_activities ua2
                WHERE ua2.user_id = ua.user_id
                AND ua2.timestamp >= NOW() - INTERVAL '1 hour'
            ) as total_acoes_ultima_hora
        FROM ultimas_atividades ua
        LEFT JOIN public.user_profiles up ON ua.user_id = up.id
    )
    SELECT jsonb_build_object(
        'success', true,
        'total_online', COUNT(*),
        'usuarios', jsonb_agg(
            jsonb_build_object(
                'user_id', user_id,
                'email', user_email,
                'nome', nome_usuario,
                'pracas', assigned_pracas,
                'ultima_acao', ultima_acao,
                'aba_atual', aba_atual,
                'filtros', filters_applied,
                'ultima_atividade', ultima_atividade,
                'segundos_inativo', segundos_desde_ultima_atividade,
                'acoes_ultima_hora', total_acoes_ultima_hora
            )
            ORDER BY ultima_atividade DESC
        )
    )
    INTO v_usuarios
    FROM usuarios_info;
    
    RETURN COALESCE(v_usuarios, jsonb_build_object('success', true, 'total_online', 0, 'usuarios', '[]'::jsonb));
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =========================================================================
-- SEÇÃO 4: RPC para Histórico de Atividades de um Usuário
-- =========================================================================

CREATE OR REPLACE FUNCTION public.historico_atividades_usuario(
    p_user_id UUID DEFAULT NULL,
    p_limite INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_historico JSONB;
    v_target_user_id UUID;
BEGIN
    -- Verificar se o usuário é admin
    SELECT is_admin INTO v_is_admin
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF v_is_admin IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Acesso negado'
        );
    END IF;
    
    -- Se não especificou user_id, pegar todas as atividades
    v_target_user_id := p_user_id;
    
    SELECT jsonb_build_object(
        'success', true,
        'atividades', jsonb_agg(
            jsonb_build_object(
                'id', id,
                'user_email', user_email,
                'action_type', action_type,
                'action_details', action_details,
                'tab_name', tab_name,
                'filters_applied', filters_applied,
                'timestamp', timestamp,
                'session_id', session_id
            )
            ORDER BY timestamp DESC
        )
    )
    INTO v_historico
    FROM (
        SELECT *
        FROM public.user_activities
        WHERE (v_target_user_id IS NULL OR user_id = v_target_user_id)
        ORDER BY timestamp DESC
        LIMIT p_limite
    ) sub;
    
    RETURN COALESCE(v_historico, jsonb_build_object('success', true, 'atividades', '[]'::jsonb));
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =========================================================================
-- SEÇÃO 5: Políticas RLS
-- =========================================================================

-- Habilitar RLS na tabela
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver atividades
CREATE POLICY "Admins podem ver todas as atividades"
    ON public.user_activities
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Política: Todos podem inserir suas próprias atividades
CREATE POLICY "Usuários podem registrar suas atividades"
    ON public.user_activities
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- =========================================================================
-- SEÇÃO 6: Função para Limpar Atividades Antigas (Manutenção)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.limpar_atividades_antigas(
    p_dias_manter INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_deleted_count INTEGER;
BEGIN
    -- Verificar se é admin
    SELECT is_admin INTO v_is_admin
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF v_is_admin IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Apenas admins podem executar esta função');
    END IF;
    
    -- Deletar atividades antigas
    DELETE FROM public.user_activities
    WHERE timestamp < NOW() - (p_dias_manter || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'atividades_removidas', v_deleted_count,
        'data_limite', NOW() - (p_dias_manter || ' days')::INTERVAL
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =========================================================================
-- FIM DO SCRIPT
-- =========================================================================

-- Para testar:
-- SELECT public.registrar_atividade('login', '{"dispositivo": "desktop"}'::jsonb, 'dashboard', '{}'::jsonb, 'session-123');
-- SELECT public.listar_usuarios_online(5);
-- SELECT public.historico_atividades_usuario(NULL, 50);

