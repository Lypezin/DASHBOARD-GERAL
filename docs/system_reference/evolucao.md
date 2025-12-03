# Evolução - Documentação Técnica

## Visão Geral
A aba **Evolução** apresenta o histórico de desempenho ao longo do tempo (Mensal e Semanal). Permite visualizar tendências de corridas (Ofertadas, Aceitas, Completadas) e UTR.

## Estrutura Frontend

### Componente Principal
*   **Arquivo**: `src/components/views/EvolucaoView.tsx`
*   **Responsabilidade**: Exibir gráficos de linha/barra e cards de estatísticas evolutivas.
*   **Componentes Filhos**:
    *   `EvolucaoChart`: Gráfico principal (Chart.js).
    *   `EvolucaoStatsCards`: Cards com totais do período.
    *   `EvolucaoFilters`: Seleção de ano e métricas.

### Gerenciamento de Dados (Hooks)
*   **Hook Principal**: `src/hooks/useDashboardEvolucao.ts`
*   **Responsabilidade**: Buscar dados mensais e semanais para o ano selecionado.
*   **Cache**: Utiliza `useRef` para cachear resultados por ano/praça e evitar re-fetching ao alternar abas.

### Fluxo de Dados
1.  Usuário seleciona um Ano.
2.  `useDashboardEvolucao` verifica o cache.
3.  Se não houver cache, chama em paralelo:
    *   `listar_evolucao_mensal`
    *   `listar_evolucao_semanal`
4.  Calcula a UTR semanal no frontend (baseado nos dados retornados de `listar_evolucao_semanal`).

## Backend (Supabase)

### Funções RPC
1.  **`listar_evolucao_mensal`**
    *   **Parâmetros**: `p_ano`, `p_praca`, `p_organization_id`.
    *   **Retorno**: Array com dados agregados por mês (1-12).

2.  **`listar_evolucao_semanal`**
    *   **Parâmetros**: `p_ano`, `p_praca`, `p_organization_id`, `p_limite_semanas` (opcional).
    *   **Retorno**: Array com dados agregados por semana ISO.

### Tabelas Envolvidas
*   **`dados_corridas`**: Fonte dos dados.

### Índices Importantes
*   **`idx_dados_ano_iso_simples`**: Crucial para filtrar pelo ano selecionado.
*   **`idx_dados_corridas_admin_optimized`**: Usado para as agregações.

## Manutenção e Debug

### Problemas Comuns
1.  **Gráfico Vazio**: Verificar se há dados para o ano selecionado.
2.  **Performance**: Carregar o ano inteiro pode ser pesado. A RPC deve ser otimizada para agregar rapidamente.
3.  **Chart.js**: Erros de renderização do gráfico ("Canvas is already in use") são comuns se o componente não for desmontado/destruído corretamente. O `EvolucaoView` usa `registerChartJS` para garantir a inicialização correta.
