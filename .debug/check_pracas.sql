-- Script para verificar quais praças existem nos dados das semanas 38 e 39
-- Execute no SQL Editor

SELECT DISTINCT praca, COUNT(*) as total
FROM tb_dashboard_resumo
WHERE semana_iso IN (38, 39)
  AND ano_iso = 2025
GROUP BY praca
ORDER BY total DESC;
