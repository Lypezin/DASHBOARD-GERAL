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
SET search_path = public, statement_timeout = '120000ms'
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

-- Totais gerais -------------------------------------------------------
res_totais AS (
  SELECT jsonb_build_object(
    'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
    'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
    'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
    'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
  ) AS data
  FROM base
),

-- Preparação de turnos planejados sem duplicidade --------------------
turnos_planejados AS (
  SELECT
    date_trunc('day', data_do_periodo) AS dia_ref,
    date_part('isoyear', data_do_periodo)::int AS ano_iso,
    date_part('week', data_do_periodo)::int AS semana_numero,
    date_part('isodow', data_do_periodo)::int AS dia_iso,
    periodo,
    praca,
    sub_praca,
    origem,
    numero_minimo_de_entregadores_regulares_na_escala,
    MAX(duracao_segundos) AS duracao_segundos
  FROM base
  WHERE duracao_segundos > 0
  GROUP BY
    date_trunc('day', data_do_periodo),
    date_part('isoyear', data_do_periodo)::int,
    date_part('week', data_do_periodo)::int,
    date_part('isodow', data_do_periodo)::int,
    periodo,
    praca,
    sub_praca,
    origem,
    numero_minimo_de_entregadores_regulares_na_escala
),

-- Aderência semanal ---------------------------------------------------
planejado_semana AS (
  SELECT
    ano_iso,
    semana_numero,
    SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
  FROM turnos_planejados
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
semana_union AS (
  SELECT
    COALESCE(ps.ano_iso, rs.ano_iso) AS ano_iso,
    COALESCE(ps.semana_numero, rs.semana_numero) AS semana_numero,
    COALESCE(ps.segundos_planejados, 0) AS segundos_planejados,
    COALESCE(rs.segundos_realizados, 0) AS segundos_realizados
  FROM planejado_semana ps
  FULL JOIN realizado_semana rs
    ON ps.ano_iso = rs.ano_iso
   AND ps.semana_numero = rs.semana_numero
  WHERE COALESCE(ps.semana_numero, rs.semana_numero) IS NOT NULL
),
semana_json AS (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'semana', 'Semana ' || LPAD(semana_numero::text, 2, '0'),
        'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * segundos_planejados, 'HH24:MI:SS'),
        'horas_entregues', TO_CHAR(INTERVAL '1 second' * segundos_realizados, 'HH24:MI:SS'),
        'aderencia_percentual', COALESCE(ROUND((segundos_realizados / NULLIF(segundos_planejados, 0)) * 100, 2), 0)
      )
      ORDER BY ano_iso DESC, semana_numero DESC
    ),
    '[]'::jsonb
  ) AS data
  FROM semana_union
),

-- Aderência por dia ---------------------------------------------------
planejado_dia AS (
  SELECT
    dia_iso,
    SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
  FROM turnos_planejados
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
dia_union AS (
  SELECT
    COALESCE(pd.dia_iso, rd.dia_iso) AS dia_iso,
    COALESCE(pd.segundos_planejados, 0) AS segundos_planejados,
    COALESCE(rd.segundos_realizados, 0) AS segundos_realizados
  FROM planejado_dia pd
  FULL JOIN realizado_dia rd USING (dia_iso)
  WHERE COALESCE(pd.dia_iso, rd.dia_iso) IS NOT NULL
),
dia_json AS (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'dia_iso', dia_iso,
        'dia_da_semana', CASE dia_iso
          WHEN 1 THEN 'Segunda'
          WHEN 2 THEN 'Terça'
          WHEN 3 THEN 'Quarta'
          WHEN 4 THEN 'Quinta'
          WHEN 5 THEN 'Sexta'
          WHEN 6 THEN 'Sábado'
          WHEN 7 THEN 'Domingo'
          ELSE 'N/D' END,
        'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * segundos_planejados, 'HH24:MI:SS'),
        'horas_entregues', TO_CHAR(INTERVAL '1 second' * segundos_realizados, 'HH24:MI:SS'),
        'aderencia_percentual', COALESCE(ROUND((segundos_realizados / NULLIF(segundos_planejados, 0)) * 100, 2), 0)
      )
      ORDER BY dia_iso
    ),
    '[]'::jsonb
  ) AS data
  FROM dia_union
),

