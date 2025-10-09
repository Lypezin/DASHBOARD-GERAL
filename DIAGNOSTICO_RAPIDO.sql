-- =====================================================================
-- 🔍 DIAGNÓSTICO RÁPIDO - VER O QUE ESTÁ RETORNANDO
-- =====================================================================

-- 1. Verificar se MV tem dados
SELECT '1️⃣ Materialized View' as teste, COUNT(*) as registros FROM public.mv_aderencia_agregada;

-- 2. Ver o que dashboard_resumo retorna (formato)
SELECT '2️⃣ Dashboard Resumo' as teste, jsonb_pretty(public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL)) as resultado;

-- 3. Verificar tipos de dados em dimensoes
SELECT 
  '3️⃣ Tipos em dimensoes' as teste,
  jsonb_typeof((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'dimensoes') as tipo_dimensoes,
  jsonb_typeof((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'dimensoes'->'pracas') as tipo_pracas,
  jsonb_typeof((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'dimensoes'->'semanas') as tipo_semanas,
  jsonb_typeof((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'totais') as tipo_totais,
  jsonb_typeof((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'semanal') as tipo_semanal;

-- 4. Ver totais específicos
SELECT 
  '4️⃣ Totais de corridas' as teste,
  (public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL)->'totais'->>'corridas_ofertadas')::bigint as ofertadas,
  (public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL)->'totais'->>'corridas_aceitas')::bigint as aceitas;

-- 5. Ver quantidade de arrays
SELECT 
  '5️⃣ Tamanho dos arrays' as teste,
  jsonb_array_length((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'semanal') as qtd_semanal,
  jsonb_array_length((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'dia') as qtd_dia,
  jsonb_array_length((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'dimensoes'->'pracas') as qtd_pracas;

