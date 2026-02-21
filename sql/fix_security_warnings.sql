-- Fix: function_search_path_mutable

CREATE OR REPLACE FUNCTION public.dashboard_evolucao_mensal(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_semanas integer[] DEFAULT NULL::integer[], p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_turno text DEFAULT NULL::text, p_sub_pracas text[] DEFAULT NULL::text[], p_origens text[] DEFAULT NULL::text[], p_turnos text[] DEFAULT NULL::text[], p_filtro_modo text DEFAULT 'ano_semana'::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(ano integer, mes integer, mes_nome text, total_corridas bigint, corridas_completadas bigint, corridas_ofertadas bigint, corridas_aceitas bigint, corridas_rejeitadas bigint, total_segundos numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_org_filter uuid;
    v_is_admin boolean;
    v_user_id uuid;
    v_praca_list text[];
    v_sub_praca_list text[];
    v_origem_list text[];
    v_turno_list text[];
    v_ano_filter int;
BEGIN
    v_user_id := auth.uid();
    
    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) 
    INTO v_is_admin 
    FROM public.user_profiles 
    WHERE id = v_user_id;
    
    IF v_is_admin = true THEN
        v_org_filter := NULL;
    ELSE
        IF p_organization_id IS NOT NULL AND p_organization_id != '' THEN
            BEGIN 
                v_org_filter := p_organization_id::uuid; 
            EXCEPTION WHEN OTHERS THEN 
                SELECT organization_id INTO v_org_filter 
                FROM public.user_profiles 
                WHERE id = v_user_id;
            END;
        ELSE
            SELECT organization_id INTO v_org_filter 
            FROM public.user_profiles 
            WHERE id = v_user_id;
        END IF;
    END IF;

    -- Standardize array inputs
    IF p_sub_pracas IS NOT NULL AND array_length(p_sub_pracas, 1) > 0 THEN
        v_sub_praca_list := p_sub_pracas;
    ELSIF p_sub_praca IS NOT NULL THEN
        v_sub_praca_list := ARRAY[p_sub_praca];
    END IF;

    IF p_origens IS NOT NULL AND array_length(p_origens, 1) > 0 THEN
        v_origem_list := p_origens;
    ELSIF p_origem IS NOT NULL THEN
        v_origem_list := ARRAY[p_origem];
    END IF;

    IF p_turnos IS NOT NULL AND array_length(p_turnos, 1) > 0 THEN
        v_turno_list := p_turnos;
    ELSIF p_turno IS NOT NULL THEN
        v_turno_list := ARRAY[p_turno];
    END IF;

    IF p_praca IS NOT NULL THEN
        v_praca_list := ARRAY[p_praca];
    END IF;

    v_ano_filter := p_ano;

    RETURN QUERY
    WITH filtered_data AS (
        SELECT 
            -- Calculate Calendar Month/Year
            (EXTRACT(YEAR FROM data_do_periodo))::integer as ano_calendario,
            EXTRACT(MONTH FROM data_do_periodo)::integer as mes_calendario,
            
            -- Columns from mv_dashboard_resumo
            total_ofertadas,
            total_aceitas,
            total_rejeitadas,
            total_completadas,
            segundos_realizados
            
        FROM public.mv_dashboard_resumo
        WHERE 
            (v_org_filter IS NULL OR organization_id = v_org_filter)
            AND (v_praca_list IS NULL OR praca = ANY(v_praca_list))
            AND (v_sub_praca_list IS NULL OR sub_praca = ANY(v_sub_praca_list))
            AND (v_origem_list IS NULL OR origem = ANY(v_origem_list))
            AND (v_turno_list IS NULL OR turno = ANY(v_turno_list))
            AND (p_sub_pracas IS NULL OR sub_praca = ANY(p_sub_pracas))
            AND (p_origens IS NULL OR origem = ANY(p_origens))
            AND (p_turnos IS NULL OR turno = ANY(p_turnos))
            AND (p_data_inicial IS NULL OR data_do_periodo >= p_data_inicial)
            AND (p_data_final IS NULL OR data_do_periodo <= p_data_final)
            -- FILTER BY CALENDAR YEAR (Fixes "Ghost December")
            AND (v_ano_filter IS NULL OR EXTRACT(YEAR FROM data_do_periodo) = v_ano_filter)
    )
    SELECT
        v_ano_filter as ano,
        fd.mes_calendario as mes,
        CASE fd.mes_calendario
            WHEN 1 THEN 'Janeiro' WHEN 2 THEN 'Fevereiro' WHEN 3 THEN 'Março'
            WHEN 4 THEN 'Abril' WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho'
            WHEN 7 THEN 'Julho' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Setembro'
            WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
        END as mes_nome,
        -- Aggregate
        SUM(COALESCE(fd.total_ofertadas,0) + COALESCE(fd.total_aceitas,0) + COALESCE(fd.total_rejeitadas,0) + COALESCE(fd.total_completadas,0))::bigint as total_corridas,
        SUM(COALESCE(fd.total_completadas, 0))::bigint as corridas_completadas,
        SUM(COALESCE(fd.total_ofertadas, 0))::bigint as corridas_ofertadas,
        SUM(COALESCE(fd.total_aceitas, 0))::bigint as corridas_aceitas,
        SUM(COALESCE(fd.total_rejeitadas, 0))::bigint as corridas_rejeitadas,
        SUM(COALESCE(fd.segundos_realizados, 0))::numeric as total_segundos
    FROM filtered_data fd
    GROUP BY fd.mes_calendario
    ORDER BY fd.mes_calendario;
END;
$function$;

CREATE OR REPLACE FUNCTION public.dashboard_evolucao_semanal(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_semanas integer[] DEFAULT NULL::integer[], p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_turno text DEFAULT NULL::text, p_sub_pracas text[] DEFAULT NULL::text[], p_origens text[] DEFAULT NULL::text[], p_turnos text[] DEFAULT NULL::text[], p_filtro_modo text DEFAULT 'ano_semana'::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(ano integer, semana integer, total_corridas bigint, corridas_completadas bigint, corridas_ofertadas bigint, corridas_aceitas bigint, corridas_rejeitadas bigint, total_segundos numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_org_filter uuid;
    v_is_admin boolean;
    v_user_id uuid;
    v_praca_list text[];
    v_sub_praca_list text[];
    v_origem_list text[];
    v_turno_list text[];
BEGIN
    v_user_id := auth.uid();
    
    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) 
    INTO v_is_admin 
    FROM public.user_profiles 
    WHERE id = v_user_id;
    
    IF v_is_admin = true THEN
        v_org_filter := NULL;
    ELSE
        IF p_organization_id IS NOT NULL AND p_organization_id != '' THEN
            BEGIN 
                v_org_filter := p_organization_id::uuid; 
            EXCEPTION WHEN OTHERS THEN 
                SELECT organization_id INTO v_org_filter 
                FROM public.user_profiles 
                WHERE id = v_user_id;
            END;
        ELSE
            SELECT organization_id INTO v_org_filter 
            FROM public.user_profiles 
            WHERE id = v_user_id;
        END IF;
        
        IF v_org_filter IS NULL THEN
            v_org_filter := '00000000-0000-0000-0000-000000000000'::uuid;
        END IF;
    END IF;

    IF p_praca IS NOT NULL AND length(trim(p_praca)) > 0 AND lower(trim(p_praca)) != 'todas' THEN
        v_praca_list := string_to_array(p_praca, ',');
    ELSE
        v_praca_list := NULL;
    END IF;

    IF p_sub_praca IS NOT NULL AND length(trim(p_sub_praca)) > 0 AND lower(trim(p_sub_praca)) != 'todas' THEN
        v_sub_praca_list := string_to_array(p_sub_praca, ',');
    ELSE
        v_sub_praca_list := NULL;
    END IF;

    IF p_origem IS NOT NULL AND length(trim(p_origem)) > 0 AND lower(trim(p_origem)) != 'todas' THEN
        v_origem_list := string_to_array(p_origem, ',');
    ELSE
        v_origem_list := NULL;
    END IF;

    IF p_turno IS NOT NULL AND length(trim(p_turno)) > 0 AND lower(trim(p_turno)) != 'todos' THEN
        v_turno_list := string_to_array(p_turno, ',');
    ELSE
        v_turno_list := NULL;
    END IF;

    RETURN QUERY
    WITH filtered_data AS (
      SELECT *, 
       EXTRACT(ISODOW FROM data_do_periodo)::integer as dia_iso_calc
      FROM public.mv_dashboard_resumo
      WHERE (v_org_filter IS NULL OR organization_id = v_org_filter)
        AND (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_iso = p_semana)
        AND (p_semanas IS NULL OR semana_iso = ANY(p_semanas))
        AND (v_praca_list IS NULL OR praca = ANY(v_praca_list))
        AND (v_sub_praca_list IS NULL OR sub_praca = ANY(v_sub_praca_list))
        AND (v_origem_list IS NULL OR origem = ANY(v_origem_list))
        AND (v_turno_list IS NULL OR turno = ANY(v_turno_list))
        AND (p_sub_pracas IS NULL OR sub_praca = ANY(p_sub_pracas))
        AND (p_origens IS NULL OR origem = ANY(p_origens))
        AND (p_turnos IS NULL OR turno = ANY(p_turnos))
        AND (p_data_inicial IS NULL OR data_do_periodo >= p_data_inicial)
        AND (p_data_final IS NULL OR data_do_periodo <= p_data_final)
    )
    SELECT
        fd.ano_iso as ano,
        fd.semana_iso as semana,
        SUM(COALESCE(fd.total_ofertadas,0) + COALESCE(fd.total_aceitas,0) + COALESCE(fd.total_rejeitadas,0) + COALESCE(fd.total_completadas,0))::bigint as total_corridas,
        SUM(COALESCE(fd.total_completadas, 0))::bigint as corridas_completadas,
        SUM(COALESCE(fd.total_ofertadas, 0))::bigint as corridas_ofertadas,
        SUM(COALESCE(fd.total_aceitas, 0))::bigint as corridas_aceitas,
        SUM(COALESCE(fd.total_rejeitadas, 0))::bigint as corridas_rejeitadas,
        SUM(COALESCE(fd.segundos_realizados, 0))::numeric as total_segundos
    FROM filtered_data fd
    GROUP BY fd.ano_iso, fd.semana_iso
    ORDER BY fd.ano_iso, fd.semana_iso;
END;
$function$;

CREATE OR REPLACE FUNCTION public.dashboard_resumo(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_semanas integer[] DEFAULT NULL::integer[], p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_turno text DEFAULT NULL::text, p_sub_pracas text[] DEFAULT NULL::text[], p_origens text[] DEFAULT NULL::text[], p_turnos text[] DEFAULT NULL::text[], p_filtro_modo text DEFAULT 'ano_semana'::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text, detailed boolean DEFAULT NULL::boolean)
 RETURNS TABLE(total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, aderencia_semanal jsonb, aderencia_dia jsonb, aderencia_turno jsonb, aderencia_sub_praca jsonb, aderencia_origem jsonb, dimensoes jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_org_filter uuid;
    v_is_admin boolean;
    v_user_id uuid;
    v_debug_info text;
    
    -- Variáveis para tratamento de arrays
    v_praca_list text[];
    v_sub_praca_list text[];
    v_origem_list text[];
    v_turno_list text[];
BEGIN
    -- DEBUG: Capturar informações
    v_user_id := auth.uid();
    
    -- 1. Verificar se usuário é admin/marketing/master
    -- Use permissive check (SECURITY DEFINER bypasses RLS on user_profiles)
    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) 
    INTO v_is_admin 
    FROM public.user_profiles 
    WHERE id = v_user_id;

    -- 2. Processar organization_id
    IF v_is_admin THEN
        -- Admin pode ver qualquer organização se solicitada, ou todas (NULL)
        IF p_organization_id IS NOT NULL AND p_organization_id != 'null' AND length(p_organization_id) > 0 THEN
            BEGIN
                v_org_filter := p_organization_id::uuid;
            EXCEPTION WHEN OTHERS THEN
                v_org_filter := NULL;
            END;
        ELSE
            v_org_filter := NULL; -- Ver todas
        END IF;
    ELSE
        -- Usuário normal vê apenas sua organização
        IF p_organization_id IS NOT NULL AND p_organization_id != 'null' AND length(p_organization_id) > 0 THEN
            BEGIN
                v_org_filter := p_organization_id::uuid;
                
                -- Verificar se o usuário pertence a essa organização
                IF NOT EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE id = v_user_id AND organization_id = v_org_filter
                ) THEN
                    -- Se tentar ver outra organização, força a dele mesmo
                    SELECT organization_id INTO v_org_filter 
                    FROM public.user_profiles 
                    WHERE id = v_user_id;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                SELECT organization_id INTO v_org_filter 
                FROM public.user_profiles 
                WHERE id = v_user_id;
            END;
        ELSE
            SELECT organization_id INTO v_org_filter 
            FROM public.user_profiles 
            WHERE id = v_user_id;
        END IF;
        
        -- Fallback if no org found for user
        IF v_org_filter IS NULL AND v_user_id IS NOT NULL THEN
             -- Allow viewing if no org assigned but authenticated? No, block.
             -- But to prevent '0' results for admins testing, let's keep logic simple
             NULL; 
        END IF;
    END IF;

    -- 3. Processar filtros de texto para arrays (tratamento robusto)
    
    IF p_praca IS NOT NULL AND length(trim(p_praca)) > 0 AND lower(trim(p_praca)) != 'todas' THEN
        v_praca_list := string_to_array(p_praca, ',');
    ELSE
        v_praca_list := NULL;
    END IF;

    IF p_sub_praca IS NOT NULL AND length(trim(p_sub_praca)) > 0 AND lower(trim(p_sub_praca)) != 'todas' THEN
        v_sub_praca_list := string_to_array(p_sub_praca, ',');
    ELSE
        v_sub_praca_list := NULL;
    END IF;

    IF p_origem IS NOT NULL AND length(trim(p_origem)) > 0 AND lower(trim(p_origem)) != 'todas' THEN
        v_origem_list := string_to_array(p_origem, ',');
    ELSE
        v_origem_list := NULL;
    END IF;

    IF p_turno IS NOT NULL AND length(trim(p_turno)) > 0 AND lower(trim(p_turno)) != 'todos' THEN
        v_turno_list := string_to_array(p_turno, ',');
    ELSE
        v_turno_list := NULL;
    END IF;

    RETURN QUERY
    WITH filtered_data AS (
      SELECT *, 
       EXTRACT(ISODOW FROM data_do_periodo)::integer as dia_iso_calc,
        CASE EXTRACT(ISODOW FROM data_do_periodo)::integer
          WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta'
          WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado' WHEN 7 THEN 'Domingo'
        END as dia_semana_calc
      FROM public.mv_dashboard_resumo
      WHERE (v_org_filter IS NULL OR organization_id = v_org_filter)
        AND (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_iso = p_semana)
        AND (p_semanas IS NULL OR semana_iso = ANY(p_semanas))
        AND (v_praca_list IS NULL OR praca = ANY(v_praca_list))
        AND (v_sub_praca_list IS NULL OR sub_praca = ANY(v_sub_praca_list) OR p_sub_pracas IS NULL OR sub_praca = ANY(p_sub_pracas))
        AND (v_origem_list IS NULL OR origem = ANY(v_origem_list) OR p_origens IS NULL OR origem = ANY(p_origens))
        AND (v_turno_list IS NULL OR turno = ANY(v_turno_list) OR p_turnos IS NULL OR turno = ANY(p_turnos))
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
                         ELSE 0 END as aderencia_percentual,
                    SUM(fd.total_ofertadas) as corridas_ofertadas,
                    SUM(fd.total_aceitas) as corridas_aceitas,
                    SUM(fd.total_rejeitadas) as corridas_rejeitadas,
                    SUM(fd.total_completadas) as corridas_completadas
                FROM filtered_data fd
                WHERE fd.semana_iso IS NOT NULL
                GROUP BY fd.semana_iso
                ORDER BY fd.semana_iso
            ) t
        ), '[]'::jsonb) as aderencia_semanal,
        
        COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT 
                    fd.dia_semana_calc as dia,
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
                WHERE fd.dia_semana_calc IS NOT NULL
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

