-- =====================================================================
-- CORREÇÃO DEFINITIVA: dashboard_resumo
-- =====================================================================
-- Problema 1: dimensoes retornando strings ao invés de arrays
-- Problema 2: totais retornando 0 mesmo com dados
-- =====================================================================

DROP FUNCTION IF EXISTS public.dashboard_resumo(integer, integer, text, text, text) CASCADE;

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
SET search_path = public
SET statement_timeout = '30000ms'
SET work_mem = '256MB'
AS $$
DECLARE
  v_result jsonb;
  v_dimensoes jsonb;
  v_base_filter text;
BEGIN
  -- Buscar dimensoes ANTES (fora do format)
  v_dimensoes := public.listar_dimensoes_dashboard(p_ano, p_semana, p_praca, p_sub_praca, p_origem);
  
  -- Construir filtro base
  v_base_filter := 'data_do_periodo IS NOT NULL';
  
  IF p_ano IS NOT NULL THEN
    v_base_filter := v_base_filter || ' AND ano_iso = ' || p_ano;
  END IF;
  
  IF p_semana IS NOT NULL THEN
    v_base_filter := v_base_filter || ' AND semana_numero = ' || p_semana;
  END IF;
  
  IF p_praca IS NOT NULL THEN
    v_base_filter := v_base_filter || ' AND praca = ' || quote_literal(p_praca);
  END IF;
  
  IF p_sub_praca IS NOT NULL THEN
    v_base_filter := v_base_filter || ' AND sub_praca = ' || quote_literal(p_sub_praca);
  END IF;
  
  IF p_origem IS NOT NULL THEN
    v_base_filter := v_base_filter || ' AND origem = ' || quote_literal(p_origem);
  END IF;

  -- Executar query única otimizada
  EXECUTE format($query$
    WITH 
    totais AS (
      SELECT
        COALESCE(SUM(numero_de_corridas_ofertadas), 0)::bigint AS corridas_ofertadas,
        COALESCE(SUM(numero_de_corridas_aceitas), 0)::bigint AS corridas_aceitas,
        COALESCE(SUM(numero_de_corridas_rejeitadas), 0)::bigint AS corridas_rejeitadas,
        COALESCE(SUM(numero_de_corridas_completadas), 0)::bigint AS corridas_completadas
      FROM public.dados_corridas
      WHERE %s
    ),
    semanal AS (
      SELECT 
        ano_iso,
        semana_numero,
        SUM(segundos_planejados) as seg_plan
      FROM public.mv_aderencia_agregada
      WHERE %s
      GROUP BY ano_iso, semana_numero
    ),
    semanal_real AS (
      SELECT 
        ano_iso,
        semana_numero,
        SUM(tempo_disponivel_absoluto_segundos) as seg_real
      FROM public.dados_corridas
      WHERE %s AND tempo_disponivel_absoluto_segundos > 0
      GROUP BY ano_iso, semana_numero
    ),
    dia AS (
      SELECT 
        dia_iso,
        SUM(segundos_planejados) as seg_plan
      FROM public.mv_aderencia_agregada
      WHERE %s
      GROUP BY dia_iso
    ),
    dia_real AS (
      SELECT 
        dia_iso,
        SUM(tempo_disponivel_absoluto_segundos) as seg_real
      FROM public.dados_corridas
      WHERE %s AND tempo_disponivel_absoluto_segundos > 0
      GROUP BY dia_iso
    ),
    turno AS (
      SELECT 
        periodo,
        SUM(segundos_planejados) as seg_plan
      FROM public.mv_aderencia_agregada
      WHERE %s AND periodo IS NOT NULL
      GROUP BY periodo
    ),
    turno_real AS (
      SELECT 
        periodo,
        SUM(tempo_disponivel_absoluto_segundos) as seg_real
      FROM public.dados_corridas
      WHERE %s AND periodo IS NOT NULL AND tempo_disponivel_absoluto_segundos > 0
      GROUP BY periodo
    ),
    sub AS (
      SELECT 
        sub_praca,
        SUM(segundos_planejados) as seg_plan
      FROM public.mv_aderencia_agregada
      WHERE %s AND sub_praca IS NOT NULL
      GROUP BY sub_praca
    ),
    sub_real AS (
      SELECT 
        sub_praca,
        SUM(tempo_disponivel_absoluto_segundos) as seg_real
      FROM public.dados_corridas
      WHERE %s AND sub_praca IS NOT NULL AND tempo_disponivel_absoluto_segundos > 0
      GROUP BY sub_praca
    ),
    origem AS (
      SELECT 
        origem,
        SUM(segundos_planejados) as seg_plan
      FROM public.mv_aderencia_agregada
      WHERE %s AND origem IS NOT NULL
      GROUP BY origem
    ),
    origem_real AS (
      SELECT 
        origem,
        SUM(tempo_disponivel_absoluto_segundos) as seg_real
      FROM public.dados_corridas
      WHERE %s AND origem IS NOT NULL AND tempo_disponivel_absoluto_segundos > 0
      GROUP BY origem
    )
    SELECT jsonb_build_object(
      'totais', (SELECT row_to_json(t) FROM totais t),
      'semanal', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'semana', 'Semana ' || LPAD(COALESCE(s.semana_numero, sr.semana_numero)::text, 2, '0'),
            'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(s.seg_plan, 0), 'HH24:MI:SS'),
            'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(sr.seg_real, 0), 'HH24:MI:SS'),
            'aderencia_percentual', ROUND((COALESCE(sr.seg_real, 0)::numeric / NULLIF(COALESCE(s.seg_plan, 0), 0)) * 100, 2)
          ) ORDER BY COALESCE(s.ano_iso, sr.ano_iso) DESC, COALESCE(s.semana_numero, sr.semana_numero) DESC
        )
        FROM semanal s FULL OUTER JOIN semanal_real sr USING (ano_iso, semana_numero)
      ), '[]'::jsonb),
      'dia', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'dia_iso', COALESCE(d.dia_iso, dr.dia_iso),
            'dia_da_semana', CASE COALESCE(d.dia_iso, dr.dia_iso)
              WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta'
              WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado'
              WHEN 7 THEN 'Domingo' ELSE 'N/D' END,
            'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(d.seg_plan, 0), 'HH24:MI:SS'),
            'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(dr.seg_real, 0), 'HH24:MI:SS'),
            'aderencia_percentual', ROUND((COALESCE(dr.seg_real, 0)::numeric / NULLIF(COALESCE(d.seg_plan, 0), 0)) * 100, 2)
          ) ORDER BY COALESCE(d.dia_iso, dr.dia_iso)
        )
        FROM dia d FULL OUTER JOIN dia_real dr USING (dia_iso)
      ), '[]'::jsonb),
      'turno', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'periodo', COALESCE(t.periodo, tr.periodo),
            'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(t.seg_plan, 0), 'HH24:MI:SS'),
            'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(tr.seg_real, 0), 'HH24:MI:SS'),
            'aderencia_percentual', ROUND((COALESCE(tr.seg_real, 0)::numeric / NULLIF(COALESCE(t.seg_plan, 0), 0)) * 100, 2)
          ) ORDER BY COALESCE(t.periodo, tr.periodo)
        )
        FROM turno t FULL OUTER JOIN turno_real tr USING (periodo)
      ), '[]'::jsonb),
      'sub_praca', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'sub_praca', COALESCE(s.sub_praca, sr.sub_praca),
            'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(s.seg_plan, 0), 'HH24:MI:SS'),
            'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(sr.seg_real, 0), 'HH24:MI:SS'),
            'aderencia_percentual', ROUND((COALESCE(sr.seg_real, 0)::numeric / NULLIF(COALESCE(s.seg_plan, 0), 0)) * 100, 2)
          ) ORDER BY COALESCE(s.sub_praca, sr.sub_praca)
        )
        FROM sub s FULL OUTER JOIN sub_real sr USING (sub_praca)
      ), '[]'::jsonb),
      'origem', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'origem', COALESCE(o.origem, oro.origem),
            'horas_a_entregar', TO_CHAR(INTERVAL '1 second' * COALESCE(o.seg_plan, 0), 'HH24:MI:SS'),
            'horas_entregues', TO_CHAR(INTERVAL '1 second' * COALESCE(oro.seg_real, 0), 'HH24:MI:SS'),
            'aderencia_percentual', ROUND((COALESCE(oro.seg_real, 0)::numeric / NULLIF(COALESCE(o.seg_plan, 0), 0)) * 100, 2)
          ) ORDER BY COALESCE(o.origem, oro.origem)
        )
        FROM origem o FULL OUTER JOIN origem_real oro USING (origem)
      ), '[]'::jsonb)
    )
  $query$, 
    v_base_filter, v_base_filter, v_base_filter,
    v_base_filter, v_base_filter,
    v_base_filter, v_base_filter,
    v_base_filter, v_base_filter,
    v_base_filter, v_base_filter
  ) INTO v_result;

  -- Adicionar dimensoes ao resultado (FORA do format)
  v_result := v_result || jsonb_build_object('dimensoes', v_dimensoes);

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro em dashboard_resumo: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    
    RETURN jsonb_build_object(
      'totais', jsonb_build_object(
        'corridas_ofertadas', 0,
        'corridas_aceitas', 0,
        'corridas_rejeitadas', 0,
        'corridas_completadas', 0
      ),
      'semanal', '[]'::jsonb,
      'dia', '[]'::jsonb,
      'turno', '[]'::jsonb,
      'sub_praca', '[]'::jsonb,
      'origem', '[]'::jsonb,
      'dimensoes', v_dimensoes
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(integer, integer, text, text, text)
  TO anon, authenticated, service_role;

-- Verificar se funcionou
SELECT '✅ dashboard_resumo corrigido!' as status;
SELECT 
  'Testando dimensoes...' as teste,
  jsonb_typeof((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'dimensoes'->'pracas') as tipo_pracas,
  jsonb_array_length((public.dashboard_resumo(NULL, NULL, NULL, NULL, NULL))->'dimensoes'->'pracas') as qtd_pracas;

