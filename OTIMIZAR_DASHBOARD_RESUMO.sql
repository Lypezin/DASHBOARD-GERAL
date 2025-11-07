-- =====================================================================
-- OTIMIZAR FUNÇÃO dashboard_resumo
-- =====================================================================
-- Esta versão otimizada remove subconsultas correlacionadas custosas
-- e usa JOINs e agregações pré-calculadas para melhor performance
-- =====================================================================

-- Recriar dashboard_resumo com otimizações de performance
CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL,
  p_turno text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '120000ms'
SET jit = off
AS $$
WITH filtered_data AS MATERIALIZED (
  SELECT
    ano_iso,
    semana_numero,
    dia_iso,
    periodo,
    praca,
    sub_praca,
    origem,
    data_do_periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    COALESCE(duracao_segundos, hhmmss_to_seconds(duracao_do_periodo)) AS duracao_segundos,
    COALESCE(tempo_disponivel_absoluto_segundos, hhmmss_to_seconds(tempo_disponivel_absoluto)) AS tempo_absoluto_segundos,
    numero_de_corridas_ofertadas,
    numero_de_corridas_aceitas,
    numero_de_corridas_rejeitadas,
    numero_de_corridas_completadas
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (
      p_praca IS NULL
      OR p_praca = ''
      OR (p_praca NOT LIKE '%,%' AND praca = p_praca)
      OR (p_praca LIKE '%,%' AND praca = ANY(string_to_array(p_praca, ',')))
    )
    AND (
      p_sub_praca IS NULL
      OR p_sub_praca = ''
      OR (p_sub_praca NOT LIKE '%,%' AND sub_praca = p_sub_praca)
      OR (p_sub_praca LIKE '%,%' AND sub_praca = ANY(string_to_array(p_sub_praca, ',')))
    )
    AND (
      p_origem IS NULL
      OR p_origem = ''
      OR (p_origem NOT LIKE '%,%' AND origem = p_origem)
      OR (p_origem LIKE '%,%' AND origem = ANY(string_to_array(p_origem, ',')))
    )
    AND (
      p_turno IS NULL
      OR p_turno = ''
      OR (p_turno NOT LIKE '%,%' AND periodo = p_turno)
      OR (p_turno LIKE '%,%' AND periodo = ANY(string_to_array(p_turno, ',')))
    )
),
planejado_base AS MATERIALIZED (
  SELECT DISTINCT ON (data_do_periodo, periodo, praca, sub_praca, origem)
    ano_iso,
    semana_numero,
    dia_iso,
    periodo,
    praca,
    sub_praca,
    origem,
    data_do_periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_segundos
  FROM filtered_data
  ORDER BY data_do_periodo, periodo, praca, sub_praca, origem, numero_minimo_de_entregadores_regulares_na_escala DESC
),
aggregated AS MATERIALIZED (
  SELECT
    CASE
      WHEN origem IS NOT NULL THEN 'origem'
      WHEN sub_praca IS NOT NULL THEN 'sub_praca'
      WHEN periodo IS NOT NULL THEN 'turno'
      WHEN dia_iso IS NOT NULL THEN 'dia'
      WHEN ano_iso IS NOT NULL AND semana_numero IS NOT NULL THEN 'semanal'
      ELSE 'total'
    END AS bucket,
    origem,
    sub_praca,
    periodo,
    dia_iso,
    ano_iso,
    semana_numero,
    COALESCE(SUM(numero_de_corridas_ofertadas), 0)::numeric AS ofertadas,
    COALESCE(SUM(numero_de_corridas_aceitas), 0)::numeric AS aceitas,
    COALESCE(SUM(numero_de_corridas_rejeitadas), 0)::numeric AS rejeitadas,
    COALESCE(SUM(numero_de_corridas_completadas), 0)::numeric AS completadas,
    COALESCE(SUM(tempo_absoluto_segundos), 0)::numeric AS horas_entregues_segundos
  FROM filtered_data
  GROUP BY GROUPING SETS (
    (),
    (origem),
    (sub_praca),
    (periodo),
    (dia_iso),
    (ano_iso, semana_numero)
  )
),
planejado AS MATERIALIZED (
  SELECT
    CASE
      WHEN origem IS NOT NULL THEN 'origem'
      WHEN sub_praca IS NOT NULL THEN 'sub_praca'
      WHEN periodo IS NOT NULL THEN 'turno'
      WHEN dia_iso IS NOT NULL THEN 'dia'
      WHEN ano_iso IS NOT NULL AND semana_numero IS NOT NULL THEN 'semanal'
      ELSE 'total'
    END AS bucket,
    origem,
    sub_praca,
    periodo,
    dia_iso,
    ano_iso,
    semana_numero,
    COALESCE(SUM(duracao_segundos * numero_minimo_de_entregadores_regulares_na_escala), 0)::numeric AS horas_planejadas_segundos
  FROM planejado_base
  GROUP BY GROUPING SETS (
    (),
    (origem),
    (sub_praca),
    (periodo),
    (dia_iso),
    (ano_iso, semana_numero)
  )
),
metricas AS (
  SELECT
    a.bucket,
    a.origem,
    a.sub_praca,
    a.periodo,
    a.dia_iso,
    a.ano_iso,
    a.semana_numero,
    a.ofertadas,
    a.aceitas,
    a.rejeitadas,
    a.completadas,
    a.horas_entregues_segundos,
    COALESCE(p.horas_planejadas_segundos, 0)::numeric AS horas_planejadas_segundos
  FROM aggregated a
  LEFT JOIN planejado p
    ON a.bucket = p.bucket
    AND a.origem IS NOT DISTINCT FROM p.origem
    AND a.sub_praca IS NOT DISTINCT FROM p.sub_praca
    AND a.periodo IS NOT DISTINCT FROM p.periodo
    AND a.dia_iso IS NOT DISTINCT FROM p.dia_iso
    AND a.ano_iso IS NOT DISTINCT FROM p.ano_iso
    AND a.semana_numero IS NOT DISTINCT FROM p.semana_numero
),
metricas_normalizadas AS (
  SELECT
    bucket,
    origem,
    sub_praca,
    periodo,
    dia_iso,
    ano_iso,
    semana_numero,
    ofertadas,
    aceitas,
    rejeitadas,
    completadas,
    horas_planejadas_segundos,
    horas_entregues_segundos,
    ROUND(COALESCE(horas_planejadas_segundos, 0) / 3600, 2) AS horas_planejadas_horas,
    ROUND(COALESCE(horas_entregues_segundos, 0) / 3600, 2) AS horas_entregues_horas,
    CASE
      WHEN horas_planejadas_segundos > 0
      THEN ROUND((horas_entregues_segundos / horas_planejadas_segundos) * 100, 2)
      ELSE 0
    END AS aderencia_percentual
  FROM metricas
),
totais AS (
  SELECT jsonb_build_object(
    'corridas_ofertadas', ofertadas,
    'corridas_aceitas', aceitas,
    'corridas_rejeitadas', rejeitadas,
    'corridas_completadas', completadas
  ) AS data
  FROM (
    SELECT
      COALESCE(ofertadas, 0) AS ofertadas,
      COALESCE(aceitas, 0) AS aceitas,
      COALESCE(rejeitadas, 0) AS rejeitadas,
      COALESCE(completadas, 0) AS completadas
    FROM metricas_normalizadas
    WHERE bucket = 'total'
    UNION ALL
    SELECT 0, 0, 0, 0
    WHERE NOT EXISTS (SELECT 1 FROM metricas_normalizadas WHERE bucket = 'total')
  ) t
  LIMIT 1
),
origem AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'origem', origem,
    'corridas_ofertadas', ofertadas,
    'corridas_aceitas', aceitas,
    'corridas_rejeitadas', rejeitadas,
    'corridas_completadas', completadas,
    'horas_a_entregar', horas_planejadas_horas,
    'horas_entregues', horas_entregues_horas,
    'aderencia_percentual', aderencia_percentual
  ) ORDER BY origem), '[]'::jsonb) AS data
  FROM metricas_normalizadas
  WHERE bucket = 'origem' AND origem IS NOT NULL
),
sub_praca AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'sub_praca', sub_praca,
    'corridas_ofertadas', ofertadas,
    'corridas_aceitas', aceitas,
    'corridas_rejeitadas', rejeitadas,
    'corridas_completadas', completadas,
    'horas_a_entregar', horas_planejadas_horas,
    'horas_entregues', horas_entregues_horas,
    'aderencia_percentual', aderencia_percentual
  ) ORDER BY sub_praca), '[]'::jsonb) AS data
  FROM metricas_normalizadas
  WHERE bucket = 'sub_praca' AND sub_praca IS NOT NULL
),
turno AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'periodo', periodo,
    'corridas_ofertadas', ofertadas,
    'corridas_aceitas', aceitas,
    'corridas_rejeitadas', rejeitadas,
    'corridas_completadas', completadas,
    'horas_a_entregar', horas_planejadas_horas,
    'horas_entregues', horas_entregues_horas,
    'aderencia_percentual', aderencia_percentual
  ) ORDER BY periodo), '[]'::jsonb) AS data
  FROM metricas_normalizadas
  WHERE bucket = 'turno' AND periodo IS NOT NULL
),
dia AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'dia_iso', dia_iso,
    'dia_da_semana', CASE dia_iso
      WHEN 1 THEN 'Segunda'
      WHEN 2 THEN 'Terça'
      WHEN 3 THEN 'Quarta'
      WHEN 4 THEN 'Quinta'
      WHEN 5 THEN 'Sexta'
      WHEN 6 THEN 'Sábado'
      WHEN 7 THEN 'Domingo'
      ELSE 'N/D'
    END,
    'corridas_ofertadas', ofertadas,
    'corridas_aceitas', aceitas,
    'corridas_rejeitadas', rejeitadas,
    'corridas_completadas', completadas,
    'horas_a_entregar', horas_planejadas_horas,
    'horas_entregues', horas_entregues_horas,
    'aderencia_percentual', aderencia_percentual
  ) ORDER BY dia_iso), '[]'::jsonb) AS data
  FROM metricas_normalizadas
  WHERE bucket = 'dia' AND dia_iso IS NOT NULL
),
semanal AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'semana', 'Semana ' || LPAD(semana_numero::text, 2, '0'),
    'ano', ano_iso,
    'corridas_ofertadas', ofertadas,
    'corridas_aceitas', aceitas,
    'corridas_rejeitadas', rejeitadas,
    'corridas_completadas', completadas,
    'horas_a_entregar', horas_planejadas_horas,
    'horas_entregues', horas_entregues_horas,
    'aderencia_percentual', aderencia_percentual
  ) ORDER BY ano_iso DESC, semana_numero DESC), '[]'::jsonb) AS data
  FROM metricas_normalizadas
  WHERE bucket = 'semanal' AND ano_iso IS NOT NULL AND semana_numero IS NOT NULL
),
dimensoes AS (
  SELECT jsonb_build_object(
    'anos', COALESCE((
      SELECT jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC)
      FROM filtered_data
      WHERE ano_iso IS NOT NULL
    ), '[]'::jsonb),
    'semanas', COALESCE((
      SELECT jsonb_agg(DISTINCT (ano_iso || '-W' || LPAD(semana_numero::text, 2, '0')) ORDER BY (ano_iso || '-W' || LPAD(semana_numero::text, 2, '0')) DESC)
      FROM filtered_data
      WHERE semana_numero IS NOT NULL AND ano_iso IS NOT NULL
    ), '[]'::jsonb),
    'pracas', COALESCE((
      SELECT jsonb_agg(DISTINCT praca ORDER BY praca)
      FROM filtered_data
      WHERE praca IS NOT NULL
    ), '[]'::jsonb),
    'sub_pracas', COALESCE((
      SELECT jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca)
      FROM filtered_data
      WHERE sub_praca IS NOT NULL
    ), '[]'::jsonb),
    'origens', COALESCE((
      SELECT jsonb_agg(DISTINCT origem ORDER BY origem)
      FROM filtered_data
      WHERE origem IS NOT NULL
    ), '[]'::jsonb),
    'turnos', COALESCE((
      SELECT jsonb_agg(DISTINCT periodo ORDER BY periodo)
      FROM filtered_data
      WHERE periodo IS NOT NULL
    ), '[]'::jsonb)
  ) AS data
)
SELECT jsonb_build_object(
  'totais', totais.data,
  'semanal', semanal.data,
  'dia', dia.data,
  'turno', turno.data,
  'sub_praca', sub_praca.data,
  'origem', origem.data,
  'dimensoes', dimensoes.data
)
FROM totais
CROSS JOIN semanal
CROSS JOIN dia
CROSS JOIN turno
CROSS JOIN sub_praca
CROSS JOIN origem
CROSS JOIN dimensoes;
$$;

