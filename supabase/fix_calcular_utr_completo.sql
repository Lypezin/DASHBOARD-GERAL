-- Create comprehensive UTR calculation function
-- Extends calcular_utr to include praca, sub_praca, origem, and turno breakdowns

CREATE OR REPLACE FUNCTION public.calcular_utr_completo(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL,
  p_turno text DEFAULT NULL,
  p_data_inicial date DEFAULT NULL,
  p_data_final date DEFAULT NULL,
  p_organization_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_org_filter uuid;
  v_result jsonb;
BEGIN
  v_org_filter := NULLIF(p_organization_id, '')::uuid;
  SELECT (role = 'admin' OR is_admin = true) INTO v_is_admin FROM public.user_profiles WHERE id = auth.uid();
  
  IF v_is_admin AND v_org_filter IS NULL THEN v_org_filter := NULL;
  ELSIF v_org_filter IS NULL AND NOT v_is_admin THEN SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid(); END IF;

  SELECT jsonb_build_object(
    'geral', (
      SELECT jsonb_build_object(
        'tempo_horas', COALESCE(SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) / 3600, 0),
        'corridas', COALESCE(SUM(numero_de_corridas_completadas), 0),
        'utr', CASE WHEN SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) > 0 
          THEN COALESCE(SUM(numero_de_corridas_completadas) / (SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) / 3600), 0)
          ELSE 0 END
      )
      FROM public.dados_corridas
      WHERE (CASE
        WHEN p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN data_do_periodo >= p_data_inicial AND data_do_periodo <= p_data_final  
        WHEN p_ano IS NOT NULL AND p_semana IS NOT NULL THEN ano_iso = p_ano AND semana_numero = p_semana
        WHEN p_ano IS NOT NULL THEN EXTRACT(YEAR FROM data_do_periodo) = p_ano
        ELSE data_do_periodo >= CURRENT_DATE - 14 AND data_do_periodo <= CURRENT_DATE
      END)
        AND (v_org_filter IS NULL OR organization_id = v_org_filter)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
        AND (p_origem IS NULL OR origem = p_origem)
        AND (p_turno IS NULL OR periodo = p_turno)
    ),
    'praca', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          praca,
          COALESCE(SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) / 3600, 0) as tempo_horas,
          COALESCE(SUM(numero_de_corridas_completadas), 0) as corridas,
          CASE WHEN SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) > 0
           THEN COALESCE(SUM(numero_de_corridas_completadas) / (SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) / 3600), 0)
            ELSE 0 END as utr
        FROM public.dados_corridas
        WHERE (CASE
          WHEN p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN data_do_periodo >= p_data_inicial AND data_do_periodo <= p_data_final
          WHEN p_ano IS NOT NULL AND p_semana IS NOT NULL THEN ano_iso = p_ano AND semana_numero = p_semana
          WHEN p_ano IS NOT NULL THEN EXTRACT(YEAR FROM data_do_periodo) = p_ano
          ELSE data_do_periodo >= CURRENT_DATE - 14 AND data_do_periodo <= CURRENT_DATE
        END)
          AND (v_org_filter IS NULL OR organization_id = v_org_filter)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR origem = p_origem)
          AND (p_turno IS NULL OR periodo = p_turno)
          AND praca IS NOT NULL
        GROUP BY praca
        ORDER BY utr DESC
      ) t
    ),
    'sub_praca', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          sub_praca,
          COALESCE(SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) / 3600, 0) as tempo_horas,
          COALESCE(SUM(numero_de_corridas_completadas), 0) as corridas,
          CASE WHEN SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) > 0
            THEN COALESCE(SUM(numero_de_corridas_completadas) / (SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) / 3600), 0)
            ELSE 0 END as utr
        FROM public.dados_corridas
        WHERE (CASE
          WHEN p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN data_do_periodo >= p_data_inicial AND data_do_periodo <= p_data_final
          WHEN p_ano IS NOT NULL AND p_semana IS NOT NULL THEN ano_iso = p_ano AND semana_numero = p_semana
          WHEN p_ano IS NOT NULL THEN EXTRACT(YEAR FROM data_do_periodo) = p_ano
          ELSE data_do_periodo >= CURRENT_DATE - 14 AND data_do_periodo <= CURRENT_DATE
        END)
          AND (v_org_filter IS NULL OR organization_id = v_org_filter)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR origem = p_origem)
          AND (p_turno IS NULL OR periodo = p_turno)
          AND sub_praca IS NOT NULL
        GROUP BY sub_praca
        ORDER BY utr DESC
      ) t
    ),
    'origem', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          origem,
          COALESCE(SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) / 3600, 0) as tempo_horas,
          COALESCE(SUM(numero_de_corridas_completadas), 0) as corridas,
          CASE WHEN SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) > 0
            THEN COALESCE(SUM(numero_de_corridas_completadas) / (SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) / 3600), 0)
            ELSE 0 END as utr
        FROM public.dados_corridas
        WHERE (CASE
          WHEN p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN data_do_periodo >= p_data_inicial AND data_do_periodo <= p_data_final
          WHEN p_ano IS NOT NULL AND p_semana IS NOT NULL THEN ano_iso = p_ano AND semana_numero = p_semana
          WHEN p_ano IS NOT NULL THEN EXTRACT(YEAR FROM data_do_periodo) = p_ano
          ELSE data_do_periodo >= CURRENT_DATE - 14 AND data_do_periodo <= CURRENT_DATE
        END)
          AND (v_org_filter IS NULL OR organization_id = v_org_filter)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR origem = p_origem)
          AND (p_turno IS NULL OR periodo = p_turno)
          AND origem IS NOT NULL
        GROUP BY origem
        ORDER BY utr DESC
      ) t
    ),
    'turno', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          periodo as turno,
          COALESCE(SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) / 3600, 0) as tempo_horas,
          COALESCE(SUM(numero_de_corridas_completadas), 0) as corridas,
          CASE WHEN SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) > 0
            THEN COALESCE(SUM(numero_de_corridas_completadas) / (SUM(EXTRACT(EPOCH FROM tempo_disponivel_absoluto)) / 3600), 0)
            ELSE 0 END as utr
        FROM public.dados_corridas
        WHERE (CASE
          WHEN p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN data_do_periodo >= p_data_inicial AND data_do_periodo <= p_data_final
          WHEN p_ano IS NOT NULL AND p_semana IS NOT NULL THEN ano_iso = p_ano AND semana_numero = p_semana
          WHEN p_ano IS NOT NULL THEN EXTRACT(YEAR FROM data_do_periodo) = p_ano
          ELSE data_do_periodo >= CURRENT_DATE - 14 AND data_do_periodo <= CURRENT_DATE
        END)
          AND (v_org_filter IS NULL OR organization_id = v_org_filter)
          AND (p_praca IS NULL OR praca = p_praca)
          AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR origem = p_origem)
          AND (p_turno IS NULL OR periodo = p_turno)
          AND periodo IS NOT NULL
        GROUP BY periodo
        ORDER BY utr DESC
      ) t
    )
  ) INTO v_result;

  RETURN v_result;
END;
$function$;
