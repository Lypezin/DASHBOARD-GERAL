-- Script para investigar a tabela/view tb_dashboard_resumo
-- Execute no SQL Editor

-- 1. Verificar o que é tb_dashboard_resumo (tabela, view ou materialized view)
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_name = 'tb_dashboard_resumo';

-- Se não aparecer acima (pode ser matview), verificar em pg_matviews
SELECT schemaname, matviewname, 'MATERIALIZED VIEW' as type
FROM pg_matviews
WHERE matviewname = 'tb_dashboard_resumo';

-- 2. Comparar contagem de dados entre a tabela bruta e a tabela do dashboard
SELECT 
    'dados_corridas' as origem,
    EXTRACT(WEEK FROM data_do_periodo AT TIME ZONE 'America/Sao_Paulo') as semana,
    COUNT(*) as total
FROM dados_corridas
WHERE EXTRACT(WEEK FROM data_do_periodo AT TIME ZONE 'America/Sao_Paulo') IN (36, 37)
  AND EXTRACT(ISOYEAR FROM data_do_periodo AT TIME ZONE 'America/Sao_Paulo') = 2025
GROUP BY 1, 2

UNION ALL

SELECT 
    'tb_dashboard_resumo' as origem,
    semana_iso as semana,
    COUNT(*) as total
FROM tb_dashboard_resumo
WHERE semana_iso IN (36, 37)
  AND ano_iso = 2025
GROUP BY 1, 2
ORDER BY 1, 2;

-- 3. Se for Materialized View, tentar atualizar (descomente se tiver permissão)
-- REFRESH MATERIALIZED VIEW tb_dashboard_resumo;
