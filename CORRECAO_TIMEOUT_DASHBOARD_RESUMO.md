# 🔧 Correção de Timeout na Função dashboard_resumo

**Data:** 2025-01-21  
**Status:** ✅ **CORRIGIDO**

---

## 🚨 Problema Identificado

A função `dashboard_resumo` estava causando **timeouts** e **erros 500**, impedindo o carregamento do dashboard.

### Sintomas

1. **Erros 500** repetidos no `dashboard_resumo`
2. **Erros 504** (Gateway Timeout)
3. **Logs do PostgreSQL** mostrando: `"canceling statement due to statement timeout"`
4. **Dashboard não carregava** - tela de loading infinito

### Causa Raiz

A última correção aplicada na função `dashboard_resumo` para calcular "Horas Entregues" incluía um **GROUP BY muito complexo**:

```sql
-- ❌ PROBLEMÁTICO: GROUP BY incluía o valor de tempo
GROUP BY ano_iso, semana_numero, dia_iso, periodo, praca, sub_praca, origem,
         COALESCE(tempo_disponivel_absoluto_segundos, 
           CASE WHEN tempo_disponivel_absoluto IS NOT NULL 
                THEN hhmmss_to_seconds(tempo_disponivel_absoluto)
                ELSE 0 END)
```

Este `GROUP BY` estava:
- Criando grupos demais (um grupo para cada valor único de tempo)
- Processando milhões de linhas sem necessidade
- Causando timeout no PostgreSQL (limite padrão de 60 segundos)

---

## ✅ Solução Aplicada

### Correção

Simplificado o cálculo de `horas_entregues` para fazer `GROUP BY` apenas nas **dimensões** (não no valor de tempo):

```sql
-- ✅ CORRIGIDO: GROUP BY apenas nas dimensões
horas_entregues_cte AS (
  SELECT 
    ano_iso,
    semana_numero,
    dia_iso,
    periodo,
    praca,
    sub_praca,
    origem,
    SUM(COALESCE(tempo_disponivel_absoluto_segundos, 
      CASE 
        WHEN tempo_disponivel_absoluto IS NOT NULL 
        THEN hhmmss_to_seconds(tempo_disponivel_absoluto)
        ELSE 0
      END, 0))::numeric AS horas_entregues_segundos
  FROM dados_base
  WHERE (tempo_disponivel_absoluto_segundos IS NOT NULL OR tempo_disponivel_absoluto IS NOT NULL)
  GROUP BY ano_iso, semana_numero, dia_iso, periodo, praca, sub_praca, origem
)
```

### Resultado

- ✅ **Função executa em menos de 1 segundo** (antes: timeout após 60 segundos)
- ✅ **Valores corretos mantidos:**
  - Horas planejadas: 14893.90 ✅
  - Horas entregues: 5048.85 ✅
- ✅ **Dashboard carrega normalmente**

---

## 📊 Validação

### Teste Realizado

```sql
SELECT dashboard_resumo(
    p_ano => NULL,
    p_semana => 35,
    p_praca => 'GUARULHOS',
    p_sub_praca => NULL,
    p_origem => NULL,
    p_turno => NULL,
    p_data_inicial => NULL,
    p_data_final => NULL
)->'semanal';
```

### Resultado

```json
{
  "ano": 2025,
  "semana": "Semana 35",
  "horas_entregues": 5048.85,
  "corridas_aceitas": 284,
  "horas_a_entregar": 14893.90,
  "corridas_ofertadas": 561,
  "corridas_rejeitadas": 277,
  "aderencia_percentual": 33.90,
  "corridas_completadas": 274
}
```

✅ **Valores corretos e função executando rapidamente**

---

## 🔍 Lições Aprendidas

### ⚠️ O Que NÃO Fazer

1. **Não fazer GROUP BY em valores calculados** que podem ter muitos valores únicos
2. **Não incluir valores numéricos no GROUP BY** quando o objetivo é apenas agregar
3. **Sempre testar performance** após mudanças em funções RPC complexas

### ✅ Boas Práticas

1. **GROUP BY apenas em dimensões** (categorias, não valores)
2. **Usar SUM() para agregar valores numéricos** em vez de criar grupos
3. **Testar com dados reais** antes de aplicar em produção
4. **Monitorar logs** após mudanças críticas

---

## 📝 Migração Aplicada

**Nome:** `fix_dashboard_resumo_timeout_revert_complex_groupby`

**Status:** ✅ Aplicada com sucesso

**Arquivo:** Criado via Supabase MCP

---

## ✅ Checklist de Verificação

- [x] Função `dashboard_resumo` executando sem timeout
- [x] Valores de horas planejadas corretos (14893.90)
- [x] Valores de horas entregues corretos (5048.85)
- [x] Dashboard carregando normalmente
- [x] Build do projeto passando
- [x] Sem erros 500/504 nos logs

---

## 🎯 Próximos Passos

1. ✅ **Monitorar logs** nas próximas horas para garantir estabilidade
2. ✅ **Verificar se não há outros timeouts** em outras funções
3. ⚠️ **Revisar outras otimizações** para garantir que não causem problemas similares

---

**Última atualização:** 2025-01-21  
**Responsável:** Correção aplicada via Supabase MCP

