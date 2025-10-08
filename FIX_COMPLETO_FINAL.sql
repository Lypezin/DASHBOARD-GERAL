-- =====================================================================
-- CORREÇÃO COMPLETA E FINAL - EXECUTE TUDO DE UMA VEZ
-- =====================================================================
-- Este script resolve TODOS os problemas:
-- 1. Remove recursão infinita em user_profiles
-- 2. Simplifica RLS em dados_corridas
-- 3. Atualiza todas as funções necessárias
-- =====================================================================

-- =============================================================================
-- PARTE 1: CORRIGIR RLS DE user_profiles (SEM RECURSÃO)
-- =============================================================================

ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (id = auth.uid());


-- =============================================================================
-- PARTE 2: SIMPLIFICAR RLS DE dados_corridas
-- =============================================================================

DROP POLICY IF EXISTS "Users can read assigned pracas" ON public.dados_corridas;
DROP POLICY IF EXISTS "Admins can read all data" ON public.dados_corridas;

-- Política única e simples: se é admin OU se a praça está em assigned_pracas
CREATE POLICY "Allow read based on role"
  ON public.dados_corridas
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.user_profiles 
      WHERE is_approved = TRUE
        AND (
          is_admin = TRUE 
          OR dados_corridas.praca = ANY(assigned_pracas)
        )
    )
  );


-- =============================================================================
-- PARTE 3: ATUALIZAR listar_dimensoes_dashboard
-- =============================================================================

DROP FUNCTION IF EXISTS public.listar_dimensoes_dashboard(integer, integer, text, text, text);
DROP FUNCTION IF EXISTS public.listar_dimensoes_dashboard();

