# Supabase Performance and Security Audit

## Atualizacao de 2026-10-03

### Latencia observada nas RPCs (24 h até 15:42 UTC de 2026-10-03)

Os tempos abaixo sao do log de chamadas RPC/REST, nao do carregamento completo da pagina. Sem uma sessao autenticada funcional, nao foi possivel medir o tempo tela-a-tela nesta coleta.

| Guia ou fluxo | RPC / amostra | p50 | p95 | Maximo | Leitura |
| --- | --- | ---: | ---: | ---: | --- |
| Geral e Analise | `dashboard_resumo`, 34 chamadas, 0 erros | 566 ms | 1.752 ms | 2.019 ms | p95 inclui rede/API e execucao; nao mede render da tela. |
| Entregadores | `listar_entregadores_v2`, 23 chamadas, 3 erros | 1.314 ms | 8.382 ms | 8.586 ms | Maior cauda e tres erros; a RPC paginada nova nao aparece no trafego. |
| Valores | `listar_valores_entregadores`, 3 chamadas, 0 erros | 4.050 ms | 6.771 ms | 6.771 ms | Maior mediana; amostra muito pequena. |
| Evolucao / UTR | `calcular_utr_completo`, 22 chamadas, 0 erros | 427 ms | 1.007 ms | 1.108 ms | Sem sinal atual que justifique outro indice. |
| Filtros | `listar_anos_disponiveis`, 29 chamadas, 0 erros | 446 ms | 2.280 ms | 2.388 ms | Algumas respostas acima de 2 s. |
| Filtros | `get_available_weeks`, 22 chamadas, 0 erros | 400 ms | 1.085 ms | 1.480 ms | Cauda acima da mediana. |
| Filtros | `listar_todas_semanas`, 4 chamadas, 0 erros | 1.562 ms | 2.628 ms | 2.628 ms | Amostra pequena; vale acompanhar. |
| Filtros | `list_pracas_disponiveis`, 9 chamadas, 0 erros | 868 ms | 2.721 ms | 2.721 ms | Amostra pequena. |
| Ticker de cidades | `get_city_last_updates`, 12 chamadas, 0 erros | 450 ms | 1.503 ms | 1.503 ms | Cauda observada em poucas chamadas. |

Os dados sao `response.origin_time` dos Edge logs de 2026-10-02 15:42 a 2026-10-03 15:42 UTC; representam o tempo no caminho REST/RPC, nao o carregamento completo da tela. Percentis de amostras pequenas sao instaveis. `get_valores_cidade_resumo` nao teve chamada suficiente para comparacao.

#### Entregadores: estado do codigo versus trafego

- O workspace envia a guia principal para `listar_entregadores_dashboard_page_v1` quando inclui `p_limit`; a RPC existe no banco e so concede `EXECUTE` a `service_role` e `postgres`.
- Correção da leitura anterior: `p_limit = -1` é um sentinela intencional que pede tamanho de página responsivo (24, 35 ou 50 conforme o total); não significa carregar a lista inteira em uma página. A RPC paginada ainda obtém a agregação base completa antes de filtrar/ordenar/paginar cada resposta, então é possível haver trabalho SQL repetido por página.
- A janela de 24 horas registrou zero chamadas HTTP externas a `listar_entregadores_dashboard_page_v1` e 23 pedidos a `listar_entregadores_v2`, três deles com erro. A função `listar_entregadores_v2` pode despachar internamente para `listar_entregadores_dashboard_fast_v1` em chamadas `service_role` elegíveis; os Edge logs não mostram essa chamada interna.
- `track_functions` está `none` no Postgres, então não há contagem para distinguir os pedidos do wrapper que seguiram pelo fast path daqueles que caíram no legado. A ausência de uma rota Edge `fast_v1` não prova que ela não rodou. Já a rota paginada `page_v1` segue sem evidência de uso em produção; não atribuo a ela os ganhos de payload medidos no checkout.
- Os três HTTP 500 ocorreram perto de 8 segundos e coincidem com três erros SQLSTATE `57014` no Postgres. A origem dentro do wrapper não foi identificada; para separar os caminhos, é necessária telemetria explícita ou uma chamada com parâmetros rastreáveis, seguida de medição após a versão desejada ser servida.

#### Login/perfil e limite da medicao tela-a-tela

- A captura mais recente ainda mostra erro ao validar perfil. Na janela de 24 horas, o Supabase registrou 127 leituras de `user_profiles` com HTTP 200 e nenhuma falha HTTP para essa rota; isso nao identifica o resultado da sessao especifica nem descarta erro na API Next local.
- O bundle servido em `localhost:3000/login` contem o botao `Tentar validar novamente`, que nao aparece na captura. A captura e a versao atual do bundle nao estao alinhadas; a causa do erro de perfil continua sem reproducao confirmada.
- Sem uma sessao autenticada funcional e correlacionada no navegador, nao ha medicao confiavel de abertura tela-a-tela, filtros em cada guia ou transicoes com dados reais.

As reducoes percentuais anteriores documentadas para RPCs foram 76,8% em Evolucao, 90,4% em Entregadores semanal, 94,1% em Valores semanal e 54,8-56,3% no filtro de cidade. Elas nao representam ganho de carregamento completo da pagina. A medicao anual intermediaria de Entregadores (89,8%) foi do SQL antes da serializacao da RPC e nao deve ser apresentada como ganho da guia. A janela recente ainda mostra cauda alta em Entregadores e Valores.

### Indices, tabelas e advisors

- Nao apareceu indice duplicado exato nas tabelas centrais nem motivo para remover os indices grandes em uso. `dados_corridas` esta em ~3,44 milhoes de linhas, com ~2,3% de tuplas mortas; ultimo autovacuum em 2026-05-27 e ultimo autoanalyze em 2026-09-28.
- Os dez avisos `unused_index` atuais estao em chat, historico/tags, gamificacao e apresentacoes. Sao avisos `INFO` em tabelas auxiliares; nao foram removidos em lote.
- O Performance Advisor tambem recomenda alocacao percentual de conexoes para Auth ao escalar a instancia. E ajuste de configuracao do projeto, nao indice SQL.
- O Security Advisor agora deixou de listar `search_path` mutavel depois da migração de 2026-10-03 15:41 UTC. Restam quatro auxiliares `SECURITY DEFINER` executaveis por `authenticated`; as quatro sao usadas por politicas RLS, e seus grants foram preservados.
- A amostra de `pg_stat_user_indexes` mostra uso real dos indices maiores de `dados_corridas` e `mv_entregadores_agregado`. `idx_scan` baixo, isoladamente, nao justifica drop de indice.

### Alteracoes locais desta rodada

- `dashboard_resumo` agora recebe as pracas autorizadas em uma unica RPC quando o perfil tem varias pracas. A definicao atual da funcao converte `p_praca` separado por virgulas em array e filtra com `praca = ANY(...)`. Isso substitui o fan-out paralelo por uma chamada; o ganho em milissegundos ainda precisa ser medido numa sessao autenticada.
- O cache GET do cliente agora inclui o id do usuario autenticado. Antes, a chave era apenas o caminho HTTP e podia reutilizar por alguns segundos a resposta de outro usuario no mesmo navegador.
- Caches locais de Resultados, Comparacao, Valores por Cidade e Entrada/Saida agora incluem o escopo de acesso do perfil e ocultam o estado anterior imediatamente quando o perfil ou as pracas atribuídas mudam.
- A API de Entrada/Saida agora exige perfil com acesso completo de cidade (admin/master ou Marketing), igual as RPCs analiticas protegidas. Antes, essa rota executava a RPC com service role sem aplicar a restricao de praca para outros perfis.
- O login tenta ler o proprio perfil diretamente com a sessao e RLS. Se esse pedido falha, a API interna valida o token e consulta somente a linha cujo `id` corresponde ao usuario autenticado, com a chave `service_role` no servidor; ela tambem usa essa chave ao provisionar perfil ausente. A chave nunca vai ao navegador.
- O `.env.local` deste ambiente nao tem `SUPABASE_SERVICE_ROLE_KEY`. O caminho direto permitido por RLS segue disponivel no login normal; o fallback de servidor e as APIs de dados que executam RPCs com `service_role` dependem dessa chave local. A validacao autenticada completa do dashboard segue pendente.
- O ticker de cidades agora separa o cache por usuario e permissoes, mantem os dados da mesma sessao durante a revalidacao e filtra no servidor as pracas visiveis. A resposta autenticada usa `private, no-store`; o cliente nao reutiliza a resposta por 10 segundos depois de uma mudanca de permissao.
- O ticker continua animando cidades e datas, com pausa para `prefers-reduced-motion`. Enquanto atualiza, mantem a ultima resposta valida e indica o estado `Atualizando`.
- A exportacao do fluxo de Marketing agora fica bloqueada durante atualizacao e apos erro, evitando salvar uma resposta anterior como se correspondesse aos filtros atuais.
- As transicoes entre guias de Dashboard, Comparacao, Evolucao e DEDICADO passaram de 80-90 ms para 160 ms e continuam respeitando `prefers-reduced-motion`.
- A exportacao de DEDICADO nao formata a coluna generica `Valor` como moeda e mostra Aderencia Horas com `%`.
- Removida uma segunda definicao CSS do spinner do ticker, que sobrepunha a regra `prefers-reduced-motion` da folha de animacoes.
- Respostas HTTP 2xx sem JSON valido no envelope `{ data: ... }` agora viram erro explicito nos leitores da API interna e das RPCs. Isso evita converter uma resposta truncada/inesperada em lista vazia no login e nas guias.
- As semanas retornadas para um ano selecionado agora sao autoritativas: lista vazia valida nao repoe semanas de outro escopo, e linhas malformadas geram erro em vez de serem descartadas.
- A leitura do proprio perfil tem politica RLS `SELECT` para `auth.uid()` e permissao `SELECT` para `authenticated` no banco. A causa exata do erro da captura ainda nao foi confirmada por um novo login; a captura nao foi reproduzida na aba local, que estava sem sessao.
- Foram revisados os nove pontos ativos que escrevem `.xlsx`: listas exportadas, paginacao de detalhes de Marketing, limites do Excel e tratamento de erro. A aba UTR da comparacao agora usa o formato real da RPC (`geral.utr`, `geral.tempo_horas`, `geral.corridas`) e marca dados ausentes como `N/D`; a contagem de abas do arquivo tambem foi corrigida. DEDICADO recusa listas acima do limite antes de criar as planilhas.
- Validacao local apos os ajustes: `npx tsc --noEmit`, `npm run lint` e `git diff --check` passaram. A rota sintetica `/visual-smoke` continua renderizando a tabela e o grafico da Comparacao. O `next build` nao foi repetido enquanto o servidor de desenvolvimento ativo compartilha a pasta `.next`.
- A validacao visual autenticada local ainda depende de uma nova tentativa do usuario no navegador; nao foi usada a senha exposta em captura anterior.

## Atualizacao de 2026-06-27

- MCP Supabase revalidado no projeto: `dados_corridas` segue como maior tabela operacional
  (~2,77M linhas), com tabelas incrementais ativas para dashboard, comparacao e entregadores.
- `get_dashboard_dimension_options(praca, org)` mediu ~9,6ms com `EXPLAIN (ANALYZE, BUFFERS)`,
  entao nao recebeu novo indice nem reescrita nesta rodada.
- `vw_dashboard_resumo_current` com `organization_id + ano_iso=2026` mediu ~262ms quente. O plano
  usa indices existentes e nao justificou novo indice especulativo.
- `vw_entregadores_agregado_current` com `organization_id + ano_iso=2026 + praca='SANTO ANDRE'`
  mediu ~14,8s no teste direto da view. O gargalo vem do overlay/anti-join da view; a guia Valores
  agregada ja usa fast path direto e mediu ~87ms no mesmo escopo de data/praca.
- `listar_valores_entregadores_detalhado` era o gargalo real da paginacao de Valores: mediu
  ~8,7s para `SANTO ANDRE`, 2026, `limit=25`. A funcao core foi preservada como fallback legado
  (`_listar_valores_entregadores_detalhado_core_legacy_v1`) e recebeu fast path com SQL dinamico
  para `organization_id + data range + uma praca`, sem sub_praca/origem.
- Revalidacao apos fast path dinamico: mesma chamada detalhada caiu para ~156ms, retornando
  `25` linhas e `total=1872`. Reducao aproximada: 98% nesse caminho medido.
- Advisory atual do MCP apontou RLS desabilitado em 5 tabelas incrementais:
  `mv_refresh_impacts`, `tb_dashboard_resumo_incremental`, `tb_corridas_agregadas_incremental`,
  `tb_entregadores_agregado_incremental` e `tb_comparison_weekly_incremental`. Nao foi aplicado
  `ENABLE ROW LEVEL SECURITY` automaticamente porque isso bloquearia acessos sem politicas
  adequadas; precisa de migracao de seguranca planejada.

Data da coleta: 2026-05-29

Projeto auditado: `ulmobmmlkevxswxpcyza`

## Atualização de 2026-05-31

- Security Advisor revalidado: 0 avisos.
- Foram removidos 5 índices sem uso e sem dependência de FK/PK/unique:
  `idx_mv_dashboard_org_v3`, `idx_mv_corridas_agregadas_entregador_v3`,
  `idx_mv_corridas_agregadas_org_v3`, `idx_mv_entregadores_summary_activation_v3`,
  `idx_mv_ativacao_org_week_v3`.
- Os 12 índices pequenos de FK foram recriados de propósito. Ao removê-los, o advisor trocou
  `unused_index` por `unindexed_foreign_keys`, que é um estado pior. Portanto eles devem ficar,
  mesmo que aparecam como pouco usados.
- Performance Advisor atual: 12 avisos `unused_index` referentes a índices de FK pequenos e
  1 aviso `auth_db_connections_absolute`, que depende de configuração do Auth no painel Supabase,
  não de SQL.
- Auditoria dos 12 `unused_index` atuais: todos batem exatamente com uma coluna de FK, todos têm
  `idx_scan = 0` no snapshot e todos são pequenos (8-16 kB). Decisão: manter. O ganho máximo de
  armazenamento seria irrelevante, e removê-los reabre o aviso pior de `unindexed_foreign_keys`.
- `dashboard_evolucao_bundle` foi otimizada para limitar o CTE base ao ano solicitado quando não há
  intervalo customizado. Medição com `2026/organização ativa`: ~1801ms antes, ~418ms depois.
- `listar_entregadores_v2` recebeu fast path para `ano + semana + organização` sem filtros extras.
  Medição com `2026/21/organização ativa`: ~1311ms antes, ~126ms depois.
- Em `2026-10-02`, a entrada em Entregadores retornou 500 por `statement timeout` na RPC
  `listar_entregadores_v2`. O plano do formato anual somente com `p_ano` levou ~22,6s e fez
  321k buscas na heap; o mesmo período enviado como intervalo usou o índice covering por data
  e levou ~2,3s antes da serialização JSON. Foi criada `listar_entregadores_dashboard_fast_v1`,
  restrita a `service_role`, que normaliza chamadas somente com ano para intervalo e mantém os
  filtros de praça, subpraça e origem. `listar_entregadores_v2` também foi mantida como fachada
  compatível: chamadas `service_role` elegíveis delegam à RPC rápida e os demais parâmetros
  seguem na implementação anterior. Uma chamada anual completa retornou em ~3,5s no cenário
  medido; os registros e métricas coincidiram com v2 quando ordenados por entregador, inclusive
  no filtro de praça. Nenhum índice adicional foi criado.
- Incidente da captura recebida: o arquivo foi criado às 22:50 UTC; o log mais próximo mostra
  `listar_entregadores_v2` respondendo 500 em 8,38s às 22:53 UTC, com `canceling statement due to
  statement timeout` no Postgres. A RPC anual rápida foi instalada às 23:13 UTC e a fachada
  compatível às 23:20 UTC. Duas chamadas posteriores da v2 terminaram em HTTP 200: às 23:39 UTC
  (5,12s) e às 23:47 UTC (2,41s). Não houve outro 500/timeout de Entregadores na janela
  consultada até 23:50 UTC. Isso confirma recuperação do caminho de banco observado, mas não
  substitui uma nova sessão autenticada no navegador para confirmar renderização completa.
- No cliente, `/api/dashboard/data` retornava o status HTTP 500 como erro sem status numérico.
  `fetchInternalRpcApi` agora preserva status/código/detalhes e `is500Error` reconhece HTTP 500;
  assim Entregadores aciona a tentativa automática já prevista, além do botão de retry da tela.
- `listar_valores_entregadores` recebeu fast path equivalente para `ano + semana + organização`.
  Medição com `2026/21/organização ativa`: ~1434ms antes, ~85ms depois.
- Revalidação adicional em `2026-05-31`: `listar_entregadores_v2` com `2026 + SAO PAULO`
  mediu ~73ms; `dashboard_dedicado_origens_v2` com `2026 + SAO PAULO` mediu ~84ms.
- `listar_valores_entregadores` com `2026 + SAO PAULO` ainda ficou em ~518ms e segue como
  candidato secundário para reduzir temp spill em filtros anuais.
- `vw_corridas_agregadas_current` foi simplificada para tratar a tabela incremental como
  substituição completa do escopo `organization_id + week_start_date + praca`, alinhado com
  `refresh_corridas_agregadas_incremental`. O ramo removido retornava 0 linhas e custava ~2,2s.
- A leitura base de `vw_corridas_agregadas_current` para a organização ativa até `2026-05-25`
  caiu de ~2,4s para ~109ms.
- `get_fluxo_semanal` continua sendo a RPC mais pesada de Marketing, mas caiu de ~5,6s para
  ~1,76s no período `2026-05-01` a `2026-05-31`. Foi adicionado cache curto e dedupe na rota
  `/api/marketing/fluxo` para tornar navegações repetidas/filtros iguais praticamente
  imediatos sem alterar os cálculos da RPC.
- Revalidação posterior mediu `get_fluxo_semanal` em ~1,9s no cenário frio/quente de maio/2026.
  Uma reescrita usando `mv_entregadores_ativacao` foi descartada porque alterou `entradas_total`
  e `saidas_mkt_count`; portanto não é segura sem revisar a regra de negócio.
- `get_fluxo_semanal(date, date, uuid, text)` e `get_fluxo_semanal(date, date, uuid, text, boolean)`
  receberam `work_mem = 64MB` no nível da função para remover temp spill em disco. A medição ficou
  em ~1,6s, mas com `Temp Read/Write = 0`.
- Foram adicionados cache curto e dedupe em voo também em `/api/dashboard/data`, `/api/app/secure-rpc`
  e `/api/dedicado/origens`, cobrindo Dashboard, UTR, Entregadores, Valores, DEDICADO, Evolução,
  Comparação, Análise e Marketing sem alterar RPCs, filtros ou payloads principais.
- As transições internas foram padronizadas em Marketing, Comparação, Evolução e DEDICADO com
  `AnimatePresence`, `transform-gpu` e respeito a `prefers-reduced-motion`, reduzindo troca brusca
  entre skeleton, conteúdo, erro e subguias.
- As RPCs de metadados de filtros do dashboard foram reescritas para evitar a view pesada
  `vw_dashboard_resumo_current` quando o retorno é apenas lista distinta. Medições finais:
  `list_pracas_disponiveis` ~52ms, `listar_anos_disponiveis` ~3ms,
  `listar_todas_semanas` ~31ms, `get_available_weeks(2026, org)` ~15ms,
  `get_dashboard_dimension_options(praca, org)` ~67ms.
- `get_dashboard_dimension_options` agora respeita explicitamente `p_organization_id` em chamadas
  `service_role`, alinhando o escopo real da RPC com a validação feita no proxy `/api/app/secure-rpc`.
- Foi adicionado um índice leve por `praca` em `mv_dashboard_resumo` e
  `tb_dashboard_resumo_incremental`. A versão covering foi testada e descartada por custo maior
  de armazenamento para ganho pequeno.
- `get_fluxo_semanal` foi reescrita para calcular `activation_week`, `last_active_week` e
  `total_rides` em uma única agregação sobre o acumulado por entregador, eliminando o CTE
  intermediário `activation_weeks` e o join de volta em todas as linhas. A saída foi comparada
  semana a semana em maio/2026 e manteve `entradas`, `saídas`, `retomada`, `base_ativa` e
  `retomada_origins` iguais. Medição pós-migração: resumo mensal ~1,49s; detalhe semanal com
  nomes ~1,40s.
