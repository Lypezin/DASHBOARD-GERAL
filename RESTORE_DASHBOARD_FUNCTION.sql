-- =========================================
-- ÍNDICES DE SUPORTE (rodam apenas se faltar)
-- =========================================
CREATE INDEX IF NOT EXISTS idx_dc_praca_ano_semana
  ON dados_corridas (praca, ano_iso, semana_numero);

CREATE INDEX IF NOT EXISTS idx_dc_data_periodo
  ON dados_corridas (data_do_periodo)
  WHERE data_do_periodo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dc_periodo
  ON dados_corridas (periodo)
  WHERE periodo IS NOT NULL;

ANALYZE dados_corridas;

-- =========================================
-- FUNÇÃO dashboard_resumo
-- =========================================
DROP FUNCTION IF EXISTS public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano INTEGER DEFAULT NULL,
  p_semana INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_sub_praca TEXT DEFAULT NULL,
  p_origem TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET statement_timeout = '60s'
SET work_mem = '512MB'
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := true;
  v_assigned_pracas TEXT[] := ARRAY[]::TEXT[];
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    BEGIN
      SELECT COALESCE(is_admin, true), COALESCE(assigned_pracas, ARRAY[]::TEXT[])
      INTO v_is_admin, v_assigned_pracas
      FROM user_profiles
      WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
      v_is_admin := true;
      v_assigned_pracas := ARRAY[]::TEXT[];
    END;
  END IF;

  RETURN (
    WITH base AS (
      SELECT
        ano_iso,
        semana_numero,
        data_do_periodo,
        periodo,
        praca,
        sub_praca,
        origem,
        COALESCE(numero_de_corridas_ofertadas, 0)       AS corridas_ofertadas,
        COALESCE(numero_de_corridas_aceitas, 0)         AS corridas_aceitas,
        COALESCE(numero_de_corridas_rejeitadas, 0)      AS corridas_rejeitadas,
        COALESCE(numero_de_corridas_completadas, 0)     AS corridas_completadas,
        COALESCE(tempo_disponivel_escalado_segundos, 0) AS tempo_escalado_seg,
        COALESCE(tempo_disponivel_absoluto_segundos, 0) AS tempo_absoluto_seg
      FROM dados_corridas
      WHERE (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_numero = p_semana)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
        AND (p_origem IS NULL OR origem = p_origem)
        AND (v_is_admin OR praca = ANY(v_assigned_pracas))
    ),
    semanal AS (
      SELECT
        ano_iso,
        semana_numero,
        ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana_label,
        ROUND(SUM(tempo_escalado_seg) / 3600.0, 2)::TEXT AS horas_a_entregar,
        ROUND(SUM(tempo_absoluto_seg) / 3600.0, 2)::TEXT AS horas_entregues,
        ROUND(
          CASE WHEN SUM(tempo_escalado_seg) > 0
               THEN (SUM(tempo_absoluto_seg)::NUMERIC / SUM(tempo_escalado_seg)::NUMERIC * 100)
               ELSE 0 END,
          1
        ) AS aderencia_percentual
      FROM base
      WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL
      GROUP BY ano_iso, semana_numero
    ),
    dia AS (
      SELECT
        EXTRACT(ISODOW FROM data_do_periodo)::INTEGER AS dia_iso,
        TO_CHAR(data_do_periodo, 'TMDay') AS dia_da_semana,
        ROUND(SUM(tempo_escalado_seg) / 3600.0, 2)::TEXT AS horas_a_entregar,
        ROUND(SUM(tempo_absoluto_seg) / 3600.0, 2)::TEXT AS horas_entregues,
        ROUND(
          CASE WHEN SUM(tempo_escalado_seg) > 0
               THEN (SUM(tempo_absoluto_seg)::NUMERIC / SUM(tempo_escalado_seg)::NUMERIC * 100)
               ELSE 0 END,
          1
        ) AS aderencia_percentual,
        SUM(corridas_ofertadas)   AS corridas_ofertadas,
        SUM(corridas_aceitas)     AS corridas_aceitas,
        SUM(corridas_rejeitadas)  AS corridas_rejeitadas,
        SUM(corridas_completadas) AS corridas_completadas,
        ROUND(
          CASE WHEN SUM(corridas_ofertadas) > 0
               THEN (SUM(corridas_aceitas)::NUMERIC / SUM(corridas_ofertadas)::NUMERIC * 100)
               ELSE 0 END,
          1
        ) AS taxa_aceitacao,
        ROUND(
          CASE WHEN SUM(corridas_aceitas) > 0
               THEN (SUM(corridas_completadas)::NUMERIC / SUM(corridas_aceitas)::NUMERIC * 100)
               ELSE 0 END,
          1
        ) AS taxa_completude
      FROM base
      WHERE data_do_periodo IS NOT NULL
      GROUP BY EXTRACT(ISODOW FROM data_do_periodo), TO_CHAR(data_do_periodo, 'TMDay')
    ),
    turno AS (
      SELECT
        periodo,
        ROUND(SUM(tempo_escalado_seg) / 3600.0, 2)::TEXT AS horas_a_entregar,
        ROUND(SUM(tempo_absoluto_seg) / 3600.0, 2)::TEXT AS horas_entregues,
        ROUND(
          CASE WHEN SUM(tempo_escalado_seg) > 0
               THEN (SUM(tempo_absoluto_seg)::NUMERIC / SUM(tempo_escalado_seg)::NUMERIC * 100)
               ELSE 0 END,
          1
        ) AS aderencia_percentual,
        SUM(corridas_completadas) AS corridas_completadas
      FROM base
      WHERE periodo IS NOT NULL
      GROUP BY periodo
    ),
    sub_praca AS (
      SELECT
        sub_praca,
        ROUND(SUM(tempo_escalado_seg) / 3600.0, 2)::TEXT AS horas_a_entregar,
        ROUND(SUM(tempo_absoluto_seg) / 3600.0, 2)::TEXT AS horas_entregues,
        ROUND(
          CASE WHEN SUM(tempo_escalado_seg) > 0
               THEN (SUM(tempo_absoluto_seg)::NUMERIC / SUM(tempo_escalado_seg)::NUMERIC * 100)
               ELSE 0 END,
          1
        ) AS aderencia_percentual,
        SUM(corridas_completadas) AS corridas_completadas
      FROM base
      WHERE sub_praca IS NOT NULL
      GROUP BY sub_praca
    ),
    dimensoes AS (
      SELECT
        COALESCE(jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC), '[]'::jsonb)                                                   AS anos,
        COALESCE(jsonb_agg(semana_label ORDER BY ano_iso DESC, semana_numero DESC), '[]'::jsonb)                                    AS semanas,
        COALESCE(jsonb_agg(DISTINCT praca ORDER BY praca), '[]'::jsonb)                                                             AS pracas,
        COALESCE(jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca), '[]'::jsonb)                                                     AS sub_pracas,
        COALESCE(jsonb_agg(DISTINCT origem ORDER BY origem), '[]'::jsonb)                                                           AS origens
      FROM (
        SELECT
          ano_iso,
          semana_numero,
          ano_iso || '-W' || LPAD(semana_numero::TEXT, 2, '0') AS semana_label,
          praca,
          sub_praca,
          origem
        FROM base
      ) dim
    )
    SELECT jsonb_build_object(
      'totais', (
        SELECT jsonb_build_object(
          'corridas_ofertadas', COALESCE(SUM(corridas_ofertadas), 0),
          'corridas_aceitas', COALESCE(SUM(corridas_aceitas), 0),
          'corridas_rejeitadas', COALESCE(SUM(corridas_rejeitadas), 0),
          'corridas_completadas', COALESCE(SUM(corridas_completadas), 0)
        )
        FROM base
      ),
      'semanal', COALESCE((
        SELECT jsonb_agg(to_jsonb(s) ORDER BY s.ano_iso DESC, s.semana_numero DESC)
        FROM semanal s
        LIMIT 52
      ), '[]'::jsonb),
      'dia', COALESCE((
        SELECT jsonb_agg(to_jsonb(d) ORDER BY d.dia_iso)
        FROM dia d
      ), '[]'::jsonb),
      'turno', COALESCE((
        SELECT jsonb_agg(to_jsonb(t) ORDER BY t.periodo)
        FROM turno t
      ), '[]'::jsonb),
      'sub_praca', COALESCE((
        SELECT jsonb_agg(to_jsonb(sp))
        FROM (
          SELECT sub_praca, horas_a_entregar, horas_entregues,
                 aderencia_percentual, corridas_completadas
          FROM sub_praca
          ORDER BY corridas_completadas DESC
          LIMIT 50
        ) sp
      ), '[]'::jsonb),
      'origem', '[]'::jsonb,
      'dimensoes', jsonb_build_object(
        'anos',     (SELECT anos     FROM dimensoes),
        'semanas',  (SELECT semanas  FROM dimensoes),
        'pracas',   (SELECT pracas   FROM dimensoes),
        'sub_pracas',(SELECT sub_pracas FROM dimensoes),
        'origens',  (SELECT origens  FROM dimensoes)
      )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated, anon;
