# 📊 Documentação dos Índices Atuais - Tabela `dados_corridas`

**Data da Documentação:** 2025-01-21  
**Total de Índices:** 30 índices  
**Tamanho Total dos Índices:** ~1.197 MB

---

## 📋 Índices por Categoria

### 🔑 Índice Primário (OBRIGATÓRIO - NÃO REMOVER)

| Nome | Tamanho | Definição | Uso |
|------|---------|-----------|-----|
| `dados_corridas_pkey` | 42 MB | `CREATE UNIQUE INDEX dados_corridas_pkey ON public.dados_corridas USING btree (id)` | 33 vezes usado |

---

## 🎯 Índices Mais Utilizados (MANTER)

### Top 5 Índices Mais Usados

| Nome | Vezes Usado | Tuplas Lidas | Tamanho | Status |
|------|-------------|---------------|---------|--------|
| `idx_dados_corridas_entregador_filtros` | **2.067.305** | 148.674.413 | 91 MB | ✅ **CRÍTICO - MANTER** |
| `idx_dados_corridas_entregador_data_asc` | **280.925** | 19.987.182 | 50 MB | ✅ **CRÍTICO - MANTER** |
| `idx_dados_corridas_entregador` | **68.416** | 5.958.817 | 13 MB | ✅ **MANTER** |
| `idx_dados_corridas_data_periodo` | **4.504** | 141.151.188 | 12 MB | ✅ **MANTER** |
| `idx_dados_corridas_praca` | **4.363** | 817.100.893 | 12 MB | ✅ **MANTER** |

---

## 📊 Índices por Funcionalidade

### 1. Índices de Entregador (7 índices)

| Nome | Vezes Usado | Tamanho | Status |
|------|-------------|---------|--------|
| `idx_dados_corridas_entregador_filtros` | 2.067.305 | 91 MB | ✅ **MANTER** |
| `idx_dados_corridas_entregador_data_asc` | 280.925 | 50 MB | ✅ **MANTER** |
| `idx_dados_corridas_entregador` | 68.416 | 13 MB | ✅ **MANTER** |
| `idx_dados_corridas_entregador_data` | 0 | 50 MB | ⚠️ **NÃO USADO - CANDIDATO A REMOÇÃO** |
| `idx_dados_corridas_entregador_data_otimizado` | 0 | 50 MB | ⚠️ **NÃO USADO - CANDIDATO A REMOÇÃO** |
| `idx_dados_corridas_data_entregador` | 0 | 50 MB | ⚠️ **NÃO USADO - CANDIDATO A REMOÇÃO** |
| `idx_dados_corridas_valores` | 0 | 115 MB | ⚠️ **NÃO USADO - CANDIDATO A REMOÇÃO** |

**Análise:**
- 3 índices de entregador NÃO são usados (150 MB desperdiçados)
- `idx_dados_corridas_entregador_data_asc` e `idx_dados_corridas_entregador_data` são similares
- **Recomendação:** Remover os 3 índices não usados, manter apenas os 4 que são usados

---

### 2. Índices de Data/Período (8 índices)

| Nome | Vezes Usado | Tamanho | Status |
|------|-------------|---------|--------|
| `idx_dados_corridas_data_periodo` | 4.504 | 12 MB | ✅ **MANTER** |
| `idx_dados_corridas_data_periodo_otimizado` | 336 | 14 MB | ✅ **MANTER** |
| `idx_dados_corridas_distinct_periodo` | 1.611 | 20 MB | ✅ **MANTER** |
| `idx_dados_corridas_data_filtros_otimizado_v2` | 1 | 20 MB | ⚠️ **QUASE NÃO USADO** |
| `idx_dados_corridas_praca_data` | 0 | 12 MB | ⚠️ **NÃO USADO - CANDIDATO A REMOÇÃO** |
| `idx_dados_corridas_sub_praca_data` | 0 | 12 MB | ⚠️ **NÃO USADO - CANDIDATO A REMOÇÃO** |
| `idx_dados_corridas_origem_data` | 16 | 13 MB | ⚠️ **POUCO USADO** |
| `idx_dados_corridas_periodo` | 306 | 12 MB | ✅ **MANTER** |

