-- ===================================================================
-- Funções do Dashboard (aplicar no SQL Editor do Supabase)
-- ===================================================================

-- 1. Funções auxiliares ------------------------------------------------
DROP FUNCTION IF EXISTS public.normalize_time_to_hhmmss(text);
DROP FUNCTION IF EXISTS public.hhmmss_to_seconds(text);

CREATE OR REPLACE FUNCTION public.normalize_time_to_hhmmss(input_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text := '00:00:00';
BEGIN
  IF input_value IS NULL OR trim(input_value) = '' THEN
    RETURN result;
  END IF;

  input_value := trim(input_value);

  IF input_value LIKE '%T%:%:%Z' THEN
    result := split_part(split_part(input_value, 'T', 2), '.', 1);

  ELSIF input_value ~ '^[0-9]+\\.[0-9]+$' THEN
    DECLARE
      total_seconds int := round((input_value::numeric * 86400)::numeric);
      hours int := floor(total_seconds / 3600);
      minutes int := floor((total_seconds % 3600) / 60);
      seconds int := total_seconds % 60;
    BEGIN
      result := lpad(hours::text, 2, '0') || ':' ||
                lpad(minutes::text, 2, '0') || ':' ||
                lpad(seconds::text, 2, '0');
    END;

  ELSIF input_value ~ '^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$' THEN
    result := input_value;
  ELSE
    result := input_value;
  END IF;

  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.hhmmss_to_seconds(value text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  hh int;
  mm int;
  ss int;
BEGIN
  IF value IS NULL OR trim(value) = '' THEN
    RETURN 0;
  END IF;

  BEGIN
    RETURN EXTRACT(EPOCH FROM value::interval);
  EXCEPTION WHEN others THEN
    BEGIN
      SELECT split_part(value, ':', 1)::int,
             split_part(value, ':', 2)::int,
             split_part(value, ':', 3)::int
      INTO hh, mm, ss;
      RETURN hh * 3600 + mm * 60 + ss;
    EXCEPTION WHEN others THEN
      RETURN 0;
    END;
  END;
END $$;

-- 2. RPC listar_dimensoes_dashboard -----------------------------------
DROP FUNCTION IF EXISTS public.listar_dimensoes_dashboard();

CREATE OR REPLACE FUNCTION public.listar_dimensoes_dashboard()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH base AS (
  SELECT
    data_do_periodo,
    praca,
    sub_praca,
    origem
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
),
anos AS (
  SELECT COALESCE(array_agg(val), ARRAY[]::integer[]) AS values
  FROM (SELECT DISTINCT date_part('isoyear', data_do_periodo)::int AS val FROM base ORDER BY val) t
),
semanas AS (
  SELECT COALESCE(array_agg(val), ARRAY[]::integer[]) AS values
  FROM (SELECT DISTINCT date_part('week', data_do_periodo)::int AS val FROM base ORDER BY val) t
),
pracas AS (
  SELECT COALESCE(array_agg(val), ARRAY[]::text[]) AS values
  FROM (SELECT DISTINCT praca AS val FROM base WHERE praca IS NOT NULL ORDER BY val) t
),
sub_pracas AS (
  SELECT COALESCE(array_agg(val), ARRAY[]::text[]) AS values
  FROM (SELECT DISTINCT sub_praca AS val FROM base WHERE sub_praca IS NOT NULL ORDER BY val) t
),
origens AS (
  SELECT COALESCE(array_agg(val), ARRAY[]::text[]) AS values
  FROM (SELECT DISTINCT origem AS val FROM base WHERE origem IS NOT NULL ORDER BY val) t
),
sub_por_praca AS (
  SELECT COALESCE(jsonb_object_agg(praca, subs), '{}'::jsonb) AS mapping
  FROM (
    SELECT praca, to_jsonb(array_agg(sub_praca ORDER BY sub_praca)) AS subs
    FROM (
      SELECT DISTINCT praca, sub_praca
      FROM base
      WHERE praca IS NOT NULL AND sub_praca IS NOT NULL
    ) distinct_sub
    GROUP BY praca
  ) mapa
)
SELECT jsonb_build_object(
  'anos', to_jsonb(anos.values),
  'semanas', to_jsonb(semanas.values),
  'pracas', to_jsonb(pracas.values),
  'sub_pracas', to_jsonb(sub_pracas.values),
  'origens', to_jsonb(origens.values),
  'map_sub_praca', COALESCE(sub_por_praca.mapping, '{}'::jsonb)
)
FROM anos, semanas, pracas, sub_pracas, origens, sub_por_praca;
$$;

GRANT EXECUTE ON FUNCTION public.listar_dimensoes_dashboard()
  TO anon, authenticated, service_role;

-- 3. RPC dashboard_resumo ----------------------------------------------
DROP FUNCTION IF EXISTS public.dashboard_resumo(
  integer,
  integer,
  text,
  text,
  text
);

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH base AS (
  SELECT
    data_do_periodo,
    periodo,
    praca,
    sub_praca,
    origem,
    numero_minimo_de_entregadores_regulares_na_escala,
    COALESCE(duracao_segundos, hhmmss_to_seconds(duracao_do_periodo)) AS duracao_segundos,
    COALESCE(tempo_disponivel_absoluto_segundos, hhmmss_to_seconds(tempo_disponivel_absoluto)) AS tempo_absoluto_segundos,
    numero_de_corridas_ofertadas,
    numero_de_corridas_aceitas,
    numero_de_corridas_rejeitadas,
    numero_de_corridas_completadas
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND (p_ano IS NULL OR date_part('isoyear', data_do_periodo)::int = p_ano)
    AND (p_semana IS NULL OR date_part('week', data_do_periodo)::int = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
),

-- Totais gerais
res_totais AS (
  SELECT jsonb_build_object(
    'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
    'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
    'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
    'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
  ) AS data
  FROM base
),

-- Aderência semanal
turnos_semanais AS (
  SELECT DISTINCT ON (
      date_part('isoyear', data_do_periodo)::int,
      date_part('week', data_do_periodo)::int,
      data_do_periodo,
      periodo,
      numero_minimo_de_entregadores_regulares_na_escala
    )
    date_part('isoyear', data_do_periodo)::int AS ano_iso,
    date_part('week', data_do_periodo)::int AS semana_numero,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos
  FROM base
  WHERE duracao_segundos > 0
  ORDER BY
    date_part('isoyear', data_do_periodo)::int,
    date_part('week', data_do_periodo)::int,
    data_do_periodo,
    periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos DESC
),
planejado_semana AS (
  SELECT
    ano_iso,
    semana_numero,
    SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
  FROM turnos_semanais
  GROUP BY ano_iso, semana_numero
),
realizado_semana AS (
  SELECT
    date_part('isoyear', data_do_periodo)::int AS ano_iso,
    date_part('week', data_do_periodo)::int AS semana_numero,
    SUM(tempo_absoluto_segundos) AS segundos_realizados
  FROM base
  WHERE tempo_absoluto_segundos > 0
  GROUP BY 1, 2
),
res_semana AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'semana', 'Semana ' || LPAD(hp.semana_numero::text, 2, '0')) ORDER BY hp.ano_iso DESC, hp.semana_numero DESC), '[]'::jsonb)
         || jsonb_agg DISTINCT NULL
  FROM (
    SELECT
      hp.ano_iso,
      hp.semana_numero,
      'Semana ' || LPAD(hp.semana_numero::text, 2, '0') AS semana,
      TO_CHAR(INTERVAL '1 second' * COALESCE(hp.segundos_planejados, 0), 'HH24:MI:SS') AS horas_a_entregar,
      TO_CHAR(INTERVAL '1 second' * COALESCE(hr.segundos_realizados, 0), 'HH24:MI:SS') AS horas_entregues,
      CASE WHEN COALESCE(hp.segundos_planejados, 0) > 0 THEN ROUND((COALESCE(hr.segundos_realizados, 0) / hp.segundos_planejados) * 100, 2) ELSE 0 END AS aderencia_percentual
    FROM planejado_semana hp
    LEFT JOIN realizado_semana hr USING (ano_iso, semana_numero)
  ) dados
),

