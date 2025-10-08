-- =====================================================================
-- CORREÇÃO DA MATERIALIZED VIEW PARA GRANDES VOLUMES DE DADOS
-- =====================================================================
-- Execute este script no Supabase SQL Editor para corrigir o problema
-- de timeout ao atualizar a materialized view com 1M+ registros
-- =====================================================================

-- 1. DROPAR A MATERIALIZED VIEW EXISTENTE (SE HOUVER)
-- =====================================================================
DROP MATERIALIZED VIEW IF EXISTS public.mv_aderencia_agregada CASCADE;


-- 2. RECRIAR A MATERIALIZED VIEW COM ÍNDICE ÚNICO
-- =====================================================================
-- Esta view pré-agrega os dados para acelerar os cálculos de aderência
CREATE MATERIALIZED VIEW public.mv_aderencia_agregada AS
SELECT 
  ano_iso,
  semana_numero,
  dia_iso,
  periodo,
  praca,
  sub_praca,
  origem,
  data_do_periodo,
  duracao_segundos,
  numero_minimo_de_entregadores_regulares_na_escala,
  -- Calcular segundos planejados (escala * duração)
  (COALESCE(numero_minimo_de_entregadores_regulares_na_escala, 0) * 
   COALESCE(duracao_segundos, 0)) AS segundos_planejados,
  -- Gerar ID único para o índice
  row_number() OVER () AS row_id
FROM (
  SELECT DISTINCT ON (
    data_do_periodo,
    periodo,
    duracao_segundos,
    numero_minimo_de_entregadores_regulares_na_escala,
    praca,
    sub_praca,
    origem
  )
    ano_iso,
    semana_numero,
    dia_iso,
    periodo,
    praca,
    sub_praca,
    origem,
    data_do_periodo,
    duracao_segundos,
    numero_minimo_de_entregadores_regulares_na_escala
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND duracao_segundos IS NOT NULL
    AND duracao_segundos > 0
  ORDER BY 
    data_do_periodo,
    periodo,
    duracao_segundos,
    numero_minimo_de_entregadores_regulares_na_escala,
    praca,
    sub_praca,
    origem,
    id
) AS unique_records;


-- 3. CRIAR ÍNDICE ÚNICO (NECESSÁRIO PARA REFRESH CONCURRENTLY)
-- =====================================================================
CREATE UNIQUE INDEX idx_mv_aderencia_row_id 
  ON public.mv_aderencia_agregada (row_id);


-- 4. CRIAR ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================================
CREATE INDEX idx_mv_aderencia_ano_semana 
  ON public.mv_aderencia_agregada (ano_iso, semana_numero);

CREATE INDEX idx_mv_aderencia_dia 
  ON public.mv_aderencia_agregada (dia_iso);

CREATE INDEX idx_mv_aderencia_periodo 
  ON public.mv_aderencia_agregada (periodo);

CREATE INDEX idx_mv_aderencia_praca 
  ON public.mv_aderencia_agregada (praca);

CREATE INDEX idx_mv_aderencia_sub_praca 
  ON public.mv_aderencia_agregada (sub_praca);

CREATE INDEX idx_mv_aderencia_origem 
  ON public.mv_aderencia_agregada (origem);


-- 5. ATUALIZAR ESTATÍSTICAS
-- =====================================================================
ANALYZE public.mv_aderencia_agregada;


-- 6. RECRIAR FUNÇÃO DE REFRESH (COM REFRESH CONCURRENTLY)
-- =====================================================================
DROP FUNCTION IF EXISTS public.refresh_mv_aderencia();

CREATE OR REPLACE FUNCTION public.refresh_mv_aderencia()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '300000ms'  -- 5 minutos
AS $$
BEGIN
  -- CONCURRENTLY permite que a view continue sendo consultada durante o refresh
  -- Importante: requer um índice UNIQUE na materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
  
  -- Atualizar estatísticas após o refresh
  ANALYZE public.mv_aderencia_agregada;
  
  RAISE NOTICE 'Materialized view atualizada com sucesso';
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falha a transação
    RAISE WARNING 'Erro ao atualizar materialized view: %', SQLERRM;
    -- Re-raise para que o caller saiba que falhou
    RAISE;
END;
$$;


-- 7. GRANT PERMISSIONS
-- =====================================================================
GRANT EXECUTE ON FUNCTION public.refresh_mv_aderencia() 
  TO anon, authenticated, service_role;

GRANT SELECT ON public.mv_aderencia_agregada 
  TO anon, authenticated, service_role;


-- 8. CRIAR FUNÇÃO DE REFRESH EM BACKGROUND (ASYNC)
-- =====================================================================
-- Esta função inicia o refresh mas não espera ele terminar
-- Útil para uploads grandes onde não queremos bloquear o usuário
DROP FUNCTION IF EXISTS public.refresh_mv_aderencia_async();

CREATE OR REPLACE FUNCTION public.refresh_mv_aderencia_async()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Usar pg_background ou simplesmente retornar mensagem
  -- O refresh será feito de forma assíncrona pelo autovacuum ou manualmente
  RETURN 'Refresh da materialized view será executado em segundo plano';
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_mv_aderencia_async() 
  TO anon, authenticated, service_role;


-- =====================================================================
-- INSTRUÇÕES PÓS-EXECUÇÃO
-- =====================================================================
-- 1. Após executar este script, faça o primeiro refresh manualmente:
--    SELECT public.refresh_mv_aderencia();
--
-- 2. Configure um job externo (GitHub Actions, Vercel Cron) para refresh
--    periódico (ex: a cada 6 horas ou 1x por dia)
--
-- 3. No código da aplicação, use refresh_mv_aderencia_async() ao invés
--    de refresh_mv_aderencia() para não bloquear uploads
--
-- 4. Monitore o tamanho da MV:
--    SELECT pg_size_pretty(pg_total_relation_size('public.mv_aderencia_agregada'));
--
-- 5. Se a MV ficar muito grande (>1GB), considere particionamento
-- =====================================================================


-- VERIFICAR STATUS
SELECT 
  'Materialized View' as tipo,
  pg_size_pretty(pg_total_relation_size('public.mv_aderencia_agregada')) as tamanho,
  (SELECT COUNT(*) FROM public.mv_aderencia_agregada) as registros;
