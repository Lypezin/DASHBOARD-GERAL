-- Database Optimization Script for Dashboard
-- Run this in your Supabase SQL Editor to fix 500/Timeout errors

-- Indexes for 'valores_entregadores' (or equivalent table used by listar_valores_entregadores)
-- Assuming the table name is 'valores_entregadores' based on the feature name.
-- If the table name is different, please adjust.

-- Composite index for the most common filtering pattern: Ano + Semana + Praca + Organization
CREATE INDEX IF NOT EXISTS idx_valores_entregadores_dashboard 
ON valores_entregadores (organization_id, ano, semana, praca);

-- Index for searching/filtering by names (if applicable)
-- CREATE INDEX IF NOT EXISTS idx_valores_entregadores_nome 
-- ON valores_entregadores USING gin(nome gin_trgm_ops); -- Requires pg_trgm extension

-- Indexes for 'marketing_entregadores_consolidado' (or source of get_entregadores_marketing)
-- Helps with filtering by date ranges and cities

CREATE INDEX IF NOT EXISTS idx_marketing_entregadores_filtro_pagamento
ON marketing_pagamentos (organization_id, data_pagamento, cidade);

-- If you have a separate table for 'corridas' or 'entregas'
CREATE INDEX IF NOT EXISTS idx_corridas_entregador_data 
ON tb_corridas (organization_id, id_entregador, data_corrida);

-- Optimize the specific function 'listar_valores_entregadores' if possible
-- Ensure the function source code uses the indexes above.

-- Run ANALYZE to update statistics for the query planner
ANALYZE valores_entregadores;
ANALYZE marketing_pagamentos;
-- ANALYZE tb_corridas;
