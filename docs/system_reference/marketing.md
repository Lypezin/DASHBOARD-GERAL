# Marketing - Documentação Técnica

## Visão Geral
A aba **Marketing** foca no funil de aquisição e ativação de entregadores. Exibe métricas de leads criados, enviados, liberados e que começaram a rodar ("Rodando Início").

## Estrutura Frontend

### Componente Principal
*   **Arquivo**: `src/components/views/MarketingDashboardView.tsx`
*   **Responsabilidade**: Exibir o funil de marketing e detalhamento por cidade.
*   **Componentes Filhos**:
    *   `MarketingCard`: Cards de métricas do funil.
    *   `MarketingCityCard`: Cards por cidade.
    *   `MarketingDateFilter`: Filtros de data específicos (Enviados, Liberados, Rodou Dia).

### Gerenciamento de Dados (Hooks)
*   **Hook Principal**: `src/components/views/marketing/useMarketingData.ts`
*   **Responsabilidade**: Buscar totais e dados por cidade.
*   **Filtros**: Gerencia filtros independentes para cada etapa do funil (`filtroEnviados`, `filtroLiberacao`, `filtroRodouDia`).

### Fluxo de Dados
1.  `useMarketingData` chama em paralelo:
    *   `fetchTotals` -> RPC `get_marketing_totals`
    *   `fetchCitiesData` -> RPC `get_marketing_cities_data`
2.  Se as RPCs falharem, existe um fallback complexo que faz múltiplas queries diretas ao Supabase (`dados_marketing`), construindo as agregações no cliente.

## Backend (Supabase)

### Funções RPC
1.  **`get_marketing_totals`**
    *   **Parâmetros**: Filtros de data para cada etapa (`data_envio_inicial`, `data_liberacao_final`, etc.).
    *   **Retorno**: Objeto com totais (`criado`, `enviado`, `liberado`, `rodando_inicio`).

2.  **`get_marketing_cities_data`**
    *   **Parâmetros**: Mesmos filtros de data.
    *   **Retorno**: Lista de objetos com métricas por cidade.

### Tabelas Envolvidas
*   **`dados_marketing`**: Tabela principal de leads/entregadores do marketing.

### Índices Importantes (`dados_marketing`)
*   **`idx_dados_marketing_data_envio`**: Filtro de enviados.
*   **`idx_dados_marketing_data_liberacao`**: Filtro de liberados.
*   **`idx_dados_marketing_rodou_dia`**: Filtro de quem rodou.
*   **`idx_dados_marketing_regiao_atuacao`**: Agrupamento por cidade.

## Manutenção e Debug

### Problemas Comuns
1.  **Fallback Lento**: Se a RPC falhar, o fallback faz muitas requisições (N cidades * 3 métricas), o que é muito lento. Priorizar a correção da RPC.
2.  **Inconsistência de Totais**: Os filtros de data são independentes. É possível filtrar "Enviados em Jan" e "Liberados em Fev". Isso é intencional, mas pode confundir se não for compreendido.
