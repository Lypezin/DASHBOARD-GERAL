# Valores por Cidade - Documentação Técnica

## Visão Geral
A aba **Valores por Cidade** (acessível via botão específico ou rota) exibe o investimento financeiro em marketing por cidade e calcula o Custo por Lead Liberado (CPL).

## Estrutura Frontend

### Componente Principal
*   **Arquivo**: `src/components/views/ValoresCidadeView.tsx`
*   **Responsabilidade**: Exibir tabela de custos e cards de resumo.
*   **Componentes Filhos**:
    *   `ValoresCidadeCards`: Cards com Total Investido e Custo por Liberado.
    *   `ValoresCidadeFilters`: Filtros de data independentes para Investimento e Leads.

### Gerenciamento de Dados (Hooks)
*   **Hook Principal**: `src/hooks/valoresCidade/useValoresCidadeData.ts`
*   **Autenticação**: `useValoresCidadeAuth.ts` (Proteção extra por senha local).

### Fluxo de Dados
1.  **Investimento**: Query direta na tabela `dados_valores_cidade` filtrando por data (`filter`).
2.  **Leads (Liberados)**: Query direta na tabela `dados_marketing` filtrando por data de envio (`filterEnviados`) e status 'Liberado'.
3.  **Cruzamento**:
    *   O sistema mapeia o nome da cidade em `dados_valores_cidade` (ex: 'SÃO PAULO') para a região em `dados_marketing` (ex: 'São Paulo 2.0') usando um mapa fixo (`cidadeToRegiao`).
    *   Calcula `Custo por Liberado = Investimento / Quantidade de Liberados`.

## Backend (Supabase)

### Queries Diretas (Sem RPC)
Este módulo não utiliza RPCs, mas sim queries diretas via cliente Supabase (`.from(...).select(...)`).

### Tabelas Envolvidas
1.  **`dados_valores_cidade`**
    *   Colunas usadas: `cidade`, `valor`, `data`.
    *   Objetivo: Armazenar o valor investido diariamente por cidade.

2.  **`dados_marketing`**
    *   Colunas usadas: `regiao_atuacao`, `status`, `data_envio`.
    *   Objetivo: Contar leads liberados.

### Índices Importantes
*   **`dados_valores_cidade`**: Índice em `data` e `cidade` (recomendado).
*   **`dados_marketing`**: `idx_dados_marketing_regiao_atuacao`, `idx_dados_marketing_status`, `idx_dados_marketing_data_envio`.

## Manutenção e Debug

### Problemas Comuns
1.  **Mapeamento de Cidades**: Se uma nova cidade for adicionada ou o nome mudar, o objeto `cidadeToRegiao` em `useValoresCidadeData.ts` precisa ser atualizado, senão o cruzamento falha e o Custo por Liberado fica incorreto.
2.  **Performance**: O hook faz um `Promise.all` iterando sobre todas as cidades para contar os liberados. Isso gera N queries simultâneas. Se houver muitas cidades, pode ser lento.
3.  **Segurança**: A senha de acesso é validada apenas no frontend (`useValoresCidadeAuth`), o que não é seguro para dados sensíveis. Recomenda-se mover essa validação para o backend (RLS ou Edge Function).
