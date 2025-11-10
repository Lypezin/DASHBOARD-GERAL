-- =====================================================================
-- CORRIGIR ÍNDICE PARA FILTRO DE SEMANA
-- =====================================================================
-- Este script recria um índice otimizado que foi removido por engano
-- e que é necessário para queries com filtro de semana
-- =====================================================================

-- Recriar índice otimizado para queries que filtram por:
-- - data_do_periodo IS NOT NULL (condição comum em todas as queries)
-- - ano_iso IS NOT NULL
-- - semana_numero IS NOT NULL
-- Este índice é usado por queries que precisam dessas 3 condições juntas

CREATE INDEX IF NOT EXISTS idx_dados_corridas_ano_semana_otimizado
ON public.dados_corridas 
USING btree (ano_iso, semana_numero) 
WHERE (
  data_do_periodo IS NOT NULL 
  AND ano_iso IS NOT NULL 
  AND semana_numero IS NOT NULL
);

-- Verificar se foi criado
DO $$
DECLARE
  v_exists BOOLEAN;
  v_size TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'dados_corridas'
      AND indexname = 'idx_dados_corridas_ano_semana_otimizado'
  ) INTO v_exists;
  
  IF v_exists THEN
    SELECT pg_size_pretty(pg_relation_size('idx_dados_corridas_ano_semana_otimizado'::regclass)) INTO v_size;
    RAISE NOTICE '✅ Índice idx_dados_corridas_ano_semana_otimizado criado com sucesso';
    RAISE NOTICE '   Tamanho: %', v_size;
  ELSE
    RAISE WARNING '⚠️ Erro ao criar índice';
  END IF;
END $$;

-- =====================================================================
-- FIM DO SCRIPT
-- =====================================================================

