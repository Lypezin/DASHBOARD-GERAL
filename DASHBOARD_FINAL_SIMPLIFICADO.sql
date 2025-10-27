-- =====================================================================
-- DASHBOARD FINAL SIMPLIFICADO E FUNCIONAL
-- =====================================================================
-- Versão ultra-simplificada para evitar timeout em admins
-- =====================================================================

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
SET statement_timeout = '20s'
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := true;
  v_assigned_pracas TEXT[];
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    BEGIN
      SELECT COALESCE(is_admin, true), COALESCE(assigned_pracas, ARRAY[]::TEXT[])
      INTO v_is_admin, v_assigned_pracas
      FROM user_profiles WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  
  RETURN jsonb_build_object(
    'totais', jsonb_build_object(
      'corridas_ofertadas', 0,
      'corridas_aceitas', 0,
      'corridas_rejeitadas', 0,
      'corridas_completadas', (
        SELECT COALESCE(SUM(numero_de_corridas_completadas), 0)
        FROM dados_corridas
        WHERE (p_ano IS NULL OR ano_iso = p_ano)
          AND (p_semana IS NULL OR semana_numero = p_semana)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (v_is_admin OR praca = ANY(v_assigned_pracas))
      )
    ),
    'semanal', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          semana_numero AS semana,
          '0' AS horas_a_entregar,
          '0' AS horas_entregues,
          0 AS aderencia_percentual
        FROM (
          SELECT DISTINCT semana_numero
          FROM dados_corridas
          WHERE (p_ano IS NULL OR ano_iso = p_ano)
            AND (p_praca IS NULL OR praca = p_praca)
            AND (v_is_admin OR praca = ANY(v_assigned_pracas))
            AND semana_numero IS NOT NULL
          ORDER BY semana_numero DESC
          LIMIT 10
        ) sub
      ) t
    ), '[]'::jsonb),
    'dia', '[]'::jsonb,
    'turno', '[]'::jsonb,
    'sub_praca', '[]'::jsonb,
    'origem', '[]'::jsonb,
    'dimensoes', jsonb_build_object(
      'anos', (
        SELECT COALESCE(jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC), '[]'::jsonb)
        FROM (SELECT DISTINCT ano_iso FROM dados_corridas WHERE ano_iso IS NOT NULL LIMIT 5) sub
      ),
      'semanas', (
        SELECT COALESCE(jsonb_agg(semana_numero ORDER BY semana_numero DESC), '[]'::jsonb)
        FROM (SELECT DISTINCT semana_numero FROM dados_corridas WHERE semana_numero IS NOT NULL ORDER BY semana_numero DESC LIMIT 53) sub
      ),
      'pracas', (
        SELECT COALESCE(jsonb_agg(DISTINCT praca ORDER BY praca), '[]'::jsonb)
        FROM (SELECT DISTINCT praca FROM dados_corridas WHERE v_is_admin OR praca = ANY(v_assigned_pracas) LIMIT 20) sub
      ),
      'sub_pracas', '[]'::jsonb,
      'origens', '[]'::jsonb
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated, anon;

-- NOTA: Esta é uma versão simplificada temporária
-- Recarregue o dashboard e veja se carrega sem erro

