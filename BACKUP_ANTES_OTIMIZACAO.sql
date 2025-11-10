-- =====================================================================
-- BACKUP ANTES DA OTIMIZAÇÃO
-- =====================================================================
-- Este script cria um backup das definições dos recursos que serão removidos
-- Execute este script ANTES de executar os scripts de otimização
-- =====================================================================

-- Criar tabela temporária para armazenar o backup
CREATE TABLE IF NOT EXISTS backup_otimizacao (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,
  nome TEXT NOT NULL,
  definicao TEXT,
  tamanho TEXT,
  scans INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Limpar backup anterior se existir
TRUNCATE TABLE backup_otimizacao;

-- =====================================================================
-- BACKUP: Tabela evolucao_agregada
-- =====================================================================
INSERT INTO backup_otimizacao (tipo, nome, definicao, tamanho)
SELECT 
  'TABELA',
  'evolucao_agregada',
  pg_get_tabledef('public', 'evolucao_agregada'),
  pg_size_pretty(pg_total_relation_size('public.evolucao_agregada'::regclass))
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'evolucao_agregada'
);

-- =====================================================================
-- BACKUP: Função atualizar_evolucao_agregada
-- =====================================================================
INSERT INTO backup_otimizacao (tipo, nome, definicao)
SELECT 
  'FUNCAO',
  'atualizar_evolucao_agregada',
  pg_get_functiondef(oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'atualizar_evolucao_agregada';

-- =====================================================================
-- BACKUP: Índices que serão removidos
-- =====================================================================

-- Índices nunca utilizados
INSERT INTO backup_otimizacao (tipo, nome, definicao, tamanho, scans)
SELECT 
  'INDICE',
  indexname,
  indexdef,
  pg_size_pretty(pg_relation_size(indexname::regclass)),
  COALESCE(idx_scan, 0)
FROM pg_indexes i
LEFT JOIN pg_stat_user_indexes s ON i.indexname = s.indexrelname
WHERE i.schemaname = 'public' 
  AND i.tablename = 'dados_corridas'
  AND i.indexname IN (
    'idx_dados_corridas_entregador_periodo',
    'idx_dados_corridas_taxas',
    'idx_dados_agregacao_otimizado',
    'idx_dados_utr_otimizado',
    'idx_dados_corridas_filtros_entregadores',
    'idx_dados_corridas_distinct',
    'idx_dados_dia_iso',
    'idx_dados_corridas_isoyear_week',
    'idx_dados_ano_iso',
    'idx_dados_corridas_dia_iso',
    'idx_dados_corridas_sub_praca_data',
    'idx_dados_corridas_pessoa',
    'idx_dados_corridas_praca_data',
    'idx_dados_corridas_filtros_principais',
    'idx_dados_periodo',
    'idx_dados_data_periodo',
    -- Duplicatas
    'idx_dados_praca_ano_semana',
    'idx_dados_corridas_praca_semana',
    'idx_dados_corridas_data_do_periodo',
    'idx_dados_corridas_data_simples',
    'idx_dados_corridas_data',
    'idx_dados_corridas_data_basico',
    'idx_dados_corridas_ano_semana_basico',
    'idx_dados_corridas_ano_semana_praca'
  );

-- =====================================================================
-- RESUMO DO BACKUP
-- =====================================================================
DO $$
DECLARE
  v_total INTEGER;
  v_tabelas INTEGER;
  v_funcoes INTEGER;
  v_indices INTEGER;
  v_tamanho_total BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM backup_otimizacao;
  SELECT COUNT(*) INTO v_tabelas FROM backup_otimizacao WHERE tipo = 'TABELA';
  SELECT COUNT(*) INTO v_funcoes FROM backup_otimizacao WHERE tipo = 'FUNCAO';
  SELECT COUNT(*) INTO v_indices FROM backup_otimizacao WHERE tipo = 'INDICE';
  
  SELECT COALESCE(SUM(pg_relation_size(indexname::regclass)), 0) INTO v_tamanho_total
  FROM pg_indexes
  WHERE schemaname = 'public' 
    AND tablename = 'dados_corridas'
    AND indexname IN (
      SELECT nome FROM backup_otimizacao WHERE tipo = 'INDICE'
    );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BACKUP CRIADO COM SUCESSO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de recursos: %', v_total;
  RAISE NOTICE 'Tabelas: %', v_tabelas;
  RAISE NOTICE 'Funções: %', v_funcoes;
  RAISE NOTICE 'Índices: %', v_indices;
  RAISE NOTICE 'Tamanho total dos índices: %', pg_size_pretty(v_tamanho_total);
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Para ver o backup: SELECT * FROM backup_otimizacao ORDER BY tipo, nome;';
  RAISE NOTICE '========================================';
END $$;

-- Mostrar resumo
SELECT 
  tipo,
  COUNT(*) as quantidade,
  STRING_AGG(nome, ', ' ORDER BY nome) as recursos
FROM backup_otimizacao
GROUP BY tipo
ORDER BY tipo;

