-- Script para verificar organization_id em tb_dashboard_resumo
-- Execute no SQL Editor

SELECT 
    organization_id,
    COUNT(*) as total_registros
FROM tb_dashboard_resumo
WHERE semana_iso = 36 
  AND ano_iso = 2025
GROUP BY organization_id;
