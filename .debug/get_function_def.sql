-- Script para obter a definição da função dashboard_resumo
-- Execute isto e copie o resultado da coluna "header_lines" ou "definition"

SELECT pg_get_functiondef('dashboard_resumo'::regproc);
