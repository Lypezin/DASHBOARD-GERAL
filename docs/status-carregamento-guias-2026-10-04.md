# Status de carregamento das guias — 2026-10-04

## O que a telemetria recente mostra

Consulta somente de leitura aos logs do Supabase, entre 15:25 e 16:28 UTC. `response.origin_time` mede a chamada ao Supabase; não inclui a API Next, transferência completa, processamento React ou renderização.

| Caminho | Chamadas | Resultado observado |
| --- | ---: | --- |
| `listar_entregadores_dashboard_page_v2` | 4 | 1 resposta HTTP 200 em 4,239 s; 3 respostas HTTP 500 entre 8,389 e 8,455 s. As três coincidem com cancelamentos PostgreSQL `57014`. |
| `listar_entregadores_dashboard_fast_v1` | 2 | 3,048 s em cada chamada. |
| `dashboard_resumo` | 3 | p50 1,276 s; p95 2,296 s. |
| `get_available_weeks` | 3 | p50 467 ms; máximo 1,179 s. |
| `get_dashboard_dimension_options` | 2 | 619 ms. |
| `list_pracas_disponiveis` | 2 | 482 ms. |
| `listar_anos_disponiveis` | 3 | p50 446 ms; máximo 464 ms. |
| `calcular_utr_completo` | 1 | 676 ms. |

As amostras são pequenas e não formam um antes/depois. Elas explicam por que a lentidão continua perceptível: Entregadores ainda tem respostas lentas e cancelamentos. Não existe base para afirmar uma porcentagem de melhoria do carregamento das guias.

## Medição local do fluxo de Entregadores

No maior escopo anual amostrado, o primeiro carregamento pelo serviço local respondeu em 3,398 s e trouxe a página de 50 linhas junto dos totais e rankings. Com a fonte anual já no cache do mesmo processo, busca, filtro de inativos e ordenação responderam entre 14 e 67 ms. O caminho antigo de página expirou por `statement timeout` na mesma sonda local.

Esse resultado cobre um escopo anual e o serviço local. Não é uma medição de navegador, não mede todas as organizações/filtros e não invalida os timeouts observados nos logs remotos.

## Alterações e limite atual

- O serviço reaproveita a fonte anual em cache para paginação, busca, inativos e ordenação de Entregadores.
- Os caches em memória têm limites e compartilham chamadas simultâneas iguais; os dados válidos da mesma organização permanecem visíveis durante atualizações de filtro.
- Os caminhos de Valores reutilizam preparação e páginas no mesmo escopo, mas um cache miss ainda consulta e processa o conjunto base.
- As telas mantêm estados de atualização/erro em vez de trocar dados válidos por uma página vazia.

Essas alterações reduzem trabalho repetido e evitam alguns caminhos de timeout, mas não demonstram uma melhora geral da primeira carga. A cauda de Entregadores continua sendo o gargalo mensurado. O próximo ajuste de RPC precisa ser comparado com a mesma semana, organização e filtros, incluindo igualdade de linhas, totais, resumo e rankings, antes de substituir a implementação remota.
