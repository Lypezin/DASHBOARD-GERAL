# 📚 Guia de Otimização - Disk IO e Performance

## ⚠️ Sobre `work_mem` e `statement_timeout`

### 🔧 `work_mem`
**O que é:** Memória alocada para cada operação de ordenação/hash em uma query.

**Valores seguros:**
- ✅ **4MB - 32MB**: Ideal para a maioria das queries
- ⚠️ **64MB - 128MB**: Apenas para queries complexas específicas
- ❌ **256MB+**: EVITE! Pode causar problemas de memória

**Por que 256MB é problemático:**
```
Se você tem 10 usuários simultâneos executando a função:
10 usuários × 256MB = 2.56GB de RAM apenas para work_mem!

Isso pode:
- Esgotar a RAM do servidor
- Forçar o PostgreSQL a usar disco (swap)
- AUMENTAR o Disk IO em vez de reduzir
- Causar lentidão generalizada
```

**Recomendação:**
```sql
SET work_mem = '128MB'  -- Máximo recomendado
SET work_mem = '64MB'   -- Ideal para a maioria dos casos
SET work_mem = '32MB'   -- Seguro e eficiente
```

### ⏱️ `statement_timeout`
**O que é:** Tempo máximo que uma query pode executar antes de ser cancelada.

**Valores recomendados:**
- ✅ **30s - 60s**: Ideal para dashboards interativos
- ⚠️ **120s**: Apenas para relatórios pesados
- ❌ **0 (sem limite)**: NUNCA use em produção!

**Por que limites são importantes:**
```
Sem timeout:
- Queries mal otimizadas podem travar o servidor
- Usuários podem disparar queries acidentalmente e bloquear recursos
- Disk IO fica constantemente alto

Com timeout adequado:
- Queries ineficientes falham rapidamente
- Recursos são liberados para outras requisições
- Disk IO se mantém controlado
```

## 🔥 Principais Causas de Alto Disk IO

### 1. **Queries sem índices apropriados**
```sql
-- ❌ Ruim: Full table scan
SELECT * FROM dados_corridas WHERE praca = 'GUARULHOS';

-- ✅ Bom: Com índice
CREATE INDEX idx_praca ON dados_corridas(praca);
```

### 2. **Subconsultas correlacionadas repetidas**
```sql
-- ❌ Ruim: Subconsulta executa para CADA linha
SELECT 
  praca,
  (SELECT COUNT(*) FROM dados_corridas dc2 WHERE dc2.praca = dc.praca)
FROM dados_corridas dc;

-- ✅ Bom: GROUP BY executa uma vez
SELECT praca, COUNT(*)
FROM dados_corridas
GROUP BY praca;
```

### 3. **DISTINCT sem necessidade**
```sql
-- ❌ Ruim: DISTINCT força ordenação completa
SELECT DISTINCT * FROM dados_corridas;

-- ✅ Bom: Especifique apenas colunas necessárias
SELECT DISTINCT praca, ano_iso FROM dados_corridas;
```

### 4. **Agregações de toda a tabela**
```sql
-- ❌ Ruim: Lê tabela inteira toda vez
SELECT COUNT(*) FROM dados_corridas;

-- ✅ Bom: Use materialized views para agregações frequentes
CREATE MATERIALIZED VIEW mv_stats AS
SELECT praca, COUNT(*) as total
FROM dados_corridas
GROUP BY praca;
```

## 🎯 Otimizações Aplicadas na Função `dashboard_resumo`

### ✅ Redução de `work_mem`
```sql
-- Antes: 256MB (excesso)
SET work_mem = '256MB'

-- Depois: 128MB (adequado)
SET work_mem = '128MB'
```

### ✅ Redução de `statement_timeout`
```sql
-- Antes: 120s (muito tempo)
SET statement_timeout = '120s'

-- Depois: 60s (razoável)
SET statement_timeout = '60s'
```

### ✅ Correção de GROUP BY
```sql
-- Antes: Subconsulta correlacionada problemática
SELECT 
  EXTRACT(ISODOW FROM dc.data_do_periodo) AS dia_iso
FROM dados_corridas dc
GROUP BY dia_iso

-- Depois: Subquery intermediária
FROM (
  SELECT 
    EXTRACT(ISODOW FROM data_do_periodo)::INTEGER AS dia_iso_group
  FROM dados_corridas
  WHERE ...
) dia_calc
GROUP BY dia_iso_group
```

## 📊 Monitoramento de Disk IO

### Como verificar consumo atual:
```sql
-- Ver queries mais custosas
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Ver uso de índices
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Links úteis fornecidos pela Supabase:
- **Consumo diário:** [Supabase Dashboard - Daily IO]
- **Consumo por hora:** [Supabase Dashboard - Hourly IO]
- **Guia oficial:** [High Disk IO Consumption Guide](https://supabase.com/docs/guides/platform/performance#high-disk-io-consumption)

## 🚀 Próximos Passos Recomendados

1. **Execute a correção:**
   ```bash
   # Aplicar CORRIGIR_GROUP_BY_E_OTIMIZAR.sql no Supabase
   ```

2. **Monitore por 24h:**
   - Verifique se Disk IO diminuiu
   - Observe tempos de resposta do dashboard
   - Acompanhe erros de timeout

3. **Se ainda houver problemas:**
   - Considere criar materialized views para agregações
   - Adicione índices compostos específicos
   - Avalie upgrade de compute add-on

4. **Considere upgrade apenas se:**
   - Disk IO continua alto após otimizações
   - Você tem >100 usuários simultâneos
   - Dados crescem >1M registros/semana

## 📝 Conclusão

**Sobre a pergunta "é correto usar esses valores?"**

❌ **256MB work_mem + 120s timeout:** NÃO é correto para produção
- Causa mais problemas do que resolve
- Aumenta consumo de memória e Disk IO
- Pode travar o banco com múltiplos usuários

✅ **128MB work_mem + 60s timeout:** SIM, é adequado
- Permite queries complexas mas com controle
- Previne queries problemáticas de travar o sistema
- Mantém performance equilibrada

**Regra de ouro:**
> "Otimize a query, não aumente os recursos."
> Aumentar work_mem é como colocar um motor maior em um carro com pneus furados.
> Primeiro conserte os pneus (otimize as queries).

