-- =====================================================================
-- CORRIGIR FUNÇÃO DE VALORES - CONVERTER CENTAVOS PARA REAIS
-- =====================================================================

DROP FUNCTION IF EXISTS public.listar_valores_entregadores(INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.listar_valores_entregadores(
  p_ano INTEGER DEFAULT NULL,
  p_semana INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_sub_praca TEXT DEFAULT NULL,
  p_origem TEXT DEFAULT NULL,
  p_turno TEXT DEFAULT NULL
)
RETURNS TABLE(
  id_entregador TEXT,
  nome_entregador TEXT,
  total_taxas NUMERIC,
  numero_corridas_aceitas BIGINT,
  taxa_media NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '60000ms'
SET work_mem = '256MB'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id_da_pessoa_entregadora::TEXT as id_entregador,
    COALESCE(MAX(d.pessoa_entregadora), d.id_da_pessoa_entregadora::TEXT) as nome_entregador,
    ROUND((SUM(COALESCE(d.soma_das_taxas_das_corridas_aceitas, 0)) / 100.0)::numeric, 2) as total_taxas,
    SUM(COALESCE(d.numero_de_corridas_aceitas, 0)) as numero_corridas_aceitas,
    CASE 
      WHEN SUM(COALESCE(d.numero_de_corridas_aceitas, 0)) > 0 
      THEN ROUND(((SUM(COALESCE(d.soma_das_taxas_das_corridas_aceitas, 0)) / 100.0) / SUM(COALESCE(d.numero_de_corridas_aceitas, 0)))::numeric, 2)
      ELSE 0
    END as taxa_media
  FROM public.dados_corridas d
  WHERE 1=1
    AND (p_ano IS NULL OR EXTRACT(YEAR FROM d.data_do_periodo) = p_ano)
    AND (p_semana IS NULL OR d.semana_numero = p_semana)
    AND (p_praca IS NULL OR d.praca = p_praca)
    AND (p_sub_praca IS NULL OR d.sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR d.origem = p_origem)
    AND (p_turno IS NULL OR d.periodo = p_turno)
    AND d.id_da_pessoa_entregadora IS NOT NULL
    AND d.data_do_periodo IS NOT NULL
  GROUP BY d.id_da_pessoa_entregadora
  HAVING SUM(COALESCE(d.soma_das_taxas_das_corridas_aceitas, 0)) > 0
  ORDER BY total_taxas DESC
  LIMIT 1000;
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_valores_entregadores TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_valores_entregadores TO anon;

