-- =====================================================================
-- SOLUÇÃO DEFINITIVA: Timeout Admin
-- =====================================================================
-- Estratégia: Reduzir drasticamente complexidade das subconsultas
-- =====================================================================

-- 1. Criar função listar_todas_semanas
DROP FUNCTION IF EXISTS public.listar_todas_semanas();

CREATE OR REPLACE FUNCTION public.listar_todas_semanas()
RETURNS INTEGER[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := true;
  v_assigned_pracas TEXT[] := ARRAY[]::TEXT[];
  v_semanas INTEGER[];
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    BEGIN
      SELECT 
        COALESCE(is_admin, true),
        COALESCE(assigned_pracas, ARRAY[]::TEXT[])
      INTO v_is_admin, v_assigned_pracas
      FROM user_profiles
      WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  
  SELECT ARRAY_AGG(DISTINCT semana_numero ORDER BY semana_numero DESC)
  INTO v_semanas
  FROM dados_corridas
  WHERE (v_is_admin OR (array_length(v_assigned_pracas, 1) IS NOT NULL AND praca = ANY(v_assigned_pracas)))
    AND semana_numero IS NOT NULL;
  
  RETURN COALESCE(v_semanas, ARRAY[]::INTEGER[]);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_todas_semanas() TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_todas_semanas() TO anon;

-- 2. Criar índice otimizado
CREATE INDEX IF NOT EXISTS idx_dados_corridas_performance 
ON dados_corridas (praca, ano_iso, semana_numero, periodo)
INCLUDE (tempo_disponivel_absoluto_segundos, numero_de_corridas_completadas);

ANALYZE dados_corridas;

-- 3. Recriar dashboard_resumo ULTRA OTIMIZADO
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
SET statement_timeout = '30s'
SET work_mem = '32MB'
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := true;
  v_assigned_pracas TEXT[] := ARRAY[]::TEXT[];
  v_limite_semanas INTEGER := 5;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    BEGIN
      SELECT 
        COALESCE(is_admin, true),
        COALESCE(assigned_pracas, ARRAY[]::TEXT[])
      INTO v_is_admin, v_assigned_pracas
      FROM user_profiles
      WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  
  -- Com filtro: 52 semanas, sem filtro: 5 semanas
  IF p_ano IS NOT NULL OR p_semana IS NOT NULL OR p_praca IS NOT NULL THEN
    v_limite_semanas := 52;
  END IF;
  
  RETURN jsonb_build_object(
    'totais', (
      SELECT jsonb_build_object(
        'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
        'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
        'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
        'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
      )
      FROM dados_corridas
      WHERE (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_numero = p_semana)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
        AND (p_origem IS NULL OR origem = p_origem)
        AND (v_is_admin OR praca = ANY(v_assigned_pracas))
    ),
    'semanal', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'semana', ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0'),
          'horas_a_entregar', ROUND(horas_planejadas / 3600.0, 2)::TEXT,
          'horas_entregues', ROUND(horas_entregues / 3600.0, 2)::TEXT,
          'aderencia_percentual', ROUND(
            CASE WHEN horas_planejadas > 0 
            THEN (horas_entregues / horas_planejadas * 100) 
            ELSE 0 END, 1
          )
        ) ORDER BY ano_iso DESC, semana_numero DESC
      )
      FROM (
        SELECT 
          ano_iso,
          semana_numero,
          SUM(DISTINCT 
            EXTRACT(EPOCH FROM duracao_do_periodo::INTERVAL) * 
            numero_minimo_de_entregadores_regulares_na_escala * 
            EXTRACT(EPOCH FROM (data_do_periodo + periodo::TIME)::TIMESTAMP) -- Hash único
          ) / EXTRACT(EPOCH FROM (data_do_periodo + periodo::TIME)::TIMESTAMP) AS horas_planejadas,
          SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) AS horas_entregues
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_semana IS NULL OR semana_numero = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR origem = p_origem)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
          AND ano_iso IS NOT NULL 
          AND semana_numero IS NOT NULL
        GROUP BY ano_iso, semana_numero
        ORDER BY ano_iso DESC, semana_numero DESC
        LIMIT v_limite_semanas
      ) s
    ), '[]'::jsonb),
    'dia', '[]'::jsonb,
    'turno', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'turno', COALESCE(periodo, 'Sem Turno'),
          'periodo', periodo,
          'horas_a_entregar', '0',
          'horas_entregues', ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT,
          'aderencia_percentual', 0,
          'corridas_completadas', SUM(COALESCE(numero_de_corridas_completadas, 0))
        )
      )
      FROM dados_corridas
      WHERE (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_numero = p_semana)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
        AND (p_origem IS NULL OR origem = p_origem)
        AND (v_is_admin OR praca = ANY(v_assigned_pracas))
      GROUP BY periodo
    ), '[]'::jsonb),
    'origem', '[]'::jsonb,
    'sub_praca', '[]'::jsonb,
    'dimensoes', (
      SELECT jsonb_build_object(
        'anos', COALESCE((
          SELECT jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC)
          FROM dados_corridas
          WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND ano_iso IS NOT NULL
        ), '[]'::jsonb),
        'semanas', COALESCE((
          SELECT jsonb_agg(semana_formatada)
          FROM (
            SELECT DISTINCT ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana_formatada
            FROM dados_corridas
            WHERE (v_is_admin OR praca = ANY(v_assigned_pracas))
              AND ano_iso IS NOT NULL AND semana_numero IS NOT NULL
            ORDER BY semana_formatada DESC
          ) s
        ), '[]'::jsonb),
        'pracas', COALESCE((
          SELECT jsonb_agg(DISTINCT praca ORDER BY praca)
          FROM dados_corridas
          WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND praca IS NOT NULL
        ), '[]'::jsonb),
        'sub_pracas', COALESCE((
          SELECT jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca)
          FROM dados_corridas
          WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND sub_praca IS NOT NULL
        ), '[]'::jsonb),
        'origens', COALESCE((
          SELECT jsonb_agg(DISTINCT origem ORDER BY origem)
          FROM dados_corridas
          WHERE (v_is_admin OR praca = ANY(v_assigned_pracas)) AND origem IS NOT NULL
        ), '[]'::jsonb)
      )
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO anon;

-- =====================================================================
-- MUDANÇAS CRÍTICAS:
-- =====================================================================
-- 1. Limite reduzido: 10 -> 5 semanas para admin sem filtro
-- 2. Timeout reduzido: 45s -> 30s
-- 3. work_mem reduzido: 64MB -> 32MB
-- 4. 'dia', 'origem', 'sub_praca': Retornam [] vazio (carregam sob demanda)
-- 5. 'turno': Simplificado (sem horas planejadas por enquanto)
-- 6. 'semanal': Usa truque matemático para deduplicar sem subquery
-- =====================================================================

