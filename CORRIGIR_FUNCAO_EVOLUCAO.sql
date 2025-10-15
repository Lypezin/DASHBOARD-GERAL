-- =====================================================================
-- CORRIGIR FUNÇÕES DE EVOLUÇÃO
-- =====================================================================
-- 1. Retornar horas em segundos para formatação correta no frontend
-- 2. Corrigir filtro de praças para usuários não-admin
-- =====================================================================

-- =============================================================================
-- FUNÇÃO 1: Evolução Mensal (CORRIGIDA)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.listar_evolucao_mensal(
  p_praca TEXT DEFAULT NULL,
  p_ano INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pracas TEXT[];
  v_is_admin BOOLEAN;
  v_ano INTEGER;
  v_result JSONB;
BEGIN
  -- Obter praças do usuário
  SELECT is_admin, assigned_pracas INTO v_is_admin, v_pracas
  FROM user_profiles
  WHERE id = auth.uid();

  -- Se não encontrou o usuário, retornar vazio
  IF v_is_admin IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Se não for admin e não tiver praças, retornar vazio
  IF NOT v_is_admin AND (v_pracas IS NULL OR array_length(v_pracas, 1) = 0) THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Definir ano (padrão: ano atual)
  v_ano := COALESCE(p_ano, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

  -- Buscar dados agregados por mês
  WITH dados_mensais AS (
    SELECT
      EXTRACT(YEAR FROM data_do_periodo)::INTEGER AS ano,
      EXTRACT(MONTH FROM data_do_periodo)::INTEGER AS mes,
      CASE EXTRACT(MONTH FROM data_do_periodo)::INTEGER
        WHEN 1 THEN 'Jan'
        WHEN 2 THEN 'Fev'
        WHEN 3 THEN 'Mar'
        WHEN 4 THEN 'Abr'
        WHEN 5 THEN 'Mai'
        WHEN 6 THEN 'Jun'
        WHEN 7 THEN 'Jul'
        WHEN 8 THEN 'Ago'
        WHEN 9 THEN 'Set'
        WHEN 10 THEN 'Out'
        WHEN 11 THEN 'Nov'
        WHEN 12 THEN 'Dez'
      END AS mes_nome,
      SUM(numero_de_corridas_completadas) AS total_corridas,
      SUM(tempo_disponivel_absoluto_segundos) AS total_segundos
    FROM dados_corridas
    WHERE 
      EXTRACT(YEAR FROM data_do_periodo) = v_ano
      AND (v_is_admin OR praca = ANY(v_pracas))
      AND (p_praca IS NULL OR praca = p_praca)
      AND data_do_periodo IS NOT NULL
      AND numero_de_corridas_completadas IS NOT NULL
      AND tempo_disponivel_absoluto_segundos IS NOT NULL
    GROUP BY 
      EXTRACT(YEAR FROM data_do_periodo),
      EXTRACT(MONTH FROM data_do_periodo)
    ORDER BY ano, mes
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'ano', ano,
      'mes', mes,
      'mes_nome', mes_nome,
      'total_corridas', COALESCE(total_corridas, 0),
      'total_segundos', COALESCE(total_segundos, 0)
    )
  )
  INTO v_result
  FROM dados_mensais;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_evolucao_mensal(TEXT, INTEGER) TO authenticated;


-- =============================================================================
-- FUNÇÃO 2: Evolução Semanal (CORRIGIDA)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.listar_evolucao_semanal(
  p_praca TEXT DEFAULT NULL,
  p_ano INTEGER DEFAULT NULL,
  p_limite_semanas INTEGER DEFAULT 52
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pracas TEXT[];
  v_is_admin BOOLEAN;
  v_ano INTEGER;
  v_result JSONB;
BEGIN
  -- Obter praças do usuário
  SELECT is_admin, assigned_pracas INTO v_is_admin, v_pracas
  FROM user_profiles
  WHERE id = auth.uid();

  -- Se não encontrou o usuário, retornar vazio
  IF v_is_admin IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Se não for admin e não tiver praças, retornar vazio
  IF NOT v_is_admin AND (v_pracas IS NULL OR array_length(v_pracas, 1) = 0) THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Definir ano (padrão: ano atual)
  v_ano := COALESCE(p_ano, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

  -- Buscar dados agregados por semana
  WITH dados_semanais AS (
    SELECT
      ano_iso,
      semana_numero,
      SUM(numero_de_corridas_completadas) AS total_corridas,
      SUM(tempo_disponivel_absoluto_segundos) AS total_segundos
    FROM dados_corridas
    WHERE 
      ano_iso = v_ano
      AND (v_is_admin OR praca = ANY(v_pracas))
      AND (p_praca IS NULL OR praca = p_praca)
      AND semana_numero IS NOT NULL
      AND numero_de_corridas_completadas IS NOT NULL
      AND tempo_disponivel_absoluto_segundos IS NOT NULL
    GROUP BY ano_iso, semana_numero
    ORDER BY ano_iso, semana_numero
    LIMIT p_limite_semanas
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'ano', ano_iso,
      'semana', semana_numero,
      'semana_label', ano_iso || ' Semana ' || semana_numero,
      'total_corridas', COALESCE(total_corridas, 0),
      'total_segundos', COALESCE(total_segundos, 0)
    )
  )
  INTO v_result
  FROM dados_semanais;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_evolucao_semanal(TEXT, INTEGER, INTEGER) TO authenticated;


-- =============================================================================
-- VERIFICAÇÃO
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'FUNÇÕES DE EVOLUÇÃO CORRIGIDAS COM SUCESSO!';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'Mudanças aplicadas:';
  RAISE NOTICE '1. Horas agora retornam em segundos (total_segundos)';
  RAISE NOTICE '2. Filtro de praças corrigido para usuários não-admin';
  RAISE NOTICE '3. Verificação de usuário aprimorada';
  RAISE NOTICE '=============================================================';
END $$;

