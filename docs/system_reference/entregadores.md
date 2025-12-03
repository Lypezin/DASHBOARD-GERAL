# Entregadores - Documentação Técnica

## Visão Geral
Existem duas visualizações principais de Entregadores no sistema:
1.  **Entregadores Marketing** (`EntregadoresView.tsx`): Focada em leads e novos entregadores, dentro da aba Marketing.
2.  **Entregadores Prioridade/Main** (`EntregadoresMainView.tsx`): Focada na performance operacional (aderência, rejeição) de entregadores ativos.

## 1. Entregadores Marketing

### Estrutura Frontend
*   **Arquivo**: `src/components/views/EntregadoresView.tsx`
*   **Hook**: `src/components/views/entregadores/useEntregadoresData.ts`
*   **Fetcher**: `src/components/views/entregadores/EntregadoresDataFetcher.ts`

### Backend (Supabase)
*   **RPC**: `get_entregadores_marketing`
*   **Tabelas**: `dados_marketing` (perfil) e `dados_corridas` (performance).
*   **Objetivo**: Listar entregadores com seus dados de cadastro (Marketing) e métricas básicas de corrida (se houver).

## 2. Entregadores Prioridade/Main

### Estrutura Frontend
*   **Arquivo**: `src/components/views/EntregadoresMainView.tsx` (e `PrioridadePromoView.tsx`)
*   **Hook**: `src/hooks/useTabData.ts` (Tab 'entregadores' ou 'prioridade')
*   **Fetcher**: `src/utils/tabData/fetchers.ts` -> `fetchEntregadoresData`

### Backend (Supabase)
*   **RPC**: `listar_entregadores_v2`
*   **Tabelas**: `dados_corridas`.
*   **Objetivo**: Listar entregadores ativos no período selecionado com métricas detalhadas de aderência e performance.

### Índices Importantes (`dados_corridas`)
*   **`idx_dados_corridas_admin_optimized`**: Usado para calcular as métricas agregadas por entregador.
*   **`idx_dados_corridas_id_entregador`**: Essencial para agrupar por entregador.

## Manutenção e Debug

### Problemas Comuns
1.  **Duplicidade**: Entregadores podem aparecer duplicados se houver problemas na query de agrupamento.
2.  **Performance**: Listar todos os entregadores de um período longo pode ser pesado. A RPC `listar_entregadores_v2` deve ter paginação ou limites (atualmente retorna tudo, cuidado com períodos grandes).
3.  **Diferença de Dados**: Os dados de Marketing vêm de `dados_marketing`, enquanto os operacionais vêm de `dados_corridas`. Um entregador pode existir em um e não no outro.