CREATE OR REPLACE FUNCTION public.listar_dimensoes_dashboard(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH base AS (
    SELECT
      data_do_periodo,
      praca,
      sub_praca,
      origem,
      ano_iso,
      semana_numero
    FROM public.dados_corridas
    WHERE data_do_periodo IS NOT NULL
      AND (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
  )
  SELECT jsonb_build_object(
    'anos', COALESCE((SELECT array_agg(DISTINCT ano_iso ORDER BY ano_iso) FROM base WHERE ano_iso IS NOT NULL), ARRAY[]::integer[]),
    'semanas', COALESCE((SELECT array_agg(DISTINCT semana_numero ORDER BY semana_numero) FROM base WHERE semana_numero IS NOT NULL), ARRAY[]::integer[]),
    'pracas', COALESCE((SELECT array_agg(DISTINCT praca ORDER BY praca) FROM base WHERE praca IS NOT NULL), ARRAY[]::text[]),
    'sub_pracas', COALESCE((SELECT array_agg(DISTINCT sub_praca ORDER BY sub_praca) FROM base WHERE sub_praca IS NOT NULL), ARRAY[]::text[]),
    'origens', COALESCE((SELECT array_agg(DISTINCT origem ORDER BY origem) FROM base WHERE origem IS NOT NULL), ARRAY[]::text[])
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_dimensoes_dashboard(integer, integer, text, text, text)
  TO anon, authenticated, service_role;


-- =============================================================================
-- PARTE 4: ATUALIZAR dashboard_resumo
-- =============================================================================

DROP FUNCTION IF EXISTS public.dashboard_resumo(integer, integer, text, text, text);

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '60000ms'
AS $$
WITH filtro_base AS (
  SELECT
    ano_iso, semana_numero, dia_iso, periodo, praca, sub_praca, origem,
    tempo_disponivel_absoluto_segundos,
    numero_de_corridas_ofertadas, numero_de_corridas_aceitas,
    numero_de_corridas_rejeitadas, numero_de_corridas_completadas
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
),
totais AS (
  SELECT jsonb_build_object(
    'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
    'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
    'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
    'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
  ) AS data FROM filtro_base
),
planejado_semana AS (
  SELECT ano_iso, semana_numero, SUM(segundos_planejados) AS seg_plan
  FROM public.mv_aderencia_agregada
  WHERE (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
  GROUP BY ano_iso, semana_numero
),
realizado_semana AS (
  SELECT ano_iso, semana_numero, SUM(tempo_disponivel_absoluto_segundos) AS seg_real
  FROM filtro_base WHERE tempo_disponivel_absoluto_segundos > 0
  GROUP BY ano_iso, semana_numero
),
semana_json AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'semana', 'Semana ' || LPAD(COALESCE(ps.semana_numero, rs.semana_numero)::text, 2, '0'),
    'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(ps.seg_plan, 0), 'HH24:MI:SS'),
    'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(rs.seg_real, 0), 'HH24:MI:SS'),
    'aderencia_percentual', ROUND((COALESCE(rs.seg_real, 0) / NULLIF(COALESCE(ps.seg_plan, 0), 0)) * 100, 2)
  ) ORDER BY COALESCE(ps.ano_iso, rs.ano_iso) DESC, COALESCE(ps.semana_numero, rs.semana_numero) DESC), '[]'::jsonb) AS data
  FROM planejado_semana ps FULL JOIN realizado_semana rs USING (ano_iso, semana_numero)
),
planejado_dia AS (
  SELECT dia_iso, SUM(segundos_planejados) AS seg_plan FROM public.mv_aderencia_agregada
  WHERE (p_ano IS NULL OR ano_iso = p_ano) AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca) AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem) GROUP BY dia_iso
),
realizado_dia AS (
  SELECT dia_iso, SUM(tempo_disponivel_absoluto_segundos) AS seg_real FROM filtro_base
  WHERE tempo_disponivel_absoluto_segundos > 0 GROUP BY dia_iso
),
dia_json AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'dia_iso', COALESCE(pd.dia_iso, rd.dia_iso),
    'dia_da_semana', CASE COALESCE(pd.dia_iso, rd.dia_iso)
      WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta'
      WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado'
      WHEN 7 THEN 'Domingo' ELSE 'N/D' END,
    'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(pd.seg_plan, 0), 'HH24:MI:SS'),
    'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(rd.seg_real, 0), 'HH24:MI:SS'),
    'aderencia_percentual', ROUND((COALESCE(rd.seg_real, 0) / NULLIF(COALESCE(pd.seg_plan, 0), 0)) * 100, 2)
  ) ORDER BY COALESCE(pd.dia_iso, rd.dia_iso)), '[]'::jsonb) AS data
  FROM planejado_dia pd FULL JOIN realizado_dia rd USING (dia_iso)
),
planejado_turno AS (
  SELECT periodo, SUM(segundos_planejados) AS seg_plan FROM public.mv_aderencia_agregada
  WHERE periodo IS NOT NULL AND (p_ano IS NULL OR ano_iso = p_ano) AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca) AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem) GROUP BY periodo
),
realizado_turno AS (
  SELECT periodo, SUM(tempo_disponivel_absoluto_segundos) AS seg_real FROM filtro_base
  WHERE periodo IS NOT NULL AND tempo_disponivel_absoluto_segundos > 0 GROUP BY periodo
),
turno_json AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'periodo', COALESCE(pt.periodo, rt.periodo),
    'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(pt.seg_plan, 0), 'HH24:MI:SS'),
    'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(rt.seg_real, 0), 'HH24:MI:SS'),
    'aderencia_percentual', ROUND((COALESCE(rt.seg_real, 0) / NULLIF(COALESCE(pt.seg_plan, 0), 0)) * 100, 2)
  ) ORDER BY COALESCE(pt.periodo, rt.periodo)), '[]'::jsonb) AS data
  FROM planejado_turno pt FULL JOIN realizado_turno rt USING (periodo)
),
planejado_sub AS (
  SELECT sub_praca, SUM(segundos_planejados) AS seg_plan FROM public.mv_aderencia_agregada
  WHERE sub_praca IS NOT NULL AND (p_ano IS NULL OR ano_iso = p_ano) AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca) AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem) GROUP BY sub_praca
),
realizado_sub AS (
  SELECT sub_praca, SUM(tempo_disponivel_absoluto_segundos) AS seg_real FROM filtro_base
  WHERE sub_praca IS NOT NULL AND tempo_disponivel_absoluto_segundos > 0 GROUP BY sub_praca
),
sub_json AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'sub_praca', COALESCE(psub.sub_praca, rsub.sub_praca),
    'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(psub.seg_plan, 0), 'HH24:MI:SS'),
    'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(rsub.seg_real, 0), 'HH24:MI:SS'),
    'aderencia_percentual', ROUND((COALESCE(rsub.seg_real, 0) / NULLIF(COALESCE(psub.seg_plan, 0), 0)) * 100, 2)
  ) ORDER BY COALESCE(psub.sub_praca, rsub.sub_praca)), '[]'::jsonb) AS data
  FROM planejado_sub psub FULL JOIN realizado_sub rsub USING (sub_praca)
),
planejado_origem AS (
  SELECT origem, SUM(segundos_planejados) AS seg_plan FROM public.mv_aderencia_agregada
  WHERE origem IS NOT NULL AND (p_ano IS NULL OR ano_iso = p_ano) AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca) AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem) GROUP BY origem
),
realizado_origem AS (
  SELECT origem, SUM(tempo_disponivel_absoluto_segundos) AS seg_real FROM filtro_base
  WHERE origem IS NOT NULL AND tempo_disponivel_absoluto_segundos > 0 GROUP BY origem
),
origem_json AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'origem', COALESCE(pori.origem, rori.origem),
    'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(pori.seg_plan, 0), 'HH24:MI:SS'),
    'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(rori.seg_real, 0), 'HH24:MI:SS'),
    'aderencia_percentual', ROUND((COALESCE(rori.seg_real, 0) / NULLIF(COALESCE(pori.seg_plan, 0), 0)) * 100, 2)
  ) ORDER BY COALESCE(pori.origem, rori.origem)), '[]'::jsonb) AS data
  FROM planejado_origem pori FULL JOIN realizado_origem rori USING (origem)
)
SELECT jsonb_build_object(
  'totais', (SELECT data FROM totais),
  'semanal', (SELECT data FROM semana_json),
  'dia', (SELECT data FROM dia_json),
  'turno', (SELECT data FROM turno_json),
  'sub_praca', (SELECT data FROM sub_json),
  'origem', (SELECT data FROM origem_json),
  'dimensoes', public.listar_dimensoes_dashboard(p_ano, p_semana, p_praca, p_sub_praca, p_origem)
);
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(integer, integer, text, text, text)
  TO anon, authenticated, service_role;


