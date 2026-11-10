# Diagnóstico de egress e atualização — 10/11/2026

## Linha de base

- A captura de 04/11 mostra 1,511 GB em Shared Pooler e 31,802 MB em PostgREST. Não há identificação do projeto nem do cliente do pooler na captura; os logs acessíveis para esse dia não incluem uma fonte Supavisor. Não atribuir o consumo à dashboard sem comprovação.
- As estatísticas `pg_stat_statements` são acumuladas desde 19/10 e não medem bytes por consulta. Contagens e tempo não demonstram participação no egress de 04/11.
- Em 10/11, os quatro campos de processamento incremental de dashboard, entregadores, corridas e comparação não tinham pendências nos 19.895 impactos consultados. O backfill semanal tinha 97 registros, sem pendências nos dois campos de conclusão.
- Onze entradas de `mv_refresh_control` estavam marcadas para atualização completa. A marcação de aderência nos impactos não participa dos quatro contadores de fila; valor nulo por si só não confirma pendência ativa.
- As funções `get_admin_stats` e `list_pracas_disponiveis_otimizada` referenciam `mv_aderencia_agregada`; `get_entregadores_marketing` referencia `mv_entregadores_marketing`. Não foi identificado tráfego dessas funções nas estatísticas consultadas, o que não prova ausência de uso por outros clientes ou caminhos internos.
- Nos logs do gateway das 24 horas consultadas: 83 chamadas à RPC de estado da fila, 81 à lista de MVs pendentes, 128 lotes de importação e 122 chamadas à RPC rápida de entregadores. Os logs não disponibilizam o tamanho das respostas.
- Na consulta do cache de Entregadores, 564 das 693 entradas já estavam mais de 24 horas além do vencimento, somando cerca de 172,9 MB em representação JSON dentro do banco. Esses números descrevem o conteúdo armazenado, não o tráfego efetivo: as consultas selecionam chaves específicas.
- O rollout da paginação semanal estava desabilitado, após registro de regressão de tempo. Não habilitá-lo sem novos ensaios de paridade e latência.
- Das 104 entradas de cache ainda válidas no momento da consulta, 30 foram gravadas antes da alteração incremental mais recente do projeto. As chaves são hashes; não é possível afirmar por essa consulta se as entradas correspondem à organização e aos períodos afetados. O código anterior não tinha invalidação explícita das entradas compartilhadas ou dos caches em memória do servidor.
- Dependências entre visões encontradas no catálogo: `vw_comparison_weekly_current` usa `mv_comparison_weekly`; `vw_corridas_agregadas_current`, `mv_entregadores_ativacao` e `mv_entregadores_summary` usam `mv_corridas_agregadas`; `vw_dashboard_resumo_current` usa `mv_dashboard_resumo`; `vw_entregadores_agregado_current` e `mv_valores_entregador` usam `mv_entregadores_agregado`. Essas dependências não determinam sozinhas quais caminhos estão ativos na aplicação.

## Alterações locais

