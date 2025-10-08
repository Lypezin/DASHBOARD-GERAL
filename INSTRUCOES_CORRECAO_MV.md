# 🔧 Correção do Problema de Timeout com 1M+ Registros

## 🎯 Problema Identificado

O erro `Failed to load resource: 500` na função `refresh_mv_aderencia` ocorre porque:

1. A **Materialized View** (`mv_aderencia_agregada`) está tentando processar 1.3M+ registros de uma vez
2. O processo de `REFRESH MATERIALIZED VIEW` trava a view inteira durante a atualização
3. Com grande volume de dados, o processo excede o timeout do Supabase (60 segundos por padrão)
4. Enquanto o refresh está rodando, nenhuma query pode consultar a view, causando falhas em cascata

## ✅ Solução Implementada

### 1. **REFRESH CONCURRENTLY** (Mais Importante)

Mudamos para `REFRESH MATERIALIZED VIEW CONCURRENTLY` que:
- ✅ Permite consultas durante o refresh
- ✅ Não bloqueia o sistema
- ✅ Processa em segundo plano
- ⚠️ Requer um índice UNIQUE na view

### 2. **Upload Não-Bloqueante**

O upload agora **NÃO espera** o refresh terminar:
- ✅ Upload completa imediatamente
- ✅ Refresh acontece em segundo plano
- ✅ Usuário pode fechar a página
- ⚠️ Dados agregados levam alguns minutos para aparecer

### 3. **Melhorias nos Destaques**

Cards de destaques agora são menores e mais compactos.

---

## 📋 Passos para Aplicar a Correção

### **PASSO 1: Executar o Script de Correção**

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `fix_materialized_view.sql`
4. Copie **TODO O CONTEÚDO** do arquivo
5. Cole no SQL Editor
6. Clique em **RUN**
7. Aguarde a execução (pode levar 2-5 minutos)

### **PASSO 2: Fazer o Primeiro Refresh Manual**

Após executar o script acima, execute este comando separadamente:

```sql
SELECT public.refresh_mv_aderencia();
```

⏳ **IMPORTANTE**: Este primeiro refresh pode levar 5-10 minutos com 1.3M registros.  
Durante este tempo, o dashboard pode mostrar dados desatualizados, mas **NÃO VAI TRAVAR**.

### **PASSO 3: Deploy das Alterações do Frontend**

```bash
git add -A
git commit -m "fix: correção de timeout na materialized view com grandes volumes"
git push
```

O Vercel vai fazer o deploy automaticamente.

---

## 🔍 Como Verificar se Funcionou

### 1. **Verificar Status da Materialized View**

Execute no SQL Editor:

```sql
SELECT 
  'Materialized View' as tipo,
  pg_size_pretty(pg_total_relation_size('public.mv_aderencia_agregada')) as tamanho,
  (SELECT COUNT(*) FROM public.mv_aderencia_agregada) as registros;
```

Você deve ver:
- **Tamanho**: Aproximadamente 1-10% do tamanho da tabela principal
- **Registros**: Menos que a tabela principal (porque é agregado)

### 2. **Testar Upload**

1. Importe um arquivo pequeno (1000-5000 linhas)
2. O upload deve completar em segundos
3. Você verá a mensagem: "Aguarde alguns minutos para os dados agregados serem processados"
4. Aguarde 2-3 minutos
5. Atualize a página
6. Os dados devem aparecer

### 3. **Verificar Logs**

No console do navegador (F12), você deve ver:

```
Refresh da materialized view iniciado em segundo plano
```

ou

```
Refresh assíncrono não disponível, será processado automaticamente
```

Ambos são OK! O importante é que o upload **NÃO TRAVA** mais.

---

## 🚀 Melhorias de Performance Aplicadas

### ✅ Já Implementado

1. **Índice UNIQUE** na materialized view (`row_id`)
2. **Índices de busca** em ano, semana, dia, período, praça, sub_praça, origem
3. **REFRESH CONCURRENTLY** para não bloquear
4. **Timeout aumentado** para 5 minutos na função de refresh
5. **Upload assíncrono** - não espera o refresh terminar

### 🔄 Manutenção Recomendada

#### Executar Semanalmente (ou após grandes importações):

```sql
-- Atualizar estatísticas
ANALYZE public.dados_corridas;
ANALYZE public.mv_aderencia_agregada;

-- Refresh manual da view (se necessário)
SELECT public.refresh_mv_aderencia();
```

#### Executar Mensalmente:

```sql
-- Otimizar tabelas (executar em horário de baixo uso)
VACUUM ANALYZE public.dados_corridas;
VACUUM ANALYZE public.mv_aderencia_agregada;
```

---

## 🆘 Solução de Problemas

### ❌ Problema: "ainda está dando erro 500"

**Solução**: Execute estes comandos para verificar:

```sql
-- 1. Verificar se a MV existe
SELECT * FROM pg_matviews WHERE schemaname = 'public';

-- 2. Verificar se tem índice único
SELECT * FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'mv_aderencia_agregada'
  AND indexdef LIKE '%UNIQUE%';

-- 3. Verificar se a função existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'refresh_mv_aderencia';
```

Se algum não retornar resultados, execute o script `fix_materialized_view.sql` novamente.

---

### ❌ Problema: "dados não aparecem após importar"

**Solução**: Aguarde mais tempo e force o refresh:

```sql
-- Forçar refresh imediato
SELECT public.refresh_mv_aderencia();

-- Verificar se terminou
SELECT 
  schemaname,
  matviewname,
  last_refresh
FROM pg_matviews 
WHERE schemaname = 'public';
```

---

### ❌ Problema: "muito lento mesmo com as correções"

Se você tem **5M+ registros**, considere executar `performance_optimization.sql`:

```bash
# No SQL Editor, execute:
1. Seção 3: Índices compostos adicionais
2. Seção 4: ANALYZE
3. Seção 11: Configurar autovacuum
```

Se tiver **10M+ registros**, considere **particionamento** (consulte seção 9 do `performance_optimization.sql`).

---

## 📊 Monitoramento

### Query para Monitorar Performance:

```sql
-- Tempo de execução do dashboard
EXPLAIN ANALYZE 
SELECT * FROM public.dashboard_resumo(
  p_ano := NULL,
  p_semana := NULL,
  p_praca := NULL,
  p_sub_praca := NULL,
  p_origem := NULL
);
```

**Tempo esperado**:
- < 1 segundo: Excelente ✅
- 1-3 segundos: Bom ✅
- 3-10 segundos: Aceitável ⚠️
- > 10 segundos: Requer otimização ❌

---

## 🎯 Próximos Passos (Opcional)

Para volumes muito grandes (5M+), considere:

1. **Particionamento por Ano** - dividir tabela em partições
2. **Materialized Views por Praça** - uma MV por praça
3. **Cache em Redis** - cachear resultados do dashboard
4. **Job Agendado** - refresh automático a cada 6 horas via Vercel Cron

---

## 📞 Suporte

Se ainda tiver problemas após seguir todos os passos:

1. Execute o script de diagnóstico:
   ```sql
   -- Cole o conteúdo completo do 'performance_optimization.sql'
   -- Seções 1, 2, 5, 10 e 14
   ```

2. Copie os resultados das queries

3. Compartilhe para análise detalhada
