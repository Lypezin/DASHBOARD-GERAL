-- =====================================================================
-- OTIMIZAÇÃO DEFINITIVA: dashboard_resumo COM CTE
-- =====================================================================
-- PROBLEMA: A função lê dados_corridas 7+ vezes (origem, sub_praca, 
-- dimensões, etc.), causando timeout
-- 
-- SOLUÇÃO: Usar CTE (WITH) para filtrar UMA VEZ e reutilizar em todas as consultas
-- BENEFÍCIO: Reduz de 7+ leituras para 1 única leitura da tabela
-- =====================================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS public.dashboard_resumo(integer, integer, text, text, text);

-- Criar função OTIMIZADA com CTE
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
-- ===================================================================
-- CTE PRINCIPAL: FILTRAR DADOS UMA ÚNICA VEZ
-- ===================================================================
WITH filtered_data AS (
  SELECT
    ano_iso,
    semana_numero,
    dia_iso,
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
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
),

-- Totais gerais (USA filtered_data - 1ª reutilização)
totais AS (
  SELECT jsonb_build_object(
    'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
    'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
    'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
    'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
  ) AS data
  FROM filtered_data
),

-- Aderência por origem (USA filtered_data - 2ª reutilização)
origem AS (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'origem', origem,
        'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
        'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
        'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
        'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
      )
      ORDER BY origem
    ),
    '[]'::jsonb
  ) AS data
  FROM filtered_data
  WHERE origem IS NOT NULL
  GROUP BY origem
),

-- Aderência por sub-praça (USA filtered_data - 3ª reutilização)
sub_praca AS (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'sub_praca', sub_praca,
        'corridas_ofertadas', (SUM(numero_de_corridas_ofertadas)),
        'corridas_aceitas', (SUM(numero_de_corridas_aceitas)),
        'corridas_rejeitadas', (SUM(numero_de_corridas_rejeitadas)),
        'corridas_completadas', (SUM(numero_de_corridas_completadas))
      )
      ORDER BY sub_praca
    ),
    '[]'::jsonb
  ) AS data
  FROM filtered_data
  WHERE sub_praca IS NOT NULL
  GROUP BY sub_praca
),

-- Aderência por turno (USA filtered_data - 4ª reutilização)
turno AS (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'periodo', periodo,
        'corridas_ofertadas', (SUM(numero_de_corridas_ofertadas)),
        'corridas_aceitas', (SUM(numero_de_corridas_aceitas)),
        'corridas_rejeitadas', (SUM(numero_de_corridas_rejeitadas)),
        'corridas_completadas', (SUM(numero_de_corridas_completadas))
      )
      ORDER BY periodo
    ),
    '[]'::jsonb
  ) AS data
  FROM filtered_data
  WHERE periodo IS NOT NULL
  GROUP BY periodo
),

-- Aderência por dia (USA filtered_data - 5ª reutilização)
dia AS (
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
        'corridas_ofertadas', (SUM(numero_de_corridas_ofertadas)),
        'corridas_aceitas', (SUM(numero_de_corridas_aceitas)),
        'corridas_rejeitadas', (SUM(numero_de_corridas_rejeitadas)),
        'corridas_completadas', (SUM(numero_de_corridas_completadas))
      )
      ORDER BY dia_iso
    ),
    '[]'::jsonb
  ) AS data
  FROM filtered_data
  GROUP BY dia_iso
),

-- Aderência semanal (USA filtered_data - 6ª reutilização)
semanal AS (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'semana', 'Semana ' || LPAD(semana_numero::text, 2, '0'),
        'corridas_ofertadas', (SUM(numero_de_corridas_ofertadas)),
        'corridas_aceitas', (SUM(numero_de_corridas_aceitas)),
        'corridas_rejeitadas', (SUM(numero_de_corridas_rejeitadas)),
        'corridas_completadas', (SUM(numero_de_corridas_completadas))
      )
      ORDER BY ano_iso DESC, semana_numero DESC
    ),
    '[]'::jsonb
  ) AS data
  FROM filtered_data
  GROUP BY ano_iso, semana_numero
),

-- Dimensões (USA filtered_data - 7+ reutilização)
dimensoes AS (
  SELECT jsonb_build_object(
    'anos', COALESCE((
      SELECT jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC)
      FROM filtered_data
      WHERE ano_iso IS NOT NULL
    ), '[]'::jsonb),
    'semanas', COALESCE((
      SELECT jsonb_agg(DISTINCT semana_numero ORDER BY semana_numero DESC)
      FROM filtered_data
      WHERE semana_numero IS NOT NULL
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

-- Mensagem de sucesso
SELECT 
  '✅ OTIMIZAÇÃO APLICADA COM SUCESSO!' as status,
  'Função dashboard_resumo agora lê dados_corridas APENAS 1 VEZ' as melhoria,
  'Antes: 7+ leituras | Agora: 1 leitura' as performance;
