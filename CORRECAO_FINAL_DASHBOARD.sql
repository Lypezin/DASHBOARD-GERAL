-- =====================================================================
-- CORREÇÃO FINAL - Dashboard e Filtros
-- =====================================================================

-- Criar índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_dados_ano_semana 
ON dados_corridas (ano_iso, semana_numero) 
WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL;

ANALYZE dados_corridas;

-- Recriar função com correções
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
SET statement_timeout = '25s'
SET work_mem = '512MB'
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := true;
  v_assigned_pracas TEXT[];
  v_where_base TEXT := '';
BEGIN
  v_user_id := auth.uid();
  
  -- Buscar permissões
  IF v_user_id IS NOT NULL THEN
    BEGIN
      SELECT COALESCE(is_admin, true), COALESCE(assigned_pracas, ARRAY[]::TEXT[])
      INTO v_is_admin, v_assigned_pracas
      FROM user_profiles WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
      v_is_admin := true;
      v_assigned_pracas := ARRAY[]::TEXT[];
    END;
  END IF;
  
  -- Construir WHERE base
  v_where_base := 'WHERE 1=1';
  
  IF p_ano IS NOT NULL THEN
    v_where_base := v_where_base || ' AND ano_iso = ' || p_ano;
  END IF;
  
  IF p_semana IS NOT NULL THEN
    v_where_base := v_where_base || ' AND semana_numero = ' || p_semana;
  END IF;
  
  IF p_praca IS NOT NULL THEN
    v_where_base := v_where_base || ' AND praca = ' || quote_literal(p_praca);
  END IF;
  
  IF NOT v_is_admin AND array_length(v_assigned_pracas, 1) IS NOT NULL THEN
    v_where_base := v_where_base || ' AND praca = ANY(ARRAY[' || 
      (SELECT string_agg(quote_literal(p), ',') FROM unnest(v_assigned_pracas) p) || ']::TEXT[])';
  END IF;
  
  RETURN jsonb_build_object(
    'totais', (
      EXECUTE 'SELECT jsonb_build_object(
        ''corridas_ofertadas'', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
        ''corridas_aceitas'', COALESCE(SUM(numero_de_corridas_aceitas), 0),
        ''corridas_rejeitadas'', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
        ''corridas_completadas'', COALESCE(SUM(numero_de_corridas_completadas), 0)
      ) FROM dados_corridas ' || v_where_base
    ),
    'semanal', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        EXECUTE 'SELECT 
          semana,
          horas_a_entregar,
          horas_entregues,
          aderencia_percentual
        FROM (
          SELECT 
            ano_iso || ''-W'' || LPAD(semana_numero::TEXT, 2, ''0'') AS semana,
            ROUND(SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) / 3600.0, 2)::TEXT AS horas_a_entregar,
            ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2)::TEXT AS horas_entregues,
            ROUND(
              CASE 
                WHEN SUM(COALESCE(tempo_disponivel_escalado_segundos, 0)) > 0 
                THEN (SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0))::NUMERIC / 
                      SUM(COALESCE(tempo_disponivel_escalado_segundos, 0))::NUMERIC * 100)
                ELSE 0 
              END, 1
            ) AS aderencia_percentual
          FROM dados_corridas
          ' || v_where_base || ' AND ano_iso IS NOT NULL AND semana_numero IS NOT NULL
          GROUP BY ano_iso, semana_numero
          ORDER BY ano_iso DESC, semana_numero DESC
          LIMIT 15
        ) sub'
      ) t
    ), '[]'::jsonb),
    'dia', '[]'::jsonb,
    'turno', '[]'::jsonb,
    'sub_praca', '[]'::jsonb,
    'origem', '[]'::jsonb,
    'dimensoes', jsonb_build_object(
      'anos', (
        SELECT COALESCE(jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC), '[]'::jsonb)
        FROM dados_corridas
        WHERE ano_iso IS NOT NULL
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
        LIMIT 10
      ),
      'semanas', (
        SELECT COALESCE(jsonb_agg(semana_numero ORDER BY semana_numero DESC), '[]'::jsonb)
        FROM (
          SELECT DISTINCT semana_numero
          FROM dados_corridas
          WHERE semana_numero IS NOT NULL
            AND (v_is_admin OR praca = ANY(v_assigned_pracas))
          ORDER BY semana_numero DESC
          LIMIT 53
        ) sub
      ),
      'pracas', (
        SELECT COALESCE(jsonb_agg(DISTINCT praca ORDER BY praca), '[]'::jsonb)
        FROM dados_corridas
        WHERE v_is_admin OR praca = ANY(v_assigned_pracas)
        LIMIT 20
      ),
      'sub_pracas', '[]'::jsonb,
      'origens', '[]'::jsonb
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'totais', jsonb_build_object('corridas_ofertadas', 0, 'corridas_aceitas', 0, 'corridas_rejeitadas', 0, 'corridas_completadas', 0),
      'semanal', '[]'::jsonb,
      'dia', '[]'::jsonb,
      'turno', '[]'::jsonb,
      'sub_praca', '[]'::jsonb,
      'origem', '[]'::jsonb,
      'dimensoes', jsonb_build_object('anos', '[]'::jsonb, 'semanas', '[]'::jsonb, 'pracas', '[]'::jsonb, 'sub_pracas', '[]'::jsonb, 'origens', '[]'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated, anon;

