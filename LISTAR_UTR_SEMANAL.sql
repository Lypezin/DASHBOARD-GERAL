-- Função para listar evolução de UTR por semana
-- Similar a listar_evolucao_semanal, mas retorna UTR calculado

CREATE OR REPLACE FUNCTION listar_utr_semanal(
  p_ano INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_limite_semanas INTEGER DEFAULT 53
)
RETURNS TABLE (
  ano INTEGER,
  semana INTEGER,
  semana_label TEXT,
  tempo_horas NUMERIC,
  total_corridas BIGINT,
  utr NUMERIC
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
      COALESCE(tempo_disponivel_absoluto_segundos, hhmmss_to_seconds(tempo_disponivel_absoluto)) AS tempo_segundos,
      numero_de_corridas_completadas
    FROM public.dados_corridas
    WHERE data_do_periodo IS NOT NULL
      AND (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_praca IS NULL OR praca = p_praca)
  ),
  semana_agg AS (
    SELECT
      ano_iso,
      semana_numero,
      COALESCE(SUM(tempo_segundos), 0) AS tempo_total_segundos,
      COALESCE(SUM(numero_de_corridas_completadas), 0) AS total_corridas
    FROM filtered_data
    WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL
    GROUP BY ano_iso, semana_numero
  ),
  semana_utr AS (
    SELECT
      ano_iso,
      semana_numero,
      tempo_total_segundos,
      total_corridas,
      CASE
        WHEN tempo_total_segundos > 0 THEN
          ROUND((total_corridas::NUMERIC / (tempo_total_segundos / 3600.0)), 2)
        ELSE 0
      END AS utr
    FROM semana_agg
  )
  SELECT
    s.ano_iso AS ano,
    s.semana_numero AS semana,
    'Semana ' || LPAD(s.semana_numero::TEXT, 2, '0') AS semana_label,
    ROUND((s.tempo_total_segundos::NUMERIC / 3600.0), 2) AS tempo_horas,
    s.total_corridas::BIGINT AS total_corridas,
    s.utr
  FROM semana_utr s
  ORDER BY s.ano_iso DESC, s.semana_numero DESC
  LIMIT p_limite_semanas;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION listar_utr_semanal(INTEGER, TEXT, INTEGER) TO authenticated, anon;

COMMENT ON FUNCTION listar_utr_semanal(INTEGER, TEXT, INTEGER) IS 'Lista a evolução de UTR por semana, similar a listar_evolucao_semanal mas com cálculo de UTR';

