# ✅ Correção Aplicada - Índice para Filtro de Semana

## 🔍 Problema Identificado

Após a otimização de índices, o filtro de semana parou de funcionar porque removemos por engano o índice `idx_dados_corridas_ano_semana_basico` que tinha **408 scans** e era essencial para queries com filtro de semana.

## ⚠️ Erro na Análise Inicial

O índice `idx_dados_corridas_ano_semana_basico` foi removido pensando que era duplicata de `idx_dados_corridas_ano_semana`, mas na verdade tinha uma condição WHERE diferente e importante:

**Índice removido (ERRADO)**:
```sql
idx_dados_corridas_ano_semana_basico
WHERE ((data_do_periodo IS NOT NULL) AND (ano_iso IS NOT NULL) AND (semana_numero IS NOT NULL))
```

**Índice mantido**:
```sql
idx_dados_corridas_ano_semana
WHERE ((ano_iso IS NOT NULL) AND (semana_numero IS NOT NULL))
```

**Diferença crítica**: O índice removido incluía `data_do_periodo IS NOT NULL`, que é uma condição comum em todas as queries do sistema.

## ✅ Correção Aplicada

Recriado o índice `idx_dados_corridas_ano_semana_basico` com a definição correta:

```sql
CREATE INDEX idx_dados_corridas_ano_semana_basico
ON public.dados_corridas 
USING btree (ano_iso, semana_numero) 
WHERE (
  data_do_periodo IS NOT NULL 
  AND ano_iso IS NOT NULL 
  AND semana_numero IS NOT NULL
);
```

**Tamanho**: ~12 MB
**Status**: ✅ Criado com sucesso

## 📊 Impacto

- **Antes da correção**: Filtro de semana não funcionava
- **Depois da correção**: Filtro de semana deve funcionar normalmente
- **Economia mantida**: Ainda economizamos ~638 MB (650 MB - 12 MB do índice recriado)

## 🔄 Índices Atuais

Agora temos **20 índices** (ao invés de 19):
- 19 índices essenciais mantidos
- 1 índice recriado (`idx_dados_corridas_ano_semana_basico`)

**Tamanho total dos índices**: ~563 MB (ainda uma redução de 56% em relação aos 1,273 MB originais)

## ✅ Próximos Passos

1. Testar o filtro de semana no dashboard
2. Verificar se as queries estão rápidas
3. Monitorar uso do índice recriado

---

**Data da Correção**: 2025-11-10
**Status**: ✅ Aplicado

