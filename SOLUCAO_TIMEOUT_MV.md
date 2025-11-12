# 🔧 Solução para Timeout ao Atualizar Materialized Views

## Problema
Ao tentar atualizar as Materialized Views após upload de dados, você recebe o erro:
```
Error: SQL query ran into an upstream timeout
```

## Solução Completa

### 🚀 Passo 1: Instalar Sistema Automático (RECOMENDADO)

Execute o arquivo `sistema_atualizacao_automatica_mv.sql` no Supabase SQL Editor.

**O que este sistema faz:**
- ✅ Atualiza automaticamente as MVs quando você adiciona dados
- ✅ Processa uma MV por vez (evita timeout)
- ✅ Funciona em background (não bloqueia)
- ✅ Atualiza automaticamente a cada 5 minutos

### 📋 Passo 2: Comandos para Atualização Manual (se necessário)

Se você precisar atualizar imediatamente após o upload, use estes comandos:

#### Opção 1: Atualizar MVs Pendentes (SEM TIMEOUT) ⭐ RECOMENDADO
```sql
SELECT * FROM public.refresh_pending_mvs();
```
Este comando atualiza apenas as MVs que precisam, uma por vez, evitando timeout.

#### Opção 2: Atualizar uma MV específica
```sql
SELECT public.refresh_single_mv('mv_aderencia_agregada');
```
Ou:
```sql
SELECT public.refresh_single_mv('mv_dashboard_aderencia_metricas');
```

#### Opção 3: Verificar Status
```sql
SELECT * FROM public.check_mv_status();
```
Veja quais MVs precisam ser atualizadas.

## Como Funciona o Sistema Automático

1. **Trigger**: Quando você insere dados em `dados_corridas`, um trigger marca automaticamente que as MVs precisam atualização
2. **Job Automático**: A cada 5 minutos, um job verifica e atualiza as MVs pendentes
3. **Processamento Inteligente**: Atualiza uma MV por vez, evitando timeout

## Vantagens

✅ **Sem Timeout**: Processa uma MV por vez  
✅ **Automático**: Não precisa fazer nada após upload  
✅ **Inteligente**: Só atualiza o que precisa  
✅ **Rastreável**: Você pode ver o status de cada MV  

## Comandos Rápidos

### Atualizar tudo agora (sem timeout)
```sql
SELECT * FROM public.refresh_pending_mvs();
```

### Ver status
```sql
SELECT * FROM public.check_mv_status();
```

### Atualizar MV específica
```sql
SELECT public.refresh_single_mv('mv_dashboard_aderencia_metricas');
```

## Troubleshooting

### O sistema automático não está funcionando?
1. Verifique se executou `sistema_atualizacao_automatica_mv.sql`
2. Execute manualmente: `SELECT * FROM public.refresh_pending_mvs();`

### Ainda está dando timeout?
- Use `refresh_pending_mvs()` em vez de `REFRESH MATERIALIZED VIEW` direto
- Ou atualize uma MV por vez: `SELECT public.refresh_single_mv('mv_nome');`

### Os dados não aparecem?
1. Verifique status: `SELECT * FROM public.check_mv_status();`
2. Force atualização: `SELECT * FROM public.refresh_pending_mvs();`
3. Aguarde alguns segundos e atualize a página do dashboard

## Resumo

**Para resolver o timeout:**
1. Execute `sistema_atualizacao_automatica_mv.sql` (uma vez)
2. Use `SELECT * FROM public.refresh_pending_mvs();` quando precisar atualizar manualmente

**Pronto!** Agora seus dados serão atualizados automaticamente sem timeout! 🎉

