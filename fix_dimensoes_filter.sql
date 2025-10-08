-- =====================================================================
-- CORREÇÃO: FILTRAR DIMENSÕES POR PRAÇAS ATRIBUÍDAS
-- =====================================================================
-- Este script corrige a função listar_dimensoes_dashboard para respeitar
-- as praças atribuídas aos usuários não-admin
-- =====================================================================

DROP FUNCTION IF EXISTS public.listar_dimensoes_dashboard();

CREATE OR REPLACE FUNCTION public.listar_dimensoes_dashboard()
RETURNS jsonb
LANGUAGE sql
STABLE
-- Remover SECURITY DEFINER para que respeite RLS
SET search_path = public
AS $$
WITH base AS (
  -- Esta query agora respeita RLS automaticamente
  SELECT
    data_do_periodo,
    praca,
    sub_praca,
    origem,
    ano_iso,
    semana_numero
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
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

-- Importante: NÃO usar SECURITY DEFINER aqui
-- Isso permite que o RLS seja respeitado automaticamente
GRANT EXECUTE ON FUNCTION public.listar_dimensoes_dashboard()
  TO anon, authenticated, service_role;

-- Verificação
SELECT 'Função listar_dimensoes_dashboard' as item,
       '✅ Atualizada sem SECURITY DEFINER (respeita RLS)' as status;
