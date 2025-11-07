-- Função para listar evolução de UTR por semana
-- Similar a listar_evolucao_semanal, mas retorna UTR calculado

-- Nota: A função hhmmss_to_seconds já existe no banco e é usada por Materialized Views
-- Não vamos recriá-la para evitar conflitos. A função existente será usada.

-- Agora criar ou substituir a função listar_utr_semanal
DROP FUNCTION IF EXISTS listar_utr_semanal(INTEGER, TEXT, INTEGER);

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
      CASE
        WHEN tempo_disponivel_absoluto_segundos IS NOT NULL THEN
          tempo_disponivel_absoluto_segundos
        WHEN tempo_disponivel_absoluto IS NOT NULL THEN
          COALESCE(hhmmss_to_seconds(tempo_disponivel_absoluto), 0)
        ELSE 0
      END AS tempo_segundos,
      COALESCE(numero_de_corridas_completadas, 0) AS corridas_completadas
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
  semana_agg AS (
    SELECT
      ano_iso,
      semana_numero,
      COALESCE(SUM(tempo_segundos), 0) AS tempo_total_segundos,
      COALESCE(SUM(corridas_completadas), 0) AS total_corridas
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
    'S' || LPAD(s.semana_numero::TEXT, 2, '0') AS semana_label,
    ROUND((s.tempo_total_segundos::NUMERIC / 3600.0), 2) AS tempo_horas,
    s.total_corridas::BIGINT AS total_corridas,
    s.utr
  FROM semana_utr s
  ORDER BY s.ano_iso ASC, s.semana_numero ASC
  LIMIT p_limite_semanas;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION listar_utr_semanal(INTEGER, TEXT, INTEGER) TO authenticated, anon, service_role;

COMMENT ON FUNCTION listar_utr_semanal(INTEGER, TEXT, INTEGER) IS 'Lista a evolução de UTR por semana, similar a listar_evolucao_semanal mas com cálculo de UTR';

