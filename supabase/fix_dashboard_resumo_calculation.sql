-- Corrigir função dashboard_resumo para permitir acesso master/admin sem organization_id
-- E corrigir cálculo de aderência semanal para eliminar duplicação

-- Criar função auxiliar para verificar se usuário é admin/master
CREATE OR REPLACE FUNCTION public.is_admin_or_master()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  RETURN v_role IN ('admin', 'master');
END;
$$;

-- Corrigir dashboard_resumo para aceitar NULL organization_id se for admin/master
-- E corrigir cálculo de aderência
DROP FUNCTION IF EXISTS public.dashboard_resumo(integer, integer, text, text, text, text, date, date, uuid);

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL,
  p_turno text DEFAULT NULL,
  p_data_inicial date DEFAULT NULL,
  p_data_final date DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_data_min date;
  v_data_max date;
  v_result jsonb;
  v_is_admin_master boolean;
  v_org_filter uuid;
BEGIN
  -- Verificar se usuário é admin ou master
  v_is_admin_master := is_admin_or_master();
  
  -- Se for admin/master e organization_id for NULL, aceitar (ver todos os dados)
  -- Senão, usar o organization_id fornecido
  IF v_is_admin_master AND p_organization_id IS NULL THEN
    v_org_filter := NULL; -- NULL significa: sem filtro de organização (ver todos)
  ELSE
    v_org_filter := p_organization_id;
    
    -- Se não for admin/master E organization_id for NULL, retornar vazio
    IF v_org_filter IS NULL AND NOT v_is_admin_master THEN
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
        'dimensoes', jsonb_build_object(
          'anos', '[]'::jsonb,
          'semanas', '[]'::jsonb,
          'pracas', '[]'::jsonb,
          'sub_pracas', '[]'::jsonb,
          'origens', '[]'::jsonb,
          'turnos', '[]'::jsonb
        )
      );
    END IF;
  END IF;

  -- Determinar intervalo de datas
  IF p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN
    v_data_min := p_data_inicial;
    v_data_max := p_data_final;
  ELSIF p_ano IS NOT NULL AND p_semana IS NOT NULL THEN
    v_data_min := DATE_TRUNC('year', MAKE_DATE(p_ano, 1, 1)) + (p_semana - 1) * INTERVAL '7 days';
    v_data_max := v_data_min + INTERVAL '6 days';
  ELSIF p_ano IS NOT NULL THEN
    v_data_min := MAKE_DATE(p_ano, 1, 1);
    v_data_max := MAKE_DATE(p_ano, 12, 31);
  ELSE
    v_data_min := CURRENT_DATE - INTERVAL '2 weeks';
    v_data_max := CURRENT_DATE;
  END IF;

  -- Construir resultado
  SELECT jsonb_build_object(
    'totais', (
      SELECT jsonb_build_object(
        'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
        'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
        'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
        'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
      )
      FROM public.dados_corridas
      WHERE data_do_periodo >= v_data_min
        AND data_do_periodo <= v_data_max
        AND (v_org_filter IS NULL OR organization_id = v_org_filter)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
        AND (p_origem IS NULL OR origem = p_origem)
        AND (p_turno IS NULL OR periodo = p_turno)
    ),
    'semanal', COALESCE((
      SELECT jsonb_agg(row_to_json(semana_data))
      FROM (
        WITH dados_unicos AS (
          SELECT DISTINCT
            data_do_periodo,
            periodo,
            numero_minimo_de_entregadores_regulares_na_escala,
            duracao_do_periodo
          FROM public.dados_corridas
          WHERE data_do_periodo >= v_data_min
            AND data_do_periodo <= v_data_max
            AND (v_org_filter IS NULL OR organization_id = v_org_filter)
            AND (p_praca IS NULL OR praca = p_praca)
            AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
            AND (p_origem IS NULL OR origem = p_origem)
            AND (p_turno IS NULL OR periodo = p_turno)
            AND duracao_do_periodo IS NOT NULL
            AND duracao_do_periodo != '00:00:00'
        )
        SELECT
          TO_CHAR(du.data_do_periodo, 'IYYY') || 'W' || LPAD(TO_CHAR(du.data_do_periodo, 'IW'), 2, '0') as semana_ano,
          
          -- Horas planejadas: SUM(escala × duração) calculado apenas dos períodos únicos
          FLOOR(SUM(du.numero_minimo_de_entregadores_regulares_na_escala * EXTRACT(EPOCH FROM du.duracao_do_periodo::interval) / 3600.0))::text || ':' ||
          LPAD(FLOOR(MOD(SUM(du.numero_minimo_de_entregadores_regulares_na_escala * EXTRACT(EPOCH FROM du.duracao_do_periodo::interval) / 3600.0) * 60, 60))::text, 2, '0') || ':' ||
          LPAD(FLOOR(MOD(SUM(du.numero_minimo_de_entregadores_regulares_na_escala * EXTRACT(EPOCH FROM du.duracao_do_periodo::interval) / 3600.0) * 3600, 60))::text, 2, '0') as horas_a_entregar,
          
          -- Horas entregues: SUM de todos os tempos disponíveis absolutos
          FLOOR(COALESCE(SUM(EXTRACT(EPOCH FROM dc.tempo_disponivel_absoluto::interval) / 3600.0), 0))::text || ':' ||
          LPAD(FLOOR(MOD(COALESCE(SUM(EXTRACT(EPOCH FROM dc.tempo_disponivel_absoluto::interval) / 3600.0), 0) * 60, 60))::text, 2, '0') || ':' ||
          LPAD(FLOOR(MOD(COALESCE(SUM(EXTRACT(EPOCH FROM dc.tempo_disponivel_absoluto::interval) / 3600.0), 0) * 3600, 60))::text, 2, '0') as horas_entregues,
          
          CASE
            WHEN SUM(du.numero_minimo_de_entregadores_regulares_na_escala * EXTRACT(EPOCH FROM du.duracao_do_periodo::interval) / 3600.0) > 0 THEN
              ROUND((COALESCE(SUM(EXTRACT(EPOCH FROM dc.tempo_disponivel_absoluto::interval) / 3600.0), 0) / 
                     SUM(du.numero_minimo_de_entregadores_regulares_na_escala * EXTRACT(EPOCH FROM du.duracao_do_periodo::interval) / 3600.0)) * 100, 2)
            ELSE 0
          END as aderencia_percentual
        FROM dados_unicos du
        LEFT JOIN public.dados_corridas dc ON
          du.data_do_periodo = dc.data_do_periodo
          AND du.periodo = dc.periodo
          AND du.numero_minimo_de_entregadores_regulares_na_escala = dc.numero_minimo_de_entregadores_regulares_na_escala
          AND (v_org_filter IS NULL OR dc.organization_id = v_org_filter)
          AND (p_praca IS NULL OR dc.praca = p_praca)
          AND (p_sub_praca IS NULL OR dc.sub_praca = p_sub_praca)
          AND (p_origem IS NULL OR dc.origem = p_origem)
          AND (p_turno IS NULL OR dc.periodo = p_turno)
        GROUP BY TO_CHAR(du.data_do_periodo, 'IYYY'), TO_CHAR(du.data_do_periodo, 'IW')
        ORDER BY semana_ano DESC
        LIMIT 52
      ) as semana_data
    ), '[]'::jsonb),
    'dia', '[]'::jsonb,
    'turno', '[]'::jsonb,
    'sub_praca', '[]'::jsonb,
    'origem', '[]'::jsonb,
    'dimensoes', jsonb_build_object(
      'anos', COALESCE((
        SELECT jsonb_agg(DISTINCT EXTRACT(YEAR FROM data_do_periodo)::integer ORDER BY EXTRACT(YEAR FROM data_do_periodo)::integer)
        FROM public.dados_corridas
        WHERE (v_org_filter IS NULL OR organization_id = v_org_filter)
          AND data_do_periodo IS NOT NULL
      ), '[]'::jsonb),
      'semanas', '[]'::jsonb,
      'pracas', COALESCE((
        SELECT jsonb_agg(DISTINCT praca ORDER BY praca)
        FROM public.dados_corridas
        WHERE (v_org_filter IS NULL OR organization_id = v_org_filter)
          AND praca IS NOT NULL
        LIMIT 50
      ), '[]'::jsonb),
      'sub_pracas', '[]'::jsonb,
      'origens', '[]'::jsonb,
      'turnos', '[]'::jsonb
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_master TO authenticated;