-- Aderência por dia
turnos_dia AS (
  SELECT DISTINCT ON (data_do_periodo::date, periodo, numero_minimo_de_entregadores_regulares_na_escala)
    data_do_periodo::date AS data_ref,
    date_part('isodow', data_do_periodo)::int AS dia_iso,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos
  FROM base
  WHERE duracao_segundos > 0
  ORDER BY data_do_periodo::date, periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos DESC
),
planejado_dia AS (
  SELECT
    dia_iso,
    SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
  FROM turnos_dia
  GROUP BY dia_iso
),
realizado_dia AS (
  SELECT
    date_part('isodow', data_do_periodo)::int AS dia_iso,
    SUM(tempo_absoluto_segundos) AS segundos_realizados
  FROM base
  WHERE tempo_absoluto_segundos > 0
  GROUP BY 1
),
res_dia AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'dia_iso', hp.dia_iso,
    'dia_da_semana', CASE hp.dia_iso
      WHEN 1 THEN 'Segunda'
      WHEN 2 THEN 'Terça'
      WHEN 3 THEN 'Quarta'
      WHEN 4 THEN 'Quinta'
      WHEN 5 THEN 'Sexta'
      WHEN 6 THEN 'Sábado'
      WHEN 7 THEN 'Domingo'
      ELSE 'N/D' END,
    'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(hp.segundos_planejados, 0), 'HH24:MI:SS'),
    'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(hr.segundos_realizados, 0), 'HH24:MI:SS'),
    'aderencia_percentual', CASE WHEN COALESCE(hp.segundos_planejados, 0) > 0 THEN ROUND((COALESCE(hr.segundos_realizados, 0) / hp.segundos_planejados) * 100, 2) ELSE 0 END
  ) ORDER BY hp.dia_iso), '[]'::jsonb)
  FROM planejado_dia hp
  LEFT JOIN realizado_dia hr USING (dia_iso)
),

