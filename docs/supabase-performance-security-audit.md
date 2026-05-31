# Supabase Performance and Security Audit

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
- `dashboard_evolucao_bundle` foi otimizada para limitar o CTE base ao ano solicitado quando não há
  intervalo customizado. Medição com `2026/organização ativa`: ~1801ms antes, ~418ms depois.
- `listar_entregadores_v2` recebeu fast path para `ano + semana + organização` sem filtros extras.
  Medição com `2026/21/organização ativa`: ~1311ms antes, ~126ms depois.
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
- Dois índices experimentais testados em `mv_corridas_agregadas`/incremental não trouxeram
  ganho real e foram removidos na mesma rodada para evitar bloat e novos avisos.
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
| `get_fluxo_semanal` | ainda relevante | Preferir MV/colunas prontas e reduzir nomes detalhados quando nao precisa. |
| `list_pracas_disponiveis` | chamada repetida e lenta | Ja recebeu cache server-side curto na rota admin. |
| `get_city_last_updates` | chamada repetida | Ja recebeu cache server-side curto. |
| `get_available_weeks` | chamada repetida | Ja recebeu cache/dedupe client-side por ano/organizacao. |

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
