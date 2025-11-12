# 🚀 Instalar Sistema de Atualização Automática de Materialized Views

## Problema
Ao fazer upload de novos dados, as Materialized Views não são atualizadas automaticamente, causando:
- Dados não aparecem no dashboard
- Necessidade de atualização manual
- Timeout ao tentar atualizar MVs grandes

## Solução
Sistema automático que:
- ✅ Marca automaticamente quando MVs precisam ser atualizadas
- ✅ Atualiza em background (sem timeout)
- ✅ Processa uma MV por vez de forma inteligente
- ✅ Funciona automaticamente após upload de dados

## Como Instalar

### Passo 1: Executar o Script SQL
1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `sistema_atualizacao_automatica_mv.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **Run**

### Passo 2: Verificar Instalação
Execute este comando para verificar se está funcionando:

```sql
SELECT * FROM public.check_mv_status();
```

Você deve ver uma lista de todas as Materialized Views com seu status.

### Passo 3: Testar
1. Faça um upload de dados pequeno
2. Aguarde 5 minutos
3. Verifique se os dados aparecem no dashboard

## Como Funciona

1. **Trigger Automático**: Quando você insere/atualiza/deleta dados em `dados_corridas`, um trigger marca automaticamente que as MVs precisam ser atualizadas

2. **Job Automático (pg_cron)**: A cada 5 minutos, um job verifica se há MVs pendentes e as atualiza automaticamente

3. **Atualização Inteligente**: O sistema atualiza uma MV por vez, evitando timeout

## Comandos Úteis

### Verificar Status
```sql
SELECT * FROM public.check_mv_status();
```

### Forçar Atualização Imediata (sem timeout)
```sql
SELECT * FROM public.refresh_pending_mvs();
```

### Atualizar uma MV específica
```sql
SELECT public.refresh_single_mv('mv_dashboard_aderencia_metricas');
```

### Verificar se o job automático está rodando
```sql
SELECT * FROM cron.job WHERE jobname = 'refresh-materialized-views';
```

## Vantagens

✅ **Sem Timeout**: Atualiza uma MV por vez, evitando timeout  
✅ **Automático**: Não precisa fazer nada após upload  
✅ **Inteligente**: Só atualiza MVs que realmente precisam  
✅ **Background**: Não bloqueia o sistema durante atualização  
✅ **Rastreável**: Você pode ver o status de cada MV  

## Troubleshooting

### O job automático não está rodando?
- Verifique se o pg_cron está habilitado no Supabase
- Execute manualmente: `SELECT * FROM public.refresh_pending_mvs();`

### Ainda está dando timeout?
- Use `refresh_pending_mvs()` em vez de `refresh_dashboard_mvs()`
- Ou atualize uma MV por vez: `SELECT public.refresh_single_mv('mv_nome');`

### Os dados não aparecem após 5 minutos?
- Verifique o status: `SELECT * FROM public.check_mv_status();`
- Force atualização: `SELECT * FROM public.refresh_pending_mvs();`

