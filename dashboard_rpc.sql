-- Função RPC para Dashboard (evita limite de 1000 linhas)
-- Execute no SQL Editor do Supabase

-- 1. Dropar função antiga (se existir)
DROP FUNCTION IF EXISTS public.dashboard_totals();

-- 2. Criar função RPC
CREATE OR REPLACE FUNCTION public.dashboard_totals()
RETURNS TABLE (
  corridas_ofertadas numeric,
  corridas_aceitas numeric,
  corridas_rejeitadas numeric,
  corridas_completadas numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(numero_de_corridas_ofertadas), 0) AS corridas_ofertadas,
    COALESCE(SUM(numero_de_corridas_aceitas), 0) AS corridas_aceitas,
    COALESCE(SUM(numero_de_corridas_rejeitadas), 0) AS corridas_rejeitadas,
    COALESCE(SUM(numero_de_corridas_completadas), 0) AS corridas_completadas
  FROM public.dados_corridas;
$$;

-- 3. Garantir permissão de execução
GRANT EXECUTE ON FUNCTION public.dashboard_totals() TO anon, authenticated, service_role;
