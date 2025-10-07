-- Funções RPC para Dashboard (evita limite de 1000 linhas)
-- Execute no SQL Editor do Supabase

-- 1. Totais de corridas
DROP FUNCTION IF EXISTS public.dashboard_totals();

CREATE OR REPLACE FUNCTION public.dashboard_totals()
RETURNS TABLE (
  corridas_ofertadas numeric,
  corridas_aceitas numeric,
  corridas_rejeitadas numeric,
  corridas_completadas numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(numero_de_corridas_ofertadas), 0) AS corridas_ofertadas,
    COALESCE(SUM(numero_de_corridas_aceitas), 0) AS corridas_aceitas,
    COALESCE(SUM(numero_de_corridas_rejeitadas), 0) AS corridas_rejeitadas,
    COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas
  FROM public.dados_corridas;
$$;

-- 2. Cálculo de Aderência (semanal)
CREATE OR REPLACE FUNCTION public.calcular_aderencia_semanal()
RETURNS TABLE (
  semana text,
  horas_a_entregar text,
  horas_entregues text,
  aderencia_percentual numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH dados_unicos AS (
  -- Remove duplicatas baseado em data, período e escala mínima (como no Excel)
  SELECT DISTINCT
    data_do_periodo,
    periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_do_periodo
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND periodo IS NOT NULL
    AND numero_minimo_de_entregadores_regulares_na_escala IS NOT NULL
    AND duracao_do_periodo IS NOT NULL
    AND duracao_do_periodo != '00:00:00'
),
horas_por_semana AS (
  SELECT
    -- Extrai a semana do ano (formato: "Semana XX")
    'Semana ' || TO_CHAR(du.data_do_periodo, 'WW') AS semana,
    -- Calcula horas a entregar: escala * duração (em segundos)
    SUM(
      du.numero_minimo_de_entregadores_regulares_na_escala *
      (EXTRACT(EPOCH FROM (du.duracao_do_periodo::interval)) / 3600.0)
    ) AS horas_a_entregar_segundos,
    -- Soma das horas entregues (tempo_disponivel_absoluto convertido para segundos)
    COALESCE(
      SUM(EXTRACT(EPOCH FROM (dc.tempo_disponivel_absoluto::interval))),
      0
    ) AS horas_entregues_segundos
  FROM dados_unicos du
  LEFT JOIN public.dados_corridas dc ON
    du.data_do_periodo = dc.data_do_periodo AND
    du.periodo = dc.periodo AND
    du.numero_minimo_de_entregadores_regulares_na_escala = dc.numero_minimo_de_entregadores_regulares_na_escala
  GROUP BY TO_CHAR(du.data_do_periodo, 'WW')
  ORDER BY semana DESC
)
SELECT
  semana,
  -- Converte segundos para HH:MM:SS
  TO_CHAR(
    INTERVAL '1 second' * FLOOR(horas_a_entregar_segundos),
    'HH24:MI:SS'
  ) AS horas_a_entregar,
  TO_CHAR(
    INTERVAL '1 second' * FLOOR(horas_entregues_segundos),
    'HH24:MI:SS'
  ) AS horas_entregues,
  -- Calcula percentual de aderência
  CASE
    WHEN horas_a_entregar_segundos > 0 THEN
      ROUND((horas_entregues_segundos / horas_a_entregar_segundos) * 100, 2)
    ELSE 0
  END AS aderencia_percentual
FROM horas_por_semana;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_totals() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calcular_aderencia_semanal() TO anon, authenticated, service_role;