-- =====================================================================
-- CORREÇÃO: FUNÇÕES DE EVOLUÇÃO COM LÓGICA DO EXCEL
-- =====================================================================
-- PROBLEMA: listar_evolucao_semanal e listar_evolucao_mensal estão
-- calculando valores diferentes do dashboard_resumo
-- SOLUÇÃO: Usar a mesma lógica do dashboard_resumo (somar todas as
-- corridas sem remover duplicatas, já que corridas não são afetadas
-- pela multiplicação por entregadores)
-- =====================================================================

-- =====================================================================
-- Função listar_evolucao_semanal CORRIGIDA
-- =====================================================================
DROP FUNCTION IF EXISTS public.listar_evolucao_semanal(text, integer, integer);

CREATE OR REPLACE FUNCTION public.listar_evolucao_semanal(
  p_praca text DEFAULT NULL,
  p_ano integer DEFAULT NULL,
  p_limite_semanas integer DEFAULT 53
)
RETURNS TABLE (
  ano integer,
  semana integer,
  semana_label text,
  total_corridas bigint,
  total_segundos bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '120000ms'
AS $$
SELECT 
  ano_iso AS ano,
  semana_numero AS semana,
  'Semana ' || LPAD(semana_numero::text, 2, '0') AS semana_label,
  COALESCE(SUM(numero_de_corridas_completadas), 0)::bigint AS total_corridas,
  COALESCE(
    SUM(CASE 
      WHEN tempo_disponivel_absoluto_segundos IS NOT NULL 
      THEN tempo_disponivel_absoluto_segundos
      WHEN tempo_disponivel_absoluto IS NOT NULL 
      THEN hhmmss_to_seconds(tempo_disponivel_absoluto)
      ELSE 0
    END), 
    0
  )::bigint AS total_segundos
FROM public.dados_corridas
WHERE data_do_periodo IS NOT NULL
  AND ano_iso IS NOT NULL
  AND semana_numero IS NOT NULL
  AND (p_ano IS NULL OR EXTRACT(YEAR FROM data_do_periodo) = p_ano)
  AND (p_praca IS NULL OR praca = p_praca)
GROUP BY ano_iso, semana_numero
ORDER BY ano_iso DESC, semana_numero DESC
LIMIT p_limite_semanas;
$$;

GRANT EXECUTE ON FUNCTION public.listar_evolucao_semanal(text, integer, integer)
  TO anon, authenticated, service_role;

-- =====================================================================
-- Função listar_evolucao_mensal CORRIGIDA
-- =====================================================================
DROP FUNCTION IF EXISTS public.listar_evolucao_mensal(text, integer);

CREATE OR REPLACE FUNCTION public.listar_evolucao_mensal(
  p_praca text DEFAULT NULL,
  p_ano integer DEFAULT NULL
)
RETURNS TABLE (
  ano integer,
  mes integer,
  mes_nome text,
  total_corridas bigint,
  total_segundos bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '120000ms'
AS $$
SELECT 
  ano_iso AS ano,
  EXTRACT(MONTH FROM data_do_periodo)::integer AS mes,
  CASE EXTRACT(MONTH FROM data_do_periodo)::integer
    WHEN 1 THEN 'Janeiro'
    WHEN 2 THEN 'Fevereiro'
    WHEN 3 THEN 'Março'
    WHEN 4 THEN 'Abril'
    WHEN 5 THEN 'Maio'
    WHEN 6 THEN 'Junho'
    WHEN 7 THEN 'Julho'
    WHEN 8 THEN 'Agosto'
    WHEN 9 THEN 'Setembro'
    WHEN 10 THEN 'Outubro'
    WHEN 11 THEN 'Novembro'
    WHEN 12 THEN 'Dezembro'
    ELSE 'Desconhecido'
  END AS mes_nome,
  COALESCE(SUM(numero_de_corridas_completadas), 0)::bigint AS total_corridas,
  COALESCE(
    SUM(CASE 
      WHEN tempo_disponivel_absoluto_segundos IS NOT NULL 
      THEN tempo_disponivel_absoluto_segundos
      WHEN tempo_disponivel_absoluto IS NOT NULL 
      THEN hhmmss_to_seconds(tempo_disponivel_absoluto)
      ELSE 0
    END), 
    0
  )::bigint AS total_segundos
FROM public.dados_corridas
WHERE data_do_periodo IS NOT NULL
  AND ano_iso IS NOT NULL
  AND (p_ano IS NULL OR EXTRACT(YEAR FROM data_do_periodo) = p_ano)
  AND (p_praca IS NULL OR praca = p_praca)
GROUP BY ano_iso, EXTRACT(MONTH FROM data_do_periodo)
HAVING COUNT(*) > 0
ORDER BY ano_iso DESC, EXTRACT(MONTH FROM data_do_periodo) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.listar_evolucao_mensal(text, integer)
  TO anon, authenticated, service_role;

-- =====================================================================
-- Mensagem de sucesso
-- =====================================================================
SELECT 
  '✅ FUNÇÕES DE EVOLUÇÃO CORRIGIDAS!' as status,
  'Agora usam a mesma lógica do dashboard_resumo' as melhoria,
  'Valores devem bater entre Análise e Evolução' as resultado;

