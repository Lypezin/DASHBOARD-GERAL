# Recomendações de Otimização para Funções SQL

## Funções a Otimizar

### 1. `listar_entregadores`

**Padrões de Query:**
- Filtra por: `data_do_periodo` (range) OU `ano_iso`/`semana_numero`
- Filtra por: `praca`, `sub_praca`, `origem`
- Agrupa por: `id_da_pessoa_entregadora`
- Agrega: `SUM()` de corridas, tempos

**Recomendações:**
1. Garantir que condições WHERE estejam na ordem correta para uso de índices:
   - Primeiro: `data_do_periodo` (quando presente) OU `ano_iso`/`semana_numero`
   - Depois: `praca`, `sub_praca`, `origem`
   - Sempre: `id_da_pessoa_entregadora IS NOT NULL AND id_da_pessoa_entregadora != ''`

2. Usar índices criados:
   - Com intervalo de datas: `idx_dados_corridas_entregador_data_filtros`
   - Com ano/semana: `idx_dados_corridas_entregador_ano_semana`

3. Quando não há intervalo de datas, usar materialized view `mv_entregadores_agregados` (já implementado)

### 2. `listar_valores_entregadores`

**Padrões de Query:**
- Filtra por: `data_do_periodo` (range) OU `ano_iso`/`semana_numero`
- Filtra por: `praca`, `sub_praca`, `origem`
- Agrupa por: `id_da_pessoa_entregadora`
- Agrega: `SUM()` de corridas aceitas, taxas

**Recomendações:**
1. Mesmas recomendações de `listar_entregadores`
2. Usar índices criados:
   - Com intervalo de datas: `idx_dados_corridas_entregador_data_filtros`
   - Com ano/semana: `idx_dados_corridas_entregador_ano_semana`
3. Quando não há intervalo de datas, usar materialized view `mv_valores_entregadores_agregados` (já implementado)

### 3. `calcular_utr`

**Padrões de Query:**
- Filtra por: `data_do_periodo` (range) OU `ano_iso`/`semana_numero`
- Filtra por: `praca`, `sub_praca`, `origem`
- Agrupa por: `praca`, `sub_praca`, `origem`, `turno`

**Recomendações:**
1. Usar índices criados:
   - Com intervalo de datas: `idx_dados_corridas_data_filtros`
   - Com ano/semana: `idx_dados_corridas_ano_semana_filtros`

2. Garantir ordem de condições WHERE:
   - Primeiro: `data_do_periodo` (quando presente) OU `ano_iso`/`semana_numero`
   - Depois: `praca`, `sub_praca`, `origem`

## Ordem de Aplicação das Condições WHERE

Para garantir uso eficiente de índices, aplicar condições na seguinte ordem:

1. **Filtros de data (mais seletivos):**
   ```sql
   -- Com intervalo de datas:
   AND d.data_do_periodo >= p.data_inicial 
   AND d.data_do_periodo <= p.data_final
   
   -- OU com ano/semana:
   AND (p.ano IS NULL OR d.ano_iso = p.ano)
   AND (p.semana IS NULL OR d.semana_numero = p.semana)
   ```

2. **Filtros de localização:**
   ```sql
   AND (p.pracas IS NULL OR d.praca = ANY(p.pracas))
   AND (p.sub_pracas IS NULL OR d.sub_praca = ANY(p.sub_pracas))
   AND (p.origens IS NULL OR d.origem = ANY(p.origens))
   ```

3. **Filtros de validação (sempre):**
   ```sql
   AND d.data_do_periodo IS NOT NULL
   AND d.id_da_pessoa_entregadora IS NOT NULL
   AND d.id_da_pessoa_entregadora != ''
   ```

## Verificação de Uso de Índices

Após criar os índices, execute `EXPLAIN ANALYZE` para verificar:

```sql
-- Exemplo para listar_entregadores com intervalo de datas
EXPLAIN ANALYZE
SELECT 
  d.id_da_pessoa_entregadora,
  MAX(d.pessoa_entregadora) AS nome_entregador,
  SUM(d.numero_de_corridas_ofertadas)::bigint AS corridas_ofertadas
FROM public.dados_corridas d
WHERE d.data_do_periodo >= '2025-01-01' 
  AND d.data_do_periodo <= '2025-01-31'
  AND d.praca = 'SP'
  AND d.id_da_pessoa_entregadora IS NOT NULL
  AND d.id_da_pessoa_entregadora != ''
GROUP BY d.id_da_pessoa_entregadora;
```

Verifique se o plano de execução mostra:
- `Index Scan using idx_dados_corridas_entregador_data_filtros` (ou similar)
- Não deve mostrar `Seq Scan` (scan sequencial completo)

## Notas Importantes

1. As funções SQL já estão otimizadas para usar materialized views quando não há intervalo de datas
2. Os índices criados devem melhorar significativamente a performance quando há intervalo de datas
3. Execute `ANALYZE` após criar os índices para atualizar estatísticas
4. Monitore uso de índices com `pg_stat_user_indexes`