- A sobrecarga de resumo de `get_fluxo_semanal(..., includeNames=false)` deixou de carregar
  `nome_entregador`, porque o payload dessa chamada sempre retorna arrays de nomes vazios. O hash
  do JSON foi validado antes/depois em maio/2026 sem praça e com `SAO PAULO`
  (`9c8658413a78071d2f924328257ad2f2` e `0b86580ec0f09340e9574c41e8ef9ad0`). Medição atual:
  resumo geral ~1,33s; resumo com `SAO PAULO` ~637ms.
- `vw_entregadores_agregado_current` foi alinhada ao modelo de overlay por escopo
  `organization_id + data_do_periodo + praca + sub_praca + origem`, coerente com
  `refresh_entregadores_agregado_incremental`. O payload agregado de Entregadores 2026 foi
  comparado antes da troca: 5.603 entregadores, `diff_rows = 0` e mesmas corridas completadas.
- Dois índices experimentais testados em `mv_corridas_agregadas`/incremental não trouxeram
  ganho real e foram removidos na mesma rodada para evitar bloat e novos avisos.
- O caminho anual de `listar_valores_entregadores` foi reavaliado com `EXPLAIN`: usa o índice
  covering `idx_mv_entregadores_agregado_org_data_cover_v4` e mediu ~624ms quente para 2026
  inteiro. Testes alternativos com overlay direto em incremental e chave normalizada ficaram
  piores (~916ms a ~3,1s), então não foi aplicado índice/view adicional sem ganho comprovado.
- As RPCs `resumo_semanal_drivers` e `resumo_semanal_pedidos` foram identificadas como gargalo
  real do Resumo Semanal: ~7,06s e ~8,26s para 2026 antes do ajuste, com temp spill. O primeiro
  ajuste aplicado foi `work_mem = 96MB` no nível das duas funções. Revalidação inicial: ~0,91s e
  ~1,59s, respectivamente, sem temp spill.
- Revalidação posterior mostrou que o planner ainda lia 450k-672k linhas anuais via índice simples
  de `ano_iso`. Foi criado o índice covering `idx_dados_corridas_resumo_semanal_v1`
  (`organization_id`, `ano_iso`, `semana_numero`, `id_da_pessoa_entregadora`) com `INCLUDE` das
  colunas usadas por slots/aderência. Tamanho: 311 MB. Plano confirmado com `Index Only Scan`;
  medições quentes após `VACUUM (ANALYZE)`: `resumo_semanal_drivers` ~343-351ms e
  `resumo_semanal_pedidos` ~485-494ms para 2026 inteiro.
- As transições internas foram ampliadas para UTR, Entregadores, Valores, Prioridade Promo,
  Marketing Dashboard, Resultados, Valores por Cidade e Resumo Semanal usando o primitive
  `ViewTransition`, com `AnimatePresence`, `transform-gpu` e respeito a `prefers-reduced-motion`.
- As RPCs otimizadas continuam `SECURITY DEFINER`, com `EXECUTE` apenas para `postgres` e
  `service_role`; o advisor de segurança permaneceu zerado depois das alterações.

## Estado seguro atual

- O acesso read-only via Management API foi validado com usuario de banco `postgres`.
- O token de gestao informado em 2026-05-29 tambem validou o projeto `ulmobmmlkevxswxpcyza` como `ACTIVE_HEALTHY` na regiao `sa-east-1`.
- A fila `public.mv_refresh_control` estava saudavel no momento da coleta: 15 registros, todos com `needs_refresh = false` e `refresh_in_progress = false`.
- Nenhuma funcao `SECURITY DEFINER` distinta estava executavel por `anon`.
- Foram encontrados 143 nomes distintos de funcoes `SECURITY DEFINER`.
- Dessas, 69 estavam executaveis por `authenticated` e 74 estavam privadas ou somente `service_role`.
- Nenhum `DROP`, `REVOKE`, `REINDEX`, alteracao de indice, alteracao de RPC ou escrita no banco foi executado nesta auditoria.

## Advisors oficiais Supabase

Coleta read-only via Management API em 2026-05-29.

### Security Advisor

- 69 avisos `WARN`, todos do tipo `Signed-In Users Can Execute SECURITY DEFINER Function`.
- 0 avisos equivalentes para `anon` no retorno do advisor.
- A recomendacao segura continua sendo migrar uma RPC por vez para rotas server-side quando ela nao precisar ser chamada diretamente pelo browser, e so depois revogar `EXECUTE` de `authenticated`.
- Nao foi aplicado `REVOKE` automatico nesta rodada porque varias funcoes avisadas ainda sao contratos ativos de Dashboard, Entregadores, Valores, DEDICADO, Marketing, Admin, Chat ou perfil.

### Performance Advisor

- 18 avisos no total.
- 17 avisos `Unused Index`, todos nivel `INFO`.
- 1 aviso `Auth DB Connection Strategy is not Percentage`, tambem nivel `INFO`.
- Os indices apontados incluem tabelas de chat, metas/tags de entregadores, gamificacao, apresentacoes e algumas MVs. Eles nao devem ser removidos em lote, porque podem ser caminhos raros, constraints funcionais ou suporte de features pouco acessadas.
- Candidatos reais para futura checagem com `EXPLAIN`: os indices de `mv_corridas_agregadas` e alguns indices pequenos de recursos secundarios. Nao ha ganho seguro suficiente para drop imediato.

## Maiores pesos no banco

| Relacao | Tipo | Total | Heap | Indices | Observacao |
| --- | --- | ---: | ---: | ---: | --- |
| `dados_corridas` | tabela | 3226 MB | 1202 MB | 2024 MB | Maior peso do banco; indices tem uso alto. |
| `mv_entregadores_agregado` | MV | 840 MB | 203 MB | 637 MB | Principal candidata para revisao cuidadosa de indices. |
| `mv_aderencia_agregada` | MV | 123 MB | 71 MB | 52 MB | Evitar novos indices sem `EXPLAIN`. |
| `mv_dashboard_resumo` | MV | 48 MB | 25 MB | 23 MB | Peso moderado. |
| `mv_corridas_agregadas` | MV | 48 MB | 25 MB | 23 MB | Sustenta Marketing Entrada/Saida. |

## Indices grandes

Nao remover nesta fase. Eles aparecem com uso real e sustentam refresh/RPCs importantes.

| Indice | Relacao | Tamanho | Uso observado |
| --- | --- | ---: | ---: |
| `idx_dados_corridas_dashboard_perf` | `dados_corridas` | 529 MB | 8143 scans |
| `idx_dados_corridas_entregador_semanal` | `dados_corridas` | 507 MB | 1134 scans |
| `idx_dados_corridas_resumo_semanal_v1` | `dados_corridas` | 311 MB | 15 scans no benchmark pós-criação |
| `idx_dados_corridas_agg_v3` | `dados_corridas` | 240 MB | 507248 scans |
| `idx_mv_entregadores_agregado_org_ano_cover_v4` | `mv_entregadores_agregado` | 213 MB | 677 scans |
| `idx_mv_entregadores_agregado_org_data_cover_v4` | `mv_entregadores_agregado` | 213 MB | 195 scans |

## Candidatos para fase de EXPLAIN, sem drop direto

Estes indices sao pequenos/medios ou tem baixo uso no snapshot. Ainda assim, nao devem ser removidos sem validar planos reais e dependencias de `REFRESH MATERIALIZED VIEW CONCURRENTLY`.

- `idx_mv_dashboard_aderencia_metricas_unique`: 11 MB, 0 scans. Provavelmente necessario como indice unico para refresh concorrente, entao nao remover sem confirmar.
- `idx_mv_corridas_agregadas_entregador_v3`: 1784 kB, 0 scans. Candidato real para `EXPLAIN`.
- `idx_mv_corridas_agregadas_org_v3`: 1264 kB, 0 scans. Candidato real para `EXPLAIN`.
- `tb_dashboard_resumo_pkey`: 3040 kB, 0 scans. Nao remover por ser PK.
- `tb_entregadores_agregado_incremental_pkey`: 1184 kB, 0 scans. Nao remover por ser PK.

Snapshot adicional de 2026-05-29:

- Indices publicos acima de 1 MB com `idx_scan = 0`: 5.
- Candidatos reais sem constraint/PK/unique funcional aparente: 2, ambos em `mv_corridas_agregadas`.
- Funcoes que referenciam `mv_corridas_agregadas`: `enqueue_mv_refresh`, `get_pending_mvs`, `mark_mv_refresh_needed`, `validate_corridas_agregadas_incremental`.
- Conclusao: nao ha ganho grande e seguro em remover indices agora. A proxima acao correta e `EXPLAIN` nos caminhos de Marketing Entrada/Saida antes de qualquer drop.

## Top gargalos por tempo total

| Consulta/funcao | Sinal observado | Acao recomendada |
| --- | --- | --- |
| `process_mv_refresh_queue_job` | maior tempo total historico | Manter refresh somente sob demanda; evitar cron permanente. |
| `process_incremental_refresh_impacts_job` | alto tempo total | Continuar dedupe e lote curto pos-upload. |
| `refresh_next_pending_mv` | alto volume durante refresh completo | Manter botao manual como caminho controlado. |
| `realtime.list_changes` | muitas chamadas | Ja reduzido no frontend pausando presenca/chat em aba oculta. |
| `listar_entregadores_v2` com `ano + praca` | media historica alta | Criar caminho paginado/resumido ou limitar ano inteiro sem busca. |
| `listar_valores_entregadores` anual | media historica alta | Aplicar mesma estrategia de paginacao/resumo. |
| `get_fluxo_semanal` | ainda relevante | Reescrita parcial aplicada; segue candidato a MV dedicada se cold start precisar ficar sub-500ms. |
| `list_pracas_disponiveis` | chamada repetida de filtros | Reescrita para tabelas base + índice leve por `praca`; mediu ~52ms. |
| `get_city_last_updates` | chamada repetida | Ja recebeu cache server-side curto. |
| `get_available_weeks` | chamada repetida por ano/organizacao | Reescrita para tabelas base; mediu ~15ms com `2026 + organizacao`. |

## Funcoes SECURITY DEFINER

Resumo de nomes distintos:

- `anon`: 0 executaveis.
- `authenticated`: 69 executaveis.
- privadas/service-only: 74.
- `SECURITY DEFINER` sem `search_path` fixo: 0 no snapshot read-only de 2026-05-29.

### Manter expostas por enquanto

Estas aparecem como RPC literal direta no codigo e devem ser tratadas como contrato ativo ate migracao para rota server-side:

- `dashboard_evolucao_bundle`
- `dashboard_resumo`
- `get_available_weeks`
- `get_city_last_updates`
- `get_current_user_profile`
- `get_dashboard_dimension_options`
- `get_entregador_detail`
- `get_gamification_leaderboard`
- `get_marketing_comparison_weekly`
- `get_marketing_resultados_data`
- `get_origens_by_praca`
- `get_subpracas_by_praca`
- `get_turnos_by_praca`
- `get_valores_cidade_resumo`
- `is_global_admin`
- `list_pracas_disponiveis`
- `listar_anos_disponiveis`
- `listar_todas_semanas`
- `register_interaction`
- `registrar_atividade`
- `resumo_semanal_drivers`
- `resumo_semanal_pedidos`
- `update_login_streak`

### Candidatas para tornar service-only

Estas estavam executaveis por `authenticated`, mas nao apareceram como RPC literal direta no codigo. Algumas sao chamadas dinamicamente por rotas server-side ou podem ser legado. Precisam de checagem por nome antes de revogar:

- `calcular_utr_completo`
- `dashboard_resumo_v2`
- `dashboard_evolucao_mensal`
- `dashboard_evolucao_semanal`
- `dashboard_utr_semanal`
- `listar_entregadores_v2`
- `listar_valores_entregadores`
- `listar_valores_entregadores_detalhado`
- `obter_resumo_valores_breakdown`
- `listar_dimensoes_dashboard`
- `listar_entregadores`
- `pesquisar_entregadores`
- `pesquisar_valores_entregadores`
- funcoes antigas de aderencia direta: `calcular_aderencia_por_*`, `calcular_aderencia_semanal`
- funcoes de monitoramento/admin legado: `top_usuarios_ativos`, `historico_atividades_usuario`, `estatisticas_atividade_periodo`, `distribuicao_*`

## Mudancas ja aplicadas no app

- Cache server-side curto para `list_pracas_disponiveis` na rota admin.
- Cache server-side curto para `get_city_last_updates`.
- Cache/dedupe client-side para `get_available_weeks` por ano e organizacao.
- Dedupe em voo para `get_fluxo_semanal` via `/api/marketing/fluxo`, incluindo detalhes de Entrada/Saida.
- Dedupe em voo para GETs internos (`getAppApiData`), reduzindo chamadas repetidas de perfil, organizacao e dados auxiliares no carregamento inicial.
- Chaves de dedupe dos POSTs internos agora usam stringify estavel, reaproveitando chamadas equivalentes mesmo quando a ordem das propriedades muda.
- Pausa de presenca/chat quando a aba do navegador fica oculta.
- Timer da sidebar de pessoas online so roda quando o painel esta aberto.
- `DEDICADO` deixou de disparar busca de entregadores quando a subguia ativa nao precisa disso.
- Limite de retry em tabs para evitar loading infinito em erro 500/rate limit.
- Cache curto e dedupe em voo para chamadas idênticas de `/api/dashboard/data`, `/api/app/secure-rpc` e `/api/dedicado/origens`, evitando requests duplicados durante troca de aba/render.
- RPCs de filtros do dashboard (`list_pracas_disponiveis`, `listar_anos_disponiveis`,
  `listar_todas_semanas`, `get_available_weeks`, `get_dashboard_dimension_options` e auxiliares
  por praça) foram otimizadas para reduzir latência fria antes mesmo do cache.
- `get_fluxo_semanal` e `vw_entregadores_agregado_current` receberam ajustes estruturais de banco
  para reduzir custo de troca nas subguias Marketing Entrada/Saída, Entregadores, Prioridade e
  Valores sem alterar payloads públicos.
- `resumo_semanal_drivers` e `resumo_semanal_pedidos` receberam `work_mem` local e um índice
  covering dedicado para reduzir o Resumo Semanal de vários segundos para aproximadamente
  350-500ms em cenário quente.
- Um primitive compartilhado `ViewTransition` foi adicionado ao app para padronizar transição entre
  skeleton, erro, vazio e conteúdo nas guias que ainda retornavam estados abruptos.
- Tabela de Entregadores ajustada para rolagem horizontal unica entre cabecalho e linhas, reduzindo desalinhamento/overflow em telas menores.
- Logs diretos de componentes ativos foram padronizados em `safeLog`, reduzindo ruido no console sem mudar comportamento.
- `react-window` e o prototipo nao utilizado `VirtualizedTable` foram removidos, reduzindo dependencia morta e codigo sem contrato ativo.
- `pg` foi removido porque nao havia uso direto no app nem nos scripts locais; os acessos ao banco usam Supabase client/API.
- Rotas locais `/login`, `/upload` e `/dashboard` responderam HTTP 200 no servidor de desenvolvimento em 2026-05-29.
- A validacao visual interativa pelo navegador interno nao ficou disponivel nesta sessao; por isso os ajustes visuais desta rodada foram validados por build, lint e auditoria estatica de responsividade/overflow.
- `xlsx` carregado de forma lazy/cacheada nas exportacoes de Marketing.
- `next/image remotePatterns` e `connect-src` restringidos ao host do projeto Supabase.
- Dependencias de build foram atualizadas em linha segura dentro do Next 14.

## Entregadores: por que os totais por ano nao somam

O total da opcao `Todos` e consolidado por `id_entregador`. Entao, se o mesmo entregador aparece em 2025 e 2026, ele conta uma vez em `Todos`, mas aparece nos dois totais anuais quando cada ano e filtrado isoladamente.

Exemplo observado na auditoria:

- 2025: cerca de 7400 entregadores.
- 2026: cerca de 5600 entregadores.
- Todos consolidado: cerca de 9869 entregadores.
- Intersecao aproximada entre 2025 e 2026: cerca de 3160 entregadores.

Portanto, o comportamento de `Todos` nao deve ser `2025 + 2026`; ele representa o conjunto unico consolidado.

## Proximos passos seguros

1. Criar rota server-side para RPCs ainda chamadas diretamente pelo browser e migrar uma por vez.
2. Depois da migracao, revogar `EXECUTE` de `authenticated` nas funcoes que virarem service-only.
3. Rodar `EXPLAIN (ANALYZE, BUFFERS)` nos caminhos:
   - `listar_entregadores_v2` com ano + praca;
   - `listar_valores_entregadores` com ano + praca;
   - `get_fluxo_semanal`;
   - indices candidatos de `mv_corridas_agregadas`.
4. So depois considerar remocao/recriacao de indices.
5. Planejar substituicao futura de `xlsx` e upgrade major de `jspdf`/Next em fase separada, porque os avisos restantes exigem mudancas potencialmente quebraveis.

## Auditoria ponta a ponta de carregamento — 2026-10-02

Esta coleta complementa os snapshots historicos acima. Os tempos de `edge_logs` cobrem o tempo de origem da chamada Supabase, nao o tempo completo de renderizacao no navegador. `pg_stat_statements` acumula desde 2026-06-27, entao seus totais sao historicos; usei os logs de 24 horas para comparar as chamadas mais recentes.

### Caminho de dados por guia

| Guia | Caminho de dados | Evidencia recente |
| --- | --- | --- |
| Dashboard | `dashboard_resumo` | 36 chamadas; mediana 572 ms, p95 1,73 s, maximo 2,02 s. |
| Analise | Reutiliza `dashboard_resumo`; nao faz uma segunda carga principal. | Mesmo perfil do Dashboard. |
| UTR | `calcular_utr_completo` via `/api/dashboard/data`. | 19 chamadas; mediana 413 ms, p95 1,02 s, maximo 1,11 s. |
| Entregadores | `/api/dashboard/data` chama `listar_entregadores_dashboard_fast_v1`; `listar_entregadores_v2` permanece como contrato compatível e despacha o caminho anual rápido. | 20 respostas 200; mediana 647 ms, p95 3,71 s, maximo 8,59 s. Houve tambem 2 respostas 500 associadas ao timeout anterior da RPC. |
| Prioridade Promo | Compartilha o fetch/cache de Entregadores. | Mesmo perfil e mesma limitação de cauda de Entregadores. |
| Valores | `listar_valores_entregadores`; tabela detalhada usa `listar_valores_entregadores_detalhado` paginada. A RPC de breakdown permanece no banco, mas nao tem consumidor ativo no frontend. | Uma chamada da RPC de resumo: 1,52 s; amostra insuficiente para percentis. |
| Evolucao | Usa `dashboard_evolucao_bundle_org_year_fast` no caso anual sem filtros; com filtros usa `dashboard_evolucao_bundle`. | Sem chamadas identificáveis nos logs de 24 h; caminho conferido no código. |
| Comparacao | Compara períodos chamando `dashboard_resumo` e UTR para as semanas selecionadas. | Sem chamadas identificáveis nos logs de 24 h; caminho conferido no código. |
| Marketing — Valores por Cidade | `get_valores_cidade_resumo`. | 2 chamadas; mediana 395 ms, p95 476 ms. |
| Marketing — Entrada/Saida | `/api/marketing/fluxo` chama `get_fluxo_semanal`; há dedupe em voo no cliente e rota server-side. | Sem chamada identificável nos logs de 24 h. |
| Marketing — Comparacao | `get_marketing_comparison_weekly`. | Sem chamada identificável nos logs de 24 h. |
| Dedicado | `/api/dedicado/origens` chama `dashboard_dedicado_origens_v2`; lista e ranking de entregadores carregam sob demanda pela subguia ativa. | Sem chamada identificável nos logs de 24 h. |

As guias sao carregadas sob demanda. Evolucao/Comparacao importam o runtime de graficos ao abrir a guia; Dedicado so busca os dados da subguia selecionada. Marketing tambem importa subguias ao abrir, passar o mouse ou focar os botoes.

### Marketing — Apresentação

