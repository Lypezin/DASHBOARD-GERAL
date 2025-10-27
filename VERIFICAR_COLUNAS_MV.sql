-- Verificar colunas da MV
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mv_aderencia_agregada'
ORDER BY ordinal_position;
