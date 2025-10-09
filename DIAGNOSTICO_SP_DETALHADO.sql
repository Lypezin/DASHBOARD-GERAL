-- =====================================================================
-- 🔍 DIAGNÓSTICO DETALHADO DE SP
-- =====================================================================

-- 1. Descobrir o nome EXATO de SP
SELECT '1️⃣ NOMES DE SP NO BANCO' as info;
SELECT DISTINCT praca 
FROM public.dados_corridas 
WHERE praca ILIKE '%SP%' OR praca ILIKE '%PAULO%' OR praca ILIKE '%SAO%'
ORDER BY praca;

-- 2. Contar registros por praça
SELECT '2️⃣ QUANTIDADE DE REGISTROS POR PRAÇA' as info;
SELECT 
  praca,
  COUNT(*) as total_registros,
  MIN(data_do_periodo) as primeira_data,
  MAX(data_do_periodo) as ultima_data
FROM public.dados_corridas
GROUP BY praca
ORDER BY total_registros DESC;

-- 3. Ver se SP está na MV
SELECT '3️⃣ SP NA MATERIALIZED VIEW' as info;
SELECT 
  praca,
  COUNT(*) as registros_mv,
  SUM(total_corridas_ofertadas) as corridas
FROM public.mv_aderencia_agregada
WHERE praca ILIKE '%SP%' OR praca ILIKE '%PAULO%' OR praca ILIKE '%SAO%'
GROUP BY praca;

-- 4. Teste RÁPIDO com limite
SELECT '4️⃣ TESTE RÁPIDO (com LIMIT)' as info;
SELECT 
  SUM(total_corridas_ofertadas) as corridas,
  COUNT(*) as registros
FROM public.mv_aderencia_agregada
WHERE praca = 'SAO PAULO'
LIMIT 1000;

