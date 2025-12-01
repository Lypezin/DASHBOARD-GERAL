-- Script de Diagnóstico Completo (Reescrito)
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar colunas da tabela dados_corridas (para confirmar nomes)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dados_corridas'
ORDER BY ordinal_position;

-- 2. Descobrir a assinatura exata da função dashboard_resumo
SELECT 
    parameter_name, 
    data_type, 
    ordinal_position,
    parameter_mode
FROM information_schema.parameters 
WHERE specific_name LIKE 'dashboard_resumo%'
ORDER BY ordinal_position;

-- 3. Verificar se existem dados para as semanas 36 e 37 (Agrupamento corrigido)
SELECT 
  EXTRACT(ISOYEAR FROM data_do_periodo AT TIME ZONE 'America/Sao_Paulo') as ano,
  EXTRACT(WEEK FROM data_do_periodo AT TIME ZONE 'America/Sao_Paulo') as semana,
  COUNT(*) as total_corridas
FROM dados_corridas
WHERE EXTRACT(WEEK FROM data_do_periodo AT TIME ZONE 'America/Sao_Paulo') IN (36, 37)
  AND EXTRACT(ISOYEAR FROM data_do_periodo AT TIME ZONE 'America/Sao_Paulo') = 2025
GROUP BY 1, 2
ORDER BY 1, 2;

-- 4. Verificar distribuição diária para a semana 36 (Agrupamento corrigido)
SELECT 
  EXTRACT(ISODOW FROM data_do_periodo AT TIME ZONE 'America/Sao_Paulo') as dia_iso,
  TO_CHAR(data_do_periodo AT TIME ZONE 'America/Sao_Paulo', 'Day') as dia_nome,
  COUNT(*) as total
FROM dados_corridas
WHERE EXTRACT(WEEK FROM data_do_periodo AT TIME ZONE 'America/Sao_Paulo') = 36
  AND EXTRACT(ISOYEAR FROM data_do_periodo AT TIME ZONE 'America/Sao_Paulo') = 2025
GROUP BY 1, 2
ORDER BY 1;
