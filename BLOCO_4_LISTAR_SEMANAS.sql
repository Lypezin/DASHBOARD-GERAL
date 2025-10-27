-- =====================================================================
-- BLOCO 4: FUNÇÃO listar_todas_semanas
-- =====================================================================

DROP FUNCTION IF EXISTS public.listar_todas_semanas();

CREATE OR REPLACE FUNCTION public.listar_todas_semanas()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    jsonb_agg(DISTINCT semana ORDER BY semana DESC),
    '[]'::JSONB
  )
  FROM (
    SELECT ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana
    FROM dados_corridas
    WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL
    LIMIT 100
  ) sub;
$$;

GRANT EXECUTE ON FUNCTION public.listar_todas_semanas() TO authenticated, anon;

