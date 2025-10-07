-- Funções RPC para a dashboard (execute cada seção no SQL Editor do Supabase)

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

GRANT EXECUTE ON FUNCTION public.dashboard_totals() TO anon, authenticated, service_role;

-- 2. Função auxiliar: converte texto HH:MM:SS para segundos
DROP FUNCTION IF EXISTS public.hhmmss_to_seconds(text);

CREATE OR REPLACE FUNCTION public.hhmmss_to_seconds(value text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  parts text[];
BEGIN
  IF value IS NULL OR trim(value) = '' THEN
    RETURN 0;
  END IF;

  BEGIN
    RETURN EXTRACT(EPOCH FROM value::interval);
  EXCEPTION WHEN others THEN
    parts := regexp_split_to_array(value, ':');
    IF array_length(parts, 1) = 3 THEN
      RETURN COALESCE(parts[1]::numeric, 0) * 3600
           + COALESCE(parts[2]::numeric, 0) * 60
           + COALESCE(parts[3]::numeric, 0);
    ELSE
      RETURN 0;
    END IF;
  END;
END;
$$;

-- 3. Aderência semanal (corrigido)
DROP FUNCTION IF EXISTS public.calcular_aderencia_semanal();

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
WITH base AS (
  SELECT
    date_part('isoyear', data_do_periodo)::int AS ano_iso,
    date_part('week', data_do_periodo)::int AS semana_numero,
    data_do_periodo,
    periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    hhmmss_to_seconds(duracao_do_periodo) AS duracao_segundos,
    hhmmss_to_seconds(tempo_disponivel_absoluto) AS tempo_disponivel_segundos
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
),
unique_turnos AS (
  SELECT DISTINCT ON (
      ano_iso,
      semana_numero,
      data_do_periodo,
      periodo,
      numero_minimo_de_entregadores_regulares_na_escala
    )
    ano_iso,
    semana_numero,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos
  FROM base
  WHERE duracao_segundos > 0
  ORDER BY
    ano_iso,
    semana_numero,
    data_do_periodo,
    periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos DESC
),
horas_planejadas AS (
  SELECT
    ano_iso,
    semana_numero,
    SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
  FROM unique_turnos
  GROUP BY ano_iso, semana_numero
),
horas_realizadas AS (
  SELECT
    ano_iso,
    semana_numero,
    SUM(tempo_disponivel_segundos) AS segundos_realizados
  FROM base
  WHERE tempo_disponivel_segundos > 0
  GROUP BY ano_iso, semana_numero
),
semanas AS (
  SELECT DISTINCT ano_iso, semana_numero FROM base
)
SELECT
  'Semana ' || LPAD(semana_numero::text, 2, '0') AS semana,
  TO_CHAR(
    INTERVAL '1 second' * COALESCE(segundos_planejados, 0),
    'HH24:MI:SS'
  ) AS horas_a_entregar,
  TO_CHAR(
    INTERVAL '1 second' * COALESCE(segundos_realizados, 0),
    'HH24:MI:SS'
  ) AS horas_entregues,
  CASE
    WHEN COALESCE(segundos_planejados, 0) > 0 THEN
      ROUND((COALESCE(segundos_realizados, 0) / segundos_planejados) * 100, 2)
    ELSE 0
  END AS aderencia_percentual
FROM semanas s
LEFT JOIN horas_planejadas hp USING (ano_iso, semana_numero)
LEFT JOIN horas_realizadas hr USING (ano_iso, semana_numero)
ORDER BY ano_iso DESC, semana_numero DESC;
$$;

GRANT EXECUTE ON FUNCTION public.calcular_aderencia_semanal() TO anon, authenticated, service_role;

-- 4. Aderência por dia (data)
DROP FUNCTION IF EXISTS public.calcular_aderencia_por_dia();

CREATE OR REPLACE FUNCTION public.calcular_aderencia_por_dia()
RETURNS TABLE (
  dia_iso integer,
  dia_da_semana text,
  horas_a_entregar text,
  horas_entregues text,
  aderencia_percentual numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH base AS (
  SELECT
    data_do_periodo::date AS data_ref,
    periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    hhmmss_to_seconds(duracao_do_periodo) AS duracao_segundos,
    hhmmss_to_seconds(tempo_disponivel_absoluto) AS tempo_disponivel_segundos
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
),
unique_turnos AS (
  SELECT DISTINCT ON (
      data_ref,
      periodo,
      numero_minimo_de_entregadores_regulares_na_escala
    )
    date_part('isodow', data_ref)::int AS dia_iso,
    trim(to_char(data_ref, 'TMDay')) AS dia_nome,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos
  FROM base
  WHERE duracao_segundos > 0
  ORDER BY
    data_ref,
    periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos DESC
),
horas_planejadas AS (
  SELECT
    dia_iso,
    dia_nome,
    SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
  FROM unique_turnos
  GROUP BY dia_iso, dia_nome
),
horas_realizadas AS (
  SELECT
    date_part('isodow', data_ref)::int AS dia_iso,
    trim(to_char(data_ref, 'TMDay')) AS dia_nome,
    SUM(tempo_disponivel_segundos) AS segundos_realizados
  FROM base
  WHERE tempo_disponivel_segundos > 0
  GROUP BY date_part('isodow', data_ref)::int, trim(to_char(data_ref, 'TMDay'))
)
SELECT
  hp.dia_iso,
  INITCAP(hp.dia_nome) AS dia_da_semana,
  TO_CHAR(
    INTERVAL '1 second' * COALESCE(hp.segundos_planejados, 0),
    'HH24:MI:SS'
  ) AS horas_a_entregar,
  TO_CHAR(
    INTERVAL '1 second' * COALESCE(hr.segundos_realizados, 0),
    'HH24:MI:SS'
  ) AS horas_entregues,
  CASE
    WHEN COALESCE(hp.segundos_planejados, 0) > 0 THEN
      ROUND((COALESCE(hr.segundos_realizados, 0) / hp.segundos_planejados) * 100, 2)
    ELSE 0
  END AS aderencia_percentual
FROM horas_planejadas hp
LEFT JOIN horas_realizadas hr USING (dia_iso, dia_nome)
ORDER BY hp.dia_iso;
$$;

GRANT EXECUTE ON FUNCTION public.calcular_aderencia_por_dia() TO anon, authenticated, service_role;

-- 5. Aderência por turno (período)
DROP FUNCTION IF EXISTS public.calcular_aderencia_por_turno();

CREATE OR REPLACE FUNCTION public.calcular_aderencia_por_turno()
RETURNS TABLE (
  periodo text,
  horas_a_entregar text,
  horas_entregues text,
  aderencia_percentual numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH base AS (
  SELECT
    data_do_periodo::date AS data_ref,
    periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    hhmmss_to_seconds(duracao_do_periodo) AS duracao_segundos,
    hhmmss_to_seconds(tempo_disponivel_absoluto) AS tempo_disponivel_segundos
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND periodo IS NOT NULL
),
unique_turnos AS (
  SELECT DISTINCT ON (
      data_ref,
      periodo,
      numero_minimo_de_entregadores_regulares_na_escala
    )
    periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos
  FROM base
  WHERE duracao_segundos > 0
  ORDER BY
    data_ref,
    periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos DESC
),
horas_planejadas AS (
  SELECT
    periodo,
    SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
  FROM unique_turnos
  GROUP BY periodo
),
horas_realizadas AS (
  SELECT
    periodo,
    SUM(tempo_disponivel_segundos) AS segundos_realizados
  FROM base
  WHERE tempo_disponivel_segundos > 0
  GROUP BY periodo
)
SELECT
  hp.periodo,
  TO_CHAR(
    INTERVAL '1 second' * COALESCE(hp.segundos_planejados, 0),
    'HH24:MI:SS'
  ) AS horas_a_entregar,
  TO_CHAR(
    INTERVAL '1 second' * COALESCE(hr.segundos_realizados, 0),
    'HH24:MI:SS'
  ) AS horas_entregues,
  CASE
    WHEN COALESCE(hp.segundos_planejados, 0) > 0 THEN
      ROUND((COALESCE(hr.segundos_realizados, 0) / hp.segundos_planejados) * 100, 2)
    ELSE 0
  END AS aderencia_percentual
FROM horas_planejadas hp
LEFT JOIN horas_realizadas hr USING (periodo)
ORDER BY hp.periodo;
$$;

GRANT EXECUTE ON FUNCTION public.calcular_aderencia_por_turno() TO anon, authenticated, service_role;

