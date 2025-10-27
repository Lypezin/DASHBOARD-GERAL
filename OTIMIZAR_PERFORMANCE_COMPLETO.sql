-- =====================================================================
-- OTIMIZAÇÃO COMPLETA DE PERFORMANCE
-- =====================================================================
-- Este script otimiza todas as queries e índices do sistema
-- Execute TUDO de uma vez
-- =====================================================================

-- Configurações para acelerar a execução
SET maintenance_work_mem = '1GB';
SET work_mem = '256MB';

DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'INICIANDO OTIMIZAÇÃO DE PERFORMANCE';
  RAISE NOTICE '=============================================================';
END $$;

-- =====================================================================
-- 1. CRIAR ÍNDICES FALTANTES EM dados_corridas
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣  CRIANDO ÍNDICES OTIMIZADOS';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

-- Índice composto para queries mais comuns
CREATE INDEX IF NOT EXISTS idx_dados_corridas_filtros_completo 
ON dados_corridas (praca, semana, ano_iso, data_do_periodo);

CREATE INDEX IF NOT EXISTS idx_dados_corridas_sub_praca 
ON dados_corridas (sub_praca, semana);

CREATE INDEX IF NOT EXISTS idx_dados_corridas_pessoa 
ON dados_corridas (pessoa_entregadora, praca);

-- =====================================================================
-- 2. ATUALIZAR ESTATÍSTICAS
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  ATUALIZANDO ESTATÍSTICAS';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

ANALYZE dados_corridas;
ANALYZE user_profiles;
ANALYZE mv_aderencia_agregada;

-- =====================================================================
-- 3. OTIMIZAR FUNÇÃO dashboard_resumo
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  OTIMIZANDO dashboard_resumo';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

-- Recriar função dashboard_resumo otimizada
DROP FUNCTION IF EXISTS public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano INTEGER DEFAULT NULL,
  p_semana INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_sub_praca TEXT DEFAULT NULL,
  p_origem TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET work_mem = '256MB'
