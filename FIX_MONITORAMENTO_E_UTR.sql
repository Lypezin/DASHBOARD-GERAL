-- =====================================================
-- FIX: MONITORAMENTO (SEM DUPLICATAS) + UTR COMPARAÇÃO
-- =====================================================
-- Execute todo este SQL de uma vez

-- PASSO 1: Corrigir duplicação de usuários online
DROP FUNCTION IF EXISTS public.listar_usuarios_online() CASCADE;

CREATE FUNCTION public.listar_usuarios_online()
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    current_tab TEXT,
    filters_applied JSONB,
    last_activity TIMESTAMP WITH TIME ZONE,
    session_id TEXT,
    is_active BOOLEAN,
    last_action_type TEXT,
    action_details TEXT,
    seconds_inactive NUMERIC
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
        SELECT DISTINCT ON (ua.user_id)  -- APENAS POR user_id (sem session_id)
            ua.user_id,
            ua.user_email,
            ua.tab_name,
            ua.filters_applied,
            ua.created_at,
            ua.session_id,
            ua.action_type,
            ua.action_details,
            EXTRACT(EPOCH FROM (NOW() - ua.created_at)) AS secs_inactive
        FROM public.user_activities ua
        WHERE ua.created_at > NOW() - INTERVAL '5 minutes'
        ORDER BY ua.user_id, ua.created_at DESC  -- Pega a atividade mais recente por usuário
    )
    SELECT
        la.user_id,
        COALESCE(up.full_name, la.user_email) as user_name,
        la.user_email,
        la.tab_name,
        la.filters_applied,
        la.created_at,
        la.session_id,
        (la.secs_inactive < 120) AS is_active,
        la.action_type,
        la.action_details,
        la.secs_inactive
    FROM latest_activities la
    LEFT JOIN public.user_profiles up ON up.id = la.user_id
    ORDER BY la.created_at DESC;

END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_usuarios_online TO authenticated;

-- PASSO 2: Verificação
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MONITORAMENTO CORRIGIDO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Correções aplicadas:';
    RAISE NOTICE '   ✓ Removida duplicação de usuários';
    RAISE NOTICE '   ✓ Cada usuário aparece apenas 1 vez';
    RAISE NOTICE '   ✓ Mostra sempre a atividade mais recente';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Atualize o dashboard (F5) para testar!';
    RAISE NOTICE '';
END $$;