CREATE OR REPLACE FUNCTION public.dashboard_utr_semanal(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_semanas integer[] DEFAULT NULL::integer[], p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_turno text DEFAULT NULL::text, p_sub_pracas text[] DEFAULT NULL::text[], p_origens text[] DEFAULT NULL::text[], p_turnos text[] DEFAULT NULL::text[], p_filtro_modo text DEFAULT 'ano_semana'::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(ano integer, semana integer, tempo_horas numeric, total_corridas bigint, utr numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_org_filter uuid;
    v_is_admin boolean;
    v_user_id uuid;
    v_praca_list text[];
    v_sub_praca_list text[];
    v_origem_list text[];
    v_turno_list text[];
BEGIN
    v_user_id := auth.uid();
    
    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) 
    INTO v_is_admin 
    FROM public.user_profiles 
    WHERE id = v_user_id;
    
    IF v_is_admin = true THEN
        v_org_filter := NULL;
    ELSE
        IF p_organization_id IS NOT NULL AND p_organization_id != '' THEN
            BEGIN 
                v_org_filter := p_organization_id::uuid; 
            EXCEPTION WHEN OTHERS THEN 
                SELECT organization_id INTO v_org_filter 
                FROM public.user_profiles 
                WHERE id = v_user_id;
            END;
        ELSE
            SELECT organization_id INTO v_org_filter 
            FROM public.user_profiles 
            WHERE id = v_user_id;
        END IF;
        
        IF v_org_filter IS NULL THEN
            v_org_filter := '00000000-0000-0000-0000-000000000000'::uuid;
        END IF;
    END IF;

    IF p_praca IS NOT NULL AND length(trim(p_praca)) > 0 AND lower(trim(p_praca)) != 'todas' THEN
        v_praca_list := string_to_array(p_praca, ',');
    ELSE
        v_praca_list := NULL;
    END IF;

    IF p_sub_praca IS NOT NULL AND length(trim(p_sub_praca)) > 0 AND lower(trim(p_sub_praca)) != 'todas' THEN
        v_sub_praca_list := string_to_array(p_sub_praca, ',');
    ELSE
        v_sub_praca_list := NULL;
    END IF;

    IF p_origem IS NOT NULL AND length(trim(p_origem)) > 0 AND lower(trim(p_origem)) != 'todas' THEN
        v_origem_list := string_to_array(p_origem, ',');
    ELSE
        v_origem_list := NULL;
    END IF;

    IF p_turno IS NOT NULL AND length(trim(p_turno)) > 0 AND lower(trim(p_turno)) != 'todos' THEN
        v_turno_list := string_to_array(p_turno, ',');
    ELSE
        v_turno_list := NULL;
    END IF;

    RETURN QUERY
    WITH filtered_data AS (
      SELECT *, 
       EXTRACT(ISODOW FROM data_do_periodo)::integer as dia_iso_calc
      FROM public.mv_dashboard_resumo
      WHERE (v_org_filter IS NULL OR organization_id = v_org_filter)
        AND (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_iso = p_semana)
        AND (p_semanas IS NULL OR semana_iso = ANY(p_semanas))
        AND (v_praca_list IS NULL OR praca = ANY(v_praca_list))
        AND (v_sub_praca_list IS NULL OR sub_praca = ANY(v_sub_praca_list))
        AND (v_origem_list IS NULL OR origem = ANY(v_origem_list))
        AND (v_turno_list IS NULL OR turno = ANY(v_turno_list))
        AND (p_sub_pracas IS NULL OR sub_praca = ANY(p_sub_pracas))
        AND (p_origens IS NULL OR origem = ANY(p_origens))
        AND (p_turnos IS NULL OR turno = ANY(p_turnos))
        AND (p_data_inicial IS NULL OR data_do_periodo >= p_data_inicial)
        AND (p_data_final IS NULL OR data_do_periodo <= p_data_final)
    )
    SELECT
        fd.ano_iso as ano,
        fd.semana_iso as semana,
        (SUM(COALESCE(fd.segundos_realizados, 0))::numeric / 3600.0) as tempo_horas,
        SUM(COALESCE(fd.total_completadas, 0))::bigint as total_corridas,
        CASE 
            WHEN SUM(COALESCE(fd.segundos_realizados, 0)) > 0 THEN 
                (SUM(COALESCE(fd.total_completadas, 0))::numeric / (SUM(COALESCE(fd.segundos_realizados, 0))::numeric / 3600.0))
            ELSE 0 
        END as utr
    FROM filtered_data fd
    GROUP BY fd.ano_iso, fd.semana_iso
    ORDER BY fd.ano_iso, fd.semana_iso;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_city_last_updates(p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(city text, last_update_date text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_org_filter uuid;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    -- Determine Organization ID
    IF p_organization_id IS NOT NULL AND p_organization_id != '' THEN
        BEGIN 
            v_org_filter := p_organization_id::uuid; 
        EXCEPTION WHEN OTHERS THEN 
            SELECT organization_id INTO v_org_filter 
            FROM public.user_profiles 
            WHERE id = v_user_id;
        END;
    ELSE
        SELECT organization_id INTO v_org_filter 
        FROM public.user_profiles 
        WHERE id = v_user_id;
    END IF;

    RETURN QUERY
    SELECT 
        dc.praca::text AS city,
        to_char(MAX(dc.data_do_periodo), 'YYYY-MM-DD"T"HH24:MI:SS') AS last_update_date
    FROM public.mv_dashboard_resumo dc
    WHERE 
        (v_org_filter IS NULL OR dc.organization_id = v_org_filter)
        AND dc.data_do_periodo >= (CURRENT_DATE - INTERVAL '6 months')::date
    GROUP BY dc.praca
    ORDER BY city;
END;
$function$;

CREATE OR REPLACE FUNCTION public.listar_anos_disponiveis()
 RETURNS SETOF integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    BEGIN
        RETURN QUERY SELECT DISTINCT ano_iso FROM public.mv_dashboard_resumo ORDER BY 1 DESC;
        IF FOUND THEN
            RETURN;
        END IF;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    RETURN QUERY 
    WITH RECURSIVE t AS (
        (SELECT ano_iso FROM public.dados_corridas ORDER BY ano_iso DESC LIMIT 1)
        UNION ALL
        SELECT (SELECT ano_iso FROM public.dados_corridas WHERE ano_iso < t.ano_iso ORDER BY ano_iso DESC LIMIT 1)
        FROM t
        WHERE t.ano_iso IS NOT NULL
    )
    SELECT ano_iso FROM t WHERE ano_iso IS NOT NULL;
    
    IF NOT FOUND THEN
        RETURN NEXT 2026;
        RETURN NEXT 2025;
        RETURN NEXT 2024;
    END IF;

    RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.register_interaction(p_interaction_type text)
 RETURNS TABLE(new_badge_slug text, new_badge_name text, new_badge_description text, new_badge_icon text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_user_id UUID;
    v_today DATE := CURRENT_DATE;
    v_now TIMESTAMPTZ := NOW();
    v_hour INTEGER;
    v_user_stats public.gamification_user_stats%ROWTYPE;
    v_badge RECORD;
    v_session_duration INTERVAL;
    v_has_reset_daily BOOLEAN := FALSE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Buscar ou Criar Stats
    SELECT * INTO v_user_stats FROM public.gamification_user_stats WHERE user_id = v_user_id;
    IF NOT FOUND THEN
        INSERT INTO public.gamification_user_stats (
            user_id, login_streak, last_login_date, 
            last_interaction_at, session_start_at, daily_tabs_visited, last_daily_reset
        )
        VALUES (
            v_user_id, 0, NULL, 
            v_now, v_now, ARRAY[]::TEXT[], v_today
        )
        RETURNING * INTO v_user_stats;
    END IF;

    IF v_user_stats.last_daily_reset IS NULL OR v_user_stats.last_daily_reset < v_today THEN
        UPDATE public.gamification_user_stats 
        SET daily_tabs_visited = ARRAY[]::TEXT[], last_daily_reset = v_today 
        WHERE user_id = v_user_id;
        v_user_stats.daily_tabs_visited := ARRAY[]::TEXT[];
        v_user_stats.last_daily_reset := v_today;
        v_has_reset_daily := TRUE;
    END IF;

    IF v_user_stats.last_interaction_at IS NULL OR (v_now - v_user_stats.last_interaction_at) > INTERVAL '30 minutes' THEN
        UPDATE public.gamification_user_stats SET session_start_at = v_now WHERE user_id = v_user_id;
        v_user_stats.session_start_at := v_now;
    END IF;

    UPDATE public.gamification_user_stats SET last_interaction_at = v_now WHERE user_id = v_user_id;
    v_user_stats.last_interaction_at := v_now;

    IF p_interaction_type = 'login' THEN
        IF v_user_stats.last_login_date IS NULL OR v_user_stats.last_login_date < (v_today - 1) THEN
            UPDATE public.gamification_user_stats SET login_streak = 1, last_login_date = v_today WHERE user_id = v_user_id;
        ELSIF v_user_stats.last_login_date = (v_today - 1) THEN
            UPDATE public.gamification_user_stats SET login_streak = login_streak + 1, last_login_date = v_today WHERE user_id = v_user_id;
        END IF;
    ELSIF p_interaction_type = 'view_comparacao' THEN
        UPDATE public.gamification_user_stats 
        SET view_count_comparacao = COALESCE(view_count_comparacao, 0) + 1,
            daily_tabs_visited = array_append(daily_tabs_visited, 'view_comparacao') 
        WHERE user_id = v_user_id AND NOT ('view_comparacao' = ANY(daily_tabs_visited));
    ELSIF p_interaction_type = 'view_resumo' THEN
        UPDATE public.gamification_user_stats 
        SET view_count_resumo = COALESCE(view_count_resumo, 0) + 1,
            daily_tabs_visited = array_append(daily_tabs_visited, 'view_resumo')
        WHERE user_id = v_user_id AND NOT ('view_resumo' = ANY(daily_tabs_visited));
    ELSIF p_interaction_type = 'view_entregadores' THEN
        UPDATE public.gamification_user_stats 
        SET view_count_entregadores = COALESCE(view_count_entregadores, 0) + 1,
            daily_tabs_visited = array_append(daily_tabs_visited, 'view_entregadores')
        WHERE user_id = v_user_id AND NOT ('view_entregadores' = ANY(daily_tabs_visited));
    ELSIF p_interaction_type = 'view_evolucao' THEN
        UPDATE public.gamification_user_stats 
        SET view_count_evolucao = COALESCE(view_count_evolucao, 0) + 1,
            daily_tabs_visited = array_append(daily_tabs_visited, 'view_evolucao')
        WHERE user_id = v_user_id AND NOT ('view_evolucao' = ANY(daily_tabs_visited));
    ELSIF p_interaction_type = 'filter_change' THEN
        UPDATE public.gamification_user_stats SET filter_usage_count = COALESCE(filter_usage_count, 0) + 1 WHERE user_id = v_user_id;
    END IF;

    SELECT * INTO v_user_stats FROM public.gamification_user_stats WHERE user_id = v_user_id;

    FOR v_badge IN 
        SELECT * FROM public.gamification_badges b
        WHERE b.slug NOT IN (SELECT badge_slug FROM public.gamification_user_badges WHERE user_id = v_user_id)
    LOOP
        IF v_badge.slug = 'marathon' OR v_badge.slug = 'maratonista' THEN
             v_session_duration := v_user_stats.last_interaction_at - v_user_stats.session_start_at;
             IF EXTRACT(EPOCH FROM v_session_duration) >= 7200 THEN 
                 INSERT INTO public.gamification_user_badges (user_id, badge_slug) VALUES (v_user_id, v_badge.slug);
                 new_badge_slug := v_badge.slug; new_badge_name := v_badge.name; new_badge_description := v_badge.description; new_badge_icon := v_badge.icon; RETURN NEXT;
             END IF;
        
        ELSIF v_badge.slug = 'night_owl' OR v_badge.slug = 'coruja_noturna' THEN
             v_hour := EXTRACT(HOUR FROM v_now AT TIME ZONE 'America/Sao_Paulo'); 
             IF v_hour >= 22 OR v_hour < 5 THEN
                 INSERT INTO public.gamification_user_badges (user_id, badge_slug) VALUES (v_user_id, v_badge.slug);
                 new_badge_slug := v_badge.slug; new_badge_name := v_badge.name; new_badge_description := v_badge.description; new_badge_icon := v_badge.icon; RETURN NEXT;
             END IF;

        ELSIF v_badge.slug = 'analyst_pro' OR v_badge.slug = 'analista_pro' THEN
             IF 'view_comparacao' = ANY(v_user_stats.daily_tabs_visited) AND
                'view_resumo' = ANY(v_user_stats.daily_tabs_visited) AND
                'view_entregadores' = ANY(v_user_stats.daily_tabs_visited) AND
                'view_evolucao' = ANY(v_user_stats.daily_tabs_visited) 
             THEN
                 INSERT INTO public.gamification_user_badges (user_id, badge_slug) VALUES (v_user_id, v_badge.slug);
                 new_badge_slug := v_badge.slug; new_badge_name := v_badge.name; new_badge_description := v_badge.description; new_badge_icon := v_badge.icon; RETURN NEXT;
             END IF;

        ELSIF (v_badge.criteria_type = 'login_streak' AND v_user_stats.login_streak >= v_badge.threshold) OR
           (v_badge.criteria_type = 'view_count_comparacao' AND v_user_stats.view_count_comparacao >= v_badge.threshold) OR
           (v_badge.criteria_type = 'view_count_resumo' AND v_user_stats.view_count_resumo >= v_badge.threshold) OR
           (v_badge.criteria_type = 'view_count_entregadores' AND v_user_stats.view_count_entregadores >= v_badge.threshold) OR
           (v_badge.criteria_type = 'view_count_evolucao' AND v_user_stats.view_count_evolucao >= v_badge.threshold) OR
           (v_badge.criteria_type = 'filter_usage_count' AND v_user_stats.filter_usage_count >= v_badge.threshold)
        THEN
            INSERT INTO public.gamification_user_badges (user_id, badge_slug) VALUES (v_user_id, v_badge.slug);
            new_badge_slug := v_badge.slug;
            new_badge_name := v_badge.name;
            new_badge_description := v_badge.description;
            new_badge_icon := v_badge.icon;
            RETURN NEXT;
        END IF;
    END LOOP;

    RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resumo_semanal_drivers(p_ano integer, p_organization_id text, p_pracas text[] DEFAULT NULL::text[])
 RETURNS TABLE(ano integer, semana integer, total_drivers bigint, total_slots bigint)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    v_org_filter uuid;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF p_organization_id IS NOT NULL AND p_organization_id != '' THEN
        BEGIN 
            v_org_filter := p_organization_id::uuid; 
        EXCEPTION WHEN OTHERS THEN 
            SELECT organization_id INTO v_org_filter 
            FROM public.user_profiles 
            WHERE id = v_user_id;
        END;
    ELSE
        SELECT organization_id INTO v_org_filter 
        FROM public.user_profiles 
        WHERE id = v_user_id;
    END IF;

    IF v_org_filter IS NULL THEN
         RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        dc.ano_iso::integer AS ano,
        dc.semana_numero::integer AS semana,
        COUNT(DISTINCT dc.id_da_pessoa_entregadora) AS total_drivers,
        SUM(dc.numero_minimo_de_entregadores_regulares_na_escala)::bigint AS total_slots
    FROM public.dados_corridas dc
    WHERE dc.organization_id = v_org_filter
      AND (p_ano IS NULL OR dc.ano_iso = p_ano)
      AND (p_pracas IS NULL OR dc.praca = ANY(p_pracas))
      AND dc.numero_de_corridas_completadas > 0
    GROUP BY dc.ano_iso, dc.semana_numero
    ORDER BY dc.ano_iso DESC, dc.semana_numero DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resumo_semanal_pedidos(p_ano integer, p_organization_id text, p_pracas text[] DEFAULT NULL::text[])
 RETURNS TABLE(ano integer, semana integer, total_drivers bigint, total_slots bigint, total_pedidos bigint, total_sh numeric, aderencia_media numeric, utr numeric, aderencia numeric, rejeite numeric)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    v_org_filter uuid;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF p_organization_id IS NOT NULL AND p_organization_id != '' THEN
        BEGIN 
            v_org_filter := p_organization_id::uuid; 
        EXCEPTION WHEN OTHERS THEN 
            SELECT organization_id INTO v_org_filter 
            FROM public.user_profiles 
            WHERE id = v_user_id;
        END;
    ELSE
        SELECT organization_id INTO v_org_filter 
        FROM public.user_profiles 
        WHERE id = v_user_id;
    END IF;
    
    IF v_org_filter IS NULL THEN
         RETURN;
    END IF;

    RETURN QUERY
    WITH entregador_stats AS (
        SELECT 
            dc.ano_iso,
            dc.semana_numero,
            COUNT(DISTINCT dc.id_da_pessoa_entregadora) as active_drivers,
            SUM(dc.numero_minimo_de_entregadores_regulares_na_escala) as total_min_slots,
            AVG(
                CASE 
                    WHEN dc.numero_de_corridas_ofertadas > 0 
                    THEN (dc.numero_de_corridas_aceitas::numeric / dc.numero_de_corridas_ofertadas::numeric * 100)
                    ELSE 0
                END
            ) as avg_individual_adherence
        FROM public.dados_corridas dc
        WHERE dc.organization_id = v_org_filter
          AND (p_ano IS NULL OR dc.ano_iso = p_ano)
          AND (p_pracas IS NULL OR dc.praca = ANY(p_pracas))
        GROUP BY dc.ano_iso, dc.semana_numero
    ),
    dashboard_stats AS (
        SELECT 
            mv.ano_iso,
            mv.semana_iso,
            SUM(mv.total_completadas) as total_pedidos,
            SUM(mv.segundos_realizados) as total_seconds_realized,
            SUM(mv.segundos_planejados) as total_seconds_planned,
            SUM(mv.total_ofertadas) as total_ofertadas,
            SUM(mv.total_rejeitadas) as total_rejeitadas
        FROM public.mv_dashboard_resumo mv
        WHERE mv.organization_id = v_org_filter
          AND (p_ano IS NULL OR mv.ano_iso = p_ano)
          AND (p_pracas IS NULL OR mv.praca = ANY(p_pracas))
        GROUP BY mv.ano_iso, mv.semana_iso
    )
    SELECT 
        ds.ano_iso::integer AS ano,
        ds.semana_iso::integer AS semana,
        COALESCE(es.active_drivers, 0)::bigint AS total_drivers,
        COALESCE(es.total_min_slots, 0)::bigint AS total_slots,
        COALESCE(ds.total_pedidos, 0)::bigint,
        (COALESCE(ds.total_seconds_realized, 0) / 3600)::numeric AS total_sh,
        COALESCE(es.avg_individual_adherence, 0)::numeric AS aderencia_media,
        CASE 
            WHEN ds.total_seconds_realized > 0 
            THEN (ds.total_pedidos::numeric / (ds.total_seconds_realized::numeric / 3600))
            ELSE 0
        END AS utr,
        CASE 
            WHEN ds.total_seconds_planned > 0 
            THEN (ds.total_seconds_realized::numeric / ds.total_seconds_planned::numeric * 100)
            ELSE 0
        END AS aderencia,
        CASE 
            WHEN ds.total_ofertadas > 0 
            THEN (ds.total_rejeitadas::numeric / ds.total_ofertadas::numeric * 100)
            ELSE 0
        END AS rejeite
    FROM dashboard_stats ds
    LEFT JOIN entregador_stats es ON ds.ano_iso = es.ano_iso AND ds.semana_iso = es.semana_numero
    ORDER BY ds.ano_iso DESC, ds.semana_iso DESC;
END;
$function$;

-- Fix: materialized_view_in_api

REVOKE ALL ON public.mv_dashboard_resumo_v2 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.mv_dashboard_resumo FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.mv_entregadores_summary FROM PUBLIC, anon, authenticated;

-- Fix: rls_policy_always_true

ALTER POLICY "Enable update for users" ON public.presentations 
WITH CHECK (((organization_id = ( SELECT public.get_my_organization_id() AS get_my_organization_id)) AND (((filters ->> 'user_id'::text) IS NULL) OR ((filters ->> 'user_id'::text) = (( SELECT auth.uid() AS uid))::text))));
