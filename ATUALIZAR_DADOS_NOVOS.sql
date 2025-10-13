-- =====================================================================
-- SCRIPT PARA ATUALIZAR DADOS APÓS IMPORTAÇÃO
-- Execute este script sempre que importar novos dados no Supabase
-- =====================================================================

-- 1️⃣ VERIFICAR OS DADOS MAIS RECENTES NA TABELA ORIGINAL
-- Este comando mostra a data mais recente que você tem nos dados brutos
SELECT 
  MAX(data_do_periodo) as data_mais_recente,
  COUNT(*) as total_registros
FROM public.Sheet1;

-- 2️⃣ VERIFICAR OS DADOS MAIS RECENTES NA MATERIALIZED VIEW
-- Este comando mostra a data mais recente que está aparecendo no dashboard
SELECT 
  MAX(data_periodo) as data_mais_recente_mv,
  COUNT(*) as total_registros_mv
FROM public.mv_aderencia_agregada;

-- 3️⃣ ATUALIZAR A MATERIALIZED VIEW (REFRESH)
-- Este é o comando PRINCIPAL que você precisa executar após importar novos dados
-- Use CONCURRENTLY para não bloquear o dashboard durante a atualização
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;

-- 4️⃣ VERIFICAR NOVAMENTE APÓS O REFRESH
SELECT 
  MAX(data_periodo) as data_mais_recente_apos_refresh,
  COUNT(*) as total_registros_apos_refresh,
  COUNT(DISTINCT semana_numero) as total_semanas
FROM public.mv_aderencia_agregada;

-- 5️⃣ VERIFICAR DADOS POR DIA (últimos 7 dias)
SELECT 
  data_periodo,
  COUNT(*) as total_registros,
  COUNT(DISTINCT praca) as pracas_distintas
FROM public.mv_aderencia_agregada
WHERE data_periodo >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY data_periodo
ORDER BY data_periodo DESC;

-- =====================================================================
-- NOTAS IMPORTANTES:
-- =====================================================================
-- 
-- 📌 Sempre que você importar novos dados no Supabase, execute:
--    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
--
-- 📌 Se der erro "cannot refresh concurrently", execute sem CONCURRENTLY:
--    REFRESH MATERIALIZED VIEW public.mv_aderencia_agregada;
--
-- 📌 O refresh pode demorar alguns minutos dependendo do volume de dados
--
-- 📌 Você pode automatizar isso com um CRON job no Supabase:
--    Database > Cron Jobs > New Cron Job
--    Schedule: 0 6 * * * (todo dia às 6h da manhã)
--    SQL: REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
--
-- =====================================================================

