# 🔍 Relatório de Análise: Consumo Excessivo de Disk IO Bandwidth

## 📊 Resumo Executivo

Análise completa do projeto **DASHBOARD GERAL** no Supabase identificando as principais causas do consumo excessivo de Disk IO Bandwidth.

**Data da Análise:** 2025-01-21  
**Projeto:** ulmobmmlkevxswxpcyza (DASHBOARD GERAL)

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **Tabela `dados_corridas` com 1.675.093 linhas** ⚠️ CRÍTICO

**Impacto:** MUITO ALTO
- **Tamanho total:** 1.744 MB (546 MB tabela + 1.197 MB índices)
- **Total de índices:** 30 índices
- **Problema:** Cada INSERT precisa atualizar 30 índices, causando overhead massivo de escrita

**Evidência:**
```
INSERTs: 250 chamadas
Total de blocos lidos: 10.114.523 blocos
Leituras do disco: 78.783 blocos
Cache hits: 10.035.740 blocos
Tempo médio por INSERT: 379.87ms
```

**Solução Recomendada:**
- ✅ Reduzir número de índices (consolidar índices similares)
- ✅ Usar índices parciais quando possível
- ✅ Considerar particionamento da tabela por data

---

### 2. **Queries SELECT sem LIMIT adequado ou com LIMIT muito alto** ⚠️ CRÍTICO

**Impacto:** ALTO

**Problemas encontrados:**

#### a) `QUERY_LIMITS.AGGREGATION_MAX = 50.000` é muito alto
```typescript
// src/constants/config.ts
QUERY_LIMITS = {
  AGGREGATION_MAX: 50000,  // ❌ MUITO ALTO para tabela com 1.6M linhas
}
```

**Evidência:**
- Queries fazendo scan de até 50.000 linhas mesmo com filtros
- Cada query pode ler centenas de milhares de blocos

**Solução:**
- ✅ Reduzir `AGGREGATION_MAX` para 10.000 ou menos
- ✅ Implementar paginação real em vez de LIMIT alto
- ✅ Usar Materialized Views para agregações

#### b) Queries sem filtro de data obrigatório
```typescript
// src/hooks/useTabDataFetcher.ts
// Linha 91: LIMIT de 50.000 sem garantir filtro de data
query = query.limit(QUERY_LIMITS.AGGREGATION_MAX);
```

**Solução:**
- ✅ Exigir sempre filtro de data nas queries
- ✅ Adicionar validação antes de executar queries grandes

---

### 3. **Materialized Views sendo recriadas constantemente** ⚠️ CRÍTICO

**Impacto:** MUITO ALTO

**Evidência das queries mais pesadas:**
```
CREATE MATERIALIZED VIEW mv_dashboard_aderencia_metricas
- 3 chamadas
- Tempo total: 181.768 segundos (3 minutos!)
- Total de blocos: 3.977.956 blocos
- Leituras do disco: 389.965 blocos
- Tempo médio: 60.589 segundos por execução
```

**Problema:**
- Materialized Views fazem scan completo na tabela `dados_corridas` (1.6M linhas)
- São recriadas frequentemente, causando I/O massivo
- Múltiplas Materialized Views sendo atualizadas simultaneamente

**Materialized Views identificadas:**
1. `mv_dashboard_aderencia_metricas` - 899.402 inserts
2. `mv_aderencia_agregada` - 4.044.501 inserts ⚠️
3. `mv_entregadores_agregados` - 1.008.389 inserts
4. `mv_valores_entregadores_agregados` - 901.830 inserts
5. `mv_corridas_detalhe` - 1.184.866 inserts
6. `mv_entregue_detalhe` - 1.184.866 inserts
7. `mv_planejado_detalhe` - 1.262.975 inserts

**Solução:**
- ✅ Implementar refresh incremental em vez de recriar completamente
- ✅ Agendar refresh em horários de baixo uso
- ✅ Usar `REFRESH MATERIALIZED VIEW CONCURRENTLY` quando possível
- ✅ Evitar refresh simultâneo de múltiplas views

---

### 4. **Queries fazendo SELECT DISTINCT ON com ORDER BY em tabela grande** ⚠️ ALTO

**Impacto:** ALTO

**Evidência:**
```sql
SELECT DISTINCT ON (dc.data_do_periodo, dc.periodo, dc.praca, dc.sub_praca, dc.origem)
  ...
FROM public.dados_corridas dc
WHERE dc.data_do_periodo IS NOT NULL
ORDER BY dc.data_do_periodo, dc.periodo, dc.praca, dc.sub_praca, dc.origem,
         dc.numero_minimo_de_entregadores_regulares_na_escala DESC
```

**Problema:**
- `DISTINCT ON` com `ORDER BY` requer ordenação completa da tabela
- Em tabela com 1.6M linhas, isso lê milhões de blocos
- Executado múltiplas vezes em diferentes queries

**Solução:**
- ✅ Usar índices que cobrem a ordenação
- ✅ Pré-agregar dados em Materialized Views
- ✅ Evitar DISTINCT ON quando possível, usar GROUP BY

---

### 5. **Queries fazendo scan completo sem usar índices** ⚠️ MÉDIO

**Evidência:**
```
Query: SELECT * FROM dados_corridas ORDER BY data_do_periodo DESC
- 20 chamadas
- Total de blocos: 1.391.018 blocos
- Leituras do disco: 893.310 blocos (64% do total!)
- Cache hits: 497.708 blocos
```

**Problema:**
- Queries sem filtros adequados fazem scan completo
- Mesmo com índices, queries mal escritas não os utilizam

**Solução:**
- ✅ Sempre usar filtros de data
- ✅ Verificar planos de execução (EXPLAIN ANALYZE)
- ✅ Usar apenas colunas necessárias (não SELECT *)

