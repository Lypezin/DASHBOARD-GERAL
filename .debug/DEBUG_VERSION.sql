-- Versão com DEBUG LOGGING para identificar problema no RPC
-- Execute no SQL Editor

CREATE OR REPLACE FUNCTION public.dashboard_resumo(
    p_ano integer DEFAULT NULL::integer, 
    p_semana integer DEFAULT NULL::integer, 
    p_semanas integer[] DEFAULT NULL::integer[], 
    p_praca text DEFAULT NULL::text, 
    p_sub_praca text DEFAULT NULL::text, 
    p_origem text DEFAULT NULL::text, 
    p_turno text DEFAULT NULL::text, 
    p_sub_pracas text[] DEFAULT NULL::text[], 
    p_origens text[] DEFAULT NULL::text[], 
    p_turnos text[] DEFAULT NULL::text[], 
    p_filtro_modo text DEFAULT 'ano_semana'::text, 
    p_data_inicial date DEFAULT NULL::date, 
    p_data_final date DEFAULT NULL::date, 
    p_organization_id text DEFAULT NULL::text
)
RETURNS TABLE(
    total_ofertadas bigint, 
    total_aceitas bigint, 
    total_completadas bigint, 
    total_rejeitadas bigint, 
    aderencia_semanal jsonb, 
    aderencia_dia jsonb, 
    aderencia_turno jsonb, 
    aderencia_sub_praca jsonb, 
    aderencia_origem jsonb, 
    dimensoes jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_org_filter uuid;
    v_is_admin boolean;
    v_user_id uuid;
    v_debug_info text;
BEGIN
    -- DEBUG: Capturar informações
    v_user_id := auth.uid();
    
    -- 1. Verificar se usuário é admin/marketing/master
    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) 
    INTO v_is_admin 
    FROM public.user_profiles 
    WHERE id = v_user_id;
    
    -- DEBUG: Log via RAISE NOTICE
    RAISE NOTICE 'DEBUG dashboard_resumo: user_id=%, is_admin=%, org_id_param=%', 
        v_user_id, v_is_admin, p_organization_id;
    
    -- 2. Processar organization_id
    IF v_is_admin = true THEN
        v_org_filter := NULL;  -- Admin vê TUDO
        RAISE NOTICE 'DEBUG: Admin detected, v_org_filter set to NULL';
    ELSE
        -- Não é admin: usar organization_id passado ou do perfil
        IF p_organization_id IS NOT NULL AND p_organization_id != '' THEN
            BEGIN 
                v_org_filter := p_organization_id::uuid; 
                RAISE NOTICE 'DEBUG: Using provided org_id: %', v_org_filter;
            EXCEPTION WHEN OTHERS THEN 
                SELECT organization_id INTO v_org_filter 
                FROM public.user_profiles 
                WHERE id = v_user_id;
                RAISE NOTICE 'DEBUG: UUID cast failed, using profile org_id: %', v_org_filter;
            END;
        ELSE
            SELECT organization_id INTO v_org_filter 
            FROM public.user_profiles 
            WHERE id = v_user_id;
            RAISE NOTICE 'DEBUG: No org_id provided, using profile: %', v_org_filter;
        END IF;
        
        IF v_org_filter IS NULL THEN
            v_org_filter := '00000000-0000-0000-0000-000000000000'::uuid;
            RAISE NOTICE 'DEBUG: Blocking access with dummy UUID';
        END IF;
    END IF;

    RETURN QUERY
    WITH filtered_data AS (
      SELECT *, 
        EXTRACT(ISODOW FROM data_do_periodo)::integer as dia_iso_calc,
        CASE EXTRACT(ISODOW FROM data_do_periodo)::integer
          WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta'
          WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado' WHEN 7 THEN 'Domingo'
        END as dia_semana_calc
      FROM public.tb_dashboard_resumo
      WHERE (v_org_filter IS NULL OR organization_id = v_org_filter)
        AND (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_iso = p_semana)
        AND (p_semanas IS NULL OR semana_iso = ANY(p_semanas))
        AND (p_praca IS NULL OR praca = p_praca)
        AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
        AND (p_origem IS NULL OR origem = p_origem)
        AND (p_turno IS NULL OR turno = p_turno)
        AND (p_sub_pracas IS NULL OR sub_praca = ANY(p_sub_pracas))
        AND (p_origens IS NULL OR origem = ANY(p_origens))
        AND (p_turnos IS NULL OR turno = ANY(p_turnos))
        AND (p_data_inicial IS NULL OR data_do_periodo >= p_data_inicial)
        AND (p_data_final IS NULL OR data_do_periodo <= p_data_final)
    ),
    dimensoes_calc AS (
      SELECT jsonb_build_object(
        'anos', COALESCE((SELECT jsonb_agg(DISTINCT fd.ano_iso) FROM filtered_data fd), '[]'::jsonb),
        'semanas', COALESCE((SELECT jsonb_agg(DISTINCT fd.semana_iso) FROM filtered_data fd), '[]'::jsonb),
        'pracas', COALESCE((SELECT jsonb_agg(DISTINCT fd.praca) FROM filtered_data fd WHERE fd.praca IS NOT NULL), '[]'::jsonb),
        'sub_pracas', COALESCE((SELECT jsonb_agg(DISTINCT fd.sub_praca) FROM filtered_data fd WHERE fd.sub_praca IS NOT NULL), '[]'::jsonb),
        'origens', COALESCE((SELECT jsonb_agg(DISTINCT fd.origem) FROM filtered_data fd WHERE fd.origem IS NOT NULL), '[]'::jsonb),
        'turnos', COALESCE((SELECT jsonb_agg(DISTINCT fd.turno) FROM filtered_data fd WHERE fd.turno IS NOT NULL), '[]'::jsonb)
      ) as dimensoes_json
    )
    SELECT 
        COALESCE(SUM(fd.total_ofertadas), 0)::bigint as total_ofertadas,
        COALESCE(SUM(fd.total_aceitas), 0)::bigint as total_aceitas,
        COALESCE(SUM(fd.total_completadas), 0)::bigint as total_completadas,
        COALESCE(SUM(fd.total_rejeitadas), 0)::bigint as total_rejeitadas,
        
        COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT 
                    fd.semana_iso as semana,
                    SUM(fd.segundos_planejados) as segundos_planejados,
                    SUM(fd.segundos_realizados) as segundos_realizados,
                    CASE WHEN SUM(fd.segundos_planejados) > 0 
                         THEN (SUM(fd.segundos_realizados)::numeric / SUM(fd.segundos_planejados)::numeric) * 100 
                         ELSE 0 END as aderencia_percentual
                FROM filtered_data fd
                GROUP BY fd.semana_iso
                ORDER BY fd.semana_iso
            ) t
        ), '[]'::jsonb) as aderencia_semanal,

        COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT 
                    fd.dia_semana_calc as dia_semana,
                    fd.dia_iso_calc as dia_iso,
                    SUM(fd.segundos_planejados) as segundos_planejados,
                    SUM(fd.segundos_realizados) as segundos_realizados,
                    CASE WHEN SUM(fd.segundos_planejados) > 0 
                         THEN (SUM(fd.segundos_realizados)::numeric / SUM(fd.segundos_planejados)::numeric) * 100 
                         ELSE 0 END as aderencia_percentual,
                    SUM(fd.total_ofertadas) as corridas_ofertadas,
                    SUM(fd.total_aceitas) as corridas_aceitas,
                    SUM(fd.total_rejeitadas) as corridas_rejeitadas,
                    SUM(fd.total_completadas) as corridas_completadas
                FROM filtered_data fd
                GROUP BY fd.dia_semana_calc, fd.dia_iso_calc
                ORDER BY fd.dia_iso_calc
            ) t
        ), '[]'::jsonb) as aderencia_dia,

        COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT 
                    fd.turno,
                    SUM(fd.segundos_planejados) as segundos_planejados,
                    SUM(fd.segundos_realizados) as segundos_realizados,
                    CASE WHEN SUM(fd.segundos_planejados) > 0 
                         THEN (SUM(fd.segundos_realizados)::numeric / SUM(fd.segundos_planejados)::numeric) * 100 
                         ELSE 0 END as aderencia_percentual,
                    SUM(fd.total_ofertadas) as corridas_ofertadas,
                    SUM(fd.total_aceitas) as corridas_aceitas,
                    SUM(fd.total_rejeitadas) as corridas_rejeitadas,
                    SUM(fd.total_completadas) as corridas_completadas
                FROM filtered_data fd
                WHERE fd.turno IS NOT NULL
                GROUP BY fd.turno
                ORDER BY fd.turno
            ) t
        ), '[]'::jsonb) as aderencia_turno,

        COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT 
                    fd.sub_praca,
                    SUM(fd.segundos_planejados) as segundos_planejados,
                    SUM(fd.segundos_realizados) as segundos_realizados,
                    CASE WHEN SUM(fd.segundos_planejados) > 0 
                         THEN (SUM(fd.segundos_realizados)::numeric / SUM(fd.segundos_planejados)::numeric) * 100 
                         ELSE 0 END as aderencia_percentual,
                    SUM(fd.total_ofertadas) as corridas_ofertadas,
                    SUM(fd.total_aceitas) as corridas_aceitas,
                    SUM(fd.total_rejeitadas) as corridas_rejeitadas,
                    SUM(fd.total_completadas) as corridas_completadas
                FROM filtered_data fd
                WHERE fd.sub_praca IS NOT NULL
                GROUP BY fd.sub_praca
                ORDER BY fd.sub_praca
            ) t
        ), '[]'::jsonb) as aderencia_sub_praca,

        COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT 
                    fd.origem,
                    SUM(fd.segundos_planejados) as segundos_planejados,
                    SUM(fd.segundos_realizados) as segundos_realizados,
                    CASE WHEN SUM(fd.segundos_planejados) > 0 
                         THEN (SUM(fd.segundos_realizados)::numeric / SUM(fd.segundos_planejados)::numeric) * 100 
                         ELSE 0 END as aderencia_percentual,
                    SUM(fd.total_ofertadas) as corridas_ofertadas,
                    SUM(fd.total_aceitas) as corridas_aceitas,
                    SUM(fd.total_rejeitadas) as corridas_rejeitadas,
                    SUM(fd.total_completadas) as corridas_completadas
                FROM filtered_data fd
                WHERE fd.origem IS NOT NULL
                GROUP BY fd.origem
                ORDER BY fd.origem
            ) t
        ), '[]'::jsonb) as aderencia_origem,
        
        (SELECT dimensoes_json FROM dimensoes_calc) as dimensoes
    FROM filtered_data fd;
END;
$function$;
