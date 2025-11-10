# Backup - Otimização de Performance do Dashboard

**Data:** Janeiro 2025  
**Objetivo:** Resolver problemas de performance no carregamento do dashboard de aderência (mais de 1 minuto para carregar)

## Problema Identificado

O dashboard estava demorando mais de 1 minuto para carregar, especialmente para contas admin que carregam todas as cidades. O problema estava na função `dashboard_resumo` que fazia:

1. **Full table scan** na tabela `dados_corridas` (1.74M de linhas)
2. **Operações complexas** de `DISTINCT ON` e `GROUPING SETS` em tempo real
3. **Cálculos repetidos** de `string_to_array` para cada linha
4. **Join complexo** para calcular horas planejadas vs horas entregues

## Solução Implementada

### 1. Criação de Materialized View

Criada a materialized view `mv_dashboard_aderencia_metricas` que pré-agrega os dados:

```sql
CREATE MATERIALIZED VIEW public.mv_dashboard_aderencia_metricas AS
WITH base AS (
  SELECT 
    ano_iso, semana_numero, dia_iso, periodo, praca, sub_praca, origem,
    SUM(numero_de_corridas_ofertadas) AS corridas_ofertadas,
    SUM(numero_de_corridas_aceitas) AS corridas_aceitas,
    SUM(numero_de_corridas_rejeitadas) AS corridas_rejeitadas,
    SUM(numero_de_corridas_completadas) AS corridas_completadas,
    SUM(COALESCE(tempo_disponivel_absoluto_segundos, hhmmss_to_seconds(tempo_disponivel_absoluto))) AS horas_entregues_segundos
  FROM dados_corridas
  WHERE data_do_periodo IS NOT NULL
  GROUP BY ano_iso, semana_numero, dia_iso, periodo, praca, sub_praca, origem
),
planejado AS (
  SELECT 
    dedup.ano_iso, dedup.semana_numero, dedup.dia_iso, dedup.periodo, 
    dedup.praca, dedup.sub_praca, dedup.origem,
    SUM(dedup.duracao_base_segundos * dedup.numero_minimo::numeric) AS horas_planejadas_segundos
  FROM (
    SELECT DISTINCT ON (dc.data_do_periodo, dc.periodo, dc.praca, dc.sub_praca, dc.origem) 
      dc.ano_iso, dc.semana_numero, dc.dia_iso, dc.periodo, dc.praca, dc.sub_praca, dc.origem,
      COALESCE(dc.duracao_segundos, hhmmss_to_seconds(dc.duracao_do_periodo)) AS duracao_base_segundos,
      COALESCE(dc.numero_minimo_de_entregadores_regulares_na_escala, 0) AS numero_minimo
    FROM dados_corridas dc
    WHERE dc.data_do_periodo IS NOT NULL
    ORDER BY dc.data_do_periodo, dc.periodo, dc.praca, dc.sub_praca, dc.origem, 
             dc.numero_minimo_de_entregadores_regulares_na_escala DESC
  ) dedup
  GROUP BY dedup.ano_iso, dedup.semana_numero, dedup.dia_iso, dedup.periodo, 
           dedup.praca, dedup.sub_praca, dedup.origem
)
SELECT 
  b.ano_iso, b.semana_numero, b.dia_iso, b.periodo, b.praca, b.sub_praca, b.origem,
  b.corridas_ofertadas, b.corridas_aceitas, b.corridas_rejeitadas, b.corridas_completadas,
  b.horas_entregues_segundos,
  COALESCE(p.horas_planejadas_segundos, 0::numeric) AS horas_planejadas_segundos
FROM base b
LEFT JOIN planejado p ON 
  b.ano_iso = p.ano_iso 
  AND b.semana_numero = p.semana_numero 
  AND b.dia_iso = p.dia_iso 
  AND NOT b.periodo IS DISTINCT FROM p.periodo 
  AND NOT b.praca IS DISTINCT FROM p.praca 
  AND NOT b.sub_praca IS DISTINCT FROM p.sub_praca 
  AND NOT b.origem IS DISTINCT FROM p.origem;
```

**Pontos importantes:**
- Usa `IS NOT DISTINCT FROM` para comparar valores `NULL` corretamente
- Usa `COALESCE` para evitar `NULL` em multiplicações
- Pré-agrega dados por todas as dimensões necessárias

### 2. Índices na Materialized View

```sql
CREATE INDEX idx_mv_aderencia_filtros_principais 
ON public.mv_dashboard_aderencia_metricas (ano_iso, semana_numero, praca);

CREATE INDEX idx_mv_aderencia_filtros_secundarios 
ON public.mv_dashboard_aderencia_metricas (sub_praca, origem, periodo);
```

### 3. Atualização da Função `dashboard_resumo`

A função foi simplificada para ler diretamente da materialized view:

