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
AS $$
WITH filtered_data AS (
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
    AND (p_praca IS NULL OR praca = p_praca)
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
dados_sem_duplicatas AS (
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
-- OTIMIZAÇÃO: Calcular horas planejadas uma única vez por dimensão
horas_planejadas_origem AS (
  SELECT 
    origem,
    SUM(duracao_segundos * numero_minimo_de_entregadores_regulares_na_escala) AS horas_planejadas_segundos
  FROM dados_sem_duplicatas
  WHERE origem IS NOT NULL
  GROUP BY origem
),
horas_planejadas_sub_praca AS (
  SELECT 
    sub_praca,
    SUM(duracao_segundos * numero_minimo_de_entregadores_regulares_na_escala) AS horas_planejadas_segundos
  FROM dados_sem_duplicatas
  WHERE sub_praca IS NOT NULL
  GROUP BY sub_praca
),
horas_planejadas_turno AS (
  SELECT 
    periodo,
    SUM(duracao_segundos * numero_minimo_de_entregadores_regulares_na_escala) AS horas_planejadas_segundos
  FROM dados_sem_duplicatas
  WHERE periodo IS NOT NULL
  GROUP BY periodo
),
horas_planejadas_dia AS (
  SELECT 
    dia_iso,
    SUM(duracao_segundos * numero_minimo_de_entregadores_regulares_na_escala) AS horas_planejadas_segundos
  FROM dados_sem_duplicatas
  GROUP BY dia_iso
),
horas_planejadas_semanal AS (
  SELECT 
    ano_iso,
    semana_numero,
    SUM(duracao_segundos * numero_minimo_de_entregadores_regulares_na_escala) AS horas_planejadas_segundos
  FROM dados_sem_duplicatas
  GROUP BY ano_iso, semana_numero
),
totais AS (
  SELECT jsonb_build_object(
    'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
    'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
    'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
    'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
  ) AS data
  FROM filtered_data
),
origem_agg AS (
  SELECT 
    fd.origem,
    COALESCE(SUM(fd.numero_de_corridas_ofertadas), 0) AS ofertadas,
    COALESCE(SUM(fd.numero_de_corridas_aceitas), 0) AS aceitas,
    COALESCE(SUM(fd.numero_de_corridas_rejeitadas), 0) AS rejeitadas,
    COALESCE(SUM(fd.numero_de_corridas_completadas), 0) AS completadas,
    COALESCE(hpo.horas_planejadas_segundos, 0) AS horas_planejadas_segundos,
    COALESCE(SUM(fd.tempo_absoluto_segundos), 0) AS horas_entregues_segundos
  FROM filtered_data fd
  LEFT JOIN horas_planejadas_origem hpo ON (fd.origem = hpo.origem OR (fd.origem IS NULL AND hpo.origem IS NULL))
  WHERE fd.origem IS NOT NULL
  GROUP BY fd.origem, hpo.horas_planejadas_segundos
),
origem AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'origem', origem,
    'corridas_ofertadas', ofertadas,
    'corridas_aceitas', aceitas,
    'corridas_rejeitadas', rejeitadas,
    'corridas_completadas', completadas,
    'horas_a_entregar', ROUND((horas_planejadas_segundos::numeric / 3600), 2),
    'horas_entregues', ROUND((horas_entregues_segundos::numeric / 3600), 2),
    'aderencia_percentual', CASE 
      WHEN horas_planejadas_segundos > 0 
      THEN ROUND((horas_entregues_segundos::numeric / horas_planejadas_segundos) * 100, 2)
      ELSE 0 
    END
  ) ORDER BY origem), '[]'::jsonb) AS data
  FROM origem_agg
),
sub_praca_agg AS (
  SELECT 
    fd.sub_praca,
    COALESCE(SUM(fd.numero_de_corridas_ofertadas), 0) AS ofertadas,
    COALESCE(SUM(fd.numero_de_corridas_aceitas), 0) AS aceitas,
    COALESCE(SUM(fd.numero_de_corridas_rejeitadas), 0) AS rejeitadas,
    COALESCE(SUM(fd.numero_de_corridas_completadas), 0) AS completadas,
    COALESCE(hps.horas_planejadas_segundos, 0) AS horas_planejadas_segundos,
    COALESCE(SUM(fd.tempo_absoluto_segundos), 0) AS horas_entregues_segundos
  FROM filtered_data fd
  LEFT JOIN horas_planejadas_sub_praca hps ON (fd.sub_praca = hps.sub_praca OR (fd.sub_praca IS NULL AND hps.sub_praca IS NULL))
  WHERE fd.sub_praca IS NOT NULL
  GROUP BY fd.sub_praca, hps.horas_planejadas_segundos
),
sub_praca AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'sub_praca', sub_praca,
    'corridas_ofertadas', ofertadas,
    'corridas_aceitas', aceitas,
    'corridas_rejeitadas', rejeitadas,
    'corridas_completadas', completadas,
    'horas_a_entregar', ROUND((horas_planejadas_segundos::numeric / 3600), 2),
    'horas_entregues', ROUND((horas_entregues_segundos::numeric / 3600), 2),
    'aderencia_percentual', CASE 
      WHEN horas_planejadas_segundos > 0 
      THEN ROUND((horas_entregues_segundos::numeric / horas_planejadas_segundos) * 100, 2)
      ELSE 0 
    END
  ) ORDER BY sub_praca), '[]'::jsonb) AS data
  FROM sub_praca_agg
),
turno_agg AS (
  SELECT 
    fd.periodo,
    COALESCE(SUM(fd.numero_de_corridas_ofertadas), 0) AS ofertadas,
    COALESCE(SUM(fd.numero_de_corridas_aceitas), 0) AS aceitas,
    COALESCE(SUM(fd.numero_de_corridas_rejeitadas), 0) AS rejeitadas,
    COALESCE(SUM(fd.numero_de_corridas_completadas), 0) AS completadas,
    COALESCE(hpt.horas_planejadas_segundos, 0) AS horas_planejadas_segundos,
    COALESCE(SUM(fd.tempo_absoluto_segundos), 0) AS horas_entregues_segundos
  FROM filtered_data fd
  LEFT JOIN horas_planejadas_turno hpt ON fd.periodo = hpt.periodo
  WHERE fd.periodo IS NOT NULL
  GROUP BY fd.periodo, hpt.horas_planejadas_segundos
),
turno AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'periodo', periodo,
    'corridas_ofertadas', ofertadas,
    'corridas_aceitas', aceitas,
    'corridas_rejeitadas', rejeitadas,
    'corridas_completadas', completadas,
    'horas_a_entregar', ROUND((horas_planejadas_segundos::numeric / 3600), 2),
    'horas_entregues', ROUND((horas_entregues_segundos::numeric / 3600), 2),
    'aderencia_percentual', CASE 
      WHEN horas_planejadas_segundos > 0 
      THEN ROUND((horas_entregues_segundos::numeric / horas_planejadas_segundos) * 100, 2)
      ELSE 0 
    END
  ) ORDER BY periodo), '[]'::jsonb) AS data
  FROM turno_agg
),
dia_agg AS (
  SELECT 
    fd.dia_iso,
    CASE 
      WHEN fd.dia_iso = 1 THEN 'Segunda'
      WHEN fd.dia_iso = 2 THEN 'Terça'
      WHEN fd.dia_iso = 3 THEN 'Quarta'
      WHEN fd.dia_iso = 4 THEN 'Quinta'
      WHEN fd.dia_iso = 5 THEN 'Sexta'
      WHEN fd.dia_iso = 6 THEN 'Sábado'
      WHEN fd.dia_iso = 7 THEN 'Domingo'
      ELSE 'Desconhecido'
    END AS dia_da_semana,
    COALESCE(SUM(fd.numero_de_corridas_ofertadas), 0) AS ofertadas,
    COALESCE(SUM(fd.numero_de_corridas_aceitas), 0) AS aceitas,
    COALESCE(SUM(fd.numero_de_corridas_rejeitadas), 0) AS rejeitadas,
    COALESCE(SUM(fd.numero_de_corridas_completadas), 0) AS completadas,
    COALESCE(hpd.horas_planejadas_segundos, 0) AS horas_planejadas_segundos,
    COALESCE(SUM(fd.tempo_absoluto_segundos), 0) AS horas_entregues_segundos
  FROM filtered_data fd
  LEFT JOIN horas_planejadas_dia hpd ON fd.dia_iso = hpd.dia_iso
  GROUP BY fd.dia_iso, hpd.horas_planejadas_segundos
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
      ELSE 'N/D' END,
    'corridas_ofertadas', ofertadas,
    'corridas_aceitas', aceitas,
    'corridas_rejeitadas', rejeitadas,
    'corridas_completadas', completadas,
    'horas_a_entregar', ROUND((horas_planejadas_segundos::numeric / 3600), 2),
    'horas_entregues', ROUND((horas_entregues_segundos::numeric / 3600), 2),
    'aderencia_percentual', CASE 
      WHEN horas_planejadas_segundos > 0 
      THEN ROUND((horas_entregues_segundos::numeric / horas_planejadas_segundos) * 100, 2)
      ELSE 0 
    END
  ) ORDER BY dia_iso), '[]'::jsonb) AS data
  FROM dia_agg
),
semanal_agg AS (
  SELECT 
    fd.ano_iso,
    fd.semana_numero,
    COALESCE(SUM(fd.numero_de_corridas_ofertadas), 0) AS ofertadas,
    COALESCE(SUM(fd.numero_de_corridas_aceitas), 0) AS aceitas,
    COALESCE(SUM(fd.numero_de_corridas_rejeitadas), 0) AS rejeitadas,
    COALESCE(SUM(fd.numero_de_corridas_completadas), 0) AS completadas,
    COALESCE(hps.horas_planejadas_segundos, 0) AS horas_planejadas_segundos,
    COALESCE(SUM(fd.tempo_absoluto_segundos), 0) AS horas_entregues_segundos
  FROM filtered_data fd
  LEFT JOIN horas_planejadas_semanal hps ON fd.ano_iso = hps.ano_iso AND fd.semana_numero = hps.semana_numero
  GROUP BY fd.ano_iso, fd.semana_numero, hps.horas_planejadas_segundos
),
semanal AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'semana', 'Semana ' || LPAD(semana_numero::text, 2, '0'),
    'corridas_ofertadas', ofertadas,
    'corridas_aceitas', aceitas,
    'corridas_rejeitadas', rejeitadas,
    'corridas_completadas', completadas,
    'horas_a_entregar', ROUND((horas_planejadas_segundos::numeric / 3600), 2),
    'horas_entregues', ROUND((horas_entregues_segundos::numeric / 3600), 2),
    'aderencia_percentual', CASE 
      WHEN horas_planejadas_segundos > 0 
      THEN ROUND((horas_entregues_segundos::numeric / horas_planejadas_segundos) * 100, 2)
      ELSE 0 
    END
  ) ORDER BY ano_iso DESC, semana_numero DESC), '[]'::jsonb) AS data
  FROM semanal_agg
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

