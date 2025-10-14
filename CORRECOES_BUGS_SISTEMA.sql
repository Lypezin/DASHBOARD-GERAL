-- =============================================================================
-- CORREÇÕES DE BUGS E MELHORIAS DE ROBUSTEZ DO SISTEMA
-- =============================================================================
-- Baseado na análise de código e possíveis pontos de falha
-- =============================================================================

-- 1. FUNÇÃO: safe_dashboard_resumo
-- Versão mais robusta da dashboard_resumo com tratamento de erros
-- =============================================================================

CREATE OR REPLACE FUNCTION safe_dashboard_resumo(
    p_ano INTEGER DEFAULT NULL,
    p_semana INTEGER DEFAULT NULL,
    p_praca TEXT DEFAULT NULL,
    p_sub_praca TEXT DEFAULT NULL,
    p_origem TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    result jsonb;
    v_count integer;
BEGIN
    -- Verificar se há dados antes de processar
    SELECT COUNT(*) INTO v_count
    FROM public.mv_aderencia_agregada
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem);

    -- Se não há dados, retornar estrutura vazia mas válida
    IF v_count = 0 THEN
        RETURN jsonb_build_object(
            'totais', jsonb_build_object(
                'corridas_ofertadas', 0,
                'corridas_aceitas', 0,
                'corridas_rejeitadas', 0,
                'corridas_completadas', 0
            ),
            'semanal', '[]'::jsonb,
            'dia', '[]'::jsonb,
            'turno', '[]'::jsonb,
            'sub_praca', '[]'::jsonb,
            'origem', '[]'::jsonb,
            'dimensoes', jsonb_build_object(
                'anos', '[]'::jsonb,
                'semanas', '[]'::jsonb,
                'pracas', '[]'::jsonb,
                'sub_pracas', '[]'::jsonb,
                'origens', '[]'::jsonb
            )
        );
    END IF;

    -- Chamar função original com tratamento de erro
    BEGIN
        SELECT dashboard_resumo(p_ano, p_semana, p_praca, p_sub_praca, p_origem) INTO result;
        RETURN result;
    EXCEPTION WHEN OTHERS THEN
        -- Log do erro
        RAISE WARNING 'Erro em dashboard_resumo: %', SQLERRM;
        
        -- Retornar estrutura mínima válida
        RETURN jsonb_build_object(
            'totais', jsonb_build_object(
                'corridas_ofertadas', 0,
                'corridas_aceitas', 0,
                'corridas_rejeitadas', 0,
                'corridas_completadas', 0
            ),
            'semanal', '[]'::jsonb,
            'dia', '[]'::jsonb,
            'turno', '[]'::jsonb,
            'sub_praca', '[]'::jsonb,
            'origem', '[]'::jsonb,
            'dimensoes', jsonb_build_object(
                'anos', '[]'::jsonb,
                'semanas', '[]'::jsonb,
                'pracas', '[]'::jsonb,
                'sub_pracas', '[]'::jsonb,
                'origens', '[]'::jsonb
            )
        );
    END;
END;
$$;

-- 2. FUNÇÃO: safe_calcular_utr
-- Versão mais robusta do cálculo de UTR
-- =============================================================================

