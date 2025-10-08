-- =====================================================================
-- CORREÇÃO: FILTRAR DIMENSÕES BASEADO NO FILTRO ATUAL
-- =====================================================================
-- Esta função agora recebe os filtros atuais e retorna apenas
-- as dimensões relevantes (sub-praças, origens, semanas da praça selecionada)
-- =====================================================================

DROP FUNCTION IF EXISTS public.listar_dimensoes_dashboard(integer, integer, text, text, text);
DROP FUNCTION IF EXISTS public.listar_dimensoes_dashboard();

CREATE OR REPLACE FUNCTION public.listar_dimensoes_dashboard(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH base AS (
  -- Respeita RLS e filtros atuais
  SELECT
    data_do_periodo,
    praca,
    sub_praca,
    origem,
    ano_iso,
    semana_numero
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    -- Aplicar filtros se fornecidos
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
),
anos AS (
  SELECT COALESCE(array_agg(DISTINCT val ORDER BY val), ARRAY[]::integer[]) AS values
  FROM (
    SELECT ano_iso AS val 
    FROM base 
    WHERE ano_iso IS NOT NULL
  ) t
),
semanas AS (
  SELECT COALESCE(array_agg(DISTINCT val ORDER BY val), ARRAY[]::integer[]) AS values
  FROM (
    SELECT semana_numero AS val 
    FROM base 
    WHERE semana_numero IS NOT NULL
  ) t
),
pracas AS (
  SELECT COALESCE(array_agg(DISTINCT val ORDER BY val), ARRAY[]::text[]) AS values
  FROM (
    SELECT praca AS val 
    FROM base 
    WHERE praca IS NOT NULL
  ) t
),
sub_pracas AS (
  SELECT COALESCE(array_agg(DISTINCT val ORDER BY val), ARRAY[]::text[]) AS values
  FROM (
    SELECT sub_praca AS val 
    FROM base 
    WHERE sub_praca IS NOT NULL
  ) t
),
origens_agg AS (
  SELECT COALESCE(array_agg(DISTINCT val ORDER BY val), ARRAY[]::text[]) AS values
  FROM (
    SELECT origem AS val 
    FROM base 
    WHERE origem IS NOT NULL
  ) t
)
SELECT jsonb_build_object(
  'anos', (SELECT values FROM anos),
  'semanas', (SELECT values FROM semanas),
  'pracas', (SELECT values FROM pracas),
  'sub_pracas', (SELECT values FROM sub_pracas),
  'origens', (SELECT values FROM origens_agg)
);
$$;

GRANT EXECUTE ON FUNCTION public.listar_dimensoes_dashboard(integer, integer, text, text, text)
  TO anon, authenticated, service_role;

-- Verificação
SELECT 'Função listar_dimensoes_dashboard' as item,
       '✅ Atualizada com filtros' as status;
