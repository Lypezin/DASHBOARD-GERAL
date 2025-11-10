# Análise de Uso do Supabase

## 📊 Resumo Executivo

Este documento analisa o que está sendo usado e o que não está sendo usado no Supabase, para identificar recursos que podem ser removidos com segurança.

---

## 1. TABELAS

### ✅ Tabelas EM USO

| Tabela | Uso no Código | Observações |
|--------|---------------|-------------|
| `dados_corridas` | ✅ Usada | `src/app/upload/page.tsx` (insert), `src/app/admin/page.tsx` (select) |
| `user_profiles` | ✅ Usada | `src/components/Header.tsx`, `src/app/perfil/page.tsx`, `src/app/admin/page.tsx` |
| `user_activity` | ✅ Usada | `src/components/views/MonitoramentoView.tsx` (select) |
| `conquistas` | ✅ Usada | Sistema de conquistas (via RPC `listar_conquistas_usuario`) |
| `user_conquistas` | ✅ Usada | Sistema de conquistas (via RPC `verificar_conquistas`) |

### ⚠️ Tabelas NÃO ENCONTRADAS NO CÓDIGO

| Tabela | Linhas | Observações |
|--------|--------|-------------|
| `evolucao_agregada` | 0 | **PODE SER REMOVIDA** - Tabela vazia, não encontrada referência no código, sem triggers |
| `user_activities` | 23,418 | **⚠️ NÃO REMOVER** - Tem dados históricos (de 10/10/2025 a 06/11/2025), 30 usuários únicos. Pode ser tabela antiga, mas tem dados importantes |

### 🔍 Análise Detalhada

#### `evolucao_agregada`
- **Status**: Vazia (0 linhas)
- **Uso no código**: Nenhuma referência encontrada
- **Recomendação**: ✅ **PODE SER REMOVIDA COM SEGURANÇA**

#### `user_activities` vs `user_activity`
- **`user_activity`**: Usada em `MonitoramentoView.tsx` (9,934 linhas)
- **`user_activities`**: Não encontrada referência no código (23,418 linhas, dados de 10/10/2025 a 06/11/2025)
- **Análise**: Parece ser uma tabela antiga com dados históricos importantes
- **Recomendação**: ⚠️ **NÃO REMOVER** - Pode conter dados históricos importantes. Verificar se pode ser arquivada ou migrada

---

## 2. FUNÇÕES RPC

### ✅ Funções EM USO

| Função | Uso no Código |
|--------|---------------|
| `approve_user` | `src/app/admin/page.tsx` |
| `calcular_aderencia_por_dia` | Via `dashboard_resumo` |
| `calcular_aderencia_por_origem` | Via `dashboard_resumo` |
| `calcular_aderencia_por_sub_praca` | Via `dashboard_resumo` |
| `calcular_aderencia_por_turno` | Via `dashboard_resumo` |
| `calcular_aderencia_semanal` | Via `dashboard_resumo` |
| `calcular_utr` | `src/hooks/useDashboardData.ts`, `src/components/views/ComparacaoView.tsx` |
| `dashboard_resumo` | `src/hooks/useDashboardData.ts`, `src/components/views/ComparacaoView.tsx` |
| `dashboard_totals` | Via `dashboard_resumo` |
| `get_current_user_profile` | `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/admin/page.tsx`, `src/components/Header.tsx`, `src/app/perfil/page.tsx` |
| `get_admin_stats` | Possivelmente usado (verificar) |
| `is_user_admin` | Usada em políticas RLS |
| `list_all_users` | `src/app/admin/page.tsx` |
| `list_pending_users` | `src/app/admin/page.tsx` |
| `list_pracas_disponiveis` | `src/app/admin/page.tsx` |
| `listar_anos_disponiveis` | `src/hooks/useDashboardData.ts` |
| `listar_conquistas_usuario` | `src/hooks/useConquistas.ts` |
| `listar_entregadores` | `src/hooks/useDashboardData.ts` |
| `listar_evolucao_mensal` | `src/hooks/useDashboardData.ts` |
| `listar_evolucao_semanal` | `src/hooks/useDashboardData.ts` |
| `listar_todas_semanas` | `src/hooks/useDashboardData.ts`, `src/components/views/ComparacaoView.tsx` |
| `listar_usuarios_online` | `src/components/views/MonitoramentoView.tsx` |
| `listar_valores_entregadores` | `src/hooks/useDashboardData.ts` |
| `marcar_conquista_visualizada` | `src/hooks/useConquistas.ts` |
| `pesquisar_entregadores` | `src/components/views/EntregadoresView.tsx`, `src/components/views/PrioridadePromoView.tsx`, `src/hooks/useDashboardData.ts` |
| `pesquisar_valores_entregadores` | `src/components/views/ValoresView.tsx` |
| `registrar_atividade` | `src/hooks/useUserActivity.ts` |
| `revoke_user_access` | `src/app/admin/page.tsx` |
| `set_user_admin` | `src/app/admin/page.tsx` |
| `update_user_avatar` | `src/app/perfil/page.tsx` |
| `update_user_full_name` | `src/app/perfil/page.tsx` |
| `update_user_pracas` | `src/app/admin/page.tsx` |
| `verificar_conquistas` | `src/hooks/useConquistas.ts` |