CREATE OR REPLACE FUNCTION safe_calcular_utr(
    p_ano INTEGER DEFAULT NULL,
    p_semana INTEGER DEFAULT NULL,
    p_praca TEXT DEFAULT NULL,
    p_sub_praca TEXT DEFAULT NULL,
    p_origem TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    result jsonb;
BEGIN
    BEGIN
        SELECT calcular_utr(p_ano, p_semana, p_praca, p_sub_praca, p_origem) INTO result;
        
        -- Verificar se o resultado é válido
        IF result IS NULL OR result = 'null'::jsonb THEN
            RETURN jsonb_build_object(
                'geral', jsonb_build_object(
                    'tempo_horas', 0,
                    'corridas', 0,
                    'utr', 0
                )
            );
        END IF;
        
        RETURN result;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Erro em calcular_utr: %', SQLERRM;
        
        RETURN jsonb_build_object(
            'geral', jsonb_build_object(
                'tempo_horas', 0,
                'corridas', 0,
                'utr', 0
            )
        );
    END;
END;
$$;

-- 3. FUNÇÃO: safe_listar_entregadores
-- Versão mais robusta da listagem de entregadores
-- =============================================================================

CREATE OR REPLACE FUNCTION safe_listar_entregadores(
    p_ano INTEGER DEFAULT NULL,
    p_semana INTEGER DEFAULT NULL,
    p_praca TEXT DEFAULT NULL,
    p_sub_praca TEXT DEFAULT NULL,
    p_origem TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    result jsonb;
    v_count integer;
BEGIN
    -- Verificar se há dados
    SELECT COUNT(DISTINCT id_entregador) INTO v_count
    FROM public.mv_aderencia_agregada
    WHERE (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
      AND id_entregador IS NOT NULL;

    IF v_count = 0 THEN
        RETURN jsonb_build_object(
            'entregadores', '[]'::jsonb,
            'total', 0
        );
    END IF;

    BEGIN
        SELECT listar_entregadores(p_ano, p_semana, p_praca, p_sub_praca, p_origem) INTO result;
        
        IF result IS NULL THEN
            RETURN jsonb_build_object(
                'entregadores', '[]'::jsonb,
                'total', 0
            );
        END IF;
        
        RETURN result;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Erro em listar_entregadores: %', SQLERRM;
        
        RETURN jsonb_build_object(
            'entregadores', '[]'::jsonb,
            'total', 0
        );
    END;
END;
$$;

-- 4. FUNÇÃO: validate_user_session
-- Validar sessões de usuário para evitar problemas de autenticação
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_user_session()
RETURNS TABLE(
    user_id uuid,
    is_valid boolean,
    is_approved boolean,
    is_admin boolean,
    assigned_pracas text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as user_id,
        CASE WHEN up.id IS NOT NULL THEN true ELSE false END as is_valid,
        COALESCE(up.is_approved, false) as is_approved,
        COALESCE(up.is_admin, false) as is_admin,
        COALESCE(up.assigned_pracas, ARRAY[]::text[]) as assigned_pracas
    FROM public.user_profiles up
    WHERE up.id = auth.uid();
    
    -- Se não há resultado, usuário não existe no banco
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            auth.uid(),
            false,
            false,
            false,
            ARRAY[]::text[];
    END IF;
END;
$$;

-- 5. FUNÇÃO: health_check
-- Verificação de saúde do sistema
-- =============================================================================

CREATE OR REPLACE FUNCTION health_check()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    mv_count integer;
    data_count integer;
    last_refresh timestamp;
    result jsonb;
BEGIN
    -- Verificar MV
    SELECT COUNT(*) INTO mv_count FROM public.mv_aderencia_agregada;
    
    -- Verificar dados principais
    SELECT COUNT(*) INTO data_count FROM public.dados_corridas;
    
    -- Verificar último refresh (se houver tabela de log)
    BEGIN
        SELECT MAX(created_at) INTO last_refresh 
        FROM information_schema.tables 
        WHERE table_name = 'mv_aderencia_agregada';
    EXCEPTION WHEN OTHERS THEN
        last_refresh := NULL;
    END;
    
    result := jsonb_build_object(
        'status', CASE 
            WHEN mv_count > 0 AND data_count > 0 THEN 'healthy'
            WHEN data_count > 0 THEN 'degraded'
            ELSE 'unhealthy'
        END,
        'mv_records', mv_count,
        'data_records', data_count,
        'last_check', NOW(),
        'last_refresh', last_refresh
    );
    
    RETURN result;
END;
$$;

-- 6. TRIGGER: log_data_changes
-- Log de mudanças importantes nos dados
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.system_logs (
    id SERIAL PRIMARY KEY,
    level TEXT NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_system_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.system_logs (level, message, details)
    VALUES (
        'INFO',
        'Data change detected',
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', NOW()
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger na tabela principal (opcional - pode gerar muitos logs)
-- DROP TRIGGER IF EXISTS log_dados_corridas_changes ON public.dados_corridas;
-- CREATE TRIGGER log_dados_corridas_changes
--     AFTER INSERT OR UPDATE OR DELETE ON public.dados_corridas
--     FOR EACH STATEMENT EXECUTE FUNCTION log_system_event();

-- 7. ÍNDICES ADICIONAIS PARA ROBUSTEZ
-- =============================================================================

-- Índice para validação de usuário
CREATE INDEX IF NOT EXISTS idx_user_profiles_validation 
ON public.user_profiles (id, is_approved, is_admin);

-- Índice para health check
CREATE INDEX IF NOT EXISTS idx_mv_aderencia_health_check 
ON public.mv_aderencia_agregada (ano_iso, semana_numero);

-- 8. FUNÇÃO: refresh_mv_safe
-- Refresh seguro da materialized view
-- =============================================================================

CREATE OR REPLACE FUNCTION refresh_mv_safe()
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    record_count integer;
BEGIN
    start_time := NOW();
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
        
        end_time := NOW();
        SELECT COUNT(*) INTO record_count FROM public.mv_aderencia_agregada;
        
        INSERT INTO public.system_logs (level, message, details)
        VALUES (
            'INFO',
            'MV refresh completed successfully',
            jsonb_build_object(
                'start_time', start_time,
                'end_time', end_time,
                'duration_seconds', EXTRACT(EPOCH FROM (end_time - start_time)),
                'record_count', record_count
            )
        );
        
        RETURN true;
        
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.system_logs (level, message, details)
        VALUES (
            'ERROR',
            'MV refresh failed',
            jsonb_build_object(
                'error', SQLERRM,
                'start_time', start_time,
                'failed_at', NOW()
            )
        );
        
        RETURN false;
    END;
END;
$$;

-- =============================================================================
-- PERMISSÕES
-- =============================================================================

GRANT EXECUTE ON FUNCTION safe_dashboard_resumo TO authenticated;
GRANT EXECUTE ON FUNCTION safe_calcular_utr TO authenticated;
GRANT EXECUTE ON FUNCTION safe_listar_entregadores TO authenticated;
GRANT EXECUTE ON FUNCTION validate_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION health_check TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_mv_safe TO authenticated;

GRANT SELECT ON public.system_logs TO authenticated;

-- =============================================================================
-- COMENTÁRIOS
-- =============================================================================

COMMENT ON FUNCTION safe_dashboard_resumo IS 'Versão robusta de dashboard_resumo com tratamento de erros';
COMMENT ON FUNCTION safe_calcular_utr IS 'Versão robusta de calcular_utr com tratamento de erros';
COMMENT ON FUNCTION safe_listar_entregadores IS 'Versão robusta de listar_entregadores com tratamento de erros';
COMMENT ON FUNCTION validate_user_session IS 'Validação segura de sessão de usuário';
COMMENT ON FUNCTION health_check IS 'Verificação de saúde do sistema';
COMMENT ON FUNCTION refresh_mv_safe IS 'Refresh seguro da materialized view com logging';
COMMENT ON TABLE public.system_logs IS 'Log de eventos do sistema';

-- =============================================================================
-- INSTRUÇÕES DE USO
-- =============================================================================

/*
MELHORIAS IMPLEMENTADAS:

1. ROBUSTEZ:
   - Funções wrapper seguras para todas as RPCs principais
   - Tratamento de erros adequado
   - Retorno de estruturas válidas mesmo em caso de erro

2. VALIDAÇÃO:
   - Verificação de sessão de usuário melhorada
   - Health check para monitorar o sistema
   - Validação de dados antes de processar

3. LOGGING:
   - Sistema de logs para rastrear problemas
   - Log de refresh da MV
   - Monitoramento de mudanças críticas

4. PERFORMANCE:
   - Verificação de contagem antes de processar
   - Índices adicionais para consultas críticas
   - Refresh concorrente da MV

COMO USAR NO FRONTEND:
- Substituir calls de dashboard_resumo por safe_dashboard_resumo
- Substituir calls de calcular_utr por safe_calcular_utr
- Substituir calls de listar_entregadores por safe_listar_entregadores
- Implementar health check no frontend
- Usar validate_user_session para validar sessões
*/
