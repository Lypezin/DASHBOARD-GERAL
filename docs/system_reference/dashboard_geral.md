# Dashboard Geral - Documentação Técnica

## Visão Geral
O **Dashboard Geral** é a tela principal do sistema, responsável por apresentar os indicadores chave de desempenho (KPIs) da operação. Ele exibe métricas de aderência, volume de corridas e detalhamentos por dia, turno, sub-praça e origem.

## Estrutura Frontend

### Componente Principal
*   **Arquivo**: `src/components/views/DashboardView.tsx`
*   **Responsabilidade**: Renderizar os componentes visuais (cards, gráficos, tabelas) com base nos dados recebidos via props.
*   **Componentes Filhos**:
    *   `DashboardGeneralStats`: Cards de métricas principais (Ofertadas, Aceitas, etc.).
    *   `DashboardDailyPerformance`: Gráfico/Tabela de aderência por dia.
    *   `DashboardOperationalDetail`: Tabelas detalhadas por Turno, Sub-Praça e Origem.

### Gerenciamento de Dados (Hooks)
*   **Hook Principal**: `src/hooks/useDashboardMainData.ts`
*   **Responsabilidade**: Orquestrar a busca de dados, cache e debounce.
*   **Hooks Auxiliares**:
    *   `useDashboardCache.ts`: Gerencia o cache em memória (sessionStorage/RAM) para evitar requisições redundantes.
    *   `useDashboardDebounce.ts`: Controla o debounce das requisições ao alterar filtros.
    *   `useDashboardPage.ts`: Hook de nível superior que integra autenticação, filtros e dados.

### Fluxo de Dados
1.  O usuário altera um filtro (Ano, Semana, Praça, etc.) em `DashboardFiltersContainer`.
2.  `useDashboardPage` atualiza o estado `filters`.
3.  `useDashboardMainData` detecta a mudança e aciona o debounce.
4.  Após o debounce, chama a função RPC `dashboard_resumo`.
5.  Os dados retornados são processados e passados para `DashboardView`.

## Backend (Supabase)

### Função RPC: `dashboard_resumo`
*   **Nome**: `dashboard_resumo`
*   **Objetivo**: Retornar um resumo completo dos dados para o período e filtros selecionados.
*   **Parâmetros**:
    *   `p_ano` (int): Ano ISO.
    *   `p_semana` (int): Número da semana ISO.
    *   `p_praca` (text): Filtro de praça (opcional).
    *   `p_sub_praca` (text): Filtro de sub-praça (opcional).
    *   `p_origem` (text): Filtro de origem (opcional).
    *   `p_turno` (text): Filtro de turno (opcional).
    *   `p_organization_id` (uuid): ID da organização para RLS.
    *   `p_filtro_modo` (text): 'periodo' ou 'ano_semana'.
    *   `p_data_inicial` (date): Data inicial (se modo periodo).
    *   `p_data_final` (date): Data final (se modo periodo).

### Tabelas Envolvidas
*   **`dados_corridas`**: Tabela principal contendo os registros brutos das corridas.
*   **`fat_dashboard_resumo`** (Provável): Tabela desnormalizada ou Materialized View para performance (verificar existência no banco). Caso não exista, a agregação é feita diretamente em `dados_corridas`.

### Índices Importantes (`dados_corridas`)
Para garantir a performance do dashboard, os seguintes índices são cruciais na tabela `dados_corridas`:

1.  **`idx_dados_corridas_admin_optimized`**:
    *   Colunas: `ano_iso`, `semana_numero`, `praca`, `numero_de_corridas_ofertadas`, `numero_de_corridas_aceitas`, `numero_de_corridas_completadas`, `numero_de_corridas_rejeitadas`, `tempo_disponivel_absoluto_segundos`.
    *   Uso: Agregações principais filtradas por ano/semana/praça.

2.  **`idx_dados_ano_iso_simples`**:
    *   Coluna: `ano_iso`.
    *   Uso: Filtros rápidos por ano.

3.  **`idx_dados_corridas_admin_completo`**:
    *   Colunas: `ano_iso`, `semana_numero`, `praca`, `data_do_periodo`.
    *   Uso: Consultas mais abrangentes.

## Manutenção e Debug

### Problemas Comuns
1.  **Dados Zerados**: Verificar se o filtro de `organization_id` está sendo passado corretamente e se o usuário tem permissão.
2.  **Lentidão**: Verificar se os índices estão sendo usados (EXPLAIN ANALYZE na RPC).
3.  **Cache Desatualizado**: O hook `useDashboardCache` tem um TTL. Se os dados mudarem no banco, pode levar um tempo para refletir no frontend.

### Como Adicionar Nova Métrica
1.  **Backend**: Alterar a RPC `dashboard_resumo` para calcular e retornar a nova coluna.
2.  **Types**: Atualizar a interface `DashboardResumoData` em `src/types/index.ts`.
3.  **Frontend**: Adicionar a exibição da nova métrica em `DashboardView.tsx` ou subcomponentes.