### ⚠️ Funções NÃO ENCONTRADAS NO CÓDIGO

| Função | Tipo | Recomendação |
|--------|------|--------------|
| `atualizar_colunas_derivadas` | Trigger | ✅ **EM USO** - Usada por trigger `trigger_atualizar_derivadas` na tabela `dados_corridas` |
| `atualizar_evolucao_agregada` | Function | ⚠️ **VERIFICAR** - Pode ser usado por triggers/cron |
| `clear_admin_cache` | Function | ⚠️ **VERIFICAR** - Pode ser usado por triggers |
| `debug_dados_semana_35` | Function | ✅ **PODE SER REMOVIDA** - Função de debug |
| `debug_entregadores_dados` | Function | ✅ **PODE SER REMOVIDA** - Função de debug |
| `handle_new_user` | Trigger | ⚠️ **VERIFICAR** - Pode ser usado por triggers |
| `handle_updated_at` | Trigger | ✅ **EM USO** - Usada por trigger `on_user_profile_updated` na tabela `user_profiles` |
| `hhmmss_to_seconds` | Function | ⚠️ **VERIFICAR** - Pode ser usado por outras funções |
| `historico_atividades_usuario` | Function | ⚠️ **VERIFICAR** - Pode ser usado no futuro |
| `limpar_atividades_antigas` | Function | ⚠️ **VERIFICAR** - Pode ser usado por cron jobs |
| `list_all_users_optimized` | Function | ⚠️ **VERIFICAR** - Versão otimizada, pode substituir `list_all_users` |
| `list_pracas_disponiveis_otimizada` | Function | ⚠️ **VERIFICAR** - Versão otimizada, pode substituir `list_pracas_disponiveis` |
| `listar_dimensoes_dashboard` | Function | ⚠️ **VERIFICAR** - Pode ser usado no futuro |
| `listar_utr_semanal` | Function | ⚠️ **VERIFICAR** - Pode ser usado no futuro |
| `normalize_time_columns` | Trigger | ⚠️ **VERIFICAR** - Pode ser usado por triggers |
| `normalize_time_columns_trigger` | Trigger | ✅ **EM USO** - Usada por trigger `dados_corridas_normalize_time` na tabela `dados_corridas` |
| `normalize_time_to_hhmmss` | Function | ⚠️ **VERIFICAR** - Pode ser usado por outras funções |
| `refresh_all_materialized_views` | Function | ⚠️ **VERIFICAR** - Pode ser usado por cron jobs |
| `refresh_dashboard_mvs` | Function | ⚠️ **VERIFICAR** - Pode ser usado por cron jobs |
| `refresh_mv_aderencia` | Function | ⚠️ **VERIFICAR** - Pode ser usado por cron jobs |
| `refresh_mv_aderencia_async` | Function | ✅ **USADA** - `src/app/upload/page.tsx` |
| `split_text` | Function | ⚠️ **VERIFICAR** - Pode ser usado por outras funções |
| `to_hhmmss` | Function | ⚠️ **VERIFICAR** - Pode ser usado por outras funções |
| `trigger_clear_admin_cache` | Trigger | ✅ **EM USO** - Usada por trigger `trigger_user_profiles_cache_clear` na tabela `user_profiles` |
| `update_user_profiles_updated_at` | Trigger | ✅ **EM USO** - Usada por trigger `update_user_profiles_updated_at` na tabela `user_profiles` |

---

## 3. EXTENSÕES

### ✅ Extensões Instaladas e Provavelmente em Uso

| Extensão | Versão | Uso |
|----------|--------|-----|
| `plpgsql` | 1.0 | ✅ Usada por todas as funções PL/pgSQL |
| `pgcrypto` | 1.3 | ✅ Usada para criptografia (senhas, tokens) |
| `uuid-ossp` | 1.1 | ✅ Usada para gerar UUIDs |
| `pg_stat_statements` | 1.11 | ✅ Usada para monitoramento de performance |
| `pg_graphql` | 1.5.11 | ⚠️ Verificar se está sendo usado |
| `supabase_vault` | 0.3.1 | ✅ Usada pelo Supabase |

### ⚠️ Extensões Instaladas mas Não Usadas

