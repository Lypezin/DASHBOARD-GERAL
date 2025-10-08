-- =====================================================================
-- FUNÇÃO SIMPLES PARA LISTAR PRAÇAS DISPONÍVEIS
-- =====================================================================
-- Execute no Supabase SQL Editor
-- =====================================================================

DROP FUNCTION IF EXISTS public.list_pracas_disponiveis();

CREATE OR REPLACE FUNCTION public.list_pracas_disponiveis()
RETURNS TABLE (praca TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT dados_corridas.praca
  FROM public.dados_corridas
  WHERE dados_corridas.praca IS NOT NULL
  ORDER BY dados_corridas.praca;
$$;

GRANT EXECUTE ON FUNCTION public.list_pracas_disponiveis() 
  TO authenticated, anon;

-- Verificar
SELECT * FROM public.list_pracas_disponiveis();
