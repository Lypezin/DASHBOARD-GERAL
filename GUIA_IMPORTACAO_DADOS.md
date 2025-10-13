# 📋 Guia de Importação de Dados e Atualização do Dashboard

## 🔍 **Problema Identificado**

Você importou dados até **12/10/2025**, mas o dashboard só mostra até **07/10/2025**.

### **Causa**
O dashboard utiliza uma **Materialized View (MV)** chamada `mv_aderencia_agregada` para otimizar o desempenho. Esta MV funciona como um "cache" dos dados e **não se atualiza automaticamente** quando você importa novos dados.

---

## ✅ **Solução Rápida (Execute Agora)**

1. **Abra o Supabase** (https://supabase.com)
2. Vá em **SQL Editor**
3. Execute este comando:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
```

4. **Aguarde** a execução (pode demorar 1-3 minutos dependendo do volume)
5. **Atualize** o dashboard no navegador (F5 ou Ctrl+R)

✅ **Pronto!** Os dados até 12/10/2025 devem aparecer agora.

---

## 📊 **Processo Completo de Importação**

### **Passo 1: Importar Dados no Supabase**
1. Vá em **Table Editor**
2. Selecione a tabela `Sheet1`
3. Clique em **Insert** > **Import data from CSV**
4. Faça o upload do seu arquivo
5. Confirme a importação

### **Passo 2: Verificar os Dados Importados**
Execute no SQL Editor:

```sql
SELECT 
  MAX(data_do_periodo) as data_mais_recente,
  COUNT(*) as total_registros
FROM public.Sheet1;
```

### **Passo 3: Atualizar a Materialized View**
Execute no SQL Editor:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
```

### **Passo 4: Verificar se Atualizou**
Execute no SQL Editor:

```sql
SELECT 
  MAX(data_periodo) as data_mais_recente_mv,
  COUNT(*) as total_registros_mv
FROM public.mv_aderencia_agregada;
```

---

## 🤖 **Automatizar o Refresh (Recomendado)**

Para **não precisar fazer isso manualmente toda vez**, configure um CRON job:

### **Opção 1: Refresh Diário (Recomendado)**
Se você importa dados 1x por dia, execute:

```sql
SELECT cron.schedule(
  'refresh-mv-aderencia-diario',
  '0 6 * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
  $$
);
```

Isso vai atualizar a MV **todos os dias às 6h da manhã** automaticamente.

### **Opção 2: Refresh a Cada 6 Horas**
Se você importa dados várias vezes ao dia, execute:

```sql
SELECT cron.schedule(
  'refresh-mv-aderencia-6h',
  '0 */6 * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
  $$
);
```

---

## 🛠️ **Comandos Úteis**

### **Ver Cron Jobs Cadastrados**
```sql
SELECT jobid, schedule, command, active, jobname
FROM cron.job
ORDER BY jobid;
```

### **Remover um Cron Job**
```sql
SELECT cron.unschedule('refresh-mv-aderencia-diario');
```

### **Ver Histórico de Execuções**
```sql
SELECT 
  jobid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

---

## ⚠️ **Problemas Comuns**

### **Erro: "cannot refresh materialized view concurrently"**
**Solução:** Execute sem `CONCURRENTLY`:
```sql
REFRESH MATERIALIZED VIEW public.mv_aderencia_agregada;
```

### **Erro: "extension pg_cron is not available"**
**Solução:** 
1. Vá em **Database** > **Extensions**
2. Procure por `pg_cron`
3. Clique em **Enable**

### **Dashboard ainda não mostra dados novos**
**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Faça logout e login novamente
3. Tente em uma aba anônima/privada

---

## 📝 **Resumo**

| Ação | Comando | Quando Executar |
|------|---------|-----------------|
| **Refresh Manual** | `REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;` | Após cada importação |
| **Refresh Automático Diário** | Ver seção "Automatizar" | Uma vez (configuração inicial) |
| **Verificar Dados** | `SELECT MAX(data_periodo) FROM mv_aderencia_agregada;` | Para confirmar atualização |

---

## 💡 **Dica Pro**

Se você usa Excel ou outro sistema para gerar os dados:
1. Configure o CRON job para rodar **diariamente às 6h**
2. Importe seus dados **antes das 6h** todos os dias
3. O sistema vai atualizar automaticamente e os usuários verão os dados mais recentes quando acessarem

---

## 📞 **Precisa de Ajuda?**

Se os dados ainda não aparecerem após seguir este guia:
1. Execute o script `ATUALIZAR_DADOS_NOVOS.sql` completo
2. Verifique se a tabela `Sheet1` tem os dados corretos
3. Confirme que não há filtros ativos no dashboard
4. Verifique se o usuário tem permissão para ver aquela praça/período

---

**Última atualização:** Outubro 2025