Todas as outras extensões listadas não estão instaladas (`installed_version: null`), apenas disponíveis.

---

## 4. RECOMENDAÇÕES

### 🟢 Remover com Segurança

1. **Tabela `evolucao_agregada`**
   - Vazia (0 linhas)
   - Nenhuma referência no código
   - **Ação**: DROP TABLE

2. **Funções de Debug**
   - `debug_dados_semana_35`
   - `debug_entregadores_dados`
   - **Ação**: DROP FUNCTION

### 🟡 Verificar Antes de Remover

1. **Tabela `user_activities`**
   - Parece ser duplicata de `user_activity`
   - **DADOS**: 23,418 linhas, 30 usuários únicos, período de 10/10/2025 a 06/11/2025
   - **Ação**: ⚠️ **NÃO REMOVER** - Contém dados históricos. Considerar arquivamento se não for mais usada

2. **Funções Otimizadas**
   - `list_all_users_optimized` vs `list_all_users`
   - `list_pracas_disponiveis_otimizada` vs `list_pracas_disponiveis`
   - **Ação**: Testar funções otimizadas e substituir as antigas

3. **Funções de Manutenção**
   - `limpar_atividades_antigas` - Pode ser usado por cron jobs
   - `refresh_*` functions - Podem ser usadas por cron jobs
   - **Ação**: Verificar se há cron jobs configurados

4. **Triggers**
   - Todas as funções trigger podem estar sendo usadas
   - **Ação**: Verificar triggers ativos no banco

### 🔴 NÃO Remover

- Todas as funções RPC que estão sendo usadas no código
- Todas as tabelas que estão sendo usadas
- Extensões essenciais (plpgsql, pgcrypto, uuid-ossp)

---

## 5. PRÓXIMOS PASSOS

1. ✅ Verificar triggers ativos no banco
2. ✅ Verificar cron jobs configurados
3. ✅ Verificar dependências entre funções
4. ✅ Testar funções otimizadas
5. ✅ Fazer backup antes de remover qualquer coisa
6. ✅ Remover apenas após confirmação

---

## 6. QUERIES PARA VERIFICAÇÃO

### Verificar Triggers Ativos
```sql
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### Verificar Dependências de Funções
```sql
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'hhmmss_to_seconds',
    'normalize_time_to_hhmmss',
    'to_hhmmss',
    'split_text'
  );
```

### Verificar Dados em `user_activities`
```sql
SELECT COUNT(*) as total_rows, 
       MIN(created_at) as oldest_record,
       MAX(created_at) as newest_record
FROM public.user_activities;
```

### Verificar se `evolucao_agregada` tem triggers ou views dependentes
```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgrelid = 'public.evolucao_agregada'::regclass;
```

---

## 7. MATERIALIZED VIEWS

### ✅ Materialized Views Encontradas

| View | Índices | Populada | Uso |
|------|---------|----------|-----|
| `mv_aderencia_agregada` | ✅ | ✅ | Usada em `src/app/admin/page.tsx` |
| `mv_aderencia_dia` | ❌ | ✅ | Verificar uso |
| `mv_aderencia_semana` | ❌ | ✅ | Verificar uso |
| `mv_corridas_detalhe` | ✅ | ✅ | Verificar uso |
| `mv_dashboard_admin` | ✅ | ✅ | Verificar uso |
| `mv_dashboard_lite` | ❌ | ✅ | Verificar uso |
| `mv_dashboard_micro` | ❌ | ✅ | Verificar uso |
| `mv_entregue_detalhe` | ✅ | ✅ | Verificar uso |
| `mv_planejado_detalhe` | ✅ | ✅ | Verificar uso |

### 🔍 Análise

Todas as materialized views estão populadas e podem estar sendo usadas indiretamente pelas funções RPC. **NÃO REMOVER** sem verificar dependências.

---

## 8. TRIGGERS ATIVOS

### ✅ Triggers Encontrados e suas Funções

| Trigger | Tabela | Função | Status |
|---------|--------|--------|--------|
| `dados_corridas_normalize_time` | `dados_corridas` | `normalize_time_columns_trigger()` | ✅ **ATIVO** |
| `trigger_atualizar_derivadas` | `dados_corridas` | `atualizar_colunas_derivadas()` | ✅ **ATIVO** |
| `on_user_profile_updated` | `user_profiles` | `handle_updated_at()` | ✅ **ATIVO** |
| `trigger_user_profiles_cache_clear` | `user_profiles` | `trigger_clear_admin_cache()` | ✅ **ATIVO** |
| `update_user_profiles_updated_at` | `user_profiles` | `update_user_profiles_updated_at()` | ✅ **ATIVO** |

**Todas as funções usadas por esses triggers NÃO PODEM SER REMOVIDAS.**

