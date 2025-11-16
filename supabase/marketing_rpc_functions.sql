-- Funções RPC para otimizar queries de Marketing
-- Execute este arquivo no SQL Editor do Supabase

-- 1. Função para obter totais de marketing
DROP FUNCTION IF EXISTS public.get_marketing_totals(text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.get_marketing_totals(
  data_envio_inicial text DEFAULT NULL,
  data_envio_final text DEFAULT NULL,
  data_liberacao_inicial text DEFAULT NULL,
  data_liberacao_final text DEFAULT NULL,
  rodou_dia_inicial text DEFAULT NULL,
  rodou_dia_final text DEFAULT NULL
)
RETURNS TABLE (
  criado bigint,
  enviado bigint,
  liberado bigint,
  rodando_inicio bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::bigint FROM public.dados_marketing) as criado,
    (SELECT COUNT(*)::bigint 
     FROM public.dados_marketing 
     WHERE data_envio IS NOT NULL
       AND (data_envio_inicial IS NULL OR data_envio >= data_envio_inicial::date)
       AND (data_envio_final IS NULL OR data_envio <= data_envio_final::date)
    ) as enviado,
    (SELECT COUNT(*)::bigint 
     FROM public.dados_marketing 
     WHERE data_liberacao IS NOT NULL
       AND (data_liberacao_inicial IS NULL OR data_liberacao >= data_liberacao_inicial::date)
       AND (data_liberacao_final IS NULL OR data_liberacao <= data_liberacao_final::date)
    ) as liberado,
    (SELECT COUNT(*)::bigint 
     FROM public.dados_marketing 
     WHERE rodou_dia IS NOT NULL
       AND (rodou_dia_inicial IS NULL OR rodou_dia >= rodou_dia_inicial::date)
       AND (rodou_dia_final IS NULL OR rodou_dia <= rodou_dia_final::date)
    ) as rodando_inicio;
END;
$$;

-- 2. Função para obter dados de cidades
DROP FUNCTION IF EXISTS public.get_marketing_cities_data(text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.get_marketing_cities_data(
  data_envio_inicial text DEFAULT NULL,
  data_envio_final text DEFAULT NULL,
  data_liberacao_inicial text DEFAULT NULL,
  data_liberacao_final text DEFAULT NULL,
  rodou_dia_inicial text DEFAULT NULL,
  rodou_dia_final text DEFAULT NULL
)
RETURNS TABLE (
  cidade text,
  enviado bigint,
  liberado bigint,
  rodando_inicio bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH cidade_data AS (
    SELECT 
      CASE 
        WHEN regiao_atuacao = 'ABC 2.0' AND sub_praca_abc IN ('Vila Aquino', 'São Caetano') THEN 'Santo André'
        WHEN regiao_atuacao = 'ABC 2.0' AND sub_praca_abc IN ('Diadema', 'Nova petrópolis', 'Rudge Ramos') THEN 'São Bernardo'
        ELSE regiao_atuacao
      END as cidade_nome,
      COUNT(*) FILTER (
        WHERE data_envio IS NOT NULL
          AND (data_envio_inicial IS NULL OR data_envio >= data_envio_inicial::date)
          AND (data_envio_final IS NULL OR data_envio <= data_envio_final::date)
      )::bigint as enviado,
      COUNT(*) FILTER (
        WHERE data_liberacao IS NOT NULL
          AND (data_liberacao_inicial IS NULL OR data_liberacao >= data_liberacao_inicial::date)
          AND (data_liberacao_final IS NULL OR data_liberacao <= data_liberacao_final::date)
      )::bigint as liberado,
      COUNT(*) FILTER (
        WHERE rodou_dia IS NOT NULL
          AND (rodou_dia_inicial IS NULL OR rodou_dia >= rodou_dia_inicial::date)
          AND (rodou_dia_final IS NULL OR rodou_dia <= rodou_dia_final::date)
      )::bigint as rodando_inicio
    FROM public.dados_marketing
    WHERE regiao_atuacao IS NOT NULL
    GROUP BY cidade_nome
  )
  SELECT 
    cidade_nome::text,
    COALESCE(enviado, 0)::bigint,
    COALESCE(liberado, 0)::bigint,
    COALESCE(rodando_inicio, 0)::bigint
  FROM cidade_data
  ORDER BY cidade_nome;
END;
$$;

-- 3. Função para obter dados de atendentes (retorna dados agregados por atendente e cidade)
DROP FUNCTION IF EXISTS public.get_marketing_atendentes_data(text, text, text, text);

CREATE OR REPLACE FUNCTION public.get_marketing_atendentes_data(
  data_envio_inicial text DEFAULT NULL,
  data_envio_final text DEFAULT NULL,
  data_liberacao_inicial text DEFAULT NULL,
  data_liberacao_final text DEFAULT NULL
)
RETURNS TABLE (
  responsavel text,
  enviado bigint,
  liberado bigint,
  cidade text,
  cidade_enviado bigint,
  cidade_liberado bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH base_data AS (
    SELECT 
      dm.responsavel,
      CASE 
        WHEN dm.regiao_atuacao = 'ABC 2.0' AND dm.sub_praca_abc IN ('Vila Aquino', 'São Caetano') THEN 'Santo André'
        WHEN dm.regiao_atuacao = 'ABC 2.0' AND dm.sub_praca_abc IN ('Diadema', 'Nova petrópolis', 'Rudge Ramos') THEN 'São Bernardo'
        ELSE dm.regiao_atuacao
      END as cidade_nome,
      dm.data_envio,
      dm.data_liberacao
    FROM public.dados_marketing dm
    WHERE dm.responsavel IS NOT NULL
  )
  SELECT 
    bd.responsavel::text,
    COUNT(*) FILTER (
      WHERE bd.data_envio IS NOT NULL
        AND (data_envio_inicial IS NULL OR bd.data_envio >= data_envio_inicial::date)
        AND (data_envio_final IS NULL OR bd.data_envio <= data_envio_final::date)
    )::bigint as enviado,
    COUNT(*) FILTER (
      WHERE bd.data_liberacao IS NOT NULL
        AND (data_liberacao_inicial IS NULL OR bd.data_liberacao >= data_liberacao_inicial::date)
        AND (data_liberacao_final IS NULL OR bd.data_liberacao <= data_liberacao_final::date)
    )::bigint as liberado,
    bd.cidade_nome::text,
    COUNT(*) FILTER (
      WHERE bd.data_envio IS NOT NULL
        AND (data_envio_inicial IS NULL OR bd.data_envio >= data_envio_inicial::date)
        AND (data_envio_final IS NULL OR bd.data_envio <= data_envio_final::date)
    )::bigint as cidade_enviado,
    COUNT(*) FILTER (
      WHERE bd.data_liberacao IS NOT NULL
        AND (data_liberacao_inicial IS NULL OR bd.data_liberacao >= data_liberacao_inicial::date)
        AND (data_liberacao_final IS NULL OR bd.data_liberacao <= data_liberacao_final::date)
    )::bigint as cidade_liberado
  FROM base_data bd
  GROUP BY bd.responsavel, bd.cidade_nome
  ORDER BY bd.responsavel, bd.cidade_nome;
END;
$$;

-- 4. Índices para otimizar as queries
-- Execute estes comandos para criar índices que melhoram a performance

-- Índices em colunas de data
CREATE INDEX IF NOT EXISTS idx_dados_marketing_data_envio ON public.dados_marketing(data_envio) WHERE data_envio IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dados_marketing_data_liberacao ON public.dados_marketing(data_liberacao) WHERE data_liberacao IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dados_marketing_rodou_dia ON public.dados_marketing(rodou_dia) WHERE rodou_dia IS NOT NULL;

-- Índice em responsavel
CREATE INDEX IF NOT EXISTS idx_dados_marketing_responsavel ON public.dados_marketing(responsavel) WHERE responsavel IS NOT NULL;

-- Índices em regiao_atuacao e sub_praca_abc
CREATE INDEX IF NOT EXISTS idx_dados_marketing_regiao_atuacao ON public.dados_marketing(regiao_atuacao) WHERE regiao_atuacao IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dados_marketing_sub_praca_abc ON public.dados_marketing(sub_praca_abc) WHERE sub_praca_abc IS NOT NULL;

-- Índices compostos para queries mais complexas
CREATE INDEX IF NOT EXISTS idx_dados_marketing_responsavel_data_envio ON public.dados_marketing(responsavel, data_envio) WHERE responsavel IS NOT NULL AND data_envio IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dados_marketing_responsavel_data_liberacao ON public.dados_marketing(responsavel, data_liberacao) WHERE responsavel IS NOT NULL AND data_liberacao IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dados_marketing_regiao_sub_praca ON public.dados_marketing(regiao_atuacao, sub_praca_abc) WHERE regiao_atuacao IS NOT NULL;

