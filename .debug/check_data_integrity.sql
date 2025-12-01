-- Script para verificar integridade dos dados em tb_dashboard_resumo
-- Execute no SQL Editor

-- 1. Verificar se existem datas ou organization_id nulos na semana 36
SELECT 
    COUNT(*) as total_rows,
    COUNT(data_do_periodo) as rows_with_date,
    COUNT(organization_id) as rows_with_org,
    COUNT(*) FILTER (WHERE organization_id IS NULL) as null_orgs,
    COUNT(*) FILTER (WHERE data_do_periodo IS NULL) as null_dates
FROM tb_dashboard_resumo
WHERE semana_iso = 36 AND ano_iso = 2025;

-- 2. Verificar definição da view (se possível)
SELECT pg_get_viewdef('tb_dashboard_resumo', true);

-- 3. Verificar se os dados batem com a tabela original para um dia específico
SELECT 
    'dados_corridas' as origem,
    data_do_periodo::date as data,
    COUNT(*) as total
FROM dados_corridas
WHERE EXTRACT(WEEK FROM data_do_periodo AT TIME ZONE 'America/Sao_Paulo') = 36
  AND EXTRACT(ISOYEAR FROM data_do_periodo AT TIME ZONE 'America/Sao_Paulo') = 2025
GROUP BY 1, 2
ORDER BY 2
LIMIT 5;

SELECT 
    'tb_dashboard_resumo' as origem,
    data_do_periodo::date as data,
    COUNT(*) as total_registros_agregados,
    SUM(total_ofertadas) as total_ofertadas_calc
FROM tb_dashboard_resumo
WHERE semana_iso = 36
  AND ano_iso = 2025
GROUP BY 1, 2
ORDER BY 2
LIMIT 5;
