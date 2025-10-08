-- =====================================================================
-- FUNÇÃO PARA CALCULAR UTR (Unidade de Tempo por Rota)
-- =====================================================================
-- UTR = numero_de_corridas_completadas / (tempo_disponivel_absoluto_segundos / 3600)
-- Se tempo = 0, então UTR = 0
-- =====================================================================

DROP FUNCTION IF EXISTS public.calcular_utr(integer, integer, text, text, text);

CREATE OR REPLACE FUNCTION public.calcular_utr(
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
WITH filtro_base AS (
  SELECT
    praca,
    sub_praca,
    origem,
    periodo,
    tempo_disponivel_absoluto_segundos,
    numero_de_corridas_completadas
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
),

-- UTR Geral
utr_geral AS (
  SELECT
    SUM(tempo_disponivel_absoluto_segundos) AS total_segundos,
    SUM(numero_de_corridas_completadas) AS total_corridas,
    CASE 
      WHEN SUM(tempo_disponivel_absoluto_segundos) = 0 THEN 0
      ELSE ROUND(
        (SUM(numero_de_corridas_completadas)::numeric / 
         (SUM(tempo_disponivel_absoluto_segundos)::numeric / 3600))::numeric, 
        2
      )
    END AS utr
  FROM filtro_base
),

-- UTR por Praça
utr_praca AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'praca', praca,
      'tempo_horas', ROUND((total_segundos / 3600.0)::numeric, 2),
      'corridas', total_corridas,
      'utr', utr
    ) ORDER BY praca
  ) AS data
  FROM (
    SELECT
      praca,
      SUM(tempo_disponivel_absoluto_segundos) AS total_segundos,
      SUM(numero_de_corridas_completadas) AS total_corridas,
      CASE 
        WHEN SUM(tempo_disponivel_absoluto_segundos) = 0 THEN 0
        ELSE ROUND(
          (SUM(numero_de_corridas_completadas)::numeric / 
           (SUM(tempo_disponivel_absoluto_segundos)::numeric / 3600))::numeric, 
          2
        )
      END AS utr
    FROM filtro_base
    WHERE praca IS NOT NULL
    GROUP BY praca
  ) t
),

-- UTR por Sub-Praça
utr_sub_praca AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'sub_praca', sub_praca,
      'tempo_horas', ROUND((total_segundos / 3600.0)::numeric, 2),
      'corridas', total_corridas,
      'utr', utr
    ) ORDER BY sub_praca
  ) AS data
  FROM (
    SELECT
      sub_praca,
      SUM(tempo_disponivel_absoluto_segundos) AS total_segundos,
      SUM(numero_de_corridas_completadas) AS total_corridas,
      CASE 
        WHEN SUM(tempo_disponivel_absoluto_segundos) = 0 THEN 0
        ELSE ROUND(
          (SUM(numero_de_corridas_completadas)::numeric / 
           (SUM(tempo_disponivel_absoluto_segundos)::numeric / 3600))::numeric, 
          2
        )
      END AS utr
    FROM filtro_base
    WHERE sub_praca IS NOT NULL
    GROUP BY sub_praca
  ) t
),

-- UTR por Origem
utr_origem AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'origem', origem,
      'tempo_horas', ROUND((total_segundos / 3600.0)::numeric, 2),
      'corridas', total_corridas,
      'utr', utr
    ) ORDER BY origem
  ) AS data
  FROM (
    SELECT
      origem,
      SUM(tempo_disponivel_absoluto_segundos) AS total_segundos,
      SUM(numero_de_corridas_completadas) AS total_corridas,
      CASE 
        WHEN SUM(tempo_disponivel_absoluto_segundos) = 0 THEN 0
        ELSE ROUND(
          (SUM(numero_de_corridas_completadas)::numeric / 
           (SUM(tempo_disponivel_absoluto_segundos)::numeric / 3600))::numeric, 
          2
        )
      END AS utr
    FROM filtro_base
    WHERE origem IS NOT NULL
    GROUP BY origem
  ) t
),

-- UTR por Turno (Período)
utr_turno AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'periodo', periodo,
      'tempo_horas', ROUND((total_segundos / 3600.0)::numeric, 2),
      'corridas', total_corridas,
      'utr', utr
    ) ORDER BY periodo
  ) AS data
  FROM (
    SELECT
      periodo,
      SUM(tempo_disponivel_absoluto_segundos) AS total_segundos,
      SUM(numero_de_corridas_completadas) AS total_corridas,
      CASE 
        WHEN SUM(tempo_disponivel_absoluto_segundos) = 0 THEN 0
        ELSE ROUND(
          (SUM(numero_de_corridas_completadas)::numeric / 
           (SUM(tempo_disponivel_absoluto_segundos)::numeric / 3600))::numeric, 
          2
        )
      END AS utr
    FROM filtro_base
    WHERE periodo IS NOT NULL
    GROUP BY periodo
  ) t
)

SELECT jsonb_build_object(
  'geral', (
    SELECT jsonb_build_object(
      'tempo_horas', ROUND((total_segundos / 3600.0)::numeric, 2),
      'corridas', total_corridas,
      'utr', utr
    )
    FROM utr_geral
  ),
  'por_praca', COALESCE((SELECT data FROM utr_praca), '[]'::jsonb),
  'por_sub_praca', COALESCE((SELECT data FROM utr_sub_praca), '[]'::jsonb),
  'por_origem', COALESCE((SELECT data FROM utr_origem), '[]'::jsonb),
  'por_turno', COALESCE((SELECT data FROM utr_turno), '[]'::jsonb)
);
$$;

GRANT EXECUTE ON FUNCTION public.calcular_utr(integer, integer, text, text, text)
  TO anon, authenticated, service_role;

-- Verificação
SELECT 'Função calcular_utr' as item,
       '✅ Criada' as status;
