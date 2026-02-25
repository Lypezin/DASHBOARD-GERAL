-- =====================================================
-- BACKUP dos índices removidos em 2026-02-24
-- Motivo: RPCs listar_entregadores_v2 e listar_valores_entregadores
-- agora usam MVs (mv_entregadores_agregado e mv_valores_entregador)
-- Para restaurar: execute este arquivo no Supabase SQL Editor
-- =====================================================

-- 1. idx_dados_corridas_entregador_semanal (658 MB, 120 scans)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dados_corridas_entregador_semanal
    ON public.dados_corridas USING btree (ano_iso, semana_numero, organization_id)
    INCLUDE (
        id_da_pessoa_entregadora, pessoa_entregadora, praca, sub_praca, origem,
        numero_de_corridas_ofertadas, numero_de_corridas_aceitas,
        numero_de_corridas_rejeitadas, numero_de_corridas_completadas,
        tempo_disponivel_absoluto_segundos, soma_das_taxas_das_corridas_aceitas
    )
    WHERE (pessoa_entregadora IS NOT NULL);

-- 2. idx_dados_corridas_valores_otimizado (494 MB, 586 scans)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dados_corridas_valores_otimizado
    ON public.dados_corridas USING btree (ano_iso, semana_numero, id_da_pessoa_entregadora)
    INCLUDE (
        pessoa_entregadora, numero_de_corridas_aceitas, soma_das_taxas_das_corridas_aceitas
    )
    WHERE (
        data_do_periodo IS NOT NULL
        AND id_da_pessoa_entregadora IS NOT NULL
        AND id_da_pessoa_entregadora <> ''
        AND pessoa_entregadora IS NOT NULL
        AND numero_de_corridas_aceitas > 0
    );