```sql
CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL,
  p_turno text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
WITH params AS (
  SELECT
    p_ano AS ano,
    p_semana AS semana,
    CASE WHEN p_praca IS NULL OR p_praca = '' THEN NULL
         ELSE string_to_array(regexp_replace(p_praca, '\s*,\s*', ','), ',')::text[] END AS pracas,
    CASE WHEN p_sub_praca IS NULL OR p_sub_praca = '' THEN NULL
         ELSE string_to_array(regexp_replace(p_sub_praca, '\s*,\s*', ','), ',')::text[] END AS sub_pracas,
    CASE WHEN p_origem IS NULL OR p_origem = '' THEN NULL
         ELSE string_to_array(regexp_replace(p_origem, '\s*,\s*', ','), ',')::text[] END AS origens,
    CASE WHEN p_turno IS NULL OR p_turno = '' THEN NULL
         ELSE string_to_array(regexp_replace(p_turno, '\s*,\s*', ','), ',')::text[] END AS turnos
),
filtered_data AS (
  SELECT mv.*
  FROM public.mv_dashboard_aderencia_metricas mv
  CROSS JOIN params p
  WHERE (p.ano IS NULL OR mv.ano_iso = p.ano)
    AND (p.semana IS NULL OR mv.semana_numero = p.semana)
    AND (p.pracas IS NULL OR (mv.praca IS NOT NULL AND mv.praca = ANY(p.pracas)))
    AND (p.sub_pracas IS NULL OR (mv.sub_praca IS NOT NULL AND mv.sub_praca = ANY(p.sub_pracas)))
    AND (p.origens IS NULL OR (mv.origem IS NOT NULL AND mv.origem = ANY(p.origens)))
    AND (p.turnos IS NULL OR (mv.periodo IS NOT NULL AND mv.periodo = ANY(p.turnos)))
),
-- ... resto da função (GROUPING SETS, métricas, JSON)
```

**Melhorias:**
- Lê de materialized view pré-agregada (muito mais rápido)
- Processa filtros uma vez na CTE `params`
- Usa índices para filtros principais

### 4. Atualização da Materialized View

A materialized view precisa ser atualizada periodicamente. Para atualização manual:

```sql
REFRESH MATERIALIZED VIEW public.mv_dashboard_aderencia_metricas;
```

**Nota:** Para atualização automática, pode ser configurado um `pg_cron` job ou trigger.

## Resultados Esperados

- **Performance:** Redução de mais de 1 minuto para alguns segundos
- **Escalabilidade:** Suporta crescimento de dados sem degradação significativa
- **Manutenibilidade:** Código mais simples e fácil de entender

## Problemas Enfrentados e Soluções

### 1. Timeout ao Criar/Atualizar Materialized View

**Problema:** `Connection terminated due to connection timeout` ao tentar criar/atualizar a view.

**Solução:** 
- Usar Supabase CLI para conectar diretamente ao banco (sem pooler)
- Executar com `SET statement_timeout = 0;`
- Terminar sessões antigas de `dashboard_resumo` que estavam bloqueando

### 2. Horas Planejadas Zeradas

**Problema:** Após criar a materialized view, as horas planejadas apareciam como zero.

**Causa:** O `LEFT JOIN` não estava associando corretamente quando dimensões eram `NULL`.

**Solução:** Usar `IS NOT DISTINCT FROM` em vez de `=` para comparar valores `NULL` corretamente:

```sql
AND NOT b.periodo IS DISTINCT FROM p.periodo 
AND NOT b.praca IS DISTINCT FROM p.praca 
AND NOT b.sub_praca IS DISTINCT FROM p.sub_praca 
AND NOT b.origem IS DISTINCT FROM p.origem
```

### 3. Erro "mv_dashboard_aderencia_metricas is not a materialized view"

**Problema:** Tentativa de usar `DROP MATERIALIZED VIEW` em uma tabela.

**Solução:** Usar `DROP TABLE IF EXISTS` antes de recriar como `MATERIALIZED VIEW`.

## Comandos Úteis

### Verificar tamanho da materialized view
```sql
SELECT 
  pg_size_pretty(pg_total_relation_size('public.mv_dashboard_aderencia_metricas')) AS tamanho_total,
  pg_size_pretty(pg_relation_size('public.mv_dashboard_aderencia_metricas')) AS tamanho_dados,
  pg_size_pretty(pg_indexes_size('public.mv_dashboard_aderencia_metricas')) AS tamanho_indices;
```

### Verificar última atualização
```sql
SELECT 
  schemaname, 
  matviewname, 
  hasindexes,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) AS tamanho
FROM pg_matviews 
WHERE matviewname = 'mv_dashboard_aderencia_metricas';
```

### Atualizar materialized view (sem bloquear leituras)
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_dashboard_aderencia_metricas;
```

**Nota:** Requer índices únicos. Se não houver, usar `REFRESH MATERIALIZED VIEW` (bloqueia leituras).

## Próximos Passos (Opcional)

1. **Automatizar atualização:** Configurar `pg_cron` para atualizar a view periodicamente (ex: diariamente às 2h)
2. **Monitoramento:** Adicionar alertas se a view não for atualizada em X horas
3. **Particionamento:** Se os dados crescerem muito, considerar particionar a view por ano

## Arquivos Relacionados

- Função SQL: `public.dashboard_resumo`
- Materialized View: `public.mv_dashboard_aderencia_metricas`
- Índices: `idx_mv_aderencia_filtros_principais`, `idx_mv_aderencia_filtros_secundarios`