**Análise:**
- 2 índices de data NÃO são usados (24 MB desperdiçados)
- `idx_dados_corridas_data_periodo` e `idx_dados_corridas_data_periodo_otimizado` são similares
- **Recomendação:** Remover os 2 índices não usados

---

### 3. Índices de Ano/Semana (6 índices)

| Nome | Vezes Usado | Tamanho | Status |
|------|-------------|---------|--------|
| `idx_dados_ano_iso_simples` | 1.117 | 16 MB | ✅ **MANTER** |
| `idx_dados_corridas_ano_semana` | 1.070 | 12 MB | ✅ **MANTER** |
| `idx_dados_corridas_ano_semana_otimizado` | 816 | 12 MB | ✅ **MANTER** |
| `idx_dados_corridas_ano_semana_praca_otimizado` | 3 | 12 MB | ⚠️ **QUASE NÃO USADO** |
| `idx_dados_corridas_praca_ano_semana` | 671 | 13 MB | ✅ **MANTER** |
| `idx_dados_corridas_semana_numero` | 571 | 16 MB | ✅ **MANTER** |

**Análise:**
- Todos os índices são usados, mas alguns têm uso baixo
- `idx_dados_corridas_ano_semana` e `idx_dados_corridas_ano_semana_otimizado` são similares
- **Recomendação:** Manter todos, mas considerar consolidar os similares

---

### 4. Índices de Filtros (Praça, Sub-praça, Origem) (6 índices)

| Nome | Vezes Usado | Tamanho | Status |
|------|-------------|---------|--------|
| `idx_dados_corridas_praca` | 4.363 | 12 MB | ✅ **MANTER** |
| `idx_dados_corridas_filtros_comuns` | 1.051 | 14 MB | ✅ **MANTER** |
| `idx_dados_corridas_filtros_otimizado` | 222 | 13 MB | ✅ **MANTER** |
| `idx_dados_corridas_filtros` | 25 | 15 MB | ⚠️ **POUCO USADO** |
| `idx_dados_corridas_sub_praca` | 205 | 12 MB | ✅ **MANTER** |
| `idx_dados_corridas_origem` | 125 | 816 kB | ✅ **MANTER** |

**Análise:**
- Todos os índices são usados
- `idx_dados_corridas_filtros` tem uso muito baixo (25 vezes)
- **Recomendação:** Manter todos

---

### 5. Índices de Evolução (2 índices)

| Nome | Vezes Usado | Tamanho | Status |
|------|-------------|---------|--------|
| `idx_dados_evolucao_semanal` | 1.709 | 102 MB | ✅ **MANTER** |
| `idx_dados_evolucao_mensal` | 9 | 104 MB | ⚠️ **POUCO USADO** |

**Análise:**
- Ambos são usados, mas `idx_dados_evolucao_mensal` tem uso muito baixo
- **Recomendação:** Manter ambos (podem ser usados em relatórios específicos)

---

### 6. Índices de Admin/Otimizados (3 índices)

| Nome | Vezes Usado | Tamanho | Status |
|------|-------------|---------|--------|
| `idx_dados_corridas_admin_completo` | 1.547 | 13 MB | ✅ **MANTER** |
| `idx_dados_corridas_admin_optimized` | 190 | 114 MB | ✅ **MANTER** |
| `idx_dados_corridas_valores_otimizado` | 483 | 138 MB | ✅ **MANTER** |

**Análise:**
- Todos são usados
- **Recomendação:** Manter todos

---

## 🗑️ Índices Não Utilizados (CANDIDATOS A REMOÇÃO)

### Índices com 0 (zero) uso:

1. **`idx_dados_corridas_praca_data`** - 0 vezes usado, 12 MB
2. **`idx_dados_corridas_data_entregador`** - 0 vezes usado, 50 MB
3. **`idx_dados_corridas_entregador_data`** - 0 vezes usado, 50 MB
4. **`idx_dados_corridas_entregador_data_otimizado`** - 0 vezes usado, 50 MB
5. **`idx_dados_corridas_sub_praca_data`** - 0 vezes usado, 12 MB
6. **`idx_dados_corridas_valores`** - 0 vezes usado, 115 MB