-- =============================================================================
-- PARTE 5: CRIAR calcular_utr
-- =============================================================================

DROP FUNCTION IF EXISTS public.calcular_utr(integer, integer, text, text, text);

CREATE OR REPLACE FUNCTION public.calcular_utr(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH filtro_base AS (
    SELECT praca, sub_praca, origem, periodo,
           tempo_disponivel_absoluto_segundos,
           numero_de_corridas_completadas
    FROM public.dados_corridas
    WHERE data_do_periodo IS NOT NULL
      AND (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR praca = p_praca)
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
  ),
  utr_geral AS (
    SELECT
      SUM(tempo_disponivel_absoluto_segundos) AS total_segundos,
      SUM(numero_de_corridas_completadas) AS total_corridas,
      CASE WHEN SUM(tempo_disponivel_absoluto_segundos) = 0 THEN 0
        ELSE ROUND((SUM(numero_de_corridas_completadas)::numeric / (SUM(tempo_disponivel_absoluto_segundos)::numeric / 3600))::numeric, 2)
      END AS utr
    FROM filtro_base
  )
  SELECT jsonb_build_object(
    'geral', (
      SELECT jsonb_build_object(
        'tempo_horas', ROUND((total_segundos / 3600.0)::numeric, 2),
        'corridas', total_corridas,
        'utr', utr
      ) FROM utr_geral
    ),
    'por_praca', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('praca', praca, 'tempo_horas', ROUND((total_segundos / 3600.0)::numeric, 2),
        'corridas', total_corridas, 'utr', CASE WHEN total_segundos = 0 THEN 0
        ELSE ROUND((total_corridas::numeric / (total_segundos::numeric / 3600))::numeric, 2) END
      ) ORDER BY praca)
      FROM (SELECT praca, SUM(tempo_disponivel_absoluto_segundos) AS total_segundos, SUM(numero_de_corridas_completadas) AS total_corridas
        FROM filtro_base WHERE praca IS NOT NULL GROUP BY praca) t
    ), '[]'::jsonb),
    'por_sub_praca', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('sub_praca', sub_praca, 'tempo_horas', ROUND((total_segundos / 3600.0)::numeric, 2),
        'corridas', total_corridas, 'utr', CASE WHEN total_segundos = 0 THEN 0
        ELSE ROUND((total_corridas::numeric / (total_segundos::numeric / 3600))::numeric, 2) END
      ) ORDER BY sub_praca)
      FROM (SELECT sub_praca, SUM(tempo_disponivel_absoluto_segundos) AS total_segundos, SUM(numero_de_corridas_completadas) AS total_corridas
        FROM filtro_base WHERE sub_praca IS NOT NULL GROUP BY sub_praca) t
    ), '[]'::jsonb),
    'por_origem', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('origem', origem, 'tempo_horas', ROUND((total_segundos / 3600.0)::numeric, 2),
        'corridas', total_corridas, 'utr', CASE WHEN total_segundos = 0 THEN 0
        ELSE ROUND((total_corridas::numeric / (total_segundos::numeric / 3600))::numeric, 2) END
      ) ORDER BY origem)
      FROM (SELECT origem, SUM(tempo_disponivel_absoluto_segundos) AS total_segundos, SUM(numero_de_corridas_completadas) AS total_corridas
        FROM filtro_base WHERE origem IS NOT NULL GROUP BY origem) t
    ), '[]'::jsonb),
    'por_turno', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('periodo', periodo, 'tempo_horas', ROUND((total_segundos / 3600.0)::numeric, 2),
        'corridas', total_corridas, 'utr', CASE WHEN total_segundos = 0 THEN 0
        ELSE ROUND((total_corridas::numeric / (total_segundos::numeric / 3600))::numeric, 2) END
      ) ORDER BY periodo)
      FROM (SELECT periodo, SUM(tempo_disponivel_absoluto_segundos) AS total_segundos, SUM(numero_de_corridas_completadas) AS total_corridas
        FROM filtro_base WHERE periodo IS NOT NULL GROUP BY periodo) t
    ), '[]'::jsonb)
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calcular_utr(integer, integer, text, text, text)
  TO anon, authenticated, service_role;


-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================

SELECT '✅ Script completo executado com sucesso!' as status;

SELECT 'Políticas RLS' as categoria, COUNT(*)::text || ' políticas' as resultado
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'dados_corridas')
UNION ALL
SELECT 'Funções criadas' as categoria, COUNT(*)::text || ' funções' as resultado
FROM pg_proc 
WHERE proname IN ('listar_dimensoes_dashboard', 'calcular_utr', 'dashboard_resumo');