- A subguia de configuração não consulta os conjuntos do relatório. Ao clicar em “Gerar”, abre `/apresentacao/marketing`, que busca cinco conjuntos em paralelo: cidades, evolução diária, comparação semanal geral, comparação de custos e comparação semanal por cidade.
- Não houve chamada identificável dessa página nos logs de 24 h; o caminho foi confirmado no código, então ainda falta medir o tempo total da renderização da apresentação.

### Filtros

- Anos e cidades começam em paralelo por `listar_anos_disponiveis` e `list_pracas_disponiveis`; semanas usam `get_available_weeks` por ano/organizacao.
- A rota `/api/app/secure-rpc` mantém cache por usuário, organização, função e parâmetros por 5 minutos, coalesce chamadas em voo e serve resposta stale por até 30 minutos para RPCs não detalhadas. Semanas também têm cache local de 5 minutos por organização/ano; as dimensões iniciais ficam na sessão por 1 hora, com chave por escopo do usuário.
- As opções de subpraça, origem e turno usam `get_dashboard_dimension_options` ao selecionar uma praça. As tres RPCs separadas só são usadas como fallback se a combinada falha.
- A RPC de semanas mediu 40 ms no Postgres e teve mediana de 403 ms / p95 de 456 ms na borda Supabase (23 chamadas). O restante do tempo está fora do plano SQL, então um índice novo não reduziria esse trecho.
- `listar_anos_disponiveis` mediu 74 ms / 13.951 buffers no plano atual. A alternativa de uma varredura completa mediu 87 ms; mantive a implementação existente e não criei índice de ano sem ganho demonstrado.
- Antes desta rodada, `list_pracas_disponiveis` mediu 135 ms e derramou 268/269 páginas temporárias. A função foi reescrita para deduplicar cada fonte antes do `UNION`. Duas medições controladas da RPC atual deram 59–61 ms, 10 resultados e sem mudança de contrato. Não foi criado índice novo.
- Quando o cache de dimensões da sessão está válido (1 hora), o hook não dispara mais uma RPC de anos em segundo plano a cada remontagem. A atualização remota volta quando o cache expira.
- Antes da reescrita, `list_pracas_disponiveis` teve mediana de 445 ms e p95 de 1,55 s na borda, com 12 chamadas. Ainda é necessário comparar a latência HTTP depois desta mudança; o benchmark desta rodada mediu o SQL.

### Indices e banco

- O schema `public` tem 162 índices; `dados_corridas` ocupa aproximadamente 7,5 GB, e `mv_entregadores_agregado` aproximadamente 3,8 GB. Há índices grandes com uso alto, então não removi nem acrescentei índices de cobertura sem plano e ganho medidos.
- O advisor listava 11 índices sem scans; um deles era `idx_dados_corridas_incremental_refresh`, inválido, não pronto e com 0 bytes. Removi somente esse índice quebrado, sem constraint e sem uso possível. O advisor passou a listar 10 candidatos em tabelas secundárias.
- A reescrita de `list_pracas_disponiveis` preserva `SECURITY DEFINER`, `search_path` fixo e execução somente por `service_role`; `anon` e `authenticated` continuam sem `EXECUTE`.
- Os advisors de segurança ainda retornam 5 funções com `search_path` mutável e 4 funções `SECURITY DEFINER` executáveis por `authenticated` (`get_my_organization_id`, `get_user_organization_id`, `is_global_admin`, `is_org_admin`). Não alterei essas funções nesta rodada de desempenho; são itens separados para auditoria de autorização e dependências.

### Trabalho aplicado e limites da medição

- Migração aplicada no Supabase: `dashboard_filter_options_performance_20261002`.
- O caminho do Dashboard Geral foi inspecionado desde os hooks até `/api/dashboard/data` e `/api/app/secure-rpc`, incluindo cache, dedupe, escopo de organização e carregamento sob demanda.
- Esta sessão não tinha um servidor local ativo nem uma sessão autenticada do navegador. Portanto, as métricas por guia são de chamadas observadas nos logs Supabase; para Evolucao, Comparacao, Marketing Entrada/Saida/Apresentação/Comparacao e Dedicado, a análise do caminho foi estática e não há amostra de 24 h para publicar percentis.
- A amostra de Entregadores agrega chamadas 200 da janela de 24 h, sem segmentação temporal precisa em torno da ativação da RPC rápida/fachada compatível. Ela não deve ser lida como benchmark exclusivamente posterior à mudança; as duas respostas 500 ainda aparecem na janela e são compatíveis com o timeout anterior.
- Próxima medição end-to-end deve capturar, por guia, duração do primeiro request, duração até os filtros estarem utilizáveis, tamanho do payload e tempo até os gráficos/tabela renderizarem. Em especial, a cauda de Entregadores e o fan-out por praça no Dashboard para usuários com várias praças ainda merecem profiling com uma sessão autenticada.

## Rechecagem e correções adicionais — 2026-10-02 BRT (2026-10-03 UTC)

### Latência observada na API Supabase — janela móvel de 24 h

Os tempos abaixo são `response.origin_time` de chamadas bem-sucedidas. Não representam o carregamento completo da página nem incluem o tempo de renderização no browser.

| RPC | Respostas 200 | p50 | p95 | Máximo |
| --- | ---: | ---: | ---: | ---: |
| `dashboard_resumo` | 40 | 591 ms | 1.726 ms | 2.019 ms |
| `listar_anos_disponiveis` | 38 | 441 ms | 1.146 ms | 2.388 ms |
| `get_available_weeks` | 27 | 403 ms | 451 ms | 572 ms |
| `listar_entregadores_v2` | 21 | 652 ms | 5.115 ms | 8.586 ms |
| `calcular_utr_completo` | 20 | 420 ms | 1.012 ms | 1.108 ms |
| `get_city_last_updates` | 16 | 407 ms | 887 ms | 1.133 ms |
| `list_pracas_disponiveis` | 12 | 533 ms | 1.720 ms | 1.849 ms |
| `listar_todas_semanas` | 6 | 445 ms | 1.550 ms | 1.915 ms |
| `listar_valores_entregadores` | 3 | 4.050 ms | 6.499 ms | 6.771 ms |
| `get_valores_cidade_resumo` | 2 | 396 ms | 617 ms | 642 ms |
| `dashboard_evolucao_bundle_org_year_fast` | 1 | 1.646 ms | — | 1.646 ms |

Também houve 3 respostas HTTP 500 de `listar_entregadores_v2`, com p50 de 8.157 ms e máximo de 8.382 ms, associadas a timeout SQLSTATE `57014`. A leitura do contexto do Postgres identificou dois timeouts no corpo legado e um timeout posterior na fachada nova, já dentro de `listar_entregadores_dashboard_fast_v1`. Portanto, a fachada reduziu o custo de alguns caminhos, mas ainda não elimina a cauda de latência anual. As chamadas de Evolução, Comparação, Marketing Entrada/Saída/Comparação e DEDICADO não tiveram amostra identificável nesta janela.

### Índices e estatísticas

- Removi `idx_organizations_slug` e `idx_user_profiles_id`, duplicados exatos das chaves únicas `organizations_slug_key` e `user_profiles_pkey`. Cada índice tinha 16 KiB; o plano após a remoção usa as chaves únicas equivalentes. Não há medição de ganho percentual de latência.
- Os índices da `mv_entregadores_agregado` somam aproximadamente 3.404 MB sobre 429 MB de heap, segundo `pg_size_pretty`. Todos os índices grandes inspecionados tinham scans registrados; não foram removidos por alertas de “unused”.
- A MV tinha cerca de 1,03 milhão de linhas estimadas e zero linhas mortas, mas as estatísticas estavam sem `ANALYZE` desde junho. Executei `ANALYZE public.mv_entregadores_agregado`; a última análise agora consta como 2026-10-03 00:53 UTC. Ainda não há comparação controlada de latência antes/depois dessa atualização.
- `dados_corridas` contém cerca de 3,44 milhões de linhas estimadas e 80,6 mil linhas mortas (aproximadamente 2,3%); último autovacuum em 2026-05-27 e último autoanalyze em 2026-09-28. Não executei vacuum manual.
- O advisor ainda aponta 10 índices auxiliares sem scans e a configuração de conexões do Auth. Os 5 avisos de `search_path` mutável e 4 RPCs `SECURITY DEFINER` continuam sob revisão; não revoguei permissões sem mapear as dependências em RLS e nos callers.

### Mudanças de estado de carregamento e Excel

- Os hooks de tabs, Evolução, Comparação, DEDICADO, Marketing, Resultados, Valores e semanas de filtro agora derivam o estado pendente da combinação atual de organização e filtros. Isso evita um frame inicial de estado vazio e oculta imediatamente dados de outra organização; nas telas que mantêm a resposta anterior da mesma organização, a atualização fica sinalizada.
- Marketing Entrada/Saída passou a associar os dados à chave exata de período/praça e usa datas locais no intervalo padrão, evitando deslocamento de um dia perto da meia-noite UTC. Estados de erro e de resultado realmente vazio não exibem mais cards zerados como se fossem dados válidos.
- A biblioteca Excel é carregada sob demanda em todos os exports. O comparativo deixou de importar o pacote no carregamento inicial.
- O export de Marketing/Operacional agora usa `get_entregadores_details`, aplica o tipo correto e percorre páginas até o `total_count`. O export anterior consultava fatos crus sem paginação e podia ultrapassar o limite de linhas da API, além de não separar Marketing de Operacional.
- A exportação passa pela rota autenticada `/api/app/secure-rpc`: a rota restringe a RPC a usuários com acesso integral às praças, aplica o escopo de organização e usa `service_role`; no ACL do banco, `get_entregadores_details` não concede `EXECUTE` a `anon` nem a `authenticated`. Falhas de exportação agora também exibem uma mensagem ao usuário em vez de aparecerem somente no console.
- O export principal de Entregadores continua gerando o arquivo com os dados já disponíveis se a busca auxiliar de primeira aparição falhar, usando o campo de fallback da linha.
- A paginação de Valores na UI é client-side sobre o conjunto já carregado. A antiga paginação RPC de `useValoresServerData` não era chamada por nenhum botão; removi esse caminho inativo para evitar uma segunda lógica de consulta.

### Ganhos medidos e limites

As medições controladas já registradas para consultas/RPCs foram: Evolução 1.801 → 418 ms (**76,8%**); filtro semanal de Entregadores 1.311 → 126 ms (**90,4%**); Valores por ano/semana 1.434 → 85 ms (**94,1%**); filtro de cidade 134,9 → 59–61 ms (**54,8%–56,3%**); consulta anual de Entregadores antes do JSON 22,6 → 2,3 s (**89,8%**). Esses números não equivalem a percentuais de carregamento total das páginas. As correções de estado de loading e exports desta rechecagem ainda não têm benchmark end-to-end nem estão comprovadas como implantadas em produção.

## Continuação da auditoria — 2026-10-02 BRT (2026-10-03 UTC)

### Precisão das medições

- Os percentuais acima são reduções controladas do tempo de consulta/RPC nas condições descritas; eles não medem o tempo total até a tela estar utilizável.
- A janela recente de 24 h continua sendo apenas uma fotografia de latência da API. Não há pareamento suficiente por tela, filtros, organização e versão implantada para calcular um percentual do carregamento end-to-end.
- `pg_stat_statements` foi reiniciado em 2026-06-27 e mistura benchmarks, chamadas e versões distintas. Não usei suas médias acumuladas como comparação antes/depois.
- A interface observa `listar_entregadores_v2`; a função pública compatível pode encaminhar internamente a RPC rápida. A ausência de chamadas diretas com o nome interno nos logs não prova que o fast path deixou de ser usado.

### Atualização de estatísticas do planner

Depois de confirmar que não havia refresh ativo, executei `ANALYZE` em `public.mv_dashboard_resumo`, `public.mv_aderencia_agregada` e `public.tb_entregadores_agregado_incremental`. O banco confirmou as três análises em 2026-10-03 01:35 UTC; `n_mod_since_analyze` passou a zero. A `mv_entregadores_agregado` já tinha sido analisada em 2026-10-03 00:53 UTC na etapa anterior. Ainda não há comparação de latência após as análises, então não atribuí ganho percentual.

### Correções de carregamento, filtros e exportação

- `dashboard_resumo` agora descarta respostas antigas quando uma requisição de filtro mais recente já começou; o loading/error segue a chave de filtro atual e os dados ficam ocultos na troca de organização.
- As opções de dimensões ficam escopadas à organização/usuário atual. A lista de semanas mostra carregamento, permite nova tentativa após erro e a troca do ano limpa as semanas escolhidas do ano anterior.
- Estados de falha em UTR e Prioridade agora mostram ação para tentar novamente. Erros antigos de tabs e Comparação não aparecem por um frame nos novos filtros.
- A subguia de comparação limpa semanas ao mudar o ano e mostra loading/erro/retry na lista de semanas. DEDICADO repassa retry nas subguias de origens, entregadores e ranking; falhas com dados antigos preservam a resposta anterior com aviso.
- Marketing Entrada/Saída mantém cache vencido da mesma chave visível enquanto revalida e mostra um aviso claro quando a atualização falha.
- Os exports de Entrada/Saída, DEDICADO, Valores, UTR, Prioridade e Análise agora dão retorno visível de erro/progresso. DEDICADO interrompe o export quando o total informado pela RPC excede a lista recebida, evitando gerar silenciosamente um arquivo parcial.
- O export de Análise inclui dia e dia ISO em `Dia x Origem`; a planilha de Valores formata `Taxa Media` como moeda.
- Removi `useMarketingData` e os exports de Resultados e Dashboard após buscas completas no repositório confirmarem que não tinham consumidores.

### Verificação

- `npm run build` concluiu com sucesso após essas mudanças, incluindo lint e verificação de tipos.
- Não rodei benchmarks de interface autenticada nesta rodada; portanto, os tempos completos de cada guia ainda precisam de comparação em uma sessão autenticada depois de a versão de produção correspondente estar ativa.

## Continuação da auditoria — 2026-10-03 UTC

### Entregadores anual: causa residual de timeout

- O timeout de 2026-10-02 23:58 UTC passou pela fachada `listar_entregadores_v2` e ocorreu dentro de `listar_entregadores_dashboard_fast_v1` (linha 72 do SQL da RPC). Assim, esse erro não veio do fallback legado; a implementação rápida ainda pode ultrapassar o limite do PostgREST quando o banco lê o ano a frio.
- A MV tem aproximadamente 1,03 milhão de linhas e 429 MB de heap; a tabela incremental tem 363.328 linhas e 78 MB. Para o ano completo de 2026 na organização usada no benchmark, a consulta atual combina 575.592 linhas e retorna 8.671 entregadores distintos.
- O plano da consulta atual usa o índice covering por organização/data, mas o anti-join `Merge Anti Join` compara os escopos por data e testa praça, subpraça e origem como filtro. No plano executado, isso descartou 3.407.818 combinações no filtro de join. A medição quente completa foi 1.907 ms, com spill temporário de aproximadamente 1,7 MiB; a chamada fria anterior alcançou o timeout de 8 s.
- Avaliei um plano alternativo de `Hash Anti Join` com chave JSONB que preserva diferenças entre `NULL` e string vazia. Ele removeu o filtro de milhões de combinações, mas as execuções quentes ficaram entre 2.194 e 2.375 ms, sem evidência de ganho sobre o plano atual. Com 64 MB de `work_mem`, o spill desapareceu, mas a execução continuou em 2.375 ms e usou cerca de 65 MB para o hash. Não apliquei essa alteração nem criei índice novo.
- Próximo caminho com potencial real: manter um resumo anual/pré-agregado por entregador, ou paginar a lista e separar o carregamento de ranking/exportação. Isso reduz o trabalho e o payload iniciais; requer preservar a substituição de escopos incrementais e validar a atualização do resumo antes de virar migração.

### Correções locais confirmadas nesta retomada

- Reproduzi uma tela totalmente escura quando `prefers-reduced-motion` estava ativo: `ViewContainer` ficava com `opacity: 0` depois que a preferência era resolvida. A animação agora começa invisível somente quando pode animar e sempre tem alvo visível; a captura local confirmou opacidade 1.
- A largura das colunas Excel agora é calculada em loop e limitada a 58 caracteres (46 na comparação), sem espalhar todos os valores como argumentos de `Math.max`. Isso evita erro de limite de argumentos e reduz alocação temporária em exports grandes.
- `fetchEntregadoresDetails` valida `total_count` antes de aceitar a primeira página do export; o export também interrompe quando o total muda entre páginas ou a API deixa uma página vazia antes do fim.
- Nenhum DDL persistente ficou aplicado nesta retomada: a candidata anual foi implantada para medir e revertida após não demonstrar ganho na RPC real. Não removi índices por contagem zero nem aumentei `work_mem` em produção.
- `npm run build` concluiu com sucesso depois dessas correções; `git diff --check` não encontrou erros de whitespace. O build reportou 247 kB de First Load JS para `/dashboard`, mas não há build anterior comparável para converter isso em redução percentual.

### Reavaliação da consulta anual de Entregadores — 2026-10-03 UTC

- Testei uma variante que agrega separadamente a MV e a tabela incremental por entregador antes de unir as fontes. A igualdade foi conferida por todos os campos para o ano inteiro (8.671 linhas), praça São Paulo (4.479) e subpraça Itaim/Brooklin/Indianópolis (1.785); não houve linha ausente, extra ou divergente. O formato, total e tamanho interno do JSONB também coincidiram.
- Como SQL isolado, a variante pareceu cair de 1.695 ms para 1.517 ms de mediana. Depois de substituir a função, porém, três chamadas pela RPC real ficaram entre 1.659 e 1.771 ms (mediana 1.712 ms), contra baseline de 1.695 ms. Esse resultado não demonstra ganho; a tentativa foi revertida pela migração `rollback_entregadores_preaggregate_by_driver_20261003`, restaurando a definição em `docs/sql/2026-10-02-entregadores-fast-year-and-filter-rpc.sql`.
- Não conto a diferença de 10,5% da consulta isolada como melhoria entregue. A chamada real voltou a medir 1.701 ms após o rollback, com o mesmo total de 8.671 linhas e 3.150.644 bytes segundo `pg_column_size` do JSONB. Esse valor mede o objeto interno no Postgres, não o tamanho HTTP no fio.
- A oportunidade que permanece é reduzir o conjunto inicial entregue à tela. Hoje o endpoint retorna os 8.671 registros, enquanto a tabela mostra 24 por página e ordenação, busca e estatísticas percorrem os dados no cliente. Uma solução de paginação no servidor precisaria fornecer estatísticas globais e preservar exportação completa, ordenação, busca, estado dos filtros e os perfis; ainda não foi implementada nem medida no navegador autenticado.

## Fechamento da revisão de carregamento e exportações — 2026-10-03

### Amostra mais recente de chamadas Supabase

Snapshot dos logs de API das últimas 24 horas consultado aproximadamente às 02:57 UTC. `origin_time` mede a chamada na borda Supabase; não inclui a transferência completa, React, desenho dos gráficos nem o tempo até a tela estar utilizável.

| RPC | Chamadas | p50 | p95 | Máximo |
| --- | ---: | ---: | ---: | ---: |
| `dashboard_resumo` | 40 | 591 ms | 1.726 ms | 2.019 ms |
| `calcular_utr_completo` | 22 | 426 ms | 991 ms | 1.108 ms |
| `listar_entregadores_v2` — HTTP 200 | 24 | 736 ms | 5.136 ms | 8.586 ms |
| `listar_entregadores_v2` — HTTP 500 | 3 | 8.157 ms | 8.360 ms | 8.382 ms |
| `listar_valores_entregadores` | 4 | 3.844 ms | 6.363 ms | 6.771 ms |
| `listar_anos_disponiveis` | 38 | 441 ms | 1.185 ms | 2.388 ms |
| `get_available_weeks` | 26 | 222 ms | 452 ms | 572 ms |
| `get_city_last_updates` | 15 | 408 ms | 903 ms | 1.133 ms |
| `list_pracas_disponiveis` | 12 | 580 ms | 1.561 ms | 1.615 ms |
| `listar_todas_semanas` | 5 | 453 ms | 1.623 ms | 1.915 ms |
| `get_valores_cidade_resumo` | 2 | 396 ms | 617 ms | 642 ms |
| `dashboard_evolucao_bundle_org_year_fast` | 1 | 1.646 ms | — | 1.646 ms |

