-- Ver TODAS as colunas da tabela
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'dados_corridas'
ORDER BY ordinal_position;

