# UTR (Utilização de Tempo Real) - Documentação Técnica

## Visão Geral
A aba **UTR** exibe a métrica de Utilização de Tempo Real, que mede a eficiência dos entregadores relacionando o tempo logado com o número de corridas realizadas. O cálculo base é `Corridas / (Segundos Logados / 3600)`.

## Estrutura Frontend

### Componente Principal
*   **Arquivo**: `src/components/views/UtrView.tsx`
*   **Responsabilidade**: Exibir os dados de UTR segmentados por Geral, Praça, Sub-Praça, Origem e Turno.
*   **Componentes Filhos**:
    *   `UtrGeral`: Card principal com a UTR média.
    *   `UtrSection`: Componente reutilizável para exibir listas de UTR por segmento (Praça, Sub-Praça, etc.).

### Gerenciamento de Dados (Hooks)
*   **Hook de Fetch**: `src/utils/tabData/fetchers.ts` -> `fetchUtrData`
*   **Hook de Consumo**: `src/hooks/useTabData.ts` (quando `activeTab === 'utr'`)
*   **Orquestração**: `src/hooks/useDashboardPage.ts` chama `useTabData`.

### Fluxo de Dados
1.  Usuário seleciona a aba "UTR".
2.  `useDashboardPage` define `activeTab = 'utr'`.
3.  `useTabData` detecta a aba ativa e chama `fetchTabData` -> `fetchUtrData`.
4.  `fetchUtrData` chama a RPC `calcular_utr_completo`.
5.  Dados são retornados e mapeados via `useTabDataMapper` para o formato esperado por `UtrView`.

## Backend (Supabase)

### Função RPC: `calcular_utr_completo`
*   **Nome**: `calcular_utr_completo`
*   **Objetivo**: Calcular a UTR agregada em múltiplos níveis (Geral, Praça, Sub-Praça, Origem, Turno) em uma única chamada.
*   **Parâmetros**: Mesmos filtros do dashboard (`p_ano`, `p_semana`, `p_praca`, etc.).
*   **Retorno**: JSON contendo objetos para cada segmento (`geral`, `por_praca`, `por_sub_praca`, etc.).

### Lógica de Cálculo
```sql
UTR = SUM(numero_de_corridas_aceitas) / (SUM(tempo_disponivel_absoluto_segundos) / 3600.0)
```
*   Filtra apenas registros onde `tempo_disponivel_absoluto_segundos > 0`.

### Tabelas Envolvidas
*   **`dados_corridas`**: Fonte dos dados de tempo e corridas.

### Índices Importantes (`dados_corridas`)
*   **`idx_dados_corridas_admin_optimized`**: Essencial pois contém `tempo_disponivel_absoluto_segundos` e `numero_de_corridas_aceitas`, além das colunas de filtro.

## Manutenção e Debug

### Problemas Comuns
1.  **UTR Infinita ou Zerada**: Ocorre se `tempo_disponivel_absoluto_segundos` for 0 ou nulo. A query deve tratar divisão por zero.
2.  **Discrepância de Dados**: Verificar se os filtros de data/semana estão alinhados com o Dashboard Geral. A UTR usa a mesma base (`dados_corridas`), então os números devem ser consistentes.

### Fallback
Se a RPC falhar (timeout ou erro 500), o frontend tenta usar `fetchUtrFallback` (`src/utils/tabData/fallbacks.ts`), que faz queries diretas ao Supabase usando `.select()` e agrega no cliente (menos performático, mas funcional).
