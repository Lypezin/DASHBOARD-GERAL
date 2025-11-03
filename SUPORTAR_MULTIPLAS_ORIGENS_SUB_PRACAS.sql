-- =====================================================================
-- SUPORTAR MÚLTIPLAS ORIGENS E SUB PRAÇAS
-- =====================================================================
-- Modificar as funções SQL para aceitar valores separados por vírgula
-- e usar IN ao invés de igualdade direta
-- =====================================================================

-- Remover funções existentes antes de recriar
-- Usar script PL/pgSQL para remover todas as versões dinamicamente
DO $$ 
DECLARE
  func_record RECORD;
BEGIN
  -- Remove todas as funções com o nome listar_entregadores
  FOR func_record IN 
    SELECT oid::regprocedure AS func_signature
    FROM pg_proc
    WHERE proname = 'listar_entregadores'
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_signature || ' CASCADE';
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  -- Ignora erros se não houver funções para remover
  NULL;
END $$;

DO $$ 
DECLARE
  func_record RECORD;
BEGIN
  -- Remove todas as funções com o nome listar_valores_entregadores
  FOR func_record IN 
    SELECT oid::regprocedure AS func_signature
    FROM pg_proc
    WHERE proname = 'listar_valores_entregadores'
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_signature || ' CASCADE';
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  -- Ignora erros se não houver funções para remover
  NULL;
END $$;

DO $$ 
DECLARE
  func_record RECORD;
BEGIN
  -- Remove todas as funções com o nome dashboard_resumo
  FOR func_record IN 
    SELECT oid::regprocedure AS func_signature
    FROM pg_proc
    WHERE proname = 'dashboard_resumo'
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_signature || ' CASCADE';
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  -- Ignora erros se não houver funções para remover
  NULL;
END $$;

-- Função auxiliar para dividir string por vírgula em array
CREATE OR REPLACE FUNCTION public.split_text(text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT string_to_array($1, ',');
$$;

-- Atualizar listar_entregadores
CREATE OR REPLACE FUNCTION public.listar_entregadores(
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
WITH entregadores_agg AS (
  SELECT 
    id_da_pessoa_entregadora AS id_entregador,
    pessoa_entregadora AS nome_entregador,
    COALESCE(SUM(numero_de_corridas_ofertadas), 0)::bigint AS corridas_ofertadas,
    COALESCE(SUM(numero_de_corridas_aceitas), 0)::bigint AS corridas_aceitas,
    COALESCE(SUM(numero_de_corridas_rejeitadas), 0)::bigint AS corridas_rejeitadas,
    COALESCE(SUM(numero_de_corridas_completadas), 0)::bigint AS corridas_completadas,
    COALESCE(SUM(
      CASE 
        WHEN tempo_disponivel_absoluto_segundos IS NOT NULL 
        THEN tempo_disponivel_absoluto_segundos
        WHEN tempo_disponivel_absoluto IS NOT NULL 
        THEN hhmmss_to_seconds(tempo_disponivel_absoluto)
        ELSE 0
      END
    ), 0) AS total_segundos_trabalhados,
    COALESCE(SUM(
      CASE 
        WHEN duracao_segundos IS NOT NULL 
        THEN duracao_segundos
        WHEN duracao_do_periodo IS NOT NULL 
        THEN hhmmss_to_seconds(duracao_do_periodo)
        ELSE 0
      END
    ), 0) AS total_segundos_planejados
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND id_da_pessoa_entregadora IS NOT NULL
    AND pessoa_entregadora IS NOT NULL
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (
      (p_sub_praca IS NULL OR p_sub_praca = '')
      OR (p_sub_praca NOT LIKE '%,%' AND sub_praca = p_sub_praca)
      OR (p_sub_praca LIKE '%,%' AND sub_praca = ANY(string_to_array(p_sub_praca, ',')))
    )
    AND (
      (p_origem IS NULL OR p_origem = '')
      OR (p_origem NOT LIKE '%,%' AND origem = p_origem)
      OR (p_origem LIKE '%,%' AND origem = ANY(string_to_array(p_origem, ',')))
    )
  GROUP BY id_da_pessoa_entregadora, pessoa_entregadora
)
SELECT jsonb_build_object(
  'entregadores', COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id_entregador', id_entregador,
        'nome_entregador', nome_entregador,
        'corridas_ofertadas', corridas_ofertadas,
        'corridas_aceitas', corridas_aceitas,
        'corridas_rejeitadas', corridas_rejeitadas,
        'corridas_completadas', corridas_completadas,
        'total_segundos_trabalhados', total_segundos_trabalhados,
        'total_segundos_planejados', total_segundos_planejados,
        'aderencia_percentual', CASE 
          WHEN total_segundos_planejados > 0 
          THEN ROUND((total_segundos_trabalhados::numeric / total_segundos_planejados) * 100, 2)
          ELSE 0 
        END,
        'rejeicao_percentual', CASE 
          WHEN corridas_ofertadas > 0 
          THEN ROUND((corridas_rejeitadas::numeric / corridas_ofertadas) * 100, 2)
          ELSE 0 
        END
      ) ORDER BY nome_entregador
    ),
    '[]'::jsonb
  )
)
FROM entregadores_agg;
$$;

