# Valores - Documentação Técnica

## Visão Geral
A aba **Valores** exibe informações financeiras dos entregadores, especificamente as taxas ganhas. Permite listar os maiores ganhadores e pesquisar entregadores específicos para ver seus ganhos históricos.

## Estrutura Frontend

### Componente Principal
*   **Arquivo**: `src/components/views/ValoresView.tsx`
*   **Responsabilidade**: Exibir tabela de valores e estatísticas gerais.
*   **Componentes Filhos**:
    *   `ValoresStats`: Cards com total pago e média.
    *   `ValoresTable`: Lista de entregadores e valores.

### Gerenciamento de Dados (Hooks)
*   **Hook Principal**: `src/components/views/valores/useValoresData.ts`
*   **Hook de Fetch Inicial**: `src/hooks/useTabData.ts` (Tab 'valores') -> `fetchValoresData`.
*   **Hook de Pesquisa**: O próprio `useValoresData` implementa a pesquisa via RPC `pesquisar_valores_entregadores`.

### Fluxo de Dados
1.  **Carga Inicial**: `useTabData` chama `listar_valores_entregadores` para o período selecionado.
2.  **Pesquisa**: Quando o usuário digita no campo de busca, `useValoresData` chama `pesquisar_valores_entregadores` (com debounce).

## Backend (Supabase)

### Funções RPC
1.  **`listar_valores_entregadores`**
    *   **Objetivo**: Listar ganhos dos entregadores no período filtrado.
    *   **Tabela**: `dados_corridas`.
    *   **Colunas**: `soma_das_taxas_das_corridas_aceitas`.

2.  **`pesquisar_valores_entregadores`**
    *   **Objetivo**: Buscar entregador por nome/ID em TODO o histórico (ignora filtros de data).
    *   **Parâmetro**: `termo_busca`.
    *   **Retorno**: Lista de entregadores correspondentes com seus totais históricos.

### Índices Importantes (`dados_corridas`)
*   **`idx_dados_corridas_soma_taxas`** (Idealmente deveria existir, verificar): Para somar taxas rapidamente.
*   **`idx_dados_corridas_pessoa_entregadora`**: Para busca por nome.

## Manutenção e Debug

### Problemas Comuns
1.  **Valores Zerados**: Verificar se a coluna `soma_das_taxas_das_corridas_aceitas` está populada na tabela `dados_corridas`.
2.  **Pesquisa Lenta**: A pesquisa varre todo o histórico. Se a tabela for muito grande, precisa de índice em `pessoa_entregadora` e `id_da_pessoa_entregadora` (usando `lower()` ou índice GIN/Trigram para `LIKE`).
