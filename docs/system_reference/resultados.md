# Resultados - Documentação Técnica

## Visão Geral
A aba **Resultados** exibe o desempenho dos atendentes (responsáveis) no processo de marketing/ativação. Mostra quantos leads cada atendente enviou e quantos foram liberados.

## Estrutura Frontend

### Componente Principal
*   **Arquivo**: `src/components/views/ResultadosView.tsx`
*   **Responsabilidade**: Exibir cards por atendente com suas métricas.
*   **Componentes Filhos**:
    *   `AtendenteCard`: Card individual do atendente.
    *   `ResultadosFilter`: Filtros de data (Enviados/Liberados).

### Gerenciamento de Dados (Hooks)
*   **Hook Principal**: `src/components/views/resultados/useResultadosData.ts`
*   **Hook de Dados**: `src/hooks/useAtendentesData.ts`
*   **Responsabilidade**: Buscar dados agregados por atendente.

### Fluxo de Dados
1.  `useResultadosData` chama `fetchAtendentesData`.
2.  `fetchAtendentesData` chama a RPC `get_marketing_atendentes_data`.
3.  Os dados são processados no frontend para garantir que todos os atendentes (constante `ATENDENTES`) sejam exibidos, mesmo sem dados (zerados).

## Backend (Supabase)

### Função RPC: `get_marketing_atendentes_data`
*   **Objetivo**: Retornar contagem de enviados e liberados agrupados por `responsavel` e `cidade`.
*   **Parâmetros**: Filtros de data (`data_envio`, `data_liberacao`).
*   **Tabela**: `dados_marketing`.

### Tabelas Envolvidas
*   **`dados_marketing`**: Fonte dos dados.

### Índices Importantes (`dados_marketing`)
*   **`idx_dados_marketing_responsavel`**: Essencial para o agrupamento.
*   **`idx_dados_marketing_responsavel_data_envio`**: Índice composto para filtrar e agrupar.
*   **`idx_dados_marketing_responsavel_data_liberacao`**: Índice composto para filtrar e agrupar.

## Manutenção e Debug

### Problemas Comuns
1.  **Atendente Faltando**: O frontend usa uma lista fixa de atendentes (`src/utils/atendenteMappers.ts`). Se um novo atendente entrar, precisa atualizar essa lista.
2.  **Totais Incorretos**: Verificar se os filtros de data estão sendo aplicados corretamente na RPC. A lógica de contar "Enviados" e "Liberados" usa filtros de data independentes.
