-- Atualizar funções de evolução para retornar todas as métricas
-- (ofertadas, aceitas, completadas, rejeitadas, horas)

-- Remover funções antigas primeiro (necessário quando mudamos o tipo de retorno)
DROP FUNCTION IF EXISTS listar_evolucao_mensal(text, integer);
DROP FUNCTION IF EXISTS listar_evolucao_semanal(text, integer, integer);

-- Função de Evolução Mensal com todas as métricas
CREATE OR REPLACE FUNCTION listar_evolucao_mensal(
  p_praca TEXT DEFAULT NULL,
  p_ano INTEGER DEFAULT NULL
)
RETURNS TABLE (
  ano INTEGER,
  mes INTEGER,
  mes_nome TEXT,
  corridas_ofertadas BIGINT,
  corridas_aceitas BIGINT,
  corridas_completadas BIGINT,
  corridas_rejeitadas BIGINT,
  total_segundos NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_data AS (
    SELECT
      ano_iso,
      EXTRACT(MONTH FROM data_do_periodo) AS mes_numero,
      CASE EXTRACT(MONTH FROM data_do_periodo)
        WHEN 1 THEN 'Janeiro'
        WHEN 2 THEN 'Fevereiro'
        WHEN 3 THEN 'Março'
        WHEN 4 THEN 'Abril'
        WHEN 5 THEN 'Maio'
        WHEN 6 THEN 'Junho'
        WHEN 7 THEN 'Julho'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Setembro'
        WHEN 10 THEN 'Outubro'
        WHEN 11 THEN 'Novembro'
        WHEN 12 THEN 'Dezembro'
        ELSE 'Desconhecido'
      END AS mes_nome_pt,
      COALESCE(numero_de_corridas_ofertadas, 0) AS ofertadas,
      COALESCE(numero_de_corridas_aceitas, 0) AS aceitas,
      COALESCE(numero_de_corridas_completadas, 0) AS completadas,
      COALESCE(numero_de_corridas_rejeitadas, 0) AS rejeitadas,
      COALESCE(tempo_disponivel_absoluto_segundos, hhmmss_to_seconds(tempo_disponivel_absoluto)) AS tempo_segundos,
      data_do_periodo,
      periodo,
      praca,
      sub_praca,
      origem
    FROM public.dados_corridas
    WHERE data_do_periodo IS NOT NULL
      AND (p_ano IS NULL OR ano_iso = p_ano)
      AND (
        p_praca IS NULL
        OR p_praca = ''
        OR (p_praca NOT LIKE '%,%' AND praca = p_praca)
        OR (p_praca LIKE '%,%' AND praca = ANY(string_to_array(p_praca, ',')))
      )
  ),
  -- Remover duplicatas por (data_do_periodo, periodo, praca, sub_praca, origem) para horas
  -- Isso garante que as horas não sejam contadas múltiplas vezes (mesma lógica do dashboard)
  horas_sem_duplicatas_mensal AS (
    SELECT DISTINCT ON (data_do_periodo, periodo, praca, sub_praca, origem)
      ano_iso,
      EXTRACT(MONTH FROM data_do_periodo) AS mes_numero,
      tempo_segundos
    FROM filtered_data
    WHERE tempo_segundos IS NOT NULL AND tempo_segundos > 0
    ORDER BY data_do_periodo, periodo, praca, sub_praca, origem, tempo_segundos DESC
  ),
  horas_por_mes AS (
    SELECT
      ano_iso,
      mes_numero,
      SUM(tempo_segundos) AS total_segundos_horas
    FROM horas_sem_duplicatas_mensal
    GROUP BY ano_iso, mes_numero
  ),
  mes_agg AS (
    SELECT
      fd.ano_iso,
      fd.mes_numero,
      MAX(fd.mes_nome_pt) AS mes_nome,
      SUM(fd.ofertadas) AS total_ofertadas,
      SUM(fd.aceitas) AS total_aceitas,
      SUM(fd.completadas) AS total_completadas,
      SUM(fd.rejeitadas) AS total_rejeitadas,
      -- Usar horas sem duplicatas (mesma lógica do dashboard_resumo)
      COALESCE(hpm.total_segundos_horas, 0) AS total_segundos
    FROM filtered_data fd
    LEFT JOIN horas_por_mes hpm ON 
      fd.ano_iso = hpm.ano_iso 
      AND fd.mes_numero = hpm.mes_numero
    WHERE fd.ano_iso IS NOT NULL AND fd.mes_numero IS NOT NULL
    GROUP BY fd.ano_iso, fd.mes_numero, hpm.total_segundos_horas
  )
  SELECT
    m.ano_iso AS ano,
    m.mes_numero::INTEGER AS mes,
    m.mes_nome AS mes_nome,
    m.total_ofertadas::BIGINT AS corridas_ofertadas,
    m.total_aceitas::BIGINT AS corridas_aceitas,
    m.total_completadas::BIGINT AS corridas_completadas,
    m.total_rejeitadas::BIGINT AS corridas_rejeitadas,
    m.total_segundos AS total_segundos
  FROM mes_agg m
  ORDER BY m.ano_iso DESC, m.mes_numero DESC;
END;
$$;

-- Função de Evolução Semanal com todas as métricas
CREATE OR REPLACE FUNCTION listar_evolucao_semanal(
  p_praca TEXT DEFAULT NULL,
  p_ano INTEGER DEFAULT NULL,
  p_limite_semanas INTEGER DEFAULT 53
)
RETURNS TABLE (
  ano INTEGER,
  semana INTEGER,
  semana_label TEXT,
  corridas_ofertadas BIGINT,
  corridas_aceitas BIGINT,
  corridas_completadas BIGINT,
  corridas_rejeitadas BIGINT,
  total_segundos NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_data AS (
    SELECT
      ano_iso,
      semana_numero,
      data_do_periodo,
      periodo,
      praca,
      sub_praca,
      origem,
      COALESCE(numero_de_corridas_ofertadas, 0) AS ofertadas,
      COALESCE(numero_de_corridas_aceitas, 0) AS aceitas,
      COALESCE(numero_de_corridas_completadas, 0) AS completadas,
      COALESCE(numero_de_corridas_rejeitadas, 0) AS rejeitadas,
      COALESCE(tempo_disponivel_absoluto_segundos, hhmmss_to_seconds(tempo_disponivel_absoluto)) AS tempo_segundos
    FROM public.dados_corridas
    WHERE data_do_periodo IS NOT NULL
      AND (p_ano IS NULL OR ano_iso = p_ano)
      AND (
        p_praca IS NULL
        OR p_praca = ''
        OR (p_praca NOT LIKE '%,%' AND praca = p_praca)
        OR (p_praca LIKE '%,%' AND praca = ANY(string_to_array(p_praca, ',')))
      )
  ),
  -- Remover duplicatas por (data_do_periodo, periodo, praca, sub_praca, origem) para horas
  -- Isso garante que as horas não sejam contadas múltiplas vezes (mesma lógica do dashboard)
  horas_sem_duplicatas AS (
    SELECT DISTINCT ON (data_do_periodo, periodo, praca, sub_praca, origem)
      ano_iso,
      semana_numero,
      tempo_segundos
    FROM filtered_data
    WHERE tempo_segundos IS NOT NULL AND tempo_segundos > 0
    ORDER BY data_do_periodo, periodo, praca, sub_praca, origem, tempo_segundos DESC
  ),
  horas_por_semana AS (
    SELECT
      ano_iso,
      semana_numero,
      SUM(tempo_segundos) AS total_segundos_horas
    FROM horas_sem_duplicatas
    GROUP BY ano_iso, semana_numero
  ),
  semana_agg AS (
    SELECT
      fd.ano_iso,
      fd.semana_numero,
      SUM(fd.ofertadas) AS total_ofertadas,
      SUM(fd.aceitas) AS total_aceitas,
      SUM(fd.completadas) AS total_completadas,
      SUM(fd.rejeitadas) AS total_rejeitadas,
      -- Usar horas sem duplicatas (mesma lógica do dashboard_resumo)
      COALESCE(hps.total_segundos_horas, 0) AS total_segundos
    FROM filtered_data fd
    LEFT JOIN horas_por_semana hps ON 
      fd.ano_iso = hps.ano_iso 
      AND fd.semana_numero = hps.semana_numero
    WHERE fd.ano_iso IS NOT NULL AND fd.semana_numero IS NOT NULL
    GROUP BY fd.ano_iso, fd.semana_numero, hps.total_segundos_horas
  )
  SELECT
    s.ano_iso AS ano,
    s.semana_numero AS semana,
    'Semana ' || LPAD(s.semana_numero::TEXT, 2, '0') AS semana_label,
    s.total_ofertadas::BIGINT AS corridas_ofertadas,
    s.total_aceitas::BIGINT AS corridas_aceitas,
    s.total_completadas::BIGINT AS corridas_completadas,
    s.total_rejeitadas::BIGINT AS corridas_rejeitadas,
    s.total_segundos AS total_segundos
  FROM semana_agg s
  ORDER BY s.ano_iso DESC, s.semana_numero DESC
  LIMIT p_limite_semanas;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION listar_evolucao_mensal(TEXT, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION listar_evolucao_semanal(TEXT, INTEGER, INTEGER) TO authenticated, anon;

COMMENT ON FUNCTION listar_evolucao_mensal(TEXT, INTEGER) IS 'Lista evolução mensal com todas as métricas de corridas (ofertadas, aceitas, completadas, rejeitadas) e horas';
COMMENT ON FUNCTION listar_evolucao_semanal(TEXT, INTEGER, INTEGER) IS 'Lista evolução semanal com todas as métricas de corridas (ofertadas, aceitas, completadas, rejeitadas) e horas';

