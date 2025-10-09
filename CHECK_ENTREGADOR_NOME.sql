-- Verificar colunas disponíveis para nome do entregador
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dados_corridas' 
  AND (column_name ILIKE '%entregador%' OR column_name ILIKE '%pessoa%' OR column_name ILIKE '%nome%')
ORDER BY ordinal_position;

-- Ver exemplos de dados
SELECT DISTINCT 
  id_da_pessoa_entregadora,
  nome_da_pessoa_entregadora,
  pessoa_entregadora
FROM public.dados_corridas 
WHERE id_da_pessoa_entregadora IS NOT NULL
LIMIT 10;

