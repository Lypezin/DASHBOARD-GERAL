# Comparação - Documentação Técnica

## Visão Geral
A aba **Comparação** permite ao usuário selecionar múltiplas semanas (ou períodos) e comparar métricas lado a lado. É útil para analisar tendências e variações de desempenho entre diferentes momentos.

## Estrutura Frontend

### Componente Principal
*   **Arquivo**: `src/components/views/ComparacaoView.tsx`
*   **Responsabilidade**: Gerenciar a seleção de semanas e exibir as tabelas/gráficos comparativos.
*   **Componentes Filhos**:
    *   `ComparacaoFilters`: Seleção de semanas e praças.
    *   `ComparacaoMetrics`: Cards com métricas resumidas e variações.
    *   `ComparacaoTabelaDetalhada`: Tabela principal de comparação.
    *   `ComparacaoCharts`: Visualização gráfica.

### Gerenciamento de Dados (Hooks)
*   **Hook Principal**: `src/hooks/useComparacaoData.ts`
*   **Responsabilidade**:
    1.  Buscar a lista de todas as semanas disponíveis (`listar_todas_semanas`).
    2.  Para cada semana selecionada, chamar `dashboard_resumo` e `calcular_utr`.
    3.  Consolidar os resultados em um array ordenado.

### Fluxo de Dados
1.  Usuário seleciona semanas no filtro.
2.  Ao clicar em "Comparar", `useComparacaoData` itera sobre as semanas selecionadas.
3.  Para cada semana, dispara em paralelo (Promise.all):
    *   `dashboard_resumo` (para métricas gerais).
    *   `calcular_utr` (para métrica específica de UTR).
4.  Os resultados são combinados e armazenados no estado `dadosComparacao`.

## Backend (Supabase)

### Funções RPC Utilizadas
1.  **`dashboard_resumo`**: Reutilizada do Dashboard Geral. Retorna métricas completas para uma única semana/período.
2.  **`calcular_utr`**: Retorna especificamente dados de UTR para uma semana/período.
3.  **`listar_todas_semanas`**: Retorna a lista de semanas disponíveis no banco para popular o filtro.

### Tabelas Envolvidas
*   **`dados_corridas`**: Base para todas as métricas.

## Manutenção e Debug

### Problemas Comuns
1.  **Timeout**: Comparar muitas semanas simultaneamente pode causar timeout se o banco estiver lento, pois são feitas 2 requisições por semana selecionada.
2.  **Dados Incompletos**: Se uma semana falhar, o hook deve tratar o erro e exibir o que foi possível carregar, ou alertar o usuário.
3.  **Ordenação**: Garantir que as semanas sejam exibidas em ordem cronológica (ou lógica) na tabela, independente da ordem de resposta das requisições paralelas.

### Otimizações Possíveis
*   Criar uma RPC `comparar_semanas` que aceite um array de semanas e faça a agregação no banco de uma só vez, reduzindo o overhead de rede e conexões.
