-- =============================================================================
-- OTIMIZAÇÃO DE PERFORMANCE PARA ADMIN
-- =============================================================================
-- Funções otimizadas para melhorar a performance da página administrativa
-- =============================================================================

-- 1. FUNÇÃO: list_pracas_disponiveis_otimizada
-- Versão otimizada para buscar praças com múltiplos fallbacks
-- =============================================================================

CREATE OR REPLACE FUNCTION list_pracas_disponiveis_otimizada()
RETURNS TABLE(
    praca TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Tentar primeiro da MV (mais rápido)
    RETURN QUERY
    SELECT DISTINCT s.praca::TEXT
    FROM public.mv_aderencia_agregada s
    WHERE s.praca IS NOT NULL 
      AND s.praca != ''
      AND LENGTH(TRIM(s.praca)) > 0
    ORDER BY s.praca::TEXT
    LIMIT 100;
    
    -- Se não retornou nenhuma linha, tentar da tabela principal
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT DISTINCT d.praca::TEXT
        FROM public.dados_corridas d
        WHERE d.praca IS NOT NULL 
          AND d.praca != ''
          AND LENGTH(TRIM(d.praca)) > 0
        ORDER BY d.praca::TEXT
        LIMIT 100;
    END IF;
    
    RETURN;
END;
$$;

-- 2. FUNÇÃO: get_admin_stats
-- Estatísticas rápidas para o painel administrativo
-- =============================================================================

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE(
    total_users INTEGER,
    pending_users INTEGER,
    approved_users INTEGER,
    admin_users INTEGER,
    total_pracas INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH user_stats AS (
        SELECT 
            COUNT(*)::INTEGER as total,
            COUNT(CASE WHEN NOT is_approved THEN 1 END)::INTEGER as pending,
            COUNT(CASE WHEN is_approved THEN 1 END)::INTEGER as approved,
            COUNT(CASE WHEN is_admin THEN 1 END)::INTEGER as admins
        FROM public.user_profiles
    ),
    praca_stats AS (
        SELECT COUNT(DISTINCT praca)::INTEGER as pracas
        FROM public.mv_aderencia_agregada
        WHERE praca IS NOT NULL AND praca != ''
    )
    SELECT 
        u.total,
        u.pending,
        u.approved,
        u.admins,
        COALESCE(p.pracas, 0)
    FROM user_stats u
    CROSS JOIN praca_stats p;
END;
$$;

-- 3. FUNÇÃO: list_all_users_optimized
-- Versão otimizada para buscar todos os usuários com informações necessárias
-- =============================================================================

CREATE OR REPLACE FUNCTION list_all_users_optimized()
RETURNS TABLE(
    id UUID,
    full_name TEXT,
    email TEXT,
    is_admin BOOLEAN,
    is_approved BOOLEAN,
    assigned_pracas TEXT[],
    created_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        COALESCE(up.full_name, au.email)::TEXT as full_name,
        au.email::TEXT,
        COALESCE(up.is_admin, FALSE) as is_admin,
        COALESCE(up.is_approved, FALSE) as is_approved,
        COALESCE(up.assigned_pracas, ARRAY[]::TEXT[]) as assigned_pracas,
        COALESCE(up.created_at, au.created_at) as created_at,
        up.approved_at
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE au.deleted_at IS NULL
    ORDER BY 
        CASE WHEN up.is_approved = FALSE THEN 0 ELSE 1 END,
        up.created_at DESC NULLS LAST;
END;
$$;

-- 4. ÍNDICES PARA OTIMIZAÇÃO
-- =============================================================================

-- Melhorar performance da busca de praças
CREATE INDEX IF NOT EXISTS idx_mv_aderencia_praca_not_null 
ON public.mv_aderencia_agregada (praca) 
WHERE praca IS NOT NULL AND praca != '';

-- Otimizar queries de user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status 
ON public.user_profiles (is_approved, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_admin_status 
ON public.user_profiles (is_admin, is_approved);

-- 5. FUNCTION: clear_admin_cache
-- Limpar cache quando houver mudanças administrativas
-- =============================================================================

CREATE OR REPLACE FUNCTION clear_admin_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Esta função pode ser chamada quando há mudanças administrativas
    -- para invalidar caches no frontend
    PERFORM pg_notify('admin_cache_clear', json_build_object(
        'timestamp', EXTRACT(EPOCH FROM NOW()),
        'action', 'cache_clear'
    )::text);
END;
$$;

-- Trigger para limpar cache quando user_profiles é modificado
CREATE OR REPLACE FUNCTION trigger_clear_admin_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM clear_admin_cache();
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_user_profiles_cache_clear ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_cache_clear
    AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_clear_admin_cache();

-- =============================================================================
-- PERMISSÕES
-- =============================================================================

GRANT EXECUTE ON FUNCTION list_pracas_disponiveis_otimizada() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION list_all_users_optimized() TO authenticated;
GRANT EXECUTE ON FUNCTION clear_admin_cache() TO authenticated;

-- =============================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================================================

COMMENT ON FUNCTION list_pracas_disponiveis_otimizada() IS 'Busca praças disponíveis de forma otimizada com fallbacks';
COMMENT ON FUNCTION get_admin_stats() IS 'Retorna estatísticas rápidas para o painel administrativo';
COMMENT ON FUNCTION list_all_users_optimized() IS 'Lista todos os usuários de forma otimizada para o admin';
COMMENT ON FUNCTION clear_admin_cache() IS 'Limpa o cache administrativo quando há alterações';

-- =============================================================================
-- NOTAS DE PERFORMANCE
-- =============================================================================

/*
MELHORIAS IMPLEMENTADAS:

1. CACHE E FALLBACKS:
   - Cache de sessão para praças (5 minutos)
   - Múltiplos fallbacks para busca de praças
   - Carregamento paralelo de dados

2. ÍNDICES OTIMIZADOS:
   - Índice específico para praças não nulas
   - Índices compostos para queries administrativas

3. QUERIES OTIMIZADAS:
   - Uso de materialized view quando possível
   - Limitação de resultados para performance
   - Ordenação otimizada

4. CACHE INVALIDATION:
   - Sistema de notificação para limpar cache
   - Triggers automáticos para invalidação

RESULTADO ESPERADO:
- Carregamento 3-5x mais rápido da página admin
- Correção do bug de praças não carregando
- Melhor experiência do usuário com skeleton loading
*/
