-- =====================================================================
-- FUNÇÃO PARA LISTAR VALORES (TAXAS) POR ENTREGADOR
-- Esta função calcula a soma das taxas das corridas aceitas por entregador
-- =====================================================================

-- Deletar a função se já existir
DROP FUNCTION IF EXISTS public.listar_valores_entregadores(INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT) CASCADE;

-- Criar a função
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
    s.id_da_pessoa_entregadora::TEXT as id_entregador,
    COALESCE(MAX(s.pessoa_entregadora), s.id_da_pessoa_entregadora::TEXT) as nome_entregador,
    ROUND(SUM(COALESCE(s.soma_das_taxas_das_corridas_aceitas, 0))::numeric, 2) as total_taxas,
    SUM(COALESCE(s.numero_de_corridas_aceitas, 0)) as numero_corridas_aceitas,
    CASE 
      WHEN SUM(COALESCE(s.numero_de_corridas_aceitas, 0)) > 0 
      THEN ROUND((SUM(COALESCE(s.soma_das_taxas_das_corridas_aceitas, 0)) / SUM(COALESCE(s.numero_de_corridas_aceitas, 0)))::numeric, 2)
      ELSE 0
    END as taxa_media
  FROM public."Sheet1" s
  WHERE 1=1
    AND (p_ano IS NULL OR EXTRACT(YEAR FROM s.data_do_periodo) = p_ano)
    AND (p_semana IS NULL OR s.semana = p_semana)
    AND (p_praca IS NULL OR s.praca = p_praca)
    AND (p_sub_praca IS NULL OR s.sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR s.origem = p_origem)
    AND (p_turno IS NULL OR s.periodo = p_turno)
    AND s.id_da_pessoa_entregadora IS NOT NULL
  GROUP BY s.id_da_pessoa_entregadora
  HAVING SUM(COALESCE(s.soma_das_taxas_das_corridas_aceitas, 0)) > 0
  ORDER BY total_taxas DESC
  LIMIT 1000;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION public.listar_valores_entregadores IS 'Lista o total de taxas das corridas aceitas por entregador com filtros opcionais';

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.listar_valores_entregadores TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_valores_entregadores TO anon;

-- =====================================================================
-- TESTE DA FUNÇÃO
-- =====================================================================

-- Teste 1: Sem filtros (top 10 entregadores por valor)
SELECT * FROM public.listar_valores_entregadores(NULL, NULL, NULL, NULL, NULL, NULL)
LIMIT 10;

-- Teste 2: Filtrar por praça específica
-- SELECT * FROM public.listar_valores_entregadores(NULL, NULL, 'GUARULHOS', NULL, NULL, NULL)
-- LIMIT 10;

-- Teste 3: Filtrar por semana específica
-- SELECT * FROM public.listar_valores_entregadores(2025, 35, NULL, NULL, NULL, NULL)
-- LIMIT 10;

-- =====================================================================
-- VERIFICAR SE A FUNÇÃO FOI CRIADA
-- =====================================================================
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'listar_valores_entregadores';

-- ✅ Se aparecer 1 linha, a função foi criada com sucesso!

