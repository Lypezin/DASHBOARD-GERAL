# Otimizações de Materialized Views - Recomendações e Verificações

**Data:** 2025-01-21  
**Status:** ✅ Análise Completa e Recomendações

---

## 📊 Status Atual

### ✅ Otimizações Já Implementadas

1. **REFRESH CONCURRENTLY**
   - ✅ Funções RPC otimizadas criadas (`refresh_mvs_prioritized`, `refresh_single_mv_with_progress`)
   - ✅ Código frontend usando refresh CONCURRENTLY quando disponível
   - ✅ Fallback automático para refresh normal se CONCURRENTLY falhar

2. **Refresh Sequencial**
   - ✅ Refresh de MVs é feito sequencialmente (não simultâneo)
   - ✅ Delay de 500ms entre cada MV para evitar sobrecarga
   - ✅ Refresh prioritário para MVs críticas primeiro

3. **Índices Únicos**
   - ✅ Índices únicos criados nas principais Materialized Views
   - ✅ Necessário para permitir REFRESH CONCURRENTLY

---

## 🔍 Verificações Necessárias no Banco de Dados

### 1. Verificar Índices Únicos em Todas as Materialized Views

**SQL para verificar:**

```sql
-- Verificar quais MVs têm índices únicos
SELECT 
    schemaname,
    matviewname,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        SELECT matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public'
    )
    AND indexdef LIKE '%UNIQUE%'
ORDER BY matviewname, indexname;
```

**Materialized Views que DEVEM ter índice único para CONCURRENTLY:**

1. `mv_dashboard_aderencia_metricas` ✅ (já tem)
2. `mv_aderencia_agregada` ⚠️ (verificar)
3. `mv_entregadores_agregados` ⚠️ (verificar)
4. `mv_valores_entregadores_agregados` ⚠️ (verificar)
5. `mv_corridas_detalhe` ✅ (já tem)
6. `mv_entregue_detalhe` ✅ (já tem)
7. `mv_planejado_detalhe` ✅ (já tem)
8. `mv_entregadores_marketing` ⚠️ (verificar)

**Ação:** Criar índices únicos para todas as MVs que ainda não têm.

---

### 2. Verificar se Todas as MVs Estão Usando CONCURRENTLY

**SQL para verificar funções RPC:**

```sql
-- Verificar funções de refresh
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname LIKE '%refresh%mv%'
ORDER BY p.proname;
```

**Verificar se as funções usam `REFRESH MATERIALIZED VIEW CONCURRENTLY`**

---

### 3. Verificar Agendamento de Refresh

**Status Atual:**
- ✅ Refresh automático após upload (via `startAutoRefresh`)
- ❌ Não há agendamento automático em horários de baixo uso
- ❌ Não há verificação de horário antes de fazer refresh

**Recomendação:** Implementar agendamento automático via pg_cron ou Supabase Edge Functions.

---

## 🚀 Melhorias Recomendadas

### 1. Adicionar Verificação de Horário de Baixo Uso

**Implementar no código frontend:**

```typescript
// Verificar se é horário de baixo uso antes de fazer refresh
const isLowUsageTime = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = domingo, 6 = sábado
  
  // Horários de baixo uso: 2h-6h (madrugada) ou fins de semana
  return hour >= 2 && hour < 6 || day === 0 || day === 6;
};
```

**Aplicar em:** `useUploadRefresh.ts` - adicionar verificação antes de iniciar refresh automático.

---

### 2. Implementar Refresh Incremental (Futuro)

**Conceito:** Atualizar apenas dados novos/modificados em vez de recriar toda a MV.

**Benefícios:**
- Reduz I/O de escrita em 80-95%
- Refresh muito mais rápido
- Menos impacto no sistema

**Implementação:** Requer modificação nas funções RPC no banco de dados.

---

### 3. Agendamento Automático via pg_cron

**SQL para criar job de refresh automático:**

```sql
-- Criar job para refresh automático em horário de baixo uso (3h da manhã)
SELECT cron.schedule(
    'refresh-mvs-automatico',
    '0 3 * * *', -- Todo dia às 3h da manhã
    $$
    SELECT refresh_all_mvs_optimized();
    $$
);
```

**Nota:** Requer extensão `pg_cron` habilitada no Supabase.

---

### 4. Melhorar Monitoramento de Performance

**Adicionar métricas:**

```typescript
interface RefreshMetrics {
  mv_name: string;
  duration_seconds: number;
  method: 'CONCURRENTLY' | 'NORMAL' | 'FALLBACK';
  rows_refreshed?: number;
  disk_io_blocks?: number;
  timestamp: Date;
}
```

**Armazenar métricas em tabela para análise futura.**

---

## 📝 Checklist de Verificações

### Banco de Dados

- [ ] Verificar se todas as MVs têm índices únicos
- [ ] Criar índices únicos para MVs que não têm
- [ ] Verificar se funções RPC usam CONCURRENTLY
- [ ] Verificar se há agendamento automático (pg_cron)
- [ ] Analisar queries lentas no Supabase Dashboard

### Código Frontend

- [x] Refresh sequencial implementado
- [x] Delay entre MVs implementado
- [x] Fallback para refresh normal implementado
- [ ] Verificação de horário de baixo uso (a implementar)
- [ ] Métricas de performance (a implementar)

---

## 🎯 Próximos Passos

1. **Imediato:**
   - Verificar índices únicos no banco de dados
   - Criar índices únicos para MVs que não têm

2. **Curto Prazo (1 semana):**
   - Adicionar verificação de horário de baixo uso no código
   - Implementar métricas de performance

3. **Médio Prazo (1 mês):**
   - Implementar agendamento automático via pg_cron
   - Considerar refresh incremental para MVs grandes

---

## 📊 Impacto Esperado

### Com Todas as Otimizações:

- **Redução de Disk IO:** 70-90% durante refresh
- **Tempo de Refresh:** 70-90% mais rápido
- **Disponibilidade:** Sistema continua disponível durante refresh
- **Custo:** Redução de custos de I/O no Supabase

---

## ⚠️ Notas Importantes

1. **REFRESH CONCURRENTLY requer índice único** - Sem índice único, o PostgreSQL não permite CONCURRENTLY
2. **Refresh sequencial é melhor** - Evita sobrecarga simultânea no banco
3. **Horários de baixo uso** - Refresh em horários de baixo uso reduz impacto nos usuários
4. **Monitoramento** - Monitorar métricas para ajustar estratégia conforme necessário

---

## 🔗 Referências

- [PostgreSQL REFRESH MATERIALIZED VIEW](https://www.postgresql.org/docs/current/sql-refreshmaterializedview.html)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Materialized Views Best Practices](https://www.postgresql.org/docs/current/rules-materializedviews.html)

