-- =====================================================================
-- CRIAR FUNÇÕES PARA GUIA EVOLUÇÃO
-- =====================================================================
-- Funções para buscar dados de evolução mensal e semanal
-- =====================================================================

-- =============================================================================
-- FUNÇÃO 1: Evolução Mensal (Corridas e Horas por Mês)
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
      SUM(tempo_disponivel_absoluto_segundos) / 3600.0 AS total_horas
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
      'total_horas', ROUND(COALESCE(total_horas, 0)::NUMERIC, 2)
    )
  )
  INTO v_result
  FROM dados_mensais;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_evolucao_mensal(TEXT, INTEGER) TO authenticated;


-- =============================================================================
-- FUNÇÃO 2: Evolução Semanal (Corridas e Horas por Semana)
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
      SUM(tempo_disponivel_absoluto_segundos) / 3600.0 AS total_horas
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
      'total_horas', ROUND(COALESCE(total_horas, 0)::NUMERIC, 2)
    )
  )
  INTO v_result
  FROM dados_semanais;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_evolucao_semanal(TEXT, INTEGER, INTEGER) TO authenticated;


-- =============================================================================
-- FUNÇÃO 3: Listar Anos Disponíveis
-- =============================================================================

CREATE OR REPLACE FUNCTION public.listar_anos_disponiveis()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pracas TEXT[];
  v_is_admin BOOLEAN;
  v_result JSONB;
BEGIN
  -- Obter praças do usuário
  SELECT is_admin, assigned_pracas INTO v_is_admin, v_pracas
  FROM user_profiles
  WHERE id = auth.uid();

  -- Buscar anos disponíveis
  WITH anos AS (
    SELECT DISTINCT ano_iso AS ano
    FROM dados_corridas
    WHERE 
      (v_is_admin OR praca = ANY(v_pracas))
      AND ano_iso IS NOT NULL
    ORDER BY ano_iso DESC
  )
  SELECT jsonb_agg(ano)
  INTO v_result
  FROM anos;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_anos_disponiveis() TO authenticated;


-- =============================================================================
-- VERIFICAÇÃO
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'FUNÇÕES DE EVOLUÇÃO CRIADAS COM SUCESSO!';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'Funções disponíveis:';
  RAISE NOTICE '1. listar_evolucao_mensal(praca, ano)';
  RAISE NOTICE '2. listar_evolucao_semanal(praca, ano, limite_semanas)';
  RAISE NOTICE '3. listar_anos_disponiveis()';
  RAISE NOTICE '=============================================================';
END $$;

