-- Verificar nomes corretos das colunas
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'dados_corridas' 
  AND column_name LIKE '%tempo%'
ORDER BY column_name;

