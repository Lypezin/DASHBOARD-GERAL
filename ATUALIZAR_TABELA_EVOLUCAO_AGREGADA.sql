-- =====================================================
-- ATUALIZAR TABELA evolucao_agregada
-- Adicionar colunas faltantes e corrigir função de atualização
-- =====================================================

-- 1. Adicionar colunas faltantes à tabela
ALTER TABLE public.evolucao_agregada
  ADD COLUMN IF NOT EXISTS corridas_ofertadas BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corridas_aceitas BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corridas_rejeitadas BIGINT DEFAULT 0;

-- Atualizar coluna existente para renomear se necessário
-- (manter total_corridas como corridas_completadas para compatibilidade)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'evolucao_agregada' 
      AND column_name = 'total_corridas'
  ) THEN
    -- Se total_corridas existe, adicionar corridas_completadas como alias
    ALTER TABLE public.evolucao_agregada
      ADD COLUMN IF NOT EXISTS corridas_completadas BIGINT;
    
    -- Copiar dados existentes
    UPDATE public.evolucao_agregada
    SET corridas_completadas = total_corridas
    WHERE corridas_completadas IS NULL;
  END IF;
END $$;

-- 2. Recriar função de atualização com lógica correta (removendo duplicatas para horas)
CREATE OR REPLACE FUNCTION public.atualizar_evolucao_agregada()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Limpar dados antigos
  TRUNCATE evolucao_agregada;
  
  -- ============================================
  -- DADOS MENSAIS
  -- ============================================
  WITH filtered_data AS (
    SELECT
      ano_iso,
      EXTRACT(MONTH FROM data_do_periodo) AS mes_numero,
      praca,
      COALESCE(numero_de_corridas_ofertadas, 0) AS ofertadas,
      COALESCE(numero_de_corridas_aceitas, 0) AS aceitas,
      COALESCE(numero_de_corridas_completadas, 0) AS completadas,
      COALESCE(numero_de_corridas_rejeitadas, 0) AS rejeitadas,
      COALESCE(tempo_disponivel_absoluto_segundos, hhmmss_to_seconds(tempo_disponivel_absoluto)) AS tempo_segundos,
      data_do_periodo,
      periodo,
      sub_praca,
      origem
    FROM dados_corridas
    WHERE data_do_periodo IS NOT NULL
  ),
  -- Remover duplicatas para horas (mesma lógica do dashboard)
  horas_sem_duplicatas_mensal AS (
    SELECT DISTINCT ON (data_do_periodo, periodo, praca, sub_praca, origem)
      ano_iso,
      EXTRACT(MONTH FROM data_do_periodo) AS mes_numero,
      praca,
      tempo_segundos
    FROM filtered_data
    WHERE tempo_segundos IS NOT NULL AND tempo_segundos > 0
    ORDER BY data_do_periodo, periodo, praca, sub_praca, origem, tempo_segundos DESC
  ),
  horas_por_mes AS (
    SELECT
      ano_iso,
      mes_numero,
      praca,
      SUM(tempo_segundos) AS total_segundos_horas
    FROM horas_sem_duplicatas_mensal
    GROUP BY ano_iso, mes_numero, praca
  ),
  mensal_agg AS (
    SELECT
      fd.ano_iso,
      fd.mes_numero,
      fd.praca,
      SUM(fd.ofertadas) AS total_ofertadas,
      SUM(fd.aceitas) AS total_aceitas,
      SUM(fd.completadas) AS total_completadas,
      SUM(fd.rejeitadas) AS total_rejeitadas,
      COALESCE(hpm.total_segundos_horas, 0) AS total_segundos
    FROM filtered_data fd
    LEFT JOIN horas_por_mes hpm ON 
      fd.ano_iso = hpm.ano_iso 
      AND fd.mes_numero = hpm.mes_numero
      AND COALESCE(fd.praca, '') = COALESCE(hpm.praca, '')
    WHERE fd.ano_iso IS NOT NULL AND fd.mes_numero IS NOT NULL
    GROUP BY fd.ano_iso, fd.mes_numero, fd.praca, hpm.total_segundos_horas
  )
  INSERT INTO evolucao_agregada (
    ano, mes, praca, 
    corridas_ofertadas, corridas_aceitas, corridas_completadas, corridas_rejeitadas,
    total_corridas, total_segundos
  )
  SELECT
    m.ano_iso,
    m.mes_numero,
    m.praca,
    m.total_ofertadas,
    m.total_aceitas,
    m.total_completadas,
    m.total_rejeitadas,
    m.total_completadas, -- total_corridas mantém compatibilidade
    m.total_segundos
  FROM mensal_agg m;
  
  -- ============================================
  -- DADOS SEMANAIS
  -- ============================================
  WITH filtered_data AS (
    SELECT
      ano_iso,
      semana_numero,
      praca,
      COALESCE(numero_de_corridas_ofertadas, 0) AS ofertadas,
      COALESCE(numero_de_corridas_aceitas, 0) AS aceitas,
      COALESCE(numero_de_corridas_completadas, 0) AS completadas,
      COALESCE(numero_de_corridas_rejeitadas, 0) AS rejeitadas,
      COALESCE(tempo_disponivel_absoluto_segundos, hhmmss_to_seconds(tempo_disponivel_absoluto)) AS tempo_segundos,
      data_do_periodo,
      periodo,
      sub_praca,
      origem
    FROM dados_corridas
    WHERE data_do_periodo IS NOT NULL
      AND ano_iso IS NOT NULL 
      AND semana_numero IS NOT NULL
  ),
  -- Remover duplicatas para horas (mesma lógica do dashboard)
  horas_sem_duplicatas_semanal AS (
    SELECT DISTINCT ON (data_do_periodo, periodo, praca, sub_praca, origem)
      ano_iso,
      semana_numero,
      praca,
      tempo_segundos
    FROM filtered_data
    WHERE tempo_segundos IS NOT NULL AND tempo_segundos > 0
    ORDER BY data_do_periodo, periodo, praca, sub_praca, origem, tempo_segundos DESC
  ),
  horas_por_semana AS (
    SELECT
      ano_iso,
      semana_numero,
      praca,
      SUM(tempo_segundos) AS total_segundos_horas
    FROM horas_sem_duplicatas_semanal
    GROUP BY ano_iso, semana_numero, praca
  ),
  semanal_agg AS (
    SELECT
      fd.ano_iso,
      fd.semana_numero,
      fd.praca,
      SUM(fd.ofertadas) AS total_ofertadas,
      SUM(fd.aceitas) AS total_aceitas,
      SUM(fd.completadas) AS total_completadas,
      SUM(fd.rejeitadas) AS total_rejeitadas,
      COALESCE(hps.total_segundos_horas, 0) AS total_segundos
    FROM filtered_data fd
    LEFT JOIN horas_por_semana hps ON 
      fd.ano_iso = hps.ano_iso 
      AND fd.semana_numero = hps.semana_numero
      AND COALESCE(fd.praca, '') = COALESCE(hps.praca, '')
    GROUP BY fd.ano_iso, fd.semana_numero, fd.praca, hps.total_segundos_horas
  )
  INSERT INTO evolucao_agregada (
    ano, semana, praca,
    corridas_ofertadas, corridas_aceitas, corridas_completadas, corridas_rejeitadas,
    total_corridas, total_segundos
  )
  SELECT
    s.ano_iso,
    s.semana_numero,
    s.praca,
    s.total_ofertadas,
    s.total_aceitas,
    s.total_completadas,
    s.total_rejeitadas,
    s.total_completadas, -- total_corridas mantém compatibilidade
    s.total_segundos
  FROM semanal_agg s;
  
  -- Atualizar estatísticas
  ANALYZE evolucao_agregada;
  
  RAISE NOTICE 'Tabela evolucao_agregada atualizada com sucesso!';
END;
$$;

-- 3. Comentários
COMMENT ON FUNCTION public.atualizar_evolucao_agregada() IS 
'Atualiza a tabela evolucao_agregada com dados mensais e semanais, removendo duplicatas para cálculo correto de horas (mesma lógica do dashboard_resumo)';

-- 4. Garantir permissões
GRANT EXECUTE ON FUNCTION public.atualizar_evolucao_agregada() TO authenticated, anon;

-- 5. Executar atualização inicial
SELECT public.atualizar_evolucao_agregada();