-- Aderência por turno -------------------------------------------------
planejado_turno AS (
  SELECT
    periodo,
    SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
  FROM turnos_planejados
  WHERE periodo IS NOT NULL
  GROUP BY periodo
),
realizado_turno AS (
  SELECT
    periodo,
    SUM(tempo_absoluto_segundos) AS segundos_realizados
  FROM base
  WHERE periodo IS NOT NULL
    AND tempo_absoluto_segundos > 0
  GROUP BY periodo
),
turno_union AS (
  SELECT
    COALESCE(pt.periodo, rt.periodo) AS periodo,
    COALESCE(pt.segundos_planejados, 0) AS segundos_planejados,
    COALESCE(rt.segundos_realizados, 0) AS segundos_realizados
  FROM planejado_turno pt
  FULL JOIN realizado_turno rt USING (periodo)
  WHERE COALESCE(pt.periodo, rt.periodo) IS NOT NULL
),
turno_json AS (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'periodo', periodo,
        'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * segundos_planejados, 'HH24:MI:SS'),
        'horas_entregues', TO_CHAR(INTERVAL '1 second' * segundos_realizados, 'HH24:MI:SS'),
        'aderencia_percentual', COALESCE(ROUND((segundos_realizados / NULLIF(segundos_planejados, 0)) * 100, 2), 0)
      )
      ORDER BY periodo
    ),
    '[]'::jsonb
  ) AS data
  FROM turno_union
),

-- Aderência por sub praça ---------------------------------------------
planejado_sub AS (
  SELECT
    sub_praca,
    SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
  FROM turnos_planejados
  WHERE sub_praca IS NOT NULL
  GROUP BY sub_praca
),
realizado_sub AS (
  SELECT
    sub_praca,
    SUM(tempo_absoluto_segundos) AS segundos_realizados
  FROM base
  WHERE sub_praca IS NOT NULL
    AND tempo_absoluto_segundos > 0
  GROUP BY sub_praca
),
sub_union AS (
  SELECT
    COALESCE(psub.sub_praca, rsub.sub_praca) AS sub_praca,
    COALESCE(psub.segundos_planejados, 0) AS segundos_planejados,
    COALESCE(rsub.segundos_realizados, 0) AS segundos_realizados
  FROM planejado_sub psub
  FULL JOIN realizado_sub rsub USING (sub_praca)
  WHERE COALESCE(psub.sub_praca, rsub.sub_praca) IS NOT NULL
),
sub_json AS (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'sub_praca', sub_praca,
        'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * segundos_planejados, 'HH24:MI:SS'),
        'horas_entregues', TO_CHAR(INTERVAL '1 second' * segundos_realizados, 'HH24:MI:SS'),
        'aderencia_percentual', COALESCE(ROUND((segundos_realizados / NULLIF(segundos_planejados, 0)) * 100, 2), 0)
      )
      ORDER BY sub_praca
    ),
    '[]'::jsonb
  ) AS data
  FROM sub_union
),

-- Aderência por origem ------------------------------------------------
planejado_origem AS (
  SELECT
    origem,
    SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
  FROM turnos_planejados
  WHERE origem IS NOT NULL
  GROUP BY origem
),
realizado_origem AS (
  SELECT
    origem,
    SUM(tempo_absoluto_segundos) AS segundos_realizados
  FROM base
  WHERE origem IS NOT NULL
    AND tempo_absoluto_segundos > 0
  GROUP BY origem
),
origem_union AS (
  SELECT
    COALESCE(pori.origem, rori.origem) AS origem,
    COALESCE(pori.segundos_planejados, 0) AS segundos_planejados,
    COALESCE(rori.segundos_realizados, 0) AS segundos_realizados
  FROM planejado_origem pori
  FULL JOIN realizado_origem rori USING (origem)
  WHERE COALESCE(pori.origem, rori.origem) IS NOT NULL
),
origem_json AS (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'origem', origem,
        'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * segundos_planejados, 'HH24:MI:SS'),
        'horas_entregues', TO_CHAR(INTERVAL '1 second' * segundos_realizados, 'HH24:MI:SS'),
        'aderencia_percentual', COALESCE(ROUND((segundos_realizados / NULLIF(segundos_planejados, 0)) * 100, 2), 0)
      )
      ORDER BY origem
    ),
    '[]'::jsonb
  ) AS data
  FROM origem_union
)
SELECT jsonb_build_object(
  'totais', (SELECT data FROM res_totais),
  'semanal', (SELECT data FROM semana_json),
  'dia', (SELECT data FROM dia_json),
  'turno', (SELECT data FROM turno_json),
  'sub_praca', (SELECT data FROM sub_json),
  'origem', (SELECT data FROM origem_json),
  'dimensoes', public.listar_dimensoes_dashboard()
);
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(integer, integer, text, text, text)
  TO anon, authenticated, service_role;