-- Aderência por turno
turnos_periodo AS (
  SELECT DISTINCT ON (data_do_periodo::date, periodo, numero_minimo_de_entregadores_regulares_na_escala)
    periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos
  FROM base
  WHERE periodo IS NOT NULL AND duracao_segundos > 0
  ORDER BY data_do_periodo::date, periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos DESC
),
planejado_turno AS (
  SELECT periodo, SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
  FROM turnos_periodo
  GROUP BY periodo
),
realizado_turno AS (
  SELECT periodo, SUM(tempo_absoluto_segundos) AS segundos_realizados
  FROM base
  WHERE periodo IS NOT NULL AND tempo_absoluto_segundos > 0
  GROUP BY periodo
),
res_turno AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'periodo', hp.periodo,
    'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(hp.segundos_planejados, 0), 'HH24:MI:SS'),
    'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(hr.segundos_realizados, 0), 'HH24:MI:SS'),
    'aderencia_percentual', CASE WHEN COALESCE(hp.segundos_planejados, 0) > 0 THEN ROUND((COALESCE(hr.segundos_realizados, 0) / hp.segundos_planejados) * 100, 2) ELSE 0 END
  ) ORDER BY hp.periodo), '[]'::jsonb)
  FROM planejado_turno hp
  LEFT JOIN realizado_turno hr USING (periodo)
),

-- Aderência por sub praça
turnos_sub AS (
  SELECT DISTINCT ON (data_do_periodo::date, sub_praca, periodo, numero_minimo_de_entregadores_regulares_na_escala)
    sub_praca,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos
  FROM base
  WHERE sub_praca IS NOT NULL AND duracao_segundos > 0
  ORDER BY data_do_periodo::date, sub_praca, periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos DESC
),
planejado_sub AS (
  SELECT sub_praca, SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
  FROM turnos_sub
  GROUP BY sub_praca
),
realizado_sub AS (
  SELECT sub_praca, SUM(tempo_absoluto_segundos) AS segundos_realizados
  FROM base
  WHERE sub_praca IS NOT NULL AND tempo_absoluto_segundos > 0
  GROUP BY sub_praca
),
res_sub AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'sub_praca', hp.sub_praca,
    'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(hp.segundos_planejados, 0), 'HH24:MI:SS'),
    'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(hr.segundos_realizados, 0), 'HH24:MI:SS'),
    'aderencia_percentual', CASE WHEN COALESCE(hp.segundos_planejados, 0) > 0 THEN ROUND((COALESCE(hr.segundos_realizados, 0) / hp.segundos_planejados) * 100, 2) ELSE 0 END
  ) ORDER BY hp.sub_praca), '[]'::jsonb)
  FROM planejado_sub hp
  LEFT JOIN realizado_sub hr USING (sub_praca)
),

-- Aderência por origem
turnos_origem AS (
  SELECT DISTINCT ON (data_do_periodo::date, origem, periodo, numero_minimo_de_entregadores_regulares_na_escala)
    origem,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos
  FROM base
  WHERE origem IS NOT NULL AND duracao_segundos > 0
  ORDER BY data_do_periodo::date, origem, periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos DESC
),
planejado_origem AS (
  SELECT origem, SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
  FROM turnos_origem
  GROUP BY origem
),
realizado_origem AS (
  SELECT origem, SUM(tempo_absoluto_segundos) AS segundos_realizados
  FROM base
  WHERE origem IS NOT NULL AND tempo_absoluto_segundos > 0
  GROUP BY origem
),
res_origem AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'origem', hp.origem,
    'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(hp.segundos_planejados, 0), 'HH24:MI:SS'),
    'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(hr.segundos_realizados, 0), 'HH24:MI:SS'),
    'aderencia_percentual', CASE WHEN COALESCE(hp.segundos_planejados, 0) > 0 THEN ROUND((COALESCE(hr.segundos_realizados, 0) / hp.segundos_planejados) * 100, 2) ELSE 0 END
  ) ORDER BY hp.origem), '[]'::jsonb)
  FROM planejado_origem hp
  LEFT JOIN realizado_origem hr USING (origem)
)
SELECT jsonb_build_object(
  'totais', (SELECT data FROM res_totais),
  'semanal', (SELECT data FROM res_semana),
  'dia', (SELECT data FROM res_dia),
  'turno', (SELECT data FROM res_turno),
  'sub_praca', (SELECT data FROM res_sub),
  'origem', (SELECT data FROM res_origem)
);
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(integer, integer, text, text, text)
  TO anon, authenticated, service_role;