As amostras de Valores e Evolução são pequenas; não sustentam uma previsão de latência estável. As respostas 500 de Entregadores confirmam que a cauda anual continua sendo o principal gargalo medido. Nenhum percentual acima deve ser apresentado como ganho de carregamento da página.

### Rechecagem do catálogo e dos advisors às 03:16 UTC

- O `stats_reset` de `pg_stat_statements` continua em 2026-06-27 19:17 UTC; as médias dessa view misturam benchmarks, chamadas e versões distintas.
- `dados_corridas`: cerca de 3,44 milhões de linhas vivas e 80,6 mil mortas (2,3%); ultimo autovacuum em 2026-05-27 e ultimo autoanalyze em 2026-09-28. Não executei vacuum manual.
- `mv_entregadores_agregado`: 1.028.115 linhas vivas, sem linhas mortas, analisada em 2026-10-03 00:53 UTC.
- `mv_aderencia_agregada` e `mv_dashboard_resumo`: analisadas em 2026-10-03 01:35 UTC, sem linhas mortas.
- `tb_entregadores_agregado_incremental`: 363.328 linhas vivas e 2.528 mortas; analisada em 2026-10-03 01:35 UTC.
- `tb_dashboard_resumo_incremental`: 53.500 linhas vivas e 412 mortas; autovacuum/analyze em 2026-09-28.
- A consulta de índices não encontrou definições duplicadas exatas. Mantive os índices grandes que têm uso registrado; os 10 avisos INFO do advisor são em recursos auxiliares de chat, tags, histórico, gamificação e apresentações, não nas tabelas centrais de corridas/entregadores. Não os removi só por `idx_scan = 0`.
- O advisor também continua mostrando 5 funções com `search_path` mutável e 4 auxiliares `SECURITY DEFINER` executáveis por `authenticated`. Não alterei ACL nem search_path sem mapear cada dependência e caller. Referências: [índices sem uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), [search_path mutável](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [SECURITY DEFINER executável por usuário autenticado](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Rechecagem de erros de carregamento — 2026-10-03 04:56 UTC

### Login e validação do perfil

- A conta mostrada na captura existe em `auth.users`, tem linha correspondente em `user_profiles`, está aprovada e tem organização associada. A política de leitura permite ao usuário ler o próprio perfil. Não alterei permissões nem dados.
- `useLogin` descartava a sessão retornada por `signInWithPassword`; a validação seguinte relia a sessão do storage para montar o cabeçalho. Agora o token recém-emitido é encaminhado diretamente à rota do perfil, sem cache nesta consulta. Isso reduz a dependência do instante em que a sessão é persistida no navegador.
- A captura ainda não foi revalidada com uma sessão real depois da alteração. O ambiente não expõe a sessão autenticada do navegador; a senha não foi solicitada nem usada.

### Respostas vazias e código inativo

- Em busca de Entregadores com 3 ou mais caracteres, uma falha 500/timeout depois do fallback era convertida em lista vazia sem erro. Agora a falha permanece explícita; se já havia linhas do mesmo escopo de acesso, a tela as mantém identificadas como resposta anterior e oferece nova tentativa.
- Entregadores, DEDICADO, Valores, Valores detalhados e UTR agora tratam resposta `null` ou formato JSON inesperado como erro de carga. Arrays vazios e objetos com listas vazias continuam sendo resultados válidos.
- A tela de Valores sempre pede `detailed: false`, então o hook de breakdown nunca carregava dados, e nenhum consumidor lia seu resultado. Removi o hook, fetcher, tipo e modo API sem uso. Mantive a RPC `obter_resumo_valores_breakdown` no banco, pois um consumidor externo não foi descartado por esta análise.
- Reconfirmei os nove escritores de XLSX e os gates de exportação das guias. Detalhes Marketing/Operacional percorrem todas as páginas e conferem o total antes de salvar; exportações principais ficam bloqueadas durante atualização ou erro.

### Estatísticas atuais do banco

Snapshot read-only consultado às 04:48 UTC. `pg_stat_user_tables` informa contagens aproximadas e, por si só, não justifica vacuum manual:

- `dados_corridas`: 3.439.996 linhas vivas, 80.587 mortas, 34.873 modificações desde análise; último autovacuum em 2026-05-27 e autoanalyze em 2026-09-28.
- `tb_corridas_agregadas_incremental`: 66.451 vivas, 10.363 mortas (15,6%), 3.810 modificações desde análise; autoanalyze/autovacuum em 2026-09-28.
- `tb_dashboard_resumo`: 137.463 vivas, zero mortas ou modificações desde a análise; análise em 2026-06-30.
- `tb_entregadores_agregado_incremental`: 363.328 vivas, 2.528 mortas, zero modificações desde análise; análise em 2026-10-03 01:35 UTC.
- A leitura de advisors e scans não apontou novo índice central para adicionar/remover. Mantive as recomendações `INFO` auxiliares e os avisos de segurança sem alterações de ACL.

`npx tsc --noEmit` e `npm run build` passaram; a página `/login` respondeu HTTP 200 e `/api/app/current-user-profile` respondeu HTTP 401 sem sessão, como esperado. `git diff --check` terminou limpo. A rota ainda precisa ser repetida com a sessão real do usuário para confirmar o fluxo de login; a medição de tempo tela-a-tela também segue pendente, então não atribuo percentual de carregamento a estas mudanças.

### Correções locais da revisão final

- A comparação só permite abrir a apresentação quando as duas semanas terminaram de carregar sem erro; a apresentação também não fica montada durante uma atualização de filtro. Isso evita exportar períodos novos com os dados antigos ainda visíveis.
- Valores, UTR, Análise, Entregadores e Prioridade desabilitam o Excel enquanto a resposta está atualizando, falhou ou a busca adiada ainda não terminou. A busca de Prioridade agora usa `useDeferredValue` e informa corretamente o estado pendente.
- Entregadores e Prioridade mantêm skeleton durante um novo filtro se a resposta anterior tinha zero linhas, em vez de mostrar um vazio falso enquanto a requisição ainda está pendente.
- A exportação DEDICADO agora falha claramente se faltar o resumo, alguma planilha esperada ou se o total de entregadores não coincidir exatamente com as linhas recebidas. Marketing valida semana/período e compara o número final de linhas com o total contado após percorrer todas as páginas.
- Removi o estado intermediário redundante de Valores e um seletor CSS de ticker sem consumidor. O ticker real continua em `animate-marquee` e o indicador continua usando `animate-city-updates-spin`.
- A página de smoke espera o registro do Chart.js antes de oferecer gráficos; removi o hook de registro duplicado da comparação e a página de comparação de smoke voltou a renderizar no navegador.
- As chaves de cache e deduplicação no cliente agora incluem usuário, organização, função e praças atribuídas. A guia DEDICADO aplica esse escopo também ao resumo, à lista, ao detalhe e ao Excel, e oculta imediatamente dados carregados sob um escopo de acesso anterior. O cache continua reaproveitável para o mesmo usuário e filtros.

Essas alterações de frontend ainda são locais. O build final de produção passou com lint e verificação de tipos; `/dashboard` reportou 247 kB de First Load JS e `/visual-smoke` 273 kB. No smoke visual do artefato, a comparação e o gráfico renderizaram após selecionar “Gráfico”. Também fiz round-trip de uma pasta XLSX sintética usando o helper compartilhado: nomes de abas sanitizados, cabeçalhos, números e autofiltro foram preservados. `git diff --check` terminou sem erros de whitespace. Ainda falta um benchmark autenticado de página inteira para calcular qualquer ganho end-to-end; os tamanhos acima não têm build anterior pareado para comparação percentual. Nenhum DDL de performance ficou aplicado nessa rodada.

## Continuação — 2026-10-03: paginação de Marketing, filtros e diagnóstico de login

- A consulta semanal de `dados_marketing` retornou contagem exata de 17.685 linhas no intervalo consultado para todas as organizações; `dados_valores_cidade` retornou 1.162. O PostgREST limita cada resposta a 1.000 linhas, então as leituras antigas podiam produzir comparações e custos incompletos sem erro explícito. Os novos fetchers percorrem páginas até a contagem exata e agregam os dados semanais geral e por cidade a partir da mesma leitura. A contagem observada é global, não representa o volume de uma organização específica.
- A evolução diária e os custos da apresentação agora também percorrem todas as páginas, validam contagem e resposta e falham de modo visível. A página não monta slides com dados parciais quando alguma consulta falha. Não há benchmark de apresentação autenticada, então não atribuo redução percentual.
- Opções de anos/praças e dimensões de filtro não são mais gravadas como cache vazio quando a consulta falha. O dashboard mostra carregamento/erro e oferece retry, preservando cache do mesmo escopo enquanto revalida. A busca de dimensões usa uma única RPC de praças em vez de duplicar a consulta.
- Na Administração, falhas parciais de usuários, pendentes ou praças agora aparecem como erro; os últimos dados carregados permanecem visíveis. Removi o fallback direto a `dados_corridas` limitado a 500 linhas, que podia apresentar uma lista de praças incompleta como se fosse completa. Se as fontes de RPC falharem, a operação agora retorna erro explícito.
- Após login, o Supabase Auth havia respondido HTTP 200 nos logs consultados, mas isso não comprova que a chamada seguinte ao perfil funcionou. A rota agora diferencia falha da consulta do perfil (`PROFILE_QUERY_FAILED`) de perfil ausente, registra o erro no servidor e devolve diagnóstico seguro. A tela mostra a mensagem da API em vez do alerta genérico. A causa do alerta da captura ainda depende de uma nova tentativa autenticada e do código/mensagem exibido; não usei nem pedi a senha.
- `get_entregadores_first_seen_v1` é uma RPC `SECURITY INVOKER`, com `search_path` vazio e execução concedida só a `service_role`. Ela faz busca indexada em lote no índice existente por entregador/data. O teste read-only retornou datas para os 20 IDs amostrados; o SQL está registrado em `docs/sql/2026-10-03-entregadores-first-seen-batch.sql`.
- Percentuais disponíveis continuam limitados aos benchmarks RPC já registrados acima. Paginação, tratamento de erro e cache de filtros ainda não têm comparação pareada de carregamento de página inteira.

### Fechamento desta rodada — login, estados de carregamento e planilhas

- O login mantém a sessão Supabase após a autenticação e permite tentar novamente a validação do perfil usando a sessão existente, sem pedir a senha outra vez. O painel continua bloqueado até que o perfil seja consultado e aprovado; perfil ausente ou erro de consulta não libera navegação.
- A verificação local sem credenciais retornou HTTP 200 em `/login` e HTTP 401 em `/api/app/current-user-profile`, comportamento esperado para uma rota de perfil sem sessão. Isso não comprova um login autenticado nem identifica a causa do erro da captura.
- A configuração local não contém `SUPABASE_SERVICE_ROLE_KEY`. Em consultas agregadas read-only, havia 78 usuários de autenticação e 55 linhas em `user_profiles` (23 sem correspondência); esse total não identifica a conta da captura. Uma chave de servidor ausente impede provisionar perfis ausentes e afeta rotas protegidas que dependem dela, mas não prova que tenha causado a falha de leitura do perfil existente.
- Respostas nulas ou malformadas de dashboard, dimensões, organizações, Valores por Cidade, Comparação do Marketing e apresentações agora geram erro visível em vez de sucesso vazio. Falhas de atualização mantêm dados anteriores do mesmo escopo e as telas afetadas oferecem nova tentativa.
- A entrada duplicada de animação entre o contêiner de guia e a transição de visualização foi removida; a preferência por movimento reduzido é respeitada. O ticker de cidades e datas continua ativo no comportamento normal.
- O limite de linhas por planilha é validado antes de gravar. O export de Marketing confere páginas repetidas/vazias, estabilidade do total e igualdade entre o total esperado e as linhas recebidas; o export UTR escolhe a seção de dados preenchida quando há aliases.
- O conjunto legado isolado de Resultados, sem importadores ativos, foi removido. `npx tsc --noEmit`, `npm run build` e `git diff --check` passaram nesta rodada. O servidor local está disponível na porta 3000.
- Não houve nova alteração de índice ou RPC persistente nesta rodada. Permanecem válidos os limites de medição descritos acima: os percentuais são de RPCs específicas, não de carregamento completo das páginas; a validação de login autenticado ainda depende da sessão do usuário no navegador.

## Atualização da auditoria — 2026-10-03 06:25 UTC

### Latência da API na janela móvel mais recente

`response.origin_time` nos logs de borda mede o tempo da chamada no Supabase, não o download completo, o processamento React ou a tela pronta no navegador.

| RPC | HTTP | Chamadas | p50 | p95 | Máximo |
| --- | ---: | ---: | ---: | ---: | ---: |
| `dashboard_resumo` | 200 | 37 | 577 ms | 1.752 ms | 2.019 ms |
| `listar_anos_disponiveis` | 200 | 35 | 441 ms | 1.709 ms | 2.388 ms |
| `listar_entregadores_v2` | 200 | 25 | 700 ms | 5.140 ms | 8.586 ms |
| `listar_entregadores_v2` | 500 | 3 | 8.157 ms | 8.382 ms | 8.382 ms |
| `calcular_utr_completo` | 200 | 22 | 427 ms | 1.007 ms | 1.108 ms |
| `get_city_last_updates` | 200 | 15 | 432 ms | 1.133 ms | 1.133 ms |
| `list_pracas_disponiveis` | 200 | 12 | 626 ms | 1.615 ms | 1.615 ms |
| `get_available_weeks` | 200 | 25 | 400 ms | 572 ms | 1.085 ms |
| `listar_todas_semanas` | 200 | 6 | 454 ms | 1.915 ms | 1.915 ms |
| `listar_valores_entregadores` | 200 | 4 | 4.050 ms | 6.771 ms | 6.771 ms |
| `get_gamification_leaderboard` | 200 | 23 | 398 ms | 485 ms | 2.644 ms |

As três respostas 500 de Entregadores coincidem em horário com cancelamentos do Postgres `SQLSTATE 57014`, cerca de oito segundos após cada requisição. Isso é consistente com timeout/cancelamento da consulta, mas não identifica sozinho se o limite veio do PostgREST ou de outra camada. `listar_valores_entregadores` tem só quatro observações; não é uma amostra estável.

Nos logs dessa janela ainda aparecem chamadas diretas de `listar_entregadores_v2`. A rota rápida por `service_role` que existe no código local não aparece como chamada distinta nesses registros; não atribuo a ela uma melhoria observada em produção.

### Banco, índices e atualização das MVs

- Os índices centrais grandes continuam com scans registrados, inclusive os de `dados_corridas` e `mv_entregadores_agregado`. O banco está em aproximadamente 13 GB; não removi índices centrais por sobreposição aparente nem usei avisos auxiliares de `idx_scan = 0` como prova suficiente de inutilidade.
- `pg_stat_statements` continua cumulativo desde 2026-06-27. `process_incremental_refresh_impacts_job()` registra 230 chamadas com média histórica de 30 s; `refresh_mv_entregadores_marketing()` registra 13 com média de 128 s. Esses totais misturam versões e períodos e não demonstram trabalho ativo de fundo hoje.
- `cron.job` estava vazio na leitura atual. `mv_refresh_control` tinha 11 MVs marcadas `needs_refresh=true`, sem refresh em andamento. Não iniciei atualização completa em produção.
- `mv_refresh_impacts` tem 15.600 linhas com `aderencia_agregada_processed_at IS NULL`; a mais antiga foi atualizada em 2026-05-05 e nenhuma dessas linhas mudou nas últimas 24 h. A busca no código não encontrou consumidor do campo de fila no frontend; no banco, o processador incremental examinado trabalha com outros campos, enquanto `refresh_mv_aderencia`, `get_admin_stats` e uma variante otimizada de praças citam a MV. Não há dependência de view registrada em `pg_depend`. O backlog pode ser legado ou afetar caminhos administrativos/manuais; não é seguro apagá-lo ou executar um refresh global sem mapear os consumidores restantes.
- As chamadas de atividade (`registrar_atividade_for_user`: 355, p50 383 ms e p95 495 ms) e interação (`register_interaction_for_user`: 75, p50 375 ms e p95 422 ms) foram separadas das RPCs de dados de tela. Elas são frequentes, mas esta amostra não mostra que sejam o gargalo principal.

### Correções locais desta retomada

- O cache interno de GET deixou de ser apagado por todo POST/PATCH. Agora só invalida os caminhos afetados por gamificação, streak e atualizações de nome/avatar; a invalidação também remove requisições GET antigas em andamento e impede que uma resposta anterior repovoe o cache depois da mutação.
- Após erro ou resposta vazia da API de perfil no login, a aplicação tenta ler pela sessão autenticada apenas a linha de `user_profiles` cujo `id` pertence ao usuário. A política `SELECT` do banco permite essa leitura própria; perfil ausente continua bloqueando o login e perfil não aprovado também. Essa recuperação local ainda precisa ser confirmada no navegador com uma sessão autenticada.
- A configuração local não tem `SUPABASE_SERVICE_ROLE_KEY`. A leitura de um perfil existente usa a sessão do usuário, mas a criação automática de um perfil ausente continua dependendo dessa chave de servidor; não se deve colocá-la em variável `NEXT_PUBLIC_` nem enviá-la no chat.

### Verificação desta atualização

- `npx tsc --noEmit` passou; `npm run build` concluiu com compilação, lint e tipos. O build reportou 178 kB de First Load JS em `/login` e 249 kB em `/dashboard`; não existe build anterior pareado para estimar redução percentual.
- `git diff --check` terminou com código 0. Reiniciei o servidor local na porta 3000; `/login` retorna HTTP 200 e a rota de perfil retorna HTTP 401 sem sessão, comportamento esperado.
- A leitura direta do perfil e o login ainda não foram validados numa sessão autenticada do navegador. Os resultados de API/Supabase acima não medem o tempo até as guias estarem visualmente prontas.

## Atualização da auditoria — 2026-10-03 07:13 UTC

### Login, perfis e integridade

- O caminho de login agora consulta primeiro, com o token recém-retornado pelo Auth, somente a linha de perfil do próprio usuário via RLS. Se a leitura não resolver, usa a API interna e repete apenas falhas transitórias/de consulta; o ID vem da resposta de autenticação e a RLS continua limitando a linha visível. Isso remove uma ida à API interna no caminho normal, mas ainda não foi medido em sessão autenticada.
- A captura anterior corresponde a uma conta com perfil aprovado e organização. A estrutura de `user_profiles` contém todas as colunas usadas; RLS está ativo, a política de leitura inclui `id = auth.uid()` e o gatilho atual `on_auth_user_created` está habilitado. Portanto, a falha daquela conta não se explica por perfil ausente ou coluna faltante; ainda falta observar a tentativa autenticada após o ajuste do fluxo.
- Consulta agregada read-only encontrou 78 contas ativas em Auth e 55 perfis. Há 23 contas confirmadas, não convidadas, sem linha de perfil, criadas entre 17 e 24 de julho de 2026; não consultei nem registrei e-mails ou IDs dessas contas. O gatilho está ativo hoje, mas não encontrei uma migração registrada nesse intervalo que explique a lacuna. Não fiz backfill: sem o histórico de permissões/organização, atribuir perfis em produção por suposição pode mudar o acesso.
- O catálogo também mostrou duas linhas com divergência entre `status` e `is_approved` (uma `approved` com `is_approved=false`, outra `pending` com `is_approved=true`). O código atual de login e administração usa `is_approved`; não alterei esses registros nem o default de `status` nesta auditoria.

### Filtros, telas e exports

- A chave dos detalhes de entregadores do Marketing agora inclui usuário, função, organização e praças atribuídas; troca de escopo invalida visualmente a lista anterior e inicia nova busca.
- A exportação UTR agora respeita uma lista primária explicitamente vazia, em alinhamento com o que a tela exibe, em vez de recorrer a um alias antigo que poderia conter dados defasados.
- Reconfirmei que a paginação visual de Entregadores e Prioridade não limita seus exports: eles recebem a lista completa já filtrada/ordenada. Valores também passa o conjunto filtrado completo; Marketing percorre páginas e confere total/IDs; DEDICADO exige igualdade entre o total informado e as linhas; Comparação mantém a ordem das duas semanas selecionadas. Os helpers mantêm limite e autofiltro do Excel.
- No smoke visual local, a comparação conserva a praça e as duas semanas selecionadas, com métricas/tabelas preenchidas; o gráfico permanece acessível. Não executei guias protegidas sem a sessão do usuário.

### Verificação desta atualização

- `npx tsc --noEmit` passou e o último `npm run build` concluiu com compilação, lint e tipos; `/login` está em 178 kB de First Load JS e `/dashboard` em 249 kB, sem build anterior pareado para estimar variação percentual.
- No servidor local, `/login` e `/visual-smoke` responderam HTTP 200; `/api/app/current-user-profile` respondeu HTTP 401 sem sessão, como esperado. A aba de login local foi aberta para a confirmação autenticada.
- Não apliquei DDL/RPC nem alterei dados de usuário no Supabase nesta atualização. O caminho de login e as guias protegidas ainda precisam de conferência com a sessão do navegador; sem essa etapa não atribuo percentual end-to-end.

## Atualização da auditoria — 2026-10-03 07:37 UTC

### Login e isolamento por praça

- A captura mais recente mostra que o Auth conclui, mas a leitura do perfil falha. O leitor direto de `user_profiles` agora usa o token recém-emitido no cabeçalho da própria consulta, em vez de depender da persistência assíncrona desse token no cliente do navegador; a leitura continua restrita ao `id` autenticado pela RLS.
- A rota `/api/dashboard/data` usa `service_role`. Ela agora limita `p_praca`/`p_pracas` ao conjunto `assigned_pracas` do perfil, rejeita pedidos por praças externas e nega consultas de usuários sem praças atribuídas. Administrador, master e marketing mantêm o acesso amplo previsto na política; o limite de organização continua aplicado.
- Conferi no catálogo de produção que os filtros de Entregadores, UTR e Valores detalhado aceitam listas separadas por vírgula e que os dois RPCs do resumo semanal aceitam `text[]`; a verificação do escopo não depende de presumir esse suporte.
- A mesma proteção contra perfil sem praças foi aplicada à rota `secure-rpc`, que também executa RPCs com `service_role`.
- A API de DEDICADO agora também força as praças atribuídas ou rejeita seleções fora do perfil em resumo, lista e detalhe do entregador; as RPCs correspondentes aceitam filtros múltiplos. Removi o hook `useEntregadorDetail` e a rota de histórico/tags correspondente, pois a busca não encontrou nenhum consumidor; a RPC que resta continua atrás da regra `FULL_CITY_ACCESS_ONLY` em `secure-rpc`.
- O cache em memória do Dashboard agora inclui o escopo de usuário, organização, papel e praças na chave; enquanto o escopo troca, os dados anteriores ficam ocultos. Alterações comuns de filtro no mesmo escopo ainda podem manter a tela anterior durante o carregamento para evitar o quadro vazio intermitente.

### Releitura das medições e do banco

- Uma nova leitura dos logs de borda confirmou Entregadores como a cauda mais lenta: 25 respostas 200, p50 700 ms, p95 5.135 ms e máximo 8.586 ms; três respostas 500 levaram até 8.382 ms. As chamadas das duas últimas telas observadas continuam em 2026-10-03 05:22 UTC. Isso mede a chamada RPC/Edge e não o tempo até a tela ficar pronta.
- O advisor de performance manteve dez avisos `INFO` de índices auxiliares sem scan, além do limite fixo de dez conexões do Auth. Nenhum indica índice redundante nas tabelas centrais. O advisor de segurança manteve cinco funções com `search_path` mutável e quatro `SECURITY DEFINER` acessíveis a `authenticated`; não alterei ACL nem definição dessas funções sem mapear todos os consumidores.
- Nenhum DDL, RPC persistente ou dado do Supabase foi alterado nesta rodada. Os ajustes desta atualização são locais ao aplicativo.
- `npx tsc --noEmit` e `npm run lint` passaram após as correções de escopo do Dashboard, DEDICADO e endpoint de detalhe; o lint não apontou avisos. Mantive o servidor de desenvolvimento ativo para a validação autenticada, então ainda não repeti o build nesta atualização. Falta a tentativa de login com a sessão real do usuário; a aba local `/login` está aberta para isso. Não há medição pareada de carregamento da página, então não atribuo percentual de ganho.

## Atualização da auditoria — 2026-10-03 07:52 UTC

- A imagem mais recente ainda mostra falha de validação do perfil depois do login. A leitura dos logs de borda encontrou o POST do Auth às 07:32:52 UTC com HTTP 200, mas nenhuma chamada `/rest/v1/...` correspondente a `user_profiles` na janela analisada; a consulta aos logs de Postgres também não encontrou leitura dessa tabela. Isso delimita o ponto observado, mas ainda não revela onde o fluxo local parou. Deixei `/login` aberto para uma nova tentativa do usuário; não usei nem pedi credenciais.
- A chave e a visibilidade de `useDashboardEvolucao` agora incluem usuário, organização, papel e praças atribuídas. Dados de outro escopo não aparecem quando a sessão muda; uma falha na consulta também não marca resultados antigos como se pertencessem ao novo escopo.
- Revisei os nove escritores XLSX ativos. Entregadores, Prioridade e Valores exportam todos os registros após os filtros/ordenação, sem limitar ao trecho visual paginado; Marketing percorre páginas e valida contagem/IDs; DEDICADO valida o total; Comparação e UTR preservam filtros e selecionam as seções resolvidas. O limite de linhas por aba e o autofiltro comum continuam ativos.
- Corrigi a métrica de Comparação com base anterior zero para aparecer como “Novo” em vez de `+100%`. A afirmação desta anotação de que a linha total recebia o estilo corretamente estava incorreta: a revisão de 15:04 UTC encontrou um deslocamento de uma linha no índice do total, corrigido e verificado por geração e reabertura de um XLSX sintético.
- No smoke visual local `/visual-smoke`, comparei os dados preenchidos e alternei tabela → gráfico → tabela; a troca não mostrou estado vazio transitório. `/visual-smoke/folhas` não existe nesta versão e retorna 404; a rota válida é `/visual-smoke`.
- `npx tsc --noEmit` e `npm run lint` passaram sem avisos após essas alterações. `git diff --check` terminou sem erro; o Git só avisou sobre conversão de LF/CRLF em arquivos do workspace. Mantive o servidor local ativo e não rodei novo build para não interromper a tela de login.
- Nenhum índice, RPC persistente ou dado do Supabase foi alterado. As latências disponíveis continuam medindo RPCs, não o carregamento visual completo; falta validar o login com a sessão do usuário e coletar uma medição autenticada tela a tela antes de calcular percentual end-to-end.

## Rechecagem do login — 2026-10-03 07:58 UTC

- Consultei novamente os logs do Supabase entre 07:25 e 07:55 UTC. O único tráfego ligado a essa tentativa foi o `POST /auth/v1/token` com HTTP 200; não houve requisição PostgREST para `user_profiles` nem consulta correspondente nos logs do Postgres. A falha observada ainda está antes da leitura do perfil no banco.
- O bundle local servido para `/login` contém o botão “Tentar validar novamente”. A aba atual está no formulário sem alerta, enquanto a captura enviada não mostra esse botão; preciso de uma tentativa na página atual para correlacionar o comportamento com os logs. Não alterei a autenticação, políticas RLS, RPCs ou dados do Supabase nesta rechecagem.
- Atualizei a janela de 24 horas às 08:00 UTC: `listar_entregadores_v2` teve 25 respostas 200 (p50 700 ms, p95 5.135 ms, máximo 8.586 ms) e três 500 (p50 8.157 ms); `listar_valores_entregadores` teve só quatro respostas 200 (p50 3.844 ms, p95 6.363 ms). A RPC `listar_entregadores_dashboard_fast_v1` existe em produção com execução restrita a `service_role`, mas não teve chamada na janela; por isso ainda não há amostra para comparar seu efeito. Os volumes são pequenos e os tempos medem RPC/Edge, não a tela completa.
- Rodei os advisors novamente às 08:05 UTC: continuam dez índices sem uso reportados apenas em tabelas auxiliares e quatro `SECURITY DEFINER` chamáveis por `authenticated`, além de cinco funções de manutenção sem `search_path` fixado e do limite absoluto de dez conexões do Auth. Não removi esses índices nem alterei ACLs: o advisor sozinho não prova redundância/segurança para remoção, e funções de RLS/refresh podem depender dessas permissões e do caminho atual.

## Rechecagem do erro de login — 2026-10-03 08:22 UTC

- A nova captura continua mostrando o erro genérico de validação do perfil. Na aba local aberta, porém, o formulário atual carrega sem erro e o chunk servido de `/login` contém a ação “Tentar validar novamente”.
- Consultei os logs de Auth/PostgREST/Postgres entre 08:00 e 08:22 UTC: não houve tentativa de Auth nem leitura de `user_profiles` nesse intervalo. Os sete eventos PostgREST às 08:21 foram apenas a recarga do cache de esquema após a migração, sem relação com login. Portanto, ainda não há requisição atual para correlacionar com a captura. Pedi uma atualização forçada da aba e nova tentativa, sem compartilhar senha; aguardarei o resultado para continuar o diagnóstico.
- Não alterei o fluxo de Auth nem a política RLS nesta rechecagem. A próxima etapa depende de uma tentativa na tela atual para descobrir se a leitura direta pela sessão ou o fallback da API interna falha.

## Medições e ajuste de filtros — 2026-10-03 08:18 UTC

- A RPC `listar_anos_disponiveis()` varria `mv_dashboard_resumo` três vezes e `tb_dashboard_resumo_incremental` duas vezes para encontrar dois anos. O plano SQL completo levou 95,4 ms aquecido; a função mediu 71,5 ms. Criei índices parciais `(ano_iso DESC) WHERE ano_iso IS NOT NULL` nas duas fontes, registrados em `docs/sql/2026-10-03-dashboard-year-filter-indexes.sql`. O plano passou a usar os dois índices, sem seq scan na MV; a consulta caiu para 12,2 ms e a função para 10,8 ms. Uma amostra aquecida sugere queda de 84,8% no tempo da função SQL, não no tempo da tela ou da chamada Edge.
- Não adicionei índice para praças: o plano atual lê somente os índices existentes da MV e da tabela incremental e levou 70,4 ms. O pico isolado de 1,6 s da chamada da função não se repetiu no plano SQL aquecido. `listar_todas_semanas` e `get_available_weeks` mediram 48,9 ms e 38,9 ms no banco.
- Comparei `_listar_valores_entregadores_source_20260719` com a fachada `listar_valores_entregadores` em dois pares aquecidos, invertendo a ordem: médias de 2.166 ms e 2.399 ms, respectivamente (cerca de 9,7% menor para a fonte direta). Ambas leram volumes de blocos semelhantes. Para o ano 2026, os dois resultados coincidiram em 8.693 entregadores, nomes, taxas e corridas, sem divergências. Essa é uma medição de banco para a chamada anual sem filtros; a chamada Edge observada continua com amostra pequena e p95 de 6,363 s.
- Comparei a RPC rápida e `listar_entregadores_v2` para o mesmo período de 2026: 1.158 ms e 1.184 ms aquecidas. Os 5.975 IDs, nomes e métricas coincidiram; não há ganho relevante demonstrado nessa única comparação.
- Na janela Edge de 24 horas até 08:12 UTC, Entregadores ainda teve 25 respostas 200 (p95 5,135 s) e três 500 (p95 8,360 s); anos disponíveis teve 35 chamadas (p95 1,648 s), praças 12 (p95 1,561 s) e resumo do dashboard 37 (p95 1,678 s). A diferença entre o plano de banco aquecido e a duração Edge indica que não devo atribuir a latência externa somente ao SQL. Ainda falta a sessão autenticada para medir tempo da página completa.
- Os contadores de uso dos índices não têm janela de reset informada (`pg_stat_database.stats_reset` é nulo). Portanto não usei os contadores cumulativos como prova para apagar índices. Nenhum índice existente foi removido nesta atualização.
- Após a migração, confirmei os dois índices no catálogo, com 1.072 kB e 376 kB e já usados pelo plano (12 e 4 scans). Os advisors não apontaram regressão; permanecem os dez avisos `INFO` de índices auxiliares e os mesmos avisos de segurança já registrados, sem alteração de ACL ou função.

## Rechecagem do login e uso dos índices — 2026-10-03 08:54 UTC

- Na janela consultada, `/auth/v1/token` respondeu HTTP 200 pela última vez às 08:35:23 UTC. Não houve depois disso uma chamada `/auth/v1/user` nem leitura de `/rest/v1/user_profiles`; a última leitura observada dessa tabela foi às 05:21:59 UTC. Isso confirma que o erro da captura acontece antes da consulta de perfil no PostgREST, mas os logs do Supabase não distinguem se a falha está no bundle do navegador ou na chamada à API local.
- A página local `/login` responde HTTP 200 e o JavaScript atualmente servido contém o botão “Tentar validar novamente”. A captura enviada não mostra esse botão; como não há tentativa correlacionada após 08:35 UTC, não atribuí o erro à versão atual do fluxo. Pedi uma atualização forçada e uma nova tentativa para obter evidência atual, sem solicitar credenciais.
- A leitura SQL confirmou uso dos novos índices de filtro de ano: 12 scans em `idx_mv_dashboard_resumo_ano_iso_v1` (1.072 kB) e 4 em `idx_tb_dashboard_resumo_incremental_ano_iso_v1` (376 kB). Os contadores não têm data de reset conhecida, portanto servem como confirmação de uso, não como comparação de latência.
- `pg_stat_statements` mostrou médias ponderadas cumulativas de 737 ms para `listar_entregadores_v2` (5.328 chamadas), 293 ms para `dashboard_resumo` (6.091), 2.213 ms para `listar_valores_entregadores` (224) e 72 ms para `calcular_utr_completo` (1.808). Os máximos históricos vão de 2,2 s a 41 s, mas a extensão não expôs a janela de reset; não usei esses máximos para representar a experiência atual. Para comparar a janela recente, continuam valendo as medições Edge com amostras e percentis registradas acima.
- Reexecutei `npx tsc --noEmit`, `npm run lint` e `git diff --check`: os três terminaram sem erros. O Git emitiu apenas avisos de conversão LF/CRLF para arquivos já modificados no workspace.

## Atualização da auditoria — 2026-10-03 09:30 UTC

### Filtros e dados por organização

- Apliquei `organization_scoped_filter_options`, que adiciona overloads de praças, anos e semanas com `p_organization_id`. O overload de semanas devolve rótulos ISO completos (`YYYY-Wnn`); os overloads novos ficam executáveis apenas por `service_role`. Os RPCs globais antigos não foram removidos.
- A consulta de validação para uma organização retornou 10 praças, 2 anos e 92 semanas, de `2025-W01` a `2026-W40`. Usuários `authenticated` não executam diretamente os overloads novos; o proxy interno usa o escopo de organização autorizado.
- O cliente agora pede praças, anos e semanas pelo escopo da organização; o cache de semanas está versionado e separado por organização. A leitura antiga que interpretava `2025-W03` como semana 2025 foi trocada pelo parser ISO compartilhado.

### Telas, erros e exportações

- Corrigi estados sem conteúdo e falhas silenciosas no comparativo: com menos de duas semanas a tela orienta a seleção; se não houver dados, mostra estado vazio; erro da comparação mensal agora permite tentar novamente. A seção UTR permanece disponível quando é a única que tem resultado.
- As transições entre conteúdo e carregamento não usam mais `mode="wait"`, que deixava a área da tela vazia durante a troca.
- Nas exportações Excel revisadas, o limite de linhas é validado antes dos mapeamentos mais pesados; Valores, Prioridade, UTR, Análise e Entregadores incluem os filtros usados. DEDICADO valida métricas ausentes em vez de convertê-las em zeros; o fluxo semanal de Marketing identifica período e praça no título. Os exports continuam recebendo a lista completa já filtrada/ordenada ou paginam e conferem total/IDs, conforme a guia.
- O smoke local de Comparação continua exibindo métricas, tabela e semanas selecionadas após essas mudanças. Isso não valida guias protegidas, login autenticado nem carregamento fim a fim.

### Rechecagem do login

- A aba local `/login` aberta para inspeção está sem erro e sem sessão. Na janela consultada de 08:30 a 09:30 UTC, o último evento foi `POST /auth/v1/token` com HTTP 200 às 08:35:23; não apareceu leitura de `user_profiles` nem chamada à rota `/api/app/current-user-profile`. Assim, ainda não consigo associar a captura nova ao bundle atual ou a uma resposta de perfil.
- O `.env.local` local tem URL/chave pública do projeto correto, mas não contém `SUPABASE_SERVICE_ROLE_KEY`. A leitura da linha própria usa a sessão/RLS e não depende dessa chave; criação automática de perfil ausente na API local depende dela. Não coloquei chave de servidor no cliente nem alterei perfis.
- A tela atual oferece retry após falha de validação. Uma nova tentativa na aba atual, com o texto do erro visível, é necessária para distinguir falha de leitura, perfil ausente e bundle antigo. Nenhuma credencial foi usada nesta checagem.

### Medições e verificação

- A melhoria medida anteriormente permanece limitada à função SQL `listar_anos_disponiveis`: 71,5 ms para 10,8 ms em amostra aquecida, queda de 84,8%. Não há medição pareada de tela completa ou sessão autenticada; não atribuo percentual end-to-end aos demais ajustes.
- Os advisors após a migração mantêm 10 avisos `INFO` de índices auxiliares sem uso, 5 funções com `search_path` mutável, 4 funções `SECURITY DEFINER` executáveis por `authenticated` e o limite absoluto de 10 conexões do Auth. Não removi esses índices nem alterei ACLs: os avisos existentes não bastam para concluir que essas mudanças sejam seguras.
- `npx tsc --noEmit`, `npm run lint` e `git diff --check` passaram após as alterações locais; o Git pode avisar sobre conversão LF/CRLF. A migração foi aplicada e os overloads foram conferidos no banco. Não executei refresh global de materialized views.

## Atualização da auditoria — 2026-10-03 10:01 UTC

### Login

- A captura enviada ainda mostra erro de validação do perfil, mas não exibe o botão “Tentar validar novamente” que está no código local atual. A rota local `/login` responde HTTP 200 e os chunks JavaScript servidos contêm essa ação. A página nova aberta para conferência está limpa, sem sessão e sem erro; isso não reproduz a captura.
- Nos logs unificados do Supabase entre 09:00 e 09:50 UTC, encontrei somente uma renovação de token às 09:37 UTC. Não apareceu um novo `grant_type=password` nem uma consulta PostgREST a `user_profiles`, então não consigo associar a imagem a uma chamada da versão local atual. A hipótese de aba antiga é compatível com a diferença visual, mas ainda não está confirmada; a falha de login permanece sem causa raiz demonstrada.

### Comparação, transições e exportações

- O comparativo passa a manter o erro de UTR separado de ausência válida de valor: falhas aparecem com mensagem e ação de retry; `N/D` permanece apenas para valores ausentes sem erro da consulta. O retry invalida o resultado em cache e consulta de novo sem recarregar a página; respostas parciais com erro não são armazenadas por cinco minutos.
- A transição compartilhada agora sobrepõe a tela que entra à que sai e anima a altura do contêiner, com suporte a `prefers-reduced-motion`. Removi `mode="wait"` das trocas de tela do Dashboard, DEDICADO, Marketing e Evolução. As trocas deixam de esperar a tela anterior sumir para só então exibir a próxima.
- Os dois exports de Marketing agora carregam uma aba de filtros com organização, período e praça. Os exports de DEDICADO, Valores, Análise, UTR e Prioridade preservam mensagens úteis de limite ou integridade em vez de substituí-las por um erro genérico. UTR exige métricas finitas e grava números como valores numéricos; não converte dado inválido silenciosamente em zero.
- O formatador comum do Excel reutiliza objetos de estilo e de altura de linha entre células, reduzindo alocações repetidas em planilhas extensas sem remover autofiltro, congelamento, larguras ou formatação alternada.

### Verificação

- `npx tsc --noEmit`, `npm run lint` e `git diff --check` passaram sem erro; lint não apontou avisos. Não rodei novo build para manter o servidor de desenvolvimento ativo.
- O smoke visual local `/visual-smoke` carregou a comparação de semanas 2026-W05 e 2026-W07, com filtros, métricas e tabelas visíveis. Isso verifica a renderização estática e não a chamada real de UTR nem a troca animada de abas.
- A nova tentativa de login autenticada continua necessária para identificar a causa real da captura. Não usei nem solicitei credenciais.

### Nova janela de logs — até 2026-10-03 10:02 UTC

- Reconsultei Auth e PostgREST de 09:50 a 10:02 UTC; não houve novas chamadas a `/auth/v1/token`, `/auth/v1/user` ou `user_profiles`. O cenário permanece sem tentativa autenticada recente para correlacionar.
- O smoke visual abriu `http://localhost:3000/visual-smoke` e exibiu a seleção de duas semanas, métricas consolidadas e tabelas detalhadas. A validação do login continua pendente após atualização forçada da aba com erro.

## Diagnóstico adicional de login — 2026-10-03 10:11 UTC

- A conta mostrada na captura tem um perfil correspondente em `user_profiles`. A tabela concede `SELECT` a `authenticated`, a RLS está ativa e a política permite a leitura da própria linha por `auth.uid()`. Isso elimina “perfil inexistente” e ausência de privilégio de leitura como causa para essa conta; não comprova que o token do navegador chegou à consulta.
- O `.env.local` aponta para o projeto auditado e tem a URL e a chave pública; não tem `SUPABASE_SERVICE_ROLE_KEY`. Essa chave só é necessária no caminho de recuperação que cria perfis ausentes. Há 23 usuários históricos sem linha correspondente em `user_profiles`, mas nenhum criado nos últimos 30 dias; o gatilho `on_auth_user_created` chama `handle_new_user` para novos cadastros. A conta da captura não está nesse grupo.
- Entre 09:07 e 10:07 UTC, os logs registram apenas uma renovação de token em `/auth/v1/token`; não há concessão de senha nem chamada de leitura à API REST nesse intervalo. A página local aberta agora mostra o formulário atual, enquanto a captura ainda não mostra o botão de retry presente no código. A hipótese de aba/bundle antigo continua plausível, mas a origem exata da falha atual não está demonstrada.
- `authenticated` tem grants de `UPDATE` e `INSERT` na tabela; a política limita updates à linha própria e o trigger `check_profile_update_privileges` impede usuários não administradores de alterar papel, aprovação, organização, praças ou flags administrativas. Não alterei esses grants ou regras durante o diagnóstico.
- Próximo passo para reproduzir: atualizar a aba de login à força e autenticar nela; correlacionar essa chamada atual com os logs e a mensagem do retry. Não usei nem solicitei a senha.

## Atualização da auditoria — 2026-10-03 10:56 UTC

### Entregadores: paginação no servidor

- A tabela principal agora pede páginas de 24/35/50 linhas ao servidor, conforme o total, e envia busca, ordenação e filtro de inativos junto dos parâmetros da consulta. Os totais, resumo global e rankings continuam representando o conjunto completo; a exportação busca a lista integral sob demanda.
- Adicionei a RPC `listar_entregadores_dashboard_page_v1` com `SECURITY INVOKER`, `search_path` fixo e execução concedida somente a `service_role`. O endpoint da aplicação valida a organização e a praça autorizadas antes de chamar a RPC. Aplicação e registro das três migrações foram confirmados no projeto Supabase.
- Para os mesmos 8.671 registros anuais, a resposta JSON bruta caiu de 2.670.356 bytes para 31.784 bytes (24 linhas e agregados globais): redução de 98,81%, aproximadamente 84 vezes menor. O tempo isolado da RPC paginada ficou em 1.763 ms; isso não mede o tempo total da tela nem prova uma redução equivalente na latência end-to-end.
- Conferi a primeira página e a seguinte sem sobreposição, o filtro de inativos, busca literal por `%`, busca sem resultados, ordenação por percentual concluído, exportação integral e privilégios (`anon`/`authenticated` sem execução; `service_role` com execução). O resumo global bateu com o resultado anual completo.

### Rechecagem do erro de login

- A página aberta foi recarregada e agora mostra o formulário sem alerta. O console do navegador conserva dois erros históricos de compilação, às 10:41:24 e 10:41:28 UTC: `currentPage` estava declarado duas vezes em `EntregadoresMainTable.tsx`. O código atual não tem a duplicidade; `npx tsc --noEmit` e `npm run lint` passaram, e a recarga não gerou novo erro de compilação.
- Esse erro pode ter deixado a aba usando um bundle antigo, coerente com a captura sem o botão de retry presente no código atual. Ainda não atribuo a mensagem de validação do perfil a essa causa: não houve nova autenticação nem chamadas correlacionadas a Auth/PostgREST nos logs Supabase entre 10:11 e 10:55 UTC. A página limpa após recarga também não valida o caminho de perfil autenticado.
- É necessária uma nova tentativa feita pelo próprio usuário na aba já recarregada para correlacionar o resultado atual. Não preenchi credenciais nem usei a senha visível em uma captura anterior.

### Verificação local

- `npx tsc --noEmit` passou, `npm run lint` passou sem avisos ou erros e `git diff --check` terminou sem erro (somente avisos do Git sobre conversão LF/CRLF). Nenhum teste novo foi adicionado.

## Continuação da auditoria — 2026-10-03

### Escopo de organização e autenticação

- Encontrei `get_user_organization_id()` lendo `organization_id` de `auth.jwt()->user_metadata`. Essa função era usada por políticas de `user_profiles`, `dados_marketing`, `dados_valores_cidade` e por RPCs. `user_metadata` é editável pelo próprio usuário e não deve definir autorização.
- Substituí a origem pelo registro do próprio usuário em `public.user_profiles`, com `search_path` vazio e todas as referências qualificadas. Preservei as permissões existentes para que as políticas continuem avaliando a função.
- Apliquei e registrei a migração `20261003112858_derive_organization_scope_from_user_profile`. Na verificação transacional, uma sessão autenticada com um UUID adulterado em `user_metadata` recebeu o `organization_id` do perfil e não teve acesso a linhas do UUID adulterado. O teste passou tanto antes quanto depois da aplicação.
- A varredura encontrou também `is_user_admin()` consultando `raw_user_meta_data.is_admin`. Ela não tem chamadores no código atual e só aceita `service_role`, mas alterei a função para consultar `user_profiles.is_admin`/`role`. A mudança está na migração `20261003113213_derive_admin_status_from_user_profile`; o privilégio de execução permaneceu restrito.
- Existem 54 perfis com organização, uma única organização cadastrada e um perfil sem organização. Onze perfis têm organização no banco e claim ausente; nenhum tem claim preenchido divergente. Isso explica por que usar o claim era fonte inconsistente. Os 23 usuários sem linha em `user_profiles` são históricos; a auditoria anterior confirmou que a conta da captura possui perfil, então esse grupo não explica o erro mostrado.
- Removi o fallback de `user_metadata.organization_id` do bootstrap e da resolução de organização e removi a sincronização aguardada de metadados após login. Isso evita uma atualização de Auth sem papel de autorização e reduz chamadas extras em série no login.
- Os logs recentes mostram respostas Auth `/user` 200. O stream PostgREST disponível não expõe o caminho da requisição nos campos consultáveis; ainda não dá para afirmar se a consulta ao perfil da sessão da captura chegou ao banco. O `.env.local` não contém chave `service_role`; essa chave só é usada no caminho para recuperar um perfil ausente, caso distinto da conta confirmada na captura.

### Estados de carregamento e transições

- `useDeferredMount` agora considera a configuração atual durante a renderização: alternar de montagem imediata para adiada não monta e desmonta o componente por um frame.
- Removi os avisos de atualização duplicados no Dashboard e na Análise; o aviso global do shell permanece.
- No Comparativo, a seção UTR mantém um skeleton enquanto a consulta está pendente e ainda não retornou linhas. O aviso de “UTR não disponível” só aparece após a consulta terminar sem dados.
- Em Entregadores, a seção de destaques usa o ranking pré-calculado do servidor sem o atraso anterior; DEDICADO mantém apenas uma espera curta de 300 ms com skeleton visível, e o carregamento do módulo também tem fallback.

### Índices, advisors e exportações

- A rechecagem encontrou zero pares de índices com definição exata duplicada. O advisor segue reportando dez índices auxiliares como “unused”; são pequenos, de funcionalidades pouco usadas, e os contadores cumulativos não têm janela de reset confiável. Não removi nenhum com base apenas nesse aviso.
- Os advisors ainda mostram cinco funções de manutenção com `search_path` mutável e quatro helpers `SECURITY DEFINER` executáveis por `authenticated`. Revogar os helpers quebraria políticas RLS; os quatro consultam somente o escopo do próprio usuário e não usam `user_metadata`. Mantive as permissões necessárias.
- Revisei novamente os nove exports XLSX ativos. Os controles de paginação integral, filtros exportados, limite de linhas e validação de contagem permanecem; não encontrei outra divergência que justificasse mudar os arquivos nesta passagem.
- As medições anteriores continuam sendo de RPC/banco e tamanho de resposta, não do tempo total de cada tela. Ainda falta repetir o login na página recarregada para medir telas protegidas e fechar a correlação do erro de perfil; não atribuo um percentual end-to-end sem essa amostra.

### Verificação

- `npx tsc --noEmit` e `npm run lint` passaram após as alterações. `git diff --check` terminou sem erro, com avisos de conversão LF/CRLF do Git. Não adicionei nem rodei testes.

## Rechecagem de login e Valores — 2026-10-03 12:04 UTC

### Login e perfil

- A nova captura ainda mostra falha ao validar o perfil. A política `Users view logic via organization isolation` permite a leitura da linha com `id = auth.uid()`; o banco também concede `SELECT` ao papel `authenticated`. Na consulta agregada das últimas 24 horas, `/rest/v1/user_profiles` teve 125 respostas HTTP 200 e p95 de 446 ms. Esses eventos não identificam a sessão da captura, portanto não provam que a tentativa específica chegou ao PostgREST.
- Confirmei que o servidor local é `next dev` e que o bundle atual já contém o botão de retry; a hipótese de `next start` com build antigo estava incorreta. Ajustei o formulário para mostrar “Tentar validar novamente” também quando a mensagem descreve erro de perfil, mesmo se o estado pendente não tiver sido definido. A nova aba local abriu sem sessão nem erro; a causa da tentativa da captura continua sem reprodução autenticada.

### Valores

- A guia principal consulta `valores` e recebe todas as linhas agregadas. Busca e ordenação são locais; a tabela renderiza 15 linhas inicialmente quando há mais de mil e acrescenta blocos no scroll. A consulta detalhada usa `p_limit`/`p_offset`, mas não substitui a consulta completa da guia principal nem a exportação integral.
- O tráfego recente continua com amostra pequena para `listar_valores_entregadores` (quatro respostas 200; p50 3,78 s e p95 6,43 s na janela registrada acima). Uma comparação SQL restrita à semana 2026-W39 não terminou em pouco mais de um minuto; encerrei a espera e depois confirmei que não havia consulta correspondente ativa. Não usei esse resultado para alterar a função pública nem apliquei uma migração de atalho. O próximo ganho a avaliar é paginar a guia principal preservando totais, busca, ordenação e exportação, depois de confirmar que o plano SQL não continua fazendo o trabalho integral antes de devolver a página.

### Verificação desta atualização

- `npx tsc --noEmit`, `npm run lint` e `git diff --check` passaram. O Git mostrou somente avisos de conversão LF/CRLF. Não adicionei nem rodei testes.

## Continuação — 2026-10-03 12:27 UTC

### Erro de login

- A nova imagem ainda não mostra o botão de retry, mas a página local `/login` responde HTTP 200 e o chunk JavaScript servido contém “Tentar validar novamente”. Não encontrei registro de autenticação por senha nem consulta a `user_profiles` entre 11:45 e 12:21 UTC; só houve renovação de token às 11:58. Assim, a captura não está correlacionada a uma tentativa do bundle atual e a causa do erro permanece sem reprodução. Não usei credenciais.
- O retry já está no código atual e aparece para mensagens de erro de perfil. Uma recarga forçada da aba deve alinhar a tela aberta ao bundle que o servidor está servindo; isso ainda precisa ser confirmado visualmente pelo usuário.

### Valores

- Iniciei paginação da lista principal pela API da aplicação, com páginas de 25 entregadores, busca/ordenação no servidor, deduplicação de chamadas, cache curto e verificação de snapshot entre páginas. Exportação Excel continua buscando e ordenando o conjunto integral sob demanda. Removi também cálculos de busca/ordenação sobre arrays vazios que ficaram redundantes após mover a consulta para a API.
- Esta versão reduz o volume enviado da API da aplicação ao navegador, mas cada cache miss ainda chama a RPC completa e processa todas as linhas no servidor. Portanto, o tempo SQL inicial e o tráfego Supabase→servidor não foram reduzidos; o cache em memória pode não persistir entre instâncias. Não atribuo ganho percentual nem considero a otimização de Valores concluída antes de substituir/validar esse caminho no banco ou medir uma melhoria end-to-end.
- Quando filtros ou ordenação mudam, a lista anterior agora fica marcada como atualizando enquanto a página correspondente carrega; ela não aparenta já representar os novos filtros.

### Verificação desta atualização

- `npx tsc --noEmit` terminou sem erros, `npm run lint` passou sem avisos e `git diff --check` terminou sem erro (apenas avisos LF/CRLF do Git). Não apliquei migração do Supabase nem fiz teste autenticado da guia Valores.

## Rechecagem da captura de login e paginação — 2026-10-03 12:54 UTC

### Login

- Abri uma nova aba local em `/login`: resposta HTTP 200, sem erro visível. O chunk servido contém a ação “Tentar validar novamente”; a captura recebida não a mostra, então ela não corresponde à interface atual carregada nessa aba. Isso é compatível com uma aba antiga, mas não identifica a causa da falha.
- Conferi no Supabase que todas as colunas lidas pelo login existem em `user_profiles`; `authenticated` tem `SELECT`, e a política permite a própria linha por `auth.uid()`. Isso descarta erro de coluna e falta de permissão declarada, mas não comprova que o token da tentativa da captura chegou à consulta.
- Nas fontes Auth e Auth Audit dos logs, entre 11:45 e 12:50 UTC, constam só dois eventos ligados a token às 11:58; não há evento de senha nem erro de Auth nesse intervalo. A causa continua sem reprodução correlacionada. Não usei nenhuma credencial da imagem.

### Valores e movimento reduzido

- A tabela de Valores usa páginas de 100 linhas. Corrigi o texto do marcador de rolagem para anunciar linhas adicionais antes da consulta começar; durante a consulta, o spinner agora respeita `prefers-reduced-motion` e tem texto acessível para leitores de tela.
- A RPC paginada experimental foi removida porque sua primeira e segunda páginas repetiam o custo de agregação completa sem reduzir a latência SQL. O caminho atual ainda pode ler o conjunto completo em cache miss no servidor; não atribuo redução de tempo ao SQL. A exportação continua buscando o conjunto integral sob demanda.

### Verificação

- `npx tsc --noEmit` passou, `npm run lint` passou sem avisos e `git diff --check` terminou sem erro. Não adicionei nem rodei testes.

## Rechecagem da resposta de login — 2026-10-03 13:08 UTC

- A nova captura mostra “Não foi possível validar seu perfil agora” e não exibe “Tentar validar novamente”. No `/login` servido agora em `localhost:3000`, o HTML responde HTTP 200 e os chunks carregados incluem esse botão. Isso continua compatível com uma aba servindo JavaScript antigo, mas não permite afirmar que uma recarga forçada já ocorreu após essa captura.
- Nos logs Edge de 12:55–13:05 UTC aparece `POST /auth/v1/token` com HTTP 200 às 13:00:21; a consulta não identificou um pedido a `/rest/v1/user_profiles` no mesmo período. O endpoint de token pode atender concessões diferentes, então não classifico esse evento como login por senha.
- A checagem agregada encontrou dois usuários com `last_sign_in_at` nas últimas 24 horas; ambos têm perfil aprovado. Não há evento correlacionado que permita afirmar que são a conta da captura. As permissões e colunas da tabela já haviam sido confirmadas anteriormente.
- Nenhuma causa de perfil foi reproduzida com a interface atual. O próximo passo é recarregar a aba em uso e, se o botão aparecer, acioná-lo; a tentativa pode então ser correlacionada sem compartilhar senha ou token.

## Latência Supabase por RPC — janela 2026-10-02 13:08 a 2026-10-03 13:08 UTC

Amostras de `response.origin_time` nos Edge logs; medem o tempo do pedido ao Supabase, não o tempo de tela nem a rede inteira:

| RPC | Chamadas | Erros | p50 | p95 | Máximo |
| --- | ---: | ---: | ---: | ---: | ---: |
| `listar_entregadores_v2` | 25 | 3 | 837 ms | 8.337 s | 8.586 s |
| `listar_valores_entregadores` | 3 | 0 | 4.050 s | 6.499 s | 6.771 s |
| `listar_todas_semanas` | 4 | 0 | 1.008 s | 2.468 s | 2.721 s |
| `list_pracas_disponiveis` | 9 | 0 | 868 ms | 2.279 s | 2.721 s |
| `listar_anos_disponiveis` | 29 | 0 | 446 ms | 2.017 s | 2.388 s |
| `dashboard_resumo` | 34 | 0 | 565 ms | 1.678 s | 2.019 s |
| `get_available_weeks` | 22 | 0 | 313 ms | 1.059 s | 1.480 s |
| `calcular_utr_completo` | 22 | 0 | 427 ms | 991 ms | 1.108 s |
| `get_city_last_updates` | 12 | 0 | 443 ms | 1.300 s | 1.503 s |
| `dashboard_evolucao_bundle_org_year_fast` | 1 | 0 | 1.646 s | 1.646 s | 1.646 s |

`listar_valores_entregadores` tem a maior mediana nesta janela, mas só três amostras. `listar_entregadores_v2` tem a pior cauda e três erros; o caminho novo `listar_entregadores_dashboard_page_v1` não apareceu nos Edge logs da janela, portanto o uso e o ganho visual da paginação ainda não estão confirmados nesse tráfego. As estatísticas PostgreSQL dessa RPC incluem chamadas de benchmark e não substituem essa medição por usuário.

### Plano da RPC de Valores

- `EXPLAIN` sem execução da consulta anual de `2026` estima 321 mil linhas da `mv_entregadores_agregado`, atendidas por `idx_mv_entregadores_valores_org_ano_driver_v2` (184 MB, 89 varreduras cumulativas e zero buscas no heap), e 363 mil linhas da tabela incremental em cada uma de duas passagens: a deduplicação de escopos e a união dos dados incrementais.
- `tb_entregadores_agregado_incremental` tem 363.328 linhas estimadas, heap de 78 MB, 2.528 tuplas mortas e 96,4% das páginas marcadas como visíveis. Já existem índices cobridores de 78–90 MB para organização/ano e para escopo. Como a consulta anual atual lê praticamente toda a tabela incremental, não acrescentei outro índice nem forcei o planner a trocar o scan sequencial.
- O plano corrobora o trabalho de agregação de aproximadamente 684 mil linhas candidatas antes de produzir a lista por entregador. O ganho restante requer uma fonte anual já agregada e compatível com o processo de atualização incremental; não alterei a RPC sem confirmar esse ciclo de atualização e comparar resultados completos.

## Rechecagem do perfil e consistência do DEDICADO — 2026-10-03 13:24 UTC

### Login

- Consulta somente de presença/estado confirmou que a conta mostrada na captura tem linha em `auth.users`, perfil em `user_profiles` e `is_approved = true`. A tabela tem RLS habilitado, `authenticated` tem `SELECT` e a política inclui a própria linha por `id = auth.uid()`. Isso afasta perfil ausente/reprovado e falta de grant para essa conta; ainda não reproduz a requisição do navegador.
- O servidor local responde HTTP 200 e um dos chunks de `/login` contém o botão “Tentar validar novamente”. Ele não aparece na imagem recebida. O `last_sign_in_at` da conta não mudou nos intervalos recentes consultados, então não consegui correlacionar a imagem a uma autenticação bem-sucedida pelo bundle atual. A hipótese mais provável é aba antiga, sem confirmação visual ainda.
- A consulta agregada encontrou 23 de 78 usuários Auth sem perfil público; não são a conta da captura. O fluxo de criação do perfil no servidor depende de `service_role`; `.env.local` não tem essa variável, então contas sem perfil podem falhar no ambiente local. É um problema separado a tratar depois, com um mecanismo de provisionamento adequado.

### Exportações e estados

- Acrescentei uma validação ao export Excel do DEDICADO: o total de entregadores informado pelo resumo precisa coincidir com o total da lista integral usada no ranking. Se as consultas divergirem, o arquivo é interrompido com uma mensagem para gerar novamente.
- Confirmei que a remoção de `useComparacaoChartRegistration` não remove o registro do Chart.js: `useDashboardPage` mantém `useChartRegistration` para a aba Comparativo antes de renderizar os gráficos.
- A revisão dos demais exports não encontrou filtro omitido nem falha de paginação que justifique outra mudança nesta passagem. Marketing pagina e valida contagem/IDs; Valores busca a lista completa; Entregadores remove parâmetros de página antes da exportação completa e reaplica busca, inativos e ordenação.

### Limite da captura atual

- O browser não disponibilizou uma aba acessível para inspecionar a tentativa autenticada, e os logs Supabase consultáveis nesta janela não oferecem um caminho de requisição que correlacione o perfil ao usuário. A confirmação da atualização forçada e do resultado do botão continua pendente.

## Rechecagem de login e cache de Valores — 2026-10-03 13:41 UTC

### Login

- A imagem recebida ainda não mostra o botão de retry. A página local responde HTTP 200 e um dos sete chunks servidos contém “Tentar validar novamente”.
- Nos logs Edge entre 12:41 e 13:41 UTC, o único `POST /auth/v1/token` foi às 13:00 e usou `grant_type=refresh_token` com HTTP 200; não houve tentativa de senha nem leitura de `/rest/v1/user_profiles` nesse intervalo. Esse evento não corresponde a uma nova autenticação e não identifica a causa mostrada na captura.
- A captura segue sem reprodução correlacionada. A aba precisa ser recarregada à força; se o botão aparecer, a ação de retry permitirá observar o erro atual sem compartilhar senha ou token.

### Valores e latência

- O serviço local agora mantém por 60 segundos a lista de Valores já normalizada, filtrada e ordenada, além do snapshot e dos totais. A chave inclui organização, praças autorizadas, demais filtros, busca e ordenação; o cache aceita no máximo 12 combinações e deduplica preparações simultâneas. Assim, as páginas seguintes reutilizam o trabalho feito na primeira página.
- Essa mudança reduz trabalho repetido no servidor durante a rolagem. O cache é em memória por processo, portanto outro worker ou cold start pode recalcular. Não reduz a varredura/agregação SQL nem a latência da primeira página, que continuam sendo a maior parte do atraso observado. Não atribuo percentual sem medição pareada de tela/API.
- Nova amostra de `response.origin_time` dos Edge logs, 2026-10-02 13:41 a 2026-10-03 13:41 UTC:

| RPC | Chamadas | Erros | p50 | p95 | Máximo |
| --- | ---: | ---: | ---: | ---: | ---: |
| `listar_entregadores_v2` | 23 | 3 | 1.314 s | 8.360 s | 8.586 s |
| `listar_valores_entregadores` | 3 | 0 | 4.050 s | 6.499 s | 6.771 s |
| `listar_todas_semanas` | 4 | 0 | 1.008 s | 2.468 s | 2.628 s |
| `list_pracas_disponiveis` | 9 | 0 | 868 ms | 2.279 s | 2.721 s |
| `listar_anos_disponiveis` | 29 | 0 | 446 ms | 2.017 s | 2.388 s |
| `dashboard_resumo` | 34 | 0 | 565 ms | 1.678 s | 2.019 s |
| `get_available_weeks` | 22 | 0 | 313 ms | 1.059 s | 1.480 s |
| `calcular_utr_completo` | 22 | 0 | 427 ms | 991 ms | 1.108 s |
| `get_city_last_updates` | 12 | 0 | 443 ms | 1.300 s | 1.503 s |

`listar_valores_entregadores` ainda tem a maior mediana, mas só três amostras. `listar_entregadores_v2` manteve três erros e p95 acima de oito segundos. Os valores medem o tempo no Supabase e não incluem navegador, API da aplicação ou renderização. A janela da última hora não teve RPC de dashboard registrada.

### Advisors e verificação local

- Os advisors atuais mantêm 10 avisos informativos de índices não usados, 5 funções com `search_path` mutável e 4 funções `SECURITY DEFINER` executáveis por `authenticated`; também apontam a configuração absoluta de até 10 conexões para Auth. Mantive a decisão de não remover índices ou alterar ACL sem validar dependências e carga.
- `npx tsc --noEmit`, `npm run lint` e `git diff --check` passaram após o cache local. O último comando só exibiu os avisos conhecidos de conversão LF/CRLF. Não adicionei nem executei testes e não apliquei migração do Supabase.

## Rechecagem de login, filtros e exports — 2026-10-03 14:06 UTC

- A captura mais recente ainda mostra erro ao validar perfil, sem a ação de nova tentativa. A página/chunk atual servido em `localhost:3000/login` contém o botão “Tentar validar novamente”; não encontrei evento Auth ou consulta de perfil correlacionável à captura. Portanto, o erro real permanece sem reprodução confirmada. Uma recarga forçada deve carregar o bundle atual; se persistir, o botão permite tentar novamente sem refazer login.
- Na comparação, a seleção precisa conter exatamente duas semanas. O hook agora não busca dados para URLs antigas/inválidas com quantidade diferente, e a exportação interrompe a geração em vez de descartar semanas silenciosamente.
- A seleção de Valores com filtro de origem agora evita a fonte agregada rápida que não preserva esse filtro, mantendo a fonte pública consolidada correta.
- Varri os nove pontos de geração XLSX. Encontrei limites de linhas, metadados dos filtros e bloqueios durante carregamento/erro nos fluxos aplicáveis. Exportações paginadas validam avanço/contagem; a de comparação agora valida as duas semanas.
- Após esses ajustes, `npx tsc --noEmit` e `npm run lint` passaram. `git diff --check` terminou com código 0 e mostrou somente avisos existentes de normalização LF/CRLF. Não rodei testes, não apliquei migrações e não fiz commit/push.

## Hidratação, transições e nova captura de login — 2026-10-03 14:45 UTC

### Hidratação e animações

- O console da apresentação local confirmou divergência de hidratação: `CountUp` começava com `0` no HTML do servidor e mostrava o valor final no primeiro render do cliente quando `prefers-reduced-motion` estava ativo. Isso fazia o React substituir o HTML da página.
- `ChartSkeleton` também usava `Math.random()` na altura das barras durante o render; o console registrou altura diferente entre servidor e cliente. Troquei por sete alturas fixas. O atraso do progresso em `DayCard` passou a ser determinístico para evitar que a cada render uma animação receba outro atraso.
- Ajustei a contagem animada para renderizar de imediato o valor correto e igual no servidor e no primeiro render do cliente; mudanças posteriores ainda animam a partir do valor anterior, enquanto movimento reduzido exibe a mudança sem animação. Isso remove o zero inicial que poderia parecer dado ausente. Também estabilizei os estados iniciais de animação na grade e nos cartões semanais do relatório, no conteúdo expandido de Marketing e nos estilos SSR de `TiltCard`.
- Recarreguei os fluxos sintéticos `/visual-smoke/marketing` e `/visual-smoke`. Depois das mudanças não surgiram novos erros de hidratação; as contagens chegaram aos valores sintéticos esperados e a comparação continuou exibindo duas semanas. O console ainda conserva avisos de carregamentos anteriores, portanto considerei somente entradas posteriores ao reload.
- O navegador de verificação declara movimento reduzido ativo. Por isso, a checagem confirma renderização e hidratação; não confirma a aparência das animações em uma configuração sem essa preferência. O comportamento reduzido permanece respeitado.

### Nova captura de login

- A captura continua sem o botão “Tentar validar novamente”, embora o bundle local atual o renderize para esse texto de erro. Isso sugere interface antiga, mas ainda não prova a causa do erro da tentativa mostrada.
- A política RLS remota e o grant confirmam leitura da própria linha de `user_profiles`. Os logs PostgREST consultados não têm evento contendo `user_profiles` que correlacione esta captura. O `.env.local` deste checkout não contém chave `service_role`; isso só impede o provisionamento de um perfil ausente e não explica a falha ao ler um perfil existente.
- Pedi uma recarga forçada seguida de uma nova tentativa, sem compartilhar senha ou token, para obter o erro do bundle atual. Ainda não validei a sessão autenticada no navegador.

### Verificação desta atualização

- `npx tsc --noEmit` passou, `npm run lint` passou sem avisos e `git diff --check` terminou com código 0 e nenhuma linha com whitespace inválido. O Git ainda emite avisos de conversão LF/CRLF nos arquivos modificados. Não adicionei nem executei testes e não alterei o banco remoto.

## Limite de memória do cache da API interna — 2026-10-03 14:48 UTC

- O cache GET do navegador expirava cada entrada em 10 segundos, mas só removia uma entrada vencida quando a mesma chave fosse consultada novamente. Muitas combinações de caminho/filtro podiam deixar chaves antigas ocupando memória durante a vida da aba. Agora remove entradas expiradas em cada consulta e limita o cache a 128 respostas, descartando as mais antigas quando necessário. O TTL e a deduplicação de pedidos em andamento continuam iguais.
- Após esse ajuste, `npx tsc --noEmit` e `npm run lint` passaram; `git diff --check` terminou com código 0 e nenhum whitespace inválido. O banco remoto permaneceu somente em leitura.
- A checagem visual posterior à mudança do contador mostrou os números sintéticos completos já no primeiro estado acessível, sem o zero transitório. Os logs de console ainda contêm erros antigos anteriores aos reloads, mas não apareceu aviso novo após a renderização atual.
- Repeti `npx tsc --noEmit`, `npm run lint` e `git diff --check` às 14:50 UTC depois dessa mudança final; os três passaram, sem whitespace inválido.

## Rechecagem das exportações e sinais atuais do Supabase — 2026-10-03 15:07 UTC

### Exportações Excel

- Rastreiei os nove pontos ativos de gravação até seus botões: Análise, Comparação, DEDICADO, Entregadores, Prioridade, UTR, Valores, detalhes de Marketing e Fluxo semanal de Marketing. Entregadores e Marketing exportam o conjunto integral, não somente as linhas já carregadas na tabela; ambos validam totais/páginas. Valores consulta o conjunto completo em ação de exportação e reaplica busca e ordenação. As demais telas mantêm os filtros usados em cada guia.
- Corrigi o índice da linha de total na exportação comparativa. A planilha destacava a linha anterior; agora aplica o destaque a `SOMA TOTAL OFICIAL`. Uma geração sintética criou oito abas, serializou e reabriu o XLSX; a linha e o destaque ficaram na posição correta.
- O botão Excel da apresentação agora bloqueia cliques repetidos, informa a geração e apresenta erros por toast. No modal de detalhes do Marketing, separei `exportLoading` de `loading`: o botão mostra progresso e a tabela mantém os dados enquanto a planilha é preparada.
- `DashboardExcelExport.ts` não tinha importador nem botão associado; sua remoção elimina uma função órfã, sem retirar uma ação disponível da interface.

### Paginação de Valores e banco remoto

- A lista visível consulta páginas de 100 por `/api/dashboard/data`, mas um cache miss no servidor ainda chama `listar_valores_entregadores`, recebe e processa a resposta integral e só então calcula a página. Isso reduz bytes enviados ao browser e evita repetir preparação durante o cache; não reduz a agregação SQL nem comprova menor latência da primeira página. A amostra Edge continua pequena: três chamadas em 24 h, p50 4,05 s e p95 6,50 s.
- A lista remota de migrations confirma que `drop_unused_values_page_rpc` já foi aplicada. Portanto, a paginação atual é da API Node/cache e não depende da RPC de página experimental removida do banco.
- A checagem permaneceu somente leitura no Supabase. Não apliquei DDL nem removi índices.

### Erro de login na captura

- A aba local nova abriu `/login` sem erro e o bundle servido inclui “Tentar validar novamente”. Nos últimos 60 minutos, os quatro pedidos a `/auth/v1/token` foram `refresh_token` com HTTP 200; houve três leituras de `user_profiles` com HTTP 200. Não encontrei concessão `password` nessa janela, então esses eventos não identificam a tentativa da imagem. A causa visual ainda não foi reproduzida no bundle atual.
- Reexaminei a captura em 15:20 UTC. O aviso continua sem o botão de nova tentativa, mas o componente compilado e servido ainda contém esse botão e o estado de validação pendente o habilita; uma aba local separada abre limpa. Isso é compatível com uma página antiga, mas não comprova essa hipótese.
- Nos logs de 15:00–15:14 UTC, o único `POST /auth/v1/token` identificado respondeu 200 e foi classificado como `refresh_token`; não apareceu `grant_type=password`, `/auth/v1/user` nem leitura de `/rest/v1/user_profiles`. Não consigo associar essa janela à tentativa da captura. Mantive uma aba local de login aberta para uma nova tentativa feita pelo usuário, sem usar credenciais.

### Verificação

- `npx tsc --noEmit` passou; `npm run lint` passou sem avisos; `git diff --check` terminou com código 0 (o Git ainda lista avisos de conversão LF/CRLF em arquivos modificados). O smoke XLSX comparativo de dados sintéticos passou e o arquivo temporário foi removido. Não executei build porque o servidor de desenvolvimento ativo compartilha `.next`.

## Fallback de validação de perfil — 2026-10-03 15:35 UTC

- A captura mais recente ainda mostra falha na validação do perfil. Ao revisar o diff do fluxo, encontrei uma regressão possível no fallback do servidor: tanto a leitura direta do navegador quanto a API de perfil passaram a consultar `user_profiles` com a sessão do usuário. Se a leitura por RLS falhasse, a API devolvia 503 sem uma segunda via de leitura. Restaurei no servidor a consulta com o cliente `service_role`, limitada ao `id` que `loadAuthenticatedUser` acabou de validar; a chave permanece exclusivamente no servidor. Erros da consulta continuam explícitos e não são tratados como perfil inexistente.
- A conta da captura já havia sido confirmada com perfil aprovado, e a política remota permite ler a própria linha por `auth.uid()`. Nos logs consultados às 15:32 UTC não havia novo grant `password` nem evento de leitura de `user_profiles` que pudesse ser correlacionado à captura. Portanto, a regressão foi removida, mas a causa exata daquela tentativa ainda não foi reproduzida pelo browser.
- O ambiente local não possui `SUPABASE_SERVICE_ROLE_KEY`; assim, a via direta permitida por RLS continua sendo o caminho normal. Se ela falhar, o fallback do servidor agora retorna a mensagem específica de configuração ausente em vez de repetir a mesma leitura com a sessão. Ainda falta uma nova tentativa do usuário para confirmar o resultado visível.
- Após a correção, `npx tsc --noEmit` e `npm run lint` passaram. `git diff --check` terminou com código 0 e apenas os avisos habituais LF/CRLF. Não fiz login com a senha mostrada na captura, não rodei testes nem build e não alterei o banco remoto.

## Funções RPC internas e latência observada — 2026-10-03 15:43 UTC

### Caminho de execução fixo

- Os advisors apontaram cinco funções de manutenção com `search_path` herdado da sessão. Inspecionei os corpos: tabelas persistentes, RPCs e `cron` já estavam qualificados por esquema; três rotinas usam tabelas temporárias de trabalho.
- Apliquei `20261003154100_fix_function_search_paths_after_incremental_refresh.sql`. As rotinas com tabelas temporárias agora usam somente `pg_catalog, pg_temp`; as demais e os helpers de RLS usam caminho vazio. Os quatro grants `authenticated EXECUTE` necessários às políticas foram preservados.
- A leitura pós-migração confirmou os caminhos configurados e o advisor deixou de reportar `function_search_path_mutable`. Segue o aviso das quatro funções auxiliares `SECURITY DEFINER` chamadas pelas políticas; não revoguei esses grants porque são usados no RLS. Esta mudança é de segurança/consistência, não um ganho de velocidade medido.

### Tráfego de produção — 24 h até 15:42 UTC

Os valores são `response.origin_time` do Supabase; medem chamadas Supabase, não a experiência completa no navegador. `p95` de amostras pequenas deve ser lido como sinal, não como estimativa estável.

| RPC | Chamadas | Erros | p50 | p95 | Máximo |
| --- | ---: | ---: | ---: | ---: | ---: |
| `listar_entregadores_v2` | 23 | 3 | 1,31 s | 8,38 s | 8,59 s |
| `listar_valores_entregadores` | 3 | 0 | 4,05 s | 6,77 s | 6,77 s |
| `dashboard_resumo` | 34 | 0 | 566 ms | 1,75 s | 2,02 s |
| `listar_anos_disponiveis` | 29 | 0 | 446 ms | 2,28 s | 2,39 s |
| `get_available_weeks` | 22 | 0 | 400 ms | 1,09 s | 1,48 s |
| `calcular_utr_completo` | 22 | 0 | 427 ms | 1,01 s | 1,11 s |
| `list_pracas_disponiveis` | 9 | 0 | 868 ms | 2,72 s | 2,72 s |
| `listar_todas_semanas` | 4 | 0 | 1,56 s | 2,63 s | 2,63 s |

- No mesmo período não houve chamadas HTTP externas para `listar_entregadores_dashboard_page_v1`; as 23 consultas de entregadores chegaram ao wrapper `listar_entregadores_v2`, com três respostas de erro. O wrapper pode chamar `listar_entregadores_dashboard_fast_v1` internamente quando os parâmetros e o papel se qualificam; `track_functions=none` impede confirmar quantas chamadas usaram esse ramo. A paginação otimizada do checkout não foi comprovada em produção, e os dados não permitem atribuir uma porcentagem de redução end-to-end às mudanças locais.
- O advisor de performance segue com dez índices informativos “unused”, pequenos e ligados a chat, histórico, tags, metas e apresentações, além da configuração informativa de limite fixo de dez conexões para Auth. Não removi índices sem evidência de que as respectivas telas/relatórios podem dispensá-los.

## Leitura de perfil sem credencial privilegiada — 2026-10-03 15:49 UTC

- A captura mais recente ainda mostra erro após o envio do login. Na janela consultada, o endpoint Auth recebeu duas requisições de token com HTTP 200; uma foi classificada como renovação. Isso confirma que a etapa de autenticação pode concluir, mas não associa com certeza esses eventos à captura. Os logs atuais não permitem vincular uma leitura específica de `user_profiles` ao erro visual.
- A introspecção remota confirmou as colunas usadas pelo login e uma política SELECT que permite `id = auth.uid()`. O checkout não tem `SUPABASE_SERVICE_ROLE_KEY` em `.env.local`; não consultei nem exibi nenhuma chave.
- Ajustei a API de perfil: com bearer token ou sessão de cookie validada, o servidor lê a linha do próprio usuário com o cliente público e o mesmo escopo RLS. Assim, consultar um perfil existente não depende de `service_role`; essa chave segue necessária apenas para provisionar uma linha que esteja ausente. O perfil é filtrado pelo ID retornado pelo Auth.
- A rota local responde 401 a uma chamada anônima, como esperado. Isso confirma que a rota foi carregada, mas não substitui uma tentativa autenticada. A validação visual ainda depende de recarregar a página e repetir o login.
- Também corrigi o primeiro render do ticker de cidades: sem cache, ele agora marca o escopo como pendente desde o render inicial e preserva o espaço do ticker com um placeholder até a resposta. Com dados disponíveis, o ticker mantém os itens anteriores enquanto atualiza.
- `npx tsc --noEmit` passou, `npm run lint` passou sem avisos e `git diff --check` terminou com código 0. Não executei testes nem build, pois o servidor de desenvolvimento ativo compartilha `.next`.

## Rechecagem da captura de login — 2026-10-03 16:11 UTC

- A captura enviada ainda não pode ser correlacionada a uma tentativa autenticada: nos logs Supabase entre 15:40 e 16:10 UTC não apareceu chamada de Auth nem acesso a `user_profiles`.
- `http://localhost:3000/login` respondeu HTTP 200. O chunk atual `/_next/static/chunks/app/login/page.js` respondeu HTTP 200 e contém o botão `Tentar validar novamente`, que deveria aparecer com a mensagem de validação mostrada na captura. A imagem não mostra esse botão, então não corresponde ao componente servido no momento da checagem; aba ou estado de formulário antigo é uma hipótese, não causa confirmada.
- Não alterei o fluxo de autenticação nem as permissões do banco com base nessa imagem. Deixei uma aba nova do login local aberta; a próxima tentativa após recarga forçada deve permitir correlacionar o comportamento atual com os logs, sem compartilhar senha.

## Fechamento da rodada — 2026-10-03 16:30 UTC

### Latência e SQL observados

Janela de 24 horas terminada às 16:30 UTC. Os percentis foram calculados com `quantileExact`; `response.origin_time` mede o processamento no Supabase, não a duração completa percebida no navegador. Amostras pequenas, sobretudo Valores, não sustentam um percentual de melhoria.

| RPC | Chamadas | Respostas não 2xx | p50 | p95 | Máximo |
| --- | ---: | ---: | ---: | ---: | ---: |
| `listar_entregadores_v2` | 22 | 2 | 1,31 s | 8,38 s | 8,59 s |
| `listar_valores_entregadores` | 3 | 0 | 4,05 s | 6,77 s | 6,77 s |
| `dashboard_resumo` | 21 | 0 | 1,07 s | 1,64 s | 2,02 s |
| `get_available_weeks` | 21 | 0 | 225 ms | 1,09 s | 1,48 s |
| `listar_anos_disponiveis` | 28 | 0 | 456 ms | 2,28 s | 2,39 s |
| `get_city_last_updates` | 11 | 0 | 435 ms | 1,50 s | 1,50 s |

- A RPC `listar_entregadores_dashboard_page_v1` existe no banco, mas não recebeu chamadas HTTP na janela. A implementação chama a RPC de conjunto completo, materializa o JSON de todos os entregadores e só depois filtra, ordena e forma a página. Ela reduz o payload de resposta, mas não remove a agregação completa; ainda não há tráfego de produção que comprove ganho de tempo.
- A origem rápida de Valores e a RPC pública retornaram os mesmos 8.693 entregadores e os mesmos valores por ID na comparação registrada anteriormente; a diferença observada foi a ordem dos empates. A função de ordenação agora também aplica `total_taxas DESC`, seguido por nome e ID, antes do fatiamento no servidor. Isso estabiliza as páginas que vêm da origem rápida. A comparação não mediu uma redução de latência.
- O advisor de performance ainda aponta dez índices informativos não usados, principalmente em chat, histórico, tags, metas, gamificação e apresentações. A lista inclui índices pequenos e estatísticas de uso não têm uma janela de reset correlacionada às telas; não removi nenhum. Os índices largos das views de entregadores se sobrepõem em colunas, mas têm leituras registradas e não foram removidos por contagem baixa isolada.
- O diretório de migrations local tem 11 arquivos correspondentes entre 786 registros remotos; alinhei os nove nomes de arquivo aos IDs já aplicados. Continua sendo um histórico local parcial e este checkout não tem `supabase/config.toml`; não é um snapshot suficiente para reconstruir o banco desde o início.

### Login mostrado na captura

- Entre 16:00 e 16:25 UTC, os logs mostraram renovações de sessão, sem nova autenticação por senha ou leitura de `user_profiles` que pudesse ser ligada à captura. O Supabase confirma grant de leitura e política RLS para a linha do próprio usuário. A causa da mensagem permanece sem reprodução correlacionada; o código servido contém o botão de retry, ausente na imagem.
- O `.env.local` tem somente URL e chave pública. Isso não impede ler um perfil existente pela política RLS; afeta apenas a via administrativa que provisiona um perfil ausente. Não alterei a política nem contornei RLS.

### Verificação final desta atualização

- `npx tsc --noEmit`, `npm run lint` e `git diff --check` passaram. O Git continuou emitindo apenas avisos de conversão LF/CRLF já presentes nos arquivos editados. Não rodei testes nem build, não apliquei nova migração e não fiz commit ou push.

## Paginação relacional de Entregadores — 2026-10-03 16:55 UTC

- A migração `20261003164157_entregadores_page_relational_source.sql` adiciona uma origem relacional para a página, sem serializar o conjunto inteiro em JSON e convertê-lo de volta em linhas. A RPC externa `listar_entregadores_dashboard_page_v2` executa essa origem somente quando o intervalo tem até 14 dias e não usa semana, busca ou filtro de dedicados; demais casos continuam em `page_v1`. A migração `20261003165502_limit_entregadores_page_fast_path.sql` limita explicitamente essa rota após o teste anual não retornar dentro de aproximadamente 93 s e a consulta ser interrompida.
- Em um recorte ativo de 14 dias (20/09–03/10/2026), a resposta JSON completa da nova rota foi idêntica à antiga: 3.978 entregadores, os mesmos 50 itens da primeira página, resumo, rankings e metadados. Com filtro de praça, as respostas também coincidiram (1.901 resultados). `p_limit = 0` retornou os mesmos 3.978 registros da exportação integral. Uma medição `EXPLAIN ANALYZE` por caminho registrou 155,382 ms na antiga e 112,645 ms na nova (−27,5%, −42,7 ms). É uma única comparação com buffers aquecidos, apenas do banco; não mede navegador nem sustenta ganho anual ou de produção.
- A RPC de página não teve chamadas HTTP nas 24 h verificadas às 16:30 UTC. Portanto a mudança local ainda não tem validação de tráfego real. O p95 observado anteriormente de 8,38 s e os timeouts de `listar_entregadores_v2` seguem sem correção comprovada; não atribuo redução a esses resultados.
- Confirmei que apenas `service_role` pode executar as novas funções internas e a nova RPC, que permanece inacessível a `authenticated`. O advisor continua reportando as quatro funções auxiliares `SECURITY DEFINER` usadas pelo RLS; não alterei esses grants.
- Reconsultei os advisors às 17:03 UTC: permanecem dez índices informativos sem leituras registradas e o limite fixo de dez conexões de Auth. Os índices dos agregados têm uso registrado; o índice sem leituras na tabela incremental é chave primária. Não removi índices nem alterei a configuração de Auth sem prova de que a carga da aplicação pode dispensá-los. Referências: [advisor de SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [advisor de índices sem uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), [alocação de conexões de Auth](https://supabase.com/docs/guides/deployment/going-into-prod).
- A conta da captura de login tem usuário Auth e linha em `user_profiles`. A causa da mensagem ainda não foi correlacionada com uma requisição; a existência da linha não prova que o fluxo visual passou a funcionar.
- `npx tsc --noEmit`, `npm run lint` e `git diff --check` passaram. Não rodei build porque o servidor de desenvolvimento segue usando `.next`, nem fiz commit ou push.

## Correção do token na validação do perfil — 2026-10-03 17:12 UTC

- Ao investigar a mensagem da captura, encontrei a causa no uso de `@supabase/supabase-js`: definir `Authorization` em `global.headers` não basta para consultas PostgREST, porque o cliente gera esse cabeçalho a partir da chave pública quando não tem sessão própria. Isso fazia a leitura do perfil usar a chave anon em vez do token recém-autenticado.
- Corrigi a consulta direta do login e a API de perfil para fornecer o token pela opção `accessToken` do cliente Supabase. O fallback que obtém o usuário por Auth continua num cliente separado, pois o namespace `auth` não fica disponível quando a opção `accessToken` é configurada.
- A política remota de `user_profiles` permite a leitura da própria linha por `auth.uid()`, e a conta da captura possui linha. Essa combinação explica a falha apesar do perfil existir; a correção agora faz a consulta aplicar a identidade correta.
- `npx tsc --noEmit`, `npm run lint` e `git diff --check` passaram. Um smoke isolado com `fetch` simulado confirmou que a configuração `accessToken` envia o token recebido ao PostgREST; não usou token real. Ainda falta uma nova tentativa visual de login para confirmar o resultado após a mudança. Não rodei build, não alterei RLS e não usei credenciais da captura.

## Revisão dos estados de carregamento — 2026-10-03 17:18 UTC

- Revisei os estados iniciais e de troca de filtro em Valores por Cidade, Valores, Entregadores, Prioridade, UTR, Marketing (comparação e entrada/saída) e DEDICADO. As telas aguardam o primeiro resultado com skeleton/feedback de erro; quando já há resposta válida no mesmo escopo, mostram os dados anteriores com aviso de atualização. Os estados vazios só aparecem depois que a consulta atual resolve sem dados.
- A tela de Valores por Cidade mantém os cards anteriores durante uma atualização dentro da mesma organização e escopo de acesso; mudanças de organização/permissão ocultam esses dados até o novo resultado. Esse comportamento corresponde ao aviso já visível na tela.
- Apliquei `MotionConfig reducedMotion="user"` ao shell público e autenticado para Framer Motion respeitar a preferência do sistema; os estilos CSS também mantêm regras `prefers-reduced-motion`. TypeScript e lint passaram, mas ainda não medi a animação visual com um dispositivo configurado para movimento reduzido.

## Login concluído; bloqueio local de chave do servidor — 2026-10-03 17:36 UTC

- A captura mais recente mostra o usuário já dentro de `/`; a etapa de login e validação do perfil avançou. O bloqueio atual é no carregamento de dados do dashboard, com a mensagem de que `SUPABASE_SERVICE_ROLE_KEY` não está configurada.
- O `.env.local` aponta para o projeto `ulmobmmlkevxswxpcyza` e contém URL e chave pública, mas não a chave privilegiada do servidor. Não li nem exibi segredo algum. O `sbp_...` compartilhado anteriormente é um PAT da Management API, não uma chave de API do banco; a documentação oficial descreve PATs como credenciais da Management API ([Supabase: Personal Access Tokens](https://supabase.com/docs/guides/platform/personal-access-tokens)).
- A inspeção remota confirmou que as RPCs de dashboard usadas aqui (`dashboard_resumo`, `calcular_utr_completo`, `listar_entregadores_dashboard_fast_v1`, `listar_valores_entregadores` e as rotas de página) são `SECURITY DEFINER` e só concedem `EXECUTE` a `service_role`. Remover a exigência ou conceder execução ampla sem redesenhar e revisar essas funções abriria um caminho privilegiado; não fiz essa alteração. O dashboard local precisa de uma chave de servidor em `SUPABASE_SERVICE_ROLE_KEY` (ou nome compatível aceito pelo helper), sem prefixo `NEXT_PUBLIC_`, e reinício do servidor Next.js.
- A ausência dessa chave já existia em `HEAD`: a versão base chamava `createServiceRoleClient()` no serviço do dashboard. Portanto, a captura é uma limitação de configuração local, não uma regressão introduzida pelo ajuste do login. Ainda assim, ela bloqueia a validação visual das guias e dos filtros até a chave ser configurada.
- Métricas do gateway nas últimas 24 h até 17:31 UTC: `listar_entregadores_v2` teve 18 respostas 200 (p50 687 ms, p95 5,12 s, máximo 5,14 s) e 2 respostas 500 (p50 8,27 s, máximo 8,38 s); `dashboard_resumo` teve 14 chamadas, p50 1,28 s e máximo 2,02 s; `listar_anos_disponiveis` teve 26, p50 451 ms e máximo 2,39 s; `get_available_weeks` teve 20, p50 314 ms e máximo 1,48 s; `list_pracas_disponiveis` teve 10, p50 850 ms e máximo 2,72 s. Os p95 são instáveis nas amostras pequenas.
- `pg_stat_statements` tem `stats_reset = NULL`, então não atribuí sua janela a um período específico. Entre as entradas normalizadas de PostgREST, a chamada antiga `listar_entregadores_v2` soma 328 chamadas, média 4,97 s e máximo 25,14 s; a variante com busca soma 990 chamadas, média 728 ms e máximo 7,68 s. A RPC otimizada de página não tem tráfego de cliente registrado; seus números anteriores são apenas uma comparação isolada de banco.
- Git confirmado às 17:36 UTC: branch `main`, `main...origin/main` = `0/0` commits de diferença, último commit `058e6c6d`; há 211 caminhos modificados ou não rastreados no checkout. Não fiz commit nem push.
- Atualizei a mensagem de configuração para orientar o desenvolvimento local a definir `SUPABASE_SERVICE_ROLE_KEY` em `.env.local` e reiniciar `npm run dev`; em produção, ela orienta a configurar a variável no provedor e fazer novo deploy. O erro também avisa para não usar `NEXT_PUBLIC_`.

## Origem dos erros SQL agregados — 2026-10-03 17:42 UTC

- Agreguei os logs PostgreSQL das últimas 24 horas por SQLSTATE, severidade e `application_name`, sem ler consultas, detalhes, tokens ou identificadores de usuários. Foram 37 entradas `ERROR`: 35 com `application_name = mgmt-api` e 2 com `application_name = postgrest`. Os erros de coluna/relação/função inexistentes, sintaxe e ambiguidades pertencem ao tráfego da Management API e não devem ser contabilizados como falhas das telas do dashboard.
- As duas ocorrências PostgREST eram cancelamentos `57014`, em 2026-10-02 às 22:53 UTC na rotina `listar_entregadores_v2` e às 23:58 UTC em `listar_entregadores_dashboard_fast_v1`. São compatíveis com os dois erros lentos já observados no gateway; não encontrei novo cancelamento PostgREST no período mais recente da janela. O cancelamento da RPC de página às 16:57 UTC veio de `mgmt-api`, portanto não comprova falha de tráfego do cliente.
- A conclusão prática permanece: os gargalos prioritários de cliente são as chamadas lentas de Entregadores, enquanto erros de SQL feitos por Management API ficam fora da contagem de falhas da aplicação. A validação das guias locais continua limitada pela ausência de `SUPABASE_SERVICE_ROLE_KEY`; não alterei grants para contornar isso.

## Cobertura do caminho rápido e footprint dos índices — 2026-10-03 17:45 UTC

- A revisão do fluxo confirma que a guia Entregadores envia `p_limit` e usa a RPC de página para a tabela principal. A `page_v2` só escolhe a origem relacional nova quando a janela tem até 14 dias, sem semana única/múltipla, sem busca e sem “somente dedicados”. Ano inteiro, filtros por semana, busca e janelas maiores ainda delegam à `page_v1`, que produz a resposta completa antes de paginar. Portanto a comparação de −27,5% anterior cobre intervalos curtos; não demonstra melhoria para os filtros mais amplos que ainda precisam de otimização.
- Introspecção de tamanho estimado: `mv_entregadores_agregado` tem ~1,03 milhão de linhas, heap de 429 MB e índices somando 3.404 MB; `tb_entregadores_agregado_incremental` tem ~363 mil linhas, heap de 78 MB e índices de 430 MB. Há índices com prefixos de chave semelhantes, mas todos os principais listados têm leituras registradas. `stats_reset` é `NULL`, então não há janela confiável para comparar essas contagens.
- Esse footprint torna consolidação de índices uma frente relevante para reduzir espaço e custo de refresh/escrita, mas contagem positiva e período desconhecido não justificam excluir índice usado. Não apliquei `DROP INDEX` nem alterei os índices; uma consolidação segura exige comparar planos e consultas representativas, sobretudo do caminho anual/semanal, antes/depois e manter opção de reversão.

## Filtros de dimensão e caminho rápido semanal — 2026-10-03 18:10 UTC

- A causa das listas vazias para usuários com acesso a todas as praças era o hook de dimensões: sem uma praça selecionada, ele usava arrays vazios do carregamento inicial e não chamava `get_dashboard_dimension_options`. A RPC aceita `p_pracas = []` para consultar as dimensões da organização. Validado no banco: essa chamada retornou 94 subpraças, 268 origens e 111 turnos em uma organização de amostra, sem retornar os valores das dimensões.
- O payload de filtro agora mantém todos os valores selecionados na forma CSV legada e nos arrays tipados usados por `dashboard_resumo`/`dashboard_evolucao_bundle`. UTR, Entregadores e Valores aceitam listas CSV para subpraça/origem; DEDICADO aceita subpraça. Antes, as guias que só enviavam o campo singular usavam apenas o primeiro item selecionado. A presença de arrays de subpraça, origem e turno também conta como filtro ativo.
- O fallback de UTR agora filtra `dados_corridas.periodo` pelo turno selecionado. A comparação das categorias distintas no banco confirmou que os 111 valores de `periodo` e de `turno` são os mesmos.
- Limite de cobertura confirmado no esquema: `mv_entregadores_agregado` e `tb_entregadores_agregado_incremental` não têm coluna de turno, e as RPCs de Entregadores/Valores não recebem esse parâmetro. Assim, turno é filtrável no resumo, evolução e UTR, mas não restringe as guias Entregadores, Prioridade, DEDICADO ou Valores. A RPC do DEDICADO também não recebe origem. Dar suporte nessas guias requer uma origem agregada por turno; não passei um parâmetro que o RPC ignora ou rejeita.
- A nova migração `20261003180248_entregadores_single_iso_week_fast_path.sql` foi aplicada ao Supabase. A igualdade completa contra a RPC anterior foi confirmada nas semanas ISO 36–39, página 2 da semana 39, semana 39 com praça e inativos, semanas 38–39 e intervalo de 14 dias (17–30/09). Em semana 39, a página antiga levou 166,785 ms e a nova 111,038 ms: diferença observada de −33,4% (−55,7 ms) em uma comparação do banco, sem representar a latência completa nem uma medição de produção.
- `npx tsc --noEmit`, `npm run lint` e `git diff --check` passaram. A validação visual local segue bloqueada pela ausência de `SUPABASE_SERVICE_ROLE_KEY` no ambiente de desenvolvimento; não consultei nem expus essa credencial. Não rodei build porque o servidor ativo compartilha `.next`.

## Nova checagem dos filtros de dimensão — 2026-10-03 18:36 UTC

- O smoke do `buildFilterPayload` confirmou que seleções múltiplas de subpraça, origem e turno são preservadas tanto nos parâmetros CSV quanto nos arrays tipados. `FiltroMultiSelect` atualiza os arrays e os campos singulares de compatibilidade; `dashboard_resumo` recebe os arrays, e Evolução e UTR recebem os parâmetros CSV correspondentes.
- A cobertura varia por guia: Dashboard, Análise, Evolução e UTR aceitam subpraça, origem e turno. Entregadores/Prioridade e Valores enviam subpraça e origem, mas removem turno da allowlist da consulta. DEDICADO envia apenas subpraça; origem e turno são ignorados. As tabelas agregadas usadas por Entregadores/Valores não possuem dimensão de turno, então esse filtro exige uma fonte agregada que retenha turno e validação de custo antes de ampliar a consulta.
- O `.env.local` segue sem `SUPABASE_SERVICE_ROLE_KEY` (ou um dos nomes alternativos aceitos). O carregamento das opções de dimensão e os endpoints de dados precisam dessa configuração no servidor; por isso, a execução local observada retorna erro de configuração antes de consultar os dados. Não foi possível validar o comportamento visual ou a resposta filtrada na sessão atual.
- Não alterei permissões RLS, RPCs nem criei migração para declarar um filtro que o banco não implementa. Depois que a chave de servidor estiver configurada localmente e o Next reiniciado, a validação visual pode confirmar os filtros já cobertos. Ampliar turno e a cobertura do DEDICADO requer mudança de origem/RPC e avaliação de desempenho.
- A checagem de código passou em `npx tsc --noEmit`, `npm run lint` e `git diff --check`. O smoke do payload também passou. Não rodei build porque o servidor de desenvolvimento ativo compartilha `.next`.

## Transições e gravação final de XLSX — 2026-10-03 18:42 UTC

- A revisão do `ViewTransition` confirmou troca simultânea com fade/deslocamento de 150 ms e ajuste de layout de 200 ms. `MotionConfig reducedMotion="user"`, `useReducedMotion` e as media queries CSS removem o movimento quando o sistema solicita. Não encontrei uma regressão estática nova; a aparência não pôde ser conferida na sessão atual porque a configuração local bloqueia os dados do painel.
- Inspecionei o XML dos arquivos gerados com `xlsx-js-style`: a propriedade `!freeze` não é escrita como `<pane>`, então os cabeçalhos ainda não ficam congelados ao rolar, apesar da configuração no helper. Dados, valores numéricos, formatos, filtros de tabela, proteção contra fórmulas e limite de linhas passaram nos smokes anteriores.
- Um smoke com 9.000 linhas confirmou que é possível inserir o painel congelado ao recomprimir o pacote XLSX, mas a etapa adicional de descompactação/recompactação levou cerca de 146 ms além da escrita, com cópias temporárias do arquivo inteiro em memória. Registrei a limitação em vez de introduzir esse custo nos exports sem uma estratégia adequada para arquivos grandes.
