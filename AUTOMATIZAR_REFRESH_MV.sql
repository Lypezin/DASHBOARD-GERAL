-- =====================================================================
-- AUTOMATIZAR REFRESH DA MATERIALIZED VIEW
-- Este script configura um CRON job para atualizar a MV automaticamente
-- =====================================================================

-- OPÇÃO 1: Refresh automático a cada 6 horas
-- Execute este comando no SQL Editor do Supabase
SELECT cron.schedule(
  'refresh-mv-aderencia-6h',           -- Nome do job
  '0 */6 * * *',                        -- A cada 6 horas
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
  $$
);

-- OPÇÃO 2: Refresh automático todos os dias às 6h da manhã
-- Execute este comando no SQL Editor do Supabase
SELECT cron.schedule(
  'refresh-mv-aderencia-diario',       -- Nome do job
  '0 6 * * *',                          -- Todo dia às 6h
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
  $$
);

-- OPÇÃO 3: Refresh automático a cada 1 hora (recomendado para dados em tempo real)
-- Execute este comando no SQL Editor do Supabase
SELECT cron.schedule(
  'refresh-mv-aderencia-1h',           -- Nome do job
  '0 * * * *',                          -- A cada hora
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
  $$
);

-- =====================================================================
-- COMANDOS ÚTEIS PARA GERENCIAR CRON JOBS
-- =====================================================================

-- VER TODOS OS CRON JOBS CADASTRADOS
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
ORDER BY jobid;

-- DELETAR UM CRON JOB (se quiser remover)
-- Substitua o nome do job pelo que você criou
SELECT cron.unschedule('refresh-mv-aderencia-6h');
SELECT cron.unschedule('refresh-mv-aderencia-diario');
SELECT cron.unschedule('refresh-mv-aderencia-1h');

-- VER HISTÓRICO DE EXECUÇÕES (últimas 10)
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- =====================================================================
-- NOTAS IMPORTANTES:
-- =====================================================================
-- 
-- ⚠️  ESCOLHA APENAS UMA OPÇÃO de CRON JOB (não execute as 3 ao mesmo tempo)
--
-- 📌 Se você importa dados manualmente, escolha a OPÇÃO 2 (diária às 6h)
--
-- 📌 Se você recebe dados automaticamente ao longo do dia, escolha a OPÇÃO 1 ou 3
--
-- 📌 O CRON job do Supabase usa a extensão pg_cron
--
-- 📌 Se o CRON não funcionar, verifique se a extensão está habilitada:
--    Database > Extensions > pg_cron (deve estar ON)
--
-- 📌 Você também pode executar manualmente quando precisar:
--    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
--
-- =====================================================================

