-- =====================================================================
-- 🔍 DIAGNÓSTICO COMPLETO: Por que SP não mostra dados?
-- =====================================================================

-- 1. Verificar o nome EXATO de SP no banco
SELECT '1️⃣ NOMES DE SP NO BANCO (dados_corridas)' as info;
SELECT DISTINCT praca, COUNT(*) as total
FROM public.dados_corridas 
WHERE praca ILIKE '%SP%' OR praca ILIKE '%PAULO%' OR praca ILIKE '%SAO%'
GROUP BY praca
ORDER BY total DESC;

-- 2. Verificar SP na MV
SELECT '2️⃣ SP NA MATERIALIZED VIEW' as info;
SELECT 
  praca,
  COUNT(*) as registros_mv,
  SUM(total_corridas_ofertadas) as corridas,
  MIN(ano_iso) as ano_min,
  MAX(ano_iso) as ano_max,
  MIN(semana_numero) as semana_min,
  MAX(semana_numero) as semana_max
FROM public.mv_aderencia_agregada
WHERE praca ILIKE '%SP%' OR praca ILIKE '%PAULO%' OR praca ILIKE '%SAO%'
GROUP BY praca;

-- 3. Verificar semana 30 especificamente
SELECT '3️⃣ SEMANA 30 - TODOS OS DADOS' as info;
SELECT 
  praca,
  semana_numero,
  COUNT(*) as registros,
  SUM(total_corridas_ofertadas) as corridas_ofertadas
FROM public.mv_aderencia_agregada
WHERE semana_numero = 30
GROUP BY praca, semana_numero
ORDER BY praca;

-- 4. Testar dashboard_resumo para SP semana 30
SELECT '4️⃣ TESTE: dashboard_resumo para SP S30' as info;
SELECT public.dashboard_resumo(NULL, 30, 'SAO PAULO', NULL, NULL) as resultado_sao_paulo;

-- 5. Testar com SÃO PAULO (com acento)
SELECT '5️⃣ TESTE: dashboard_resumo para SÃO PAULO S30' as info;
SELECT public.dashboard_resumo(NULL, 30, 'SÃO PAULO', NULL, NULL) as resultado_sao_paulo_acento;

-- 6. Verificar última atualização da MV
SELECT '6️⃣ INFORMAÇÕES DA MV' as info;
SELECT 
  schemaname,
  matviewname,
  hasindexes,
  ispopulated,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as tamanho
FROM pg_matviews 
WHERE matviewname = 'mv_aderencia_agregada';

-- 7. Contar registros por praça na MV
SELECT '7️⃣ TOP 10 PRAÇAS NA MV (por registros)' as info;
SELECT 
  praca,
  COUNT(*) as registros,
  MIN(semana_numero) as primeira_semana,
  MAX(semana_numero) as ultima_semana
FROM public.mv_aderencia_agregada
GROUP BY praca
ORDER BY registros DESC
LIMIT 10;

-- 8. Verificar se há registros vazios para SP
SELECT '8️⃣ REGISTROS DE SP COM DADOS ZERADOS' as info;
SELECT 
  praca,
  semana_numero,
  COUNT(*) as total_registros,
  SUM(CASE WHEN segundos_planejados = 0 AND segundos_realizados = 0 THEN 1 ELSE 0 END) as registros_zerados,
  SUM(CASE WHEN segundos_planejados > 0 OR segundos_realizados > 0 THEN 1 ELSE 0 END) as registros_com_dados
FROM public.mv_aderencia_agregada
WHERE (praca ILIKE '%SP%' OR praca ILIKE '%PAULO%' OR praca ILIKE '%SAO%')
  AND semana_numero BETWEEN 25 AND 35
GROUP BY praca, semana_numero
ORDER BY praca, semana_numero;

-- 9. Verificar índices da MV
SELECT '9️⃣ ÍNDICES DA MV' as info;
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'mv_aderencia_agregada'
ORDER BY indexname;

-- 10. SOLUÇÃO: Refresh da MV se estiver desatualizada
SELECT '🔄 EXECUTANDO REFRESH DA MV (aguarde 5-10 min)...' as info;
REFRESH MATERIALIZED VIEW public.mv_aderencia_agregada;

SELECT '✅ REFRESH COMPLETO!' as status;
SELECT 'Agora teste SP novamente no dashboard' as proximos_passos;

