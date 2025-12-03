# Documentação Técnica do Sistema

Este diretório contém a documentação técnica detalhada de cada módulo do Dashboard Geral. O objetivo é servir como referência para manutenção, debug e desenvolvimento de novas funcionalidades.

## Módulos

*   [Dashboard Geral](./dashboard_geral.md): Visão geral, KPIs principais e arquitetura base.
*   [Analise](./dashboard_geral.md): (Incluído no Dashboard Geral) Tabelas detalhadas de performance.
*   [Comparação](./comparacao.md): Ferramenta de comparação entre semanas/períodos.
*   [Evolução](./evolucao.md): Gráficos históricos mensais e semanais.
*   [UTR](./utr.md): Utilização de Tempo Real - métricas e cálculos.
*   [Marketing](./marketing.md): Funil de aquisição de entregadores.
*   [Entregadores](./entregadores.md): Listagem e métricas de entregadores (Marketing e Operacional).
*   [Valores](./valores.md): Ganhos e taxas dos entregadores.
*   [Valores por Cidade](./valores_cidade.md): Investimento e Custo por Lead (CPL).
*   [Resultados](./resultados.md): Performance dos atendentes de marketing.

## Arquitetura Geral

O sistema utiliza **React** no frontend e **Supabase** no backend. A comunicação é feita principalmente através de **RPCs (Remote Procedure Calls)** do PostgreSQL para garantir performance e segurança, encapsulando a lógica de negócios no banco de dados.

### Padrões de Código
*   **Hooks**: A lógica de busca de dados é isolada em hooks customizados (ex: `useDashboardMainData`, `useTabData`).
*   **Componentes**: A UI é separada da lógica. Componentes de visualização (`View`) recebem dados prontos via props.
*   **Cache**: Utiliza-se cache em memória e `sessionStorage` para otimizar a navegação.
