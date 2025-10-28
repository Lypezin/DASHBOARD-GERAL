-- =====================================================================
-- DASHBOARD_RESUMO COM LÓGICA DO EXCEL
-- =====================================================================
-- CORREÇÃO: Replicar exatamente a lógica do Excel
-- 1. Remover duplicatas por (data_do_periodo + periodo)
-- 2. DEPOIS multiplicar por numero_minimo_de_entregadores_regulares_na_escala
-- =====================================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS public.dashboard_resumo(integer, integer, text, text, text);

-- Criar função COM LÓGICA DO EXCEL
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
SET statement_timeout = '120000ms'
AS $$
-- CTE PRINCIPAL: FILTRAR DADOS UMA ÚNICA VEZ
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
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
),

-- LÓGICA DO EXCEL: Remover duplicatas por data_do_periodo + periodo
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

-- Totais gerais (apenas corridas)
totais AS (
  SELECT jsonb_build_object(
    'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
    'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
    'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
    'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
  ) AS data
  FROM filtered_data
),

-- Aderência por origem
origem_agg AS (
  SELECT 
    origem,
    COALESCE(SUM(numero_de_corridas_ofertadas), 0) AS ofertadas,
    COALESCE(SUM(numero_de_corridas_aceitas), 0) AS aceitas,
    COALESCE(SUM(numero_de_corridas_rejeitadas), 0) AS rejeitadas,
    COALESCE(SUM(numero_de_corridas_completadas), 0) AS completadas,
    -- LÓGICA DO EXCEL: Somar (duracao_segundos * entregadores) dos registros únicos
    COALESCE((
      SELECT SUM(duracao_segundos * numero_minimo_de_entregadores_regulares_na_escala)
      FROM dados_sem_duplicatas dsd
      WHERE dsd.origem = filtered_data.origem
        OR (dsd.origem IS NULL AND filtered_data.origem IS NULL)
    ), 0) AS horas_planejadas_segundos,
    COALESCE(SUM(tempo_absoluto_segundos), 0) AS horas_entregues_segundos
  FROM filtered_data
  WHERE origem IS NOT NULL
  GROUP BY origem
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

-- Aderência por sub-praça
sub_praca_agg AS (
  SELECT 
    sub_praca,
    COALESCE(SUM(numero_de_corridas_ofertadas), 0) AS ofertadas,
    COALESCE(SUM(numero_de_corridas_aceitas), 0) AS aceitas,
    COALESCE(SUM(numero_de_corridas_rejeitadas), 0) AS rejeitadas,
    COALESCE(SUM(numero_de_corridas_completadas), 0) AS completadas,
    COALESCE((
      SELECT SUM(duracao_segundos * numero_minimo_de_entregadores_regulares_na_escala)
      FROM dados_sem_duplicatas dsd
      WHERE dsd.sub_praca = filtered_data.sub_praca
        OR (dsd.sub_praca IS NULL AND filtered_data.sub_praca IS NULL)
    ), 0) AS horas_planejadas_segundos,
    COALESCE(SUM(tempo_absoluto_segundos), 0) AS horas_entregues_segundos
  FROM filtered_data
  WHERE sub_praca IS NOT NULL
  GROUP BY sub_praca
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

-- Aderência por turno
turno_agg AS (
  SELECT 
    periodo,
    COALESCE(SUM(numero_de_corridas_ofertadas), 0) AS ofertadas,
    COALESCE(SUM(numero_de_corridas_aceitas), 0) AS aceitas,
    COALESCE(SUM(numero_de_corridas_rejeitadas), 0) AS rejeitadas,
    COALESCE(SUM(numero_de_corridas_completadas), 0) AS completadas,
    COALESCE((
      SELECT SUM(duracao_segundos * numero_minimo_de_entregadores_regulares_na_escala)
      FROM dados_sem_duplicatas dsd
      WHERE dsd.periodo = filtered_data.periodo
        OR (dsd.periodo IS NULL AND filtered_data.periodo IS NULL)
    ), 0) AS horas_planejadas_segundos,
    COALESCE(SUM(tempo_absoluto_segundos), 0) AS horas_entregues_segundos
  FROM filtered_data
  WHERE periodo IS NOT NULL
  GROUP BY periodo
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

-- Aderência por dia
dia_agg AS (
  SELECT 
    dia_iso,
    COALESCE(SUM(numero_de_corridas_ofertadas), 0) AS ofertadas,
    COALESCE(SUM(numero_de_corridas_aceitas), 0) AS aceitas,
    COALESCE(SUM(numero_de_corridas_rejeitadas), 0) AS rejeitadas,
    COALESCE(SUM(numero_de_corridas_completadas), 0) AS completadas,
    COALESCE((
      SELECT SUM(duracao_segundos * numero_minimo_de_entregadores_regulares_na_escala)
      FROM dados_sem_duplicatas dsd
      WHERE dsd.dia_iso = filtered_data.dia_iso
    ), 0) AS horas_planejadas_segundos,
    COALESCE(SUM(tempo_absoluto_segundos), 0) AS horas_entregues_segundos
  FROM filtered_data
  GROUP BY dia_iso
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

-- Aderência semanal
semanal_agg AS (
  SELECT 
    ano_iso,
    semana_numero,
    COALESCE(SUM(numero_de_corridas_ofertadas), 0) AS ofertadas,
    COALESCE(SUM(numero_de_corridas_aceitas), 0) AS aceitas,
    COALESCE(SUM(numero_de_corridas_rejeitadas), 0) AS rejeitadas,
    COALESCE(SUM(numero_de_corridas_completadas), 0) AS completadas,
    COALESCE((
      SELECT SUM(duracao_segundos * numero_minimo_de_entregadores_regulares_na_escala)
      FROM dados_sem_duplicatas dsd
      WHERE dsd.ano_iso = filtered_data.ano_iso
        AND dsd.semana_numero = filtered_data.semana_numero
    ), 0) AS horas_planejadas_segundos,
    COALESCE(SUM(tempo_absoluto_segundos), 0) AS horas_entregues_segundos
  FROM filtered_data
  GROUP BY ano_iso, semana_numero
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

-- Dimensões
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
    ), '[]'::jsonb)
  ) AS data
)

-- Retornar tudo junto
SELECT jsonb_build_object(
  'totais', totais.data,
  'semanal', semanal.data,
  'dia', dia.data,
  'turno', turno.data,
  'sub_praca', sub_praca.data,
  'origem', origem.data,
  'dimensoes', dimensoes.data
)
FROM totais, semanal, dia, turno, sub_praca, origem, dimensoes;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.dashboard_resumo(integer, integer, text, text, text)
  TO anon, authenticated, service_role;

