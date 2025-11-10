# 🔍 Análise Completa e Profunda do Supabase

## 📊 Resumo Executivo

Esta análise profunda identifica:
1. ✅ Recursos realmente não utilizados
2. ⚠️ Índices duplicados e não utilizados (CRÍTICO - 1273 MB de índices!)
3. 🚀 Oportunidades de otimização de performance

---

## 1. TABELA `evolucao_agregada` - ANÁLISE FINAL

### ✅ CONFIRMADO: NÃO ESTÁ SENDO USADA

**Verificações realizadas:**
- ❌ Nenhuma referência no código TypeScript/JavaScript
- ❌ Nenhuma referência em arquivos SQL de migração
- ❌ Nenhum trigger associado
- ❌ Nenhum cron job configurado
- ❌ Nenhuma view materializada dependente
- ❌ Tabela vazia (0 linhas)
- ❌ Função `atualizar_evolucao_agregada()` existe mas nunca é chamada

**Recomendação**: ✅ **PODE SER REMOVIDA COM SEGURANÇA TOTAL**

---

## 2. ANÁLISE CRÍTICA: ÍNDICES DA TABELA `dados_corridas`

### 📈 Estatísticas Atuais

- **Tamanho da tabela**: 536 MB
- **Tamanho total (com índices)**: 1808 MB
- **Tamanho dos índices**: 1273 MB (⚠️ **2.4x maior que a tabela!**)
- **Número de índices**: 45 índices
- **Índices nunca usados (0 scans)**: 15 índices (~600 MB desperdiçados!)

### 🚨 PROBLEMA CRÍTICO: Índices Nunca Utilizados

| Índice | Tamanho | Scans | Status |
|--------|---------|-------|--------|
| `idx_dados_corridas_entregador_periodo` | **141 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_corridas_taxas` | **110 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_agregacao_otimizado` | **95 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_utr_otimizado` | **88 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_corridas_filtros_entregadores` | **32 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_corridas_distinct` | **19 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_dia_iso` | **16 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_corridas_isoyear_week` | **16 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_ano_iso` | **16 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_corridas_dia_iso` | **15 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_corridas_sub_praca_data` | **13 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_corridas_pessoa` | **13 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_corridas_praca_data` | **12 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_corridas_filtros_principais` | **12 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_periodo` | **12 MB** | 0 | ❌ **NUNCA USADO** |
| `idx_dados_data_periodo` | **12 MB** | 0 | ❌ **NUNCA USADO** |

**Total desperdiçado**: ~600 MB de índices nunca utilizados!

### ⚠️ PROBLEMA: Índices Duplicados

#### Duplicatas em `(praca, ano_iso, semana_numero)`:
1. `idx_dados_corridas_praca_ano_semana` (12 MB, 655 scans)
2. `idx_dados_praca_ano_semana` (12 MB, 86 scans)
3. `idx_dados_corridas_praca_semana` (12 MB, 82 scans)

**Recomendação**: Manter apenas o mais usado (`idx_dados_corridas_praca_ano_semana`)

#### Duplicatas em `data_do_periodo`:
1. `idx_dados_corridas_data_do_periodo` (16 MB, 5 scans)
2. `idx_dados_corridas_data_simples` (12 MB, 11 scans)
3. `idx_dados_corridas_data` (12 MB, 78 scans)
4. `idx_dados_corridas_data_basico` (12 MB, 13 scans)
5. `idx_dados_corridas_data_periodo` (12 MB, 4187 scans) ⭐ **MAIS USADO**

**Recomendação**: Manter apenas `idx_dados_corridas_data_periodo` (o mais usado)

#### Duplicatas em `(ano_iso, semana_numero)`:
1. `idx_dados_corridas_ano_semana` (12 MB, 1070 scans)
2. `idx_dados_corridas_ano_semana_basico` (12 MB, 408 scans)
3. `idx_dados_corridas_ano_semana_praca` (12 MB, 83 scans)

**Recomendação**: Manter apenas `idx_dados_corridas_ano_semana` (o mais usado)

### ✅ Índices Mais Utilizados (MANTER)

| Índice | Tamanho | Scans | Tuples Read | Status |
|--------|---------|-------|-------------|--------|
| `idx_dados_corridas_id_entregador` | 13 MB | 9,005 | 2.3M | ✅ **ESSENCIAL** |
| `idx_dados_corridas_praca` | 12 MB | 4,226 | 730M | ✅ **ESSENCIAL** |
| `idx_dados_corridas_data_periodo` | 12 MB | 4,187 | 23M | ✅ **ESSENCIAL** |
| `idx_dados_corridas_periodo` | 12 MB | 306 | 21M | ✅ **ESSENCIAL** |
| `idx_dados_evolucao_semanal` | 100 MB | 1,708 | 9M | ✅ **ESSENCIAL** |
| `idx_dados_corridas_admin_optimized` | 111 MB | 190 | 36M | ✅ **ESSENCIAL** |
| `idx_dados_evolucao_mensal` | 102 MB | 9 | 9.5M | ✅ **ESSENCIAL** |

---

## 3. PLANO DE OTIMIZAÇÃO

