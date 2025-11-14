# Instruções para Aplicar Índices de Performance

## ⚠️ Importante
O MCP do Supabase não está disponível no momento. Siga estas instruções para aplicar os índices manualmente.

## 📋 Passo a Passo

### 1. Acesse o Supabase Dashboard
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)

### 2. Execute o Script SQL
1. Abra o arquivo `criar_indices_otimizados.sql` neste repositório
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** ou pressione `Ctrl+Enter`

### 3. Verifique a Criação dos Índices
Execute esta query para verificar se os índices foram criados:

```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'dados_corridas'
  AND indexname LIKE 'idx_dados_corridas%'
ORDER BY indexname;
```

Você deve ver 4 novos índices:
- `idx_dados_corridas_data_filtros`
- `idx_dados_corridas_entregador_data_filtros`
- `idx_dados_corridas_ano_semana_filtros`
- `idx_dados_corridas_entregador_ano_semana`

### 4. Verifique Índices nas Materialized Views
```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND (tablename = 'mv_entregadores_agregados' OR tablename = 'mv_valores_entregadores_agregados')
ORDER BY tablename, indexname;
```

Você deve ver 2 novos índices:
- `idx_mv_entregadores_data_filtros`
- `idx_mv_valores_data_filtros`

## ✅ Índices Criados

### Para Intervalo de Datas:
1. **idx_dados_corridas_data_filtros** - Otimiza queries com `data_do_periodo` + filtros
2. **idx_dados_corridas_entregador_data_filtros** - Otimiza GROUP BY entregadores com intervalo de datas

### Para Ano/Semana:
3. **idx_dados_corridas_ano_semana_filtros** - Otimiza queries com `ano_iso`/`semana_numero` + filtros
4. **idx_dados_corridas_entregador_ano_semana** - Otimiza GROUP BY entregadores com ano/semana

### Para Materialized Views:
5. **idx_mv_entregadores_data_filtros** - Índice na MV de entregadores
6. **idx_mv_valores_data_filtros** - Índice na MV de valores

## 🎯 Resultado Esperado

Após criar os índices:
- ✅ Queries das guias UTR, Entregadores, Valores e Prioridade/Promo devem ser mais rápidas
- ✅ O comando `ANALYZE` já foi executado para atualizar estatísticas
- ✅ Performance deve melhorar especialmente com filtros de data e praça

## 🔍 Verificar Performance

Para verificar se os índices estão sendo usados, execute:

```sql
EXPLAIN ANALYZE
SELECT 
  id_da_pessoa_entregadora,
  MAX(pessoa_entregadora) AS nome_entregador,
  SUM(numero_de_corridas_ofertadas)::bigint AS corridas_ofertadas
FROM public.dados_corridas
WHERE data_do_periodo >= '2025-01-01' 
  AND data_do_periodo <= '2025-01-31'
  AND praca = 'SP'
  AND id_da_pessoa_entregadora IS NOT NULL
  AND id_da_pessoa_entregadora != ''
GROUP BY id_da_pessoa_entregadora;
```

O plano de execução deve mostrar `Index Scan using idx_dados_corridas_entregador_data_filtros` (ou similar).

## 📝 Notas

- Os índices são criados com `IF NOT EXISTS`, então é seguro executar o script múltiplas vezes
- A criação dos índices pode levar alguns minutos dependendo do tamanho da tabela
- Os índices são parciais (com WHERE) para reduzir tamanho e melhorar performance
- O comando `ANALYZE` atualiza as estatísticas do otimizador de queries

