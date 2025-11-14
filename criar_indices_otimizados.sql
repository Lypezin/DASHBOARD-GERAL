-- Criar índices otimizados para performance das guias UTR, Entregadores, Valores e Prioridade/Promo

-- 1. Índices para intervalo de datas
CREATE INDEX IF NOT EXISTS idx_dados_corridas_data_filtros 
ON public.dados_corridas(data_do_periodo, praca, sub_praca, origem)
WHERE data_do_periodo IS NOT NULL 
  AND id_da_pessoa_entregadora IS NOT NULL 
  AND id_da_pessoa_entregadora != '';

CREATE INDEX IF NOT EXISTS idx_dados_corridas_entregador_data_filtros
ON public.dados_corridas(id_da_pessoa_entregadora, data_do_periodo, praca, sub_praca, origem)
WHERE data_do_periodo IS NOT NULL 
  AND id_da_pessoa_entregadora IS NOT NULL 
  AND id_da_pessoa_entregadora != '';

-- 2. Índices para ano/semana
CREATE INDEX IF NOT EXISTS idx_dados_corridas_ano_semana_filtros
ON public.dados_corridas(ano_iso, semana_numero, praca, sub_praca, origem)
WHERE ano_iso IS NOT NULL 
  AND semana_numero IS NOT NULL
  AND id_da_pessoa_entregadora IS NOT NULL 
  AND id_da_pessoa_entregadora != '';

CREATE INDEX IF NOT EXISTS idx_dados_corridas_entregador_ano_semana
ON public.dados_corridas(id_da_pessoa_entregadora, ano_iso, semana_numero, praca, sub_praca, origem)
WHERE ano_iso IS NOT NULL 
  AND semana_numero IS NOT NULL
  AND id_da_pessoa_entregadora IS NOT NULL 
  AND id_da_pessoa_entregadora != '';

-- 3. Índices nas materialized views
CREATE INDEX IF NOT EXISTS idx_mv_entregadores_data_filtros
ON public.mv_entregadores_agregados(ano_iso, semana_numero, praca, sub_praca, origem);

CREATE INDEX IF NOT EXISTS idx_mv_valores_data_filtros
ON public.mv_valores_entregadores_agregados(ano_iso, semana_numero, praca, sub_praca, origem);

-- 4. Atualizar estatísticas
ANALYZE public.dados_corridas;
ANALYZE public.mv_entregadores_agregados;
ANALYZE public.mv_valores_entregadores_agregados;

