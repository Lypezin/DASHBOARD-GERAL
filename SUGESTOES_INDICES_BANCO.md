# Sugestões de Índices para Melhorar Performance

Este documento contém sugestões de índices para melhorar a performance das queries do sistema.

## Índices Recomendados

### 1. Tabela `dados_corridas`

Esta é a tabela principal que armazena os dados de corridas. As queries frequentemente filtram por:
- `praca`
- `sub_praca`
- `origem`
- `data_do_periodo`
- Combinações desses campos

#### Índices Sugeridos:

```sql
-- Índice composto para filtros comuns (praca, sub_praca, origem, data)
CREATE INDEX IF NOT EXISTS idx_dados_corridas_filtros 
ON public.dados_corridas(praca, sub_praca, origem, data_do_periodo);

-- Índice para data_do_periodo (usado em queries de evolução)
CREATE INDEX IF NOT EXISTS idx_dados_corridas_data_periodo 
ON public.dados_corridas(data_do_periodo DESC);

-- Índice para praça (filtro muito comum)
CREATE INDEX IF NOT EXISTS idx_dados_corridas_praca 
ON public.dados_corridas(praca) 
WHERE praca IS NOT NULL;

-- Índice para id_da_pessoa_entregadora (usado em queries de entregadores)
CREATE INDEX IF NOT EXISTS idx_dados_corridas_entregador 
ON public.dados_corridas(id_da_pessoa_entregadora) 
WHERE id_da_pessoa_entregadora IS NOT NULL;

-- Índice composto para queries de entregadores com filtros
CREATE INDEX IF NOT EXISTS idx_dados_corridas_entregador_filtros 
ON public.dados_corridas(id_da_pessoa_entregadora, praca, sub_praca, origem, data_do_periodo);
```

### 2. Tabela `user_conquistas`

Usada no sistema de conquistas e ranking.

```sql
-- Índice composto para queries de conquistas do usuário
CREATE INDEX IF NOT EXISTS idx_user_conquistas_usuario_conquista 
ON public.user_conquistas(user_id, conquista_id);

-- Índice para ranking (conquistas completas)
CREATE INDEX IF NOT EXISTS idx_user_conquistas_completas 
ON public.user_conquistas(user_id, progresso, conquistada_em) 
WHERE progresso >= 100 AND conquistada_em IS NOT NULL;

-- Índice para verificação de conquistas (progresso)
CREATE INDEX IF NOT EXISTS idx_user_conquistas_progresso 
ON public.user_conquistas(user_id, progresso) 
WHERE progresso < 100;
```

### 3. Tabela `conquistas`

```sql
-- Índice para conquistas ativas
CREATE INDEX IF NOT EXISTS idx_conquistas_ativa 
ON public.conquistas(ativa) 
WHERE ativa = true;
```

### 4. Tabela `user_profiles`

```sql
-- Índice para busca de perfil do usuário
CREATE INDEX IF NOT EXISTS idx_user_profiles_id 
ON public.user_profiles(id);

-- Índice para busca por praças atribuídas (se usar array)
-- Nota: Depende de como as praças são armazenadas
```

### 5. Tabela `user_activity` (se existir)

```sql
-- Índice para queries de atividade do usuário
CREATE INDEX IF NOT EXISTS idx_user_activity_user_data 
ON public.user_activity(user_id, created_at DESC);

-- Índice para queries por tipo de atividade
CREATE INDEX IF NOT EXISTS idx_user_activity_tipo 
ON public.user_activity(user_id, activity_type, created_at DESC);
```

## Materialized Views

Se ainda não existirem, considere criar materialized views para queries complexas que são executadas frequentemente:

```sql
-- Exemplo: Materialized view para dados agregados de entregadores
-- (Ajustar conforme a estrutura real do banco)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_entregadores_agregados AS
SELECT 
  id_da_pessoa_entregadora,
  pessoa_entregadora,
  praca,
  sub_praca,
  origem,
  data_do_periodo,
  SUM(numero_de_corridas_ofertadas) as total_ofertadas,
  SUM(numero_de_corridas_aceitas) as total_aceitas,
  SUM(numero_de_corridas_completadas) as total_completadas,
  -- ... outros agregados
FROM public.dados_corridas
GROUP BY id_da_pessoa_entregadora, pessoa_entregadora, praca, sub_praca, origem, data_do_periodo;

-- Índice na materialized view
CREATE INDEX IF NOT EXISTS idx_mv_entregadores_filtros 
ON mv_entregadores_agregados(praca, sub_praca, origem, data_do_periodo);
```

## Análise de Performance

Após criar os índices, execute:

```sql
-- Analisar tabelas para atualizar estatísticas
ANALYZE public.dados_corridas;
ANALYZE public.user_conquistas;
ANALYZE public.conquistas;
ANALYZE public.user_profiles;

-- Verificar uso de índices
EXPLAIN ANALYZE 
SELECT * FROM public.dados_corridas 
WHERE praca = 'SP' AND data_do_periodo >= '2025-01-01';
```

## Notas Importantes

1. **Ordem dos índices**: A ordem das colunas no índice composto importa. Coloque primeiro as colunas mais seletivas.

2. **Índices parciais**: Use índices parciais (com WHERE) quando possível para reduzir o tamanho do índice.

3. **Manutenção**: Materialized views precisam ser atualizadas periodicamente. Considere usar triggers ou jobs agendados.

4. **Monitoramento**: Monitore o uso de índices após criação. Índices não utilizados podem ser removidos para economizar espaço.

5. **Teste em ambiente de desenvolvimento primeiro**: Sempre teste os índices em um ambiente de desenvolvimento antes de aplicar em produção.

## Queries para Verificar Índices Existentes

```sql
-- Listar todos os índices de uma tabela
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'dados_corridas'
ORDER BY indexname;

-- Verificar tamanho dos índices
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename = 'dados_corridas'
ORDER BY pg_relation_size(indexrelid) DESC;
```