- Falhas e respostas incompletas da fila passam a gerar erro; falhas ao reagendar também são propagadas. A importação não limpa flags antigas de MVs automaticamente.
- Após tentativa de gravação parcial, a importação inicia o acompanhamento incremental sem descartar os arquivos ou sinalizar sucesso.
- O acompanhamento incremental consulta apenas o estado incremental. Com a fila estável, passa de duas RPCs a cada 5 segundos para uma a cada 15 segundos: de 24 para 4 RPCs por minuto, redução teórica de 83,3% nesse trecho. A detecção de conclusão pode demorar até 15 segundos. Isso não mede a redução de egress total.
- As leituras do cache compartilhado de Entregadores não transferem entradas além do prazo de reaproveitamento de 30 minutos ou 24 horas, conforme o período. A tolerância para recuperação após erro é preservada. Uma consulta mista aplica o maior prazo no banco e a regra exata para cada entrada na aplicação.
- Uma comparação somente de leitura sobre as 693 entradas presentes encontrou zero divergências entre os limites anteriores de reaproveitamento e os novos filtros para os prazos de 30 minutos e 24 horas. Essa comparação valida os limites, não a atualização ou os totais da dashboard.
- No fallback de Entregadores, erro de função ausente também respeita o limite de escopo que impede uma leitura ampla de corridas.
- A importação de corridas interrompe o envio no primeiro lote com erro ou resposta sem confirmação da quantidade e não passa para os arquivos seguintes. A interface informa as linhas confirmadas; o resultado do lote incerto precisa ser reconciliado antes de reenviar.
- O log de desempenho da API da dashboard inclui a indicação de cache em memória. `response_bytes` é o tamanho do JSON da aplicação, não uma medição de bytes efetivos do Supabase ou do Shared Pooler.
- A migração `20261110125516_dashboard_cache_revision.sql` acrescenta revisões por organização, alteradas na mesma transação que as corridas e o processamento dos impactos. O código usa a revisão na chave dos caches de Entregadores, tanto em memória quanto no banco; se ela não puder ser consultada, não reutiliza esses caches. Um identificador global também muda depois do refresh completo registrado em `mv_refresh_control` e ao recriar a estrutura. Refreshes feitos diretamente por SQL sem atualizar esse controle não são cobertos. Outras guias mantêm suas políticas atuais de cache.
- A migração `20261110125523_corridas_batch_idempotency.sql` cria comprovantes transacionais por organização, importação e número de lote. O navegador conserva a identificação do arquivo e sua impressão SHA-256 até concluir. A repetição do mesmo lote retorna o comprovante; conteúdo diferente para a mesma chave é rejeitado. A proteção requer que a retomada utilize os mesmos arquivos e o mesmo armazenamento local; uma nova importação deliberada em outro navegador ou após limpar esse armazenamento gera nova identificação.
- A nova RPC de importação mantém `insert_dados_corridas_batch` no nome, pois o agendador atual de refresh completo identifica por esse trecho as importações em andamento. Alterar esse nome sem atualizar o agendador poderia permitir concorrência indevida.
- Em uma amostra real de 08/11 com cinco combinações de organização, data e dimensões (630 registros), as somas de ofertadas, aceitas e completadas da tabela de corridas coincidiram com `vw_dashboard_resumo_current`. Não é uma validação de todos os períodos, organizações ou guias.

## Ordem de disponibilização

As duas migrações foram aplicadas ao projeto `DASHBOARD GERAL` em 10/11/2026, antes da publicação da aplicação. A consulta da revisão, os sete gatilhos e as permissões de execução foram verificados no banco; anon não pode executar as novas RPCs. O Security Advisor informa RLS sem políticas nas três tabelas internas novas: isso é intencional, pois são acessadas apenas pelo serviço/funções privilegiadas. A tela antiga aberta durante a troca deve ser recarregada para enviar a identificação do lote. Ainda é necessário verificar concorrência e tempo de importação com dados representativos; o PostgreSQL isolado usado aqui não reproduz a carga de produção. Não há comprovação de redução real do Shared Pooler até medir após a liberação.

Os testes locais podem ser executados com `node --test tests/*.test.cjs`. O teste de integração SQL é ignorado quando `PGLITE_MODULE` não está definido. Para executá-lo no Windows, instalar `@electric-sql/pglite@0.5.16` em um diretório temporário e definir `PGLITE_MODULE` para o caminho do pacote antes de executar o comando. Essa ferramenta foi instalada fora do repositório para esta verificação.

Validação desta rodada: 27 testes passaram, incluindo as duas migrações no PostgreSQL isolado; TypeScript, `npm run lint` e `npm run build` concluíram. O lint apresentou seis avisos existentes de uso de `console`. O teste SQL não substitui uma importação autenticada ponta a ponta nem uma medição de desempenho em ambiente Supabase com dados e concorrência representativos.

## Medição e trabalho restante

1. Na página de consumo do Supabase, selecionar explicitamente o projeto e identificar clientes Supavisor, ferramentas de BI, backups, conexões externas e automações no período do pico. Correlacionar horários com as atividades reais.
2. Em ambiente autenticado, medir respostas de cada guia e de cada filtro, distinguindo cache, caminho rápido e fallback. Repetir com o mesmo usuário, organização, filtros e dados depois de publicar as alterações.
3. Rastrear chamadas diretas e indiretas das onze MVs e comparar dados apresentados com a origem. Não remover visões nem limpar indicadores sem verificar consumidores e frescor.
4. Em ambiente Supabase isolado, ensaiar importações grandes, falhas entre lotes, repetição, atualização concorrente e retomada com as duas migrações e a aplicação completa.
5. Comparar mensalmente o volume por serviço e por projeto, além de quantidade, tempo e tamanho das respostas dos fluxos medidos. Separar resultados de Supavisor e PostgREST. A variação total de egress só pode ser calculada com dados posteriores em condições comparáveis.