**Total de espaço desperdiçado:** ~289 MB (24% do total de índices)

**Recomendação:** Remover estes 6 índices para reduzir overhead de escrita em INSERTs.

---

## 📊 Índices com Uso Muito Baixo (CANDIDATOS A ANÁLISE)

| Nome | Vezes Usado | Tamanho | Status |
|------|-------------|---------|--------|
| `idx_dados_corridas_data_filtros_otimizado_v2` | 1 | 20 MB | ⚠️ **ANALISAR** |
| `idx_dados_corridas_ano_semana_praca_otimizado` | 3 | 12 MB | ⚠️ **ANALISAR** |
| `idx_dados_evolucao_mensal` | 9 | 104 MB | ⚠️ **ANALISAR** |
| `idx_dados_corridas_origem_data` | 16 | 13 MB | ⚠️ **ANALISAR** |
| `idx_dados_corridas_filtros` | 25 | 15 MB | ⚠️ **ANALISAR** |

**Recomendação:** Monitorar por mais tempo antes de remover.

---

## 🎯 Plano de Otimização de Índices

### Fase 1: Remover Índices Não Utilizados (SEGURO)

**Índices a remover:**
1. `idx_dados_corridas_praca_data` (12 MB)
2. `idx_dados_corridas_data_entregador` (50 MB)
3. `idx_dados_corridas_entregador_data` (50 MB)
4. `idx_dados_corridas_entregador_data_otimizado` (50 MB)
5. `idx_dados_corridas_sub_praca_data` (12 MB)
6. `idx_dados_corridas_valores` (115 MB)

**Impacto esperado:**
- Redução de 289 MB em índices
- Redução de overhead de escrita em INSERTs (6 índices a menos para atualizar)
- **Redução de Disk IO em INSERTs: ~20%**

### Fase 2: Consolidar Índices Similares (ANALISAR PRIMEIRO)

**Índices similares que podem ser consolidados:**
1. `idx_dados_corridas_entregador_data_asc` (50 MB) vs `idx_dados_corridas_entregador_data` (50 MB) - **JÁ IDENTIFICADO COMO NÃO USADO**
2. `idx_dados_corridas_data_periodo` (12 MB) vs `idx_dados_corridas_data_periodo_otimizado` (14 MB) - **AMBOS USADOS, MANTER AMBOS**
3. `idx_dados_corridas_ano_semana` (12 MB) vs `idx_dados_corridas_ano_semana_otimizado` (12 MB) - **AMBOS USADOS, MANTER AMBOS**

**Recomendação:** Não consolidar ainda - ambos são usados e podem servir a queries diferentes.

---

## 📝 Resumo Executivo

### Estatísticas Gerais
- **Total de índices:** 30
- **Tamanho total:** ~1.197 MB
- **Índices não utilizados:** 6 (289 MB, 24%)
- **Índices pouco utilizados:** 5 (164 MB, 14%)
- **Índices bem utilizados:** 19 (744 MB, 62%)

### Recomendações Imediatas
1. ✅ **Remover 6 índices não utilizados** (289 MB, redução de 24%)
2. ✅ **Monitorar 5 índices pouco utilizados** por mais tempo
3. ✅ **Manter 19 índices bem utilizados**

### Impacto Esperado
- **Redução de overhead de escrita:** ~20% (6 índices a menos para atualizar em cada INSERT)
- **Redução de espaço:** 289 MB (24% dos índices)
- **Redução de Disk IO em INSERTs:** ~20%

---

## ⚠️ AVISOS IMPORTANTES

1. **NÃO REMOVER** o índice primário `dados_corridas_pkey`
2. **NÃO REMOVER** índices usados mais de 100 vezes sem análise cuidadosa
3. **TESTAR** em ambiente de desenvolvimento antes de aplicar em produção
4. **MONITORAR** performance após remoção de índices
5. **MANTER BACKUP** antes de fazer mudanças

---

**Próximos Passos:**
1. Criar script SQL para remover índices não utilizados
2. Testar em ambiente de desenvolvimento
3. Aplicar em produção após validação
4. Monitorar performance e Disk IO