-- =====================================================================
-- CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- =====================================================================
-- Execute estes índices se ainda não existirem
-- =====================================================================

-- Índices compostos para filtros comuns
CREATE INDEX IF NOT EXISTS idx_dados_corridas_filtros_principais 
  ON public.dados_corridas(data_do_periodo, ano_iso, semana_numero, praca) 
  WHERE data_do_periodo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_sub_praca 
  ON public.dados_corridas(sub_praca, data_do_periodo) 
  WHERE sub_praca IS NOT NULL AND data_do_periodo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_origem 
  ON public.dados_corridas(origem, data_do_periodo) 
  WHERE origem IS NOT NULL AND data_do_periodo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_periodo 
  ON public.dados_corridas(periodo, data_do_periodo) 
  WHERE periodo IS NOT NULL AND data_do_periodo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_dia_iso 
  ON public.dados_corridas(dia_iso, data_do_periodo) 
  WHERE data_do_periodo IS NOT NULL;

-- Índice para DISTINCT ON usado em dados_sem_duplicatas
CREATE INDEX IF NOT EXISTS idx_dados_corridas_distinct 
  ON public.dados_corridas(data_do_periodo, periodo, praca, sub_praca, origem, numero_minimo_de_entregadores_regulares_na_escala DESC) 
  WHERE data_do_periodo IS NOT NULL;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.dashboard_resumo(integer, integer, text, text, text, text)
  TO anon, authenticated, service_role;

