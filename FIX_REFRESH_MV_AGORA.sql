-- =====================================================================
-- SOLUÇÃO IMEDIATA PARA ATUALIZAR A MATERIALIZED VIEW
-- Execute este comando AGORA para ver os dados até 12/10/2025
-- =====================================================================

-- ⚠️ Este comando VAI BLOQUEAR o dashboard por 1-3 minutos durante a execução
-- Mas é a solução mais rápida para o seu problema atual

REFRESH MATERIALIZED VIEW public.mv_aderencia_agregada;

-- ✅ Após executar, os dados devem aparecer até 12/10/2025