### 🎯 Fase 1: Remover Índices Nunca Utilizados

**Economia estimada**: ~600 MB

**Índices a remover**:
1. `idx_dados_corridas_entregador_periodo` (141 MB)
2. `idx_dados_corridas_taxas` (110 MB)
3. `idx_dados_agregacao_otimizado` (95 MB)
4. `idx_dados_utr_otimizado` (88 MB)
5. `idx_dados_corridas_filtros_entregadores` (32 MB)
6. `idx_dados_corridas_distinct` (19 MB)
7. `idx_dados_dia_iso` (16 MB)
8. `idx_dados_corridas_isoyear_week` (16 MB)
9. `idx_dados_ano_iso` (16 MB)
10. `idx_dados_corridas_dia_iso` (15 MB)
11. `idx_dados_corridas_sub_praca_data` (13 MB)
12. `idx_dados_corridas_pessoa` (13 MB)
13. `idx_dados_corridas_praca_data` (12 MB)
14. `idx_dados_corridas_filtros_principais` (12 MB)
15. `idx_dados_periodo` (12 MB)
16. `idx_dados_data_periodo` (12 MB)

### 🎯 Fase 2: Remover Índices Duplicados

**Economia estimada**: ~50 MB

**Duplicatas a remover**:
1. `idx_dados_praca_ano_semana` (12 MB) - manter `idx_dados_corridas_praca_ano_semana`
2. `idx_dados_corridas_praca_semana` (12 MB) - manter `idx_dados_corridas_praca_ano_semana`
3. `idx_dados_corridas_data_do_periodo` (16 MB) - manter `idx_dados_corridas_data_periodo`
4. `idx_dados_corridas_data_simples` (12 MB) - manter `idx_dados_corridas_data_periodo`
5. `idx_dados_corridas_data` (12 MB) - manter `idx_dados_corridas_data_periodo`
6. `idx_dados_corridas_data_basico` (12 MB) - manter `idx_dados_corridas_data_periodo`
7. `idx_dados_corridas_ano_semana_basico` (12 MB) - manter `idx_dados_corridas_ano_semana`
8. `idx_dados_corridas_ano_semana_praca` (12 MB) - manter `idx_dados_corridas_ano_semana`

### 🎯 Fase 3: Otimizar Índices Grandes

**Análise dos índices grandes**:
- `idx_dados_corridas_entregador_periodo` (141 MB) - **REMOVER** (nunca usado)
- `idx_dados_corridas_admin_optimized` (111 MB) - **MANTER** (190 scans, essencial)
- `idx_dados_corridas_taxas` (110 MB) - **REMOVER** (nunca usado)
- `idx_dados_evolucao_mensal` (102 MB) - **MANTER** (9 scans, mas lê 9.5M tuples)
- `idx_dados_evolucao_semanal` (100 MB) - **MANTER** (1,708 scans, essencial)
- `idx_dados_agregacao_otimizado` (95 MB) - **REMOVER** (nunca usado)
- `idx_dados_utr_otimizado` (88 MB) - **REMOVER** (nunca usado)

---

## 4. IMPACTO ESPERADO

### 📊 Antes da Otimização
- **Tamanho total**: 1808 MB
- **Tamanho índices**: 1273 MB
- **Índices**: 45
- **Índices não utilizados**: 15 (~600 MB)

### 📊 Depois da Otimização
- **Tamanho total estimado**: ~1150 MB (redução de 36%)
- **Tamanho índices estimado**: ~650 MB (redução de 49%)
- **Índices**: ~22 (redução de 51%)
- **Índices não utilizados**: 0

### ⚡ Benefícios de Performance

1. **Menos overhead em INSERTs**: Cada INSERT precisa atualizar menos índices
2. **Menos espaço em disco**: Redução de 658 MB
3. **Menos uso de memória**: Índices menores = mais cache hits
4. **Queries mais rápidas**: Planner escolhe entre menos opções
5. **Manutenção mais rápida**: VACUUM e REINDEX mais rápidos

---

## 5. RECOMENDAÇÕES FINAIS

### ✅ Ações Imediatas

1. **Remover tabela `evolucao_agregada`** - Confirmado não utilizada
2. **Remover 16 índices nunca utilizados** - Economia de ~600 MB
3. **Remover 8 índices duplicados** - Economia de ~50 MB

### ⚠️ Ações com Cuidado

1. **Monitorar performance após remoção** - Alguns índices podem ser usados em queries raras
2. **Fazer backup antes** - Sempre!
3. **Remover em horário de baixo tráfego** - Para evitar impacto

### 🚀 Otimizações Futuras

1. **Considerar particionamento** - Se a tabela continuar crescendo
2. **Analisar queries lentas** - Usar `pg_stat_statements`
3. **Considerar materialized views** - Para queries agregadas frequentes

---

## 6. SCRIPT DE OTIMIZAÇÃO

Ver arquivo: `OTIMIZAR_INDICES_DADOS_CORRIDAS.sql`

---

**Data da Análise**: 2025-11-10
**Analisado por**: Sistema de Análise Profunda Automatizada