---

### 6. **Muitas escritas (INSERTs) em Materialized Views** ⚠️ MÉDIO

**Impacto:** MÉDIO

**Evidência:**
- `mv_aderencia_agregada`: 4.044.501 inserts
- `mv_planejado_detalhe`: 1.262.975 inserts
- `mv_entregue_detalhe`: 1.184.866 inserts
- `mv_corridas_detalhe`: 1.184.866 inserts

**Problema:**
- Cada refresh de Materialized View faz milhões de INSERTs
- Isso causa I/O massivo de escrita

**Solução:**
- ✅ Usar `REFRESH MATERIALIZED VIEW CONCURRENTLY` (permite leitura durante refresh)
- ✅ Implementar refresh incremental
- ✅ Agendar refresh em horários de baixo uso

---

### 7. **ANALYZE sendo executado frequentemente** ⚠️ BAIXO

**Evidência:**
```
ANALYZE public.dados_corridas
- 14 chamadas
- Total de blocos: 438.062 blocos
- Leituras do disco: 256.488 blocos
```

**Problema:**
- ANALYZE lê toda a tabela para atualizar estatísticas
- Executado muito frequentemente

**Solução:**
- ✅ Deixar autovacuum fazer ANALYZE automaticamente
- ✅ Executar ANALYZE apenas após grandes mudanças de dados

---

## ✅ CHECKLIST DE VERIFICAÇÕES

### ✅ Verificações Realizadas

- [x] Realtime NÃO está habilitado (não é problema)
- [x] Não há Edge Functions processando PDFs/imagens
- [x] Não há uploads frequentes de arquivos grandes
- [x] Índices existem (mas são muitos - 30 índices)

### ❌ Problemas Confirmados

- [x] SELECT grande sem LIMIT adequado
- [x] Tabela grande (1.6M linhas) fazendo scans completos
- [x] Muita escrita no banco (INSERTs em Materialized Views)
- [x] Materialized Views sendo recriadas constantemente
- [x] Queries sem filtros adequados

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### Prioridade 1 - CRÍTICO (Implementar Imediatamente)

1. **Reduzir número de índices na tabela `dados_corridas`**
   - Consolidar índices similares
   - Remover índices não utilizados
   - Usar índices parciais quando possível

2. **Reduzir `QUERY_LIMITS.AGGREGATION_MAX`**
   - De 50.000 para 10.000 ou menos
   - Implementar paginação real

3. **Otimizar refresh de Materialized Views**
   - Usar `REFRESH CONCURRENTLY`
   - Agendar refresh em horários de baixo uso
   - Evitar refresh simultâneo

### Prioridade 2 - ALTO (Implementar em 1 semana)

4. **Exigir filtro de data em todas as queries**
   - Adicionar validação no código
   - Garantir que queries sem filtro de data sejam rejeitadas

5. **Otimizar queries com DISTINCT ON**
   - Usar índices que cobrem a ordenação
   - Pré-agregar em Materialized Views

6. **Implementar cache mais agressivo**
   - Aumentar TTL do cache
   - Usar cache em memória para dados frequentes

### Prioridade 3 - MÉDIO (Implementar em 1 mês)

7. **Particionar tabela `dados_corridas` por data**
   - Reduzir tamanho de cada partição
   - Melhorar performance de queries com filtro de data

8. **Implementar refresh incremental de Materialized Views**
   - Atualizar apenas dados novos/modificados
   - Reduzir I/O de escrita

9. **Monitorar queries lentas**
   - Configurar alertas para queries que fazem muitos blocos de I/O
   - Revisar periodicamente `pg_stat_statements`

---

## 📝 CÓDIGO PARA IMPLEMENTAR

### 1. Reduzir QUERY_LIMITS

```typescript
// src/constants/config.ts
export const QUERY_LIMITS = {
  FALLBACK_MAX: 5000,        // Reduzido de 10000
  AGGREGATION_MAX: 10000,    // Reduzido de 50000 ⚠️ CRÍTICO
  DEFAULT_LIST: 1000,         // Mantido
  SEARCH_MAX: 500,            // Mantido
} as const;
```

### 2. Exigir filtro de data

```typescript
// Adicionar validação antes de queries grandes
function validateDateFilter(payload: any): void {
  if (!payload.p_data_inicial && !payload.p_data_final && !payload.p_ano && !payload.p_semana) {
    throw new Error('Filtro de data é obrigatório para queries grandes');
  }
}
```

### 3. Usar REFRESH CONCURRENTLY

```sql
-- Em vez de:
REFRESH MATERIALIZED VIEW mv_dashboard_aderencia_metricas;

-- Usar:
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_aderencia_metricas;
-- (requer índice único na view)
```

---

## 📊 MÉTRICAS DE IMPACTO ESPERADO

Após implementar as correções:

- **Redução de Disk I/O esperada:** 60-80%
- **Melhoria de performance de queries:** 3-5x mais rápido
- **Redução de tempo de refresh de Materialized Views:** 70-90%
- **Redução de overhead de INSERTs:** 50-70%

---

## 🔗 REFERÊNCIAS

- [Supabase Performance Best Practices](https://supabase.com/docs/guides/database/performance)
- [PostgreSQL Index Best Practices](https://www.postgresql.org/docs/current/indexes.html)
- [Materialized Views Performance](https://www.postgresql.org/docs/current/sql-creatematerializedview.html)

---

**Próximos Passos:**
1. Revisar e aprovar este relatório
2. Priorizar correções críticas
3. Implementar correções em ordem de prioridade
4. Monitorar métricas após cada correção
5. Ajustar conforme necessário