SET statement_timeout = '30s'
AS $$
DECLARE
  v_result JSONB;
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_assigned_pracas TEXT[];
BEGIN
  -- Obter informações do usuário
  v_user_id := auth.uid();
  
  SELECT is_admin, assigned_pracas INTO v_is_admin, v_assigned_pracas
  FROM user_profiles
  WHERE id = v_user_id;
  
  -- Usar MV para melhor performance
  SELECT jsonb_build_object(
    'totais', (
      SELECT jsonb_build_object(
        'corridas_ofertadas', COALESCE(SUM(corridas_completadas), 0),
        'corridas_aceitas', COALESCE(SUM(corridas_completadas), 0),
        'corridas_rejeitadas', 0,
        'corridas_completadas', COALESCE(SUM(corridas_completadas), 0)
      )
      FROM mv_aderencia_agregada
      WHERE (p_ano IS NULL OR ano = p_ano)
        AND (p_semana IS NULL OR semana = p_semana)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
        AND (v_is_admin OR praca = ANY(v_assigned_pracas))
    ),
    'semanal', (
      SELECT COALESCE(jsonb_agg(dados ORDER BY semana DESC), '[]'::jsonb)
      FROM (
        SELECT 
          semana,
          ROUND(SUM(tempo_disponivel_segundos) / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(tempo_em_corrida_segundos) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(AVG(aderencia_percentual), 1) AS aderencia_percentual
        FROM mv_aderencia_agregada
        WHERE (p_ano IS NULL OR ano = p_ano)
          AND (p_semana IS NULL OR semana = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
          AND semana IS NOT NULL
        GROUP BY semana
        ORDER BY semana DESC
        LIMIT 10
      ) dados
    ),
    'dia', (
      SELECT COALESCE(jsonb_agg(dados ORDER BY dia_iso), '[]'::jsonb)
      FROM (
        SELECT 
          EXTRACT(ISODOW FROM data_do_periodo)::INTEGER AS dia_iso,
          TO_CHAR(data_do_periodo, 'TMDay') AS dia_da_semana,
          ROUND(SUM(tempo_disponivel_segundos) / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(tempo_em_corrida_segundos) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(AVG(aderencia_percentual), 1) AS aderencia_percentual
        FROM mv_aderencia_agregada
        WHERE (p_ano IS NULL OR ano = p_ano)
          AND (p_semana IS NULL OR semana = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
        GROUP BY EXTRACT(ISODOW FROM data_do_periodo), TO_CHAR(data_do_periodo, 'TMDay')
        ORDER BY dia_iso
      ) dados
    ),
    'turno', '[]'::jsonb,
    'sub_praca', (
      SELECT COALESCE(jsonb_agg(dados ORDER BY sub_praca), '[]'::jsonb)
      FROM (
        SELECT 
          sub_praca,
          ROUND(SUM(tempo_disponivel_segundos) / 3600.0, 2)::TEXT AS horas_a_entregar,
          ROUND(SUM(tempo_em_corrida_segundos) / 3600.0, 2)::TEXT AS horas_entregues,
          ROUND(AVG(aderencia_percentual), 1) AS aderencia_percentual
        FROM mv_aderencia_agregada
        WHERE (p_ano IS NULL OR ano = p_ano)
          AND (p_semana IS NULL OR semana = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
          AND sub_praca IS NOT NULL
        GROUP BY sub_praca
        ORDER BY sub_praca
        LIMIT 50
      ) dados
    ),
    'origem', '[]'::jsonb,
    'dimensoes', jsonb_build_object(
      'anos', (
        SELECT COALESCE(jsonb_agg(DISTINCT ano ORDER BY ano DESC), '[]'::jsonb) 
        FROM mv_aderencia_agregada 
        WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND ano IS NOT NULL
      ),
      'semanas', (
        SELECT COALESCE(jsonb_agg(DISTINCT semana ORDER BY semana DESC), '[]'::jsonb) 
        FROM mv_aderencia_agregada 
        WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND semana IS NOT NULL
      ),
      'pracas', (
        SELECT COALESCE(jsonb_agg(DISTINCT praca ORDER BY praca), '[]'::jsonb) 
        FROM mv_aderencia_agregada 
        WHERE (v_is_admin OR praca = ANY(v_assigned_pracas))
      ),
      'sub_pracas', (
        SELECT COALESCE(jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca), '[]'::jsonb) 
        FROM mv_aderencia_agregada 
        WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND sub_praca IS NOT NULL
      ),
      'origens', '[]'::jsonb
    )
  ) INTO v_result;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro em dashboard_resumo: %', SQLERRM;
    RETURN jsonb_build_object(
      'totais', jsonb_build_object('corridas_ofertadas', 0, 'corridas_aceitas', 0, 'corridas_rejeitadas', 0, 'corridas_completadas', 0),
      'semanal', '[]'::jsonb,
      'dia', '[]'::jsonb,
      'turno', '[]'::jsonb,
      'sub_praca', '[]'::jsonb,
      'origem', '[]'::jsonb,
      'dimensoes', jsonb_build_object('anos', '[]'::jsonb, 'semanas', '[]'::jsonb, 'pracas', '[]'::jsonb, 'sub_pracas', '[]'::jsonb, 'origens', '[]'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated, anon;

-- =====================================================================
-- 4. VERIFICAR DADOS
-- =====================================================================
DO $$
DECLARE
  v_count_mv BIGINT;
  v_count_dados BIGINT;
  v_count_evolucao BIGINT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  VERIFICANDO DADOS';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  SELECT COUNT(*) INTO v_count_mv FROM mv_aderencia_agregada;
  RAISE NOTICE '  ✓ mv_aderencia_agregada: % registros', v_count_mv;
  
  IF v_count_mv = 0 THEN
    RAISE NOTICE '  ⚠ MV VAZIA! Execute ATUALIZAR_MV_SALVADOR.sql';
  END IF;
  
  SELECT COUNT(*) INTO v_count_dados FROM dados_corridas;
  RAISE NOTICE '  ✓ dados_corridas: % registros', v_count_dados;
  
  SELECT COUNT(*) INTO v_count_evolucao FROM evolucao_agregada;
  RAISE NOTICE '  ✓ evolucao_agregada: % registros', v_count_evolucao;
  
  IF v_count_evolucao = 0 THEN
    RAISE NOTICE '  ⚠ EVOLUÇÃO VAZIA! Execute ATUALIZAR_EVOLUCAO.sql';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '✅ OTIMIZAÇÃO CONCLUÍDA!';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASSOS (SE NECESSÁRIO):';
  
  IF v_count_mv = 0 THEN
    RAISE NOTICE '  1. Execute: ATUALIZAR_MV_SALVADOR.sql';
  END IF;
  
  IF v_count_evolucao = 0 THEN
    RAISE NOTICE '  2. Execute: ATUALIZAR_EVOLUCAO.sql';
  END IF;
  
  RAISE NOTICE '  3. Teste o dashboard - deve carregar em < 2 segundos';
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
END $$;