-- Atualizar listar_valores_entregadores
CREATE OR REPLACE FUNCTION public.listar_valores_entregadores(
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
WITH dados_sem_duplicatas AS (
  SELECT DISTINCT ON (id_da_pessoa_entregadora, data_do_periodo, periodo, praca, sub_praca, origem)
    id_da_pessoa_entregadora,
    pessoa_entregadora,
    data_do_periodo,
    periodo,
    praca,
    sub_praca,
    origem,
    numero_de_corridas_aceitas,
    soma_das_taxas_das_corridas_aceitas
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND id_da_pessoa_entregadora IS NOT NULL
    AND pessoa_entregadora IS NOT NULL
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (
      p_sub_praca IS NULL 
      OR (p_sub_praca NOT LIKE '%,%' AND sub_praca = p_sub_praca)
      OR (p_sub_praca LIKE '%,%' AND sub_praca = ANY(string_to_array(p_sub_praca, ',')))
    )
    AND (
      p_origem IS NULL 
      OR (p_origem NOT LIKE '%,%' AND origem = p_origem)
      OR (p_origem LIKE '%,%' AND origem = ANY(string_to_array(p_origem, ',')))
    )
  ORDER BY id_da_pessoa_entregadora, data_do_periodo, periodo, praca, sub_praca, origem, numero_de_corridas_aceitas DESC
),
valores_agg AS (
  SELECT 
    id_da_pessoa_entregadora AS id_entregador,
    pessoa_entregadora AS nome_entregador,
    COALESCE(SUM(numero_de_corridas_aceitas), 0)::bigint AS numero_corridas_aceitas,
    COALESCE(SUM(soma_das_taxas_das_corridas_aceitas), 0)::numeric(15,2) / 100 AS total_taxas
  FROM dados_sem_duplicatas
  GROUP BY id_da_pessoa_entregadora, pessoa_entregadora
  HAVING SUM(COALESCE(numero_de_corridas_aceitas, 0)) > 0
    AND SUM(COALESCE(soma_das_taxas_das_corridas_aceitas, 0)) >= 0
)
SELECT jsonb_build_object(
  'entregadores', COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id_entregador', id_entregador,
        'nome_entregador', nome_entregador,
        'numero_corridas_aceitas', numero_corridas_aceitas,
        'total_taxas', total_taxas,
        'taxa_media', CASE 
          WHEN numero_corridas_aceitas > 0 
          THEN ROUND((total_taxas / numero_corridas_aceitas)::numeric, 2)
          ELSE 0 
        END
      ) ORDER BY total_taxas DESC
    ),
    '[]'::jsonb
  )
)
FROM valores_agg;
$$;

-- Atualizar dashboard_resumo
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
    origem,
    COALESCE(SUM(numero_de_corridas_ofertadas), 0) AS ofertadas,
    COALESCE(SUM(numero_de_corridas_aceitas), 0) AS aceitas,
    COALESCE(SUM(numero_de_corridas_rejeitadas), 0) AS rejeitadas,
    COALESCE(SUM(numero_de_corridas_completadas), 0) AS completadas,
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
dia_agg AS (
  SELECT 
    dia_iso,
    CASE 
      WHEN dia_iso = 1 THEN 'Segunda'
      WHEN dia_iso = 2 THEN 'Terça'
      WHEN dia_iso = 3 THEN 'Quarta'
      WHEN dia_iso = 4 THEN 'Quinta'
      WHEN dia_iso = 5 THEN 'Sexta'
      WHEN dia_iso = 6 THEN 'Sábado'
      WHEN dia_iso = 7 THEN 'Domingo'
      ELSE 'Desconhecido'
    END AS dia_da_semana,
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

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.dashboard_resumo(integer, integer, text, text, text)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.listar_entregadores(integer, integer, text, text, text)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.listar_valores_entregadores(integer, integer, text, text, text)
  TO anon, authenticated, service_role;

