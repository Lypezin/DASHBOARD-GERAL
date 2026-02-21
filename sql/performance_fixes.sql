-- Script para otimizar as consultas do dashboard utilizando SQL Dinâmico e roteamento de consultas

-- 1. Otimização do dashboard_resumo usando SQL Dinâmico
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
    
    -- Variáveis para o SQL Dinâmico
    v_sql text;
    v_where_clauses text[];
    v_where_text text;
BEGIN
    -- DEBUG: Capturar informações
    v_user_id := auth.uid();
    
    -- 1. Verificar se usuário é admin/marketing/master
    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) 
    INTO v_is_admin 
    FROM public.user_profiles 
    WHERE id = v_user_id;

    -- 2. Processar organization_id
    IF v_is_admin THEN
        IF p_organization_id IS NOT NULL AND p_organization_id != 'null' AND length(p_organization_id) > 0 THEN
            BEGIN
                v_org_filter := p_organization_id::uuid;
            EXCEPTION WHEN OTHERS THEN
                v_org_filter := NULL;
            END;
        ELSE
            v_org_filter := NULL;
        END IF;
    ELSE
        IF p_organization_id IS NOT NULL AND p_organization_id != 'null' AND length(p_organization_id) > 0 THEN
            BEGIN
                v_org_filter := p_organization_id::uuid;
                IF NOT EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE id = v_user_id AND organization_id = v_org_filter
                ) THEN
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
        
        IF v_org_filter IS NULL AND v_user_id IS NOT NULL THEN
             NULL; 
        END IF;
    END IF;

    -- 3. Processar filtros de texto para arrays
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

    -- ==========================================================
    -- 4. CONSTRUÇÃO DO SQL DINÂMICO
    -- Otimização Crítica para evitar "Generic Plan Bypass"
    -- ==========================================================
    
    v_where_clauses := ARRAY[]::text[];
    
    IF v_org_filter IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'organization_id = $1');
    END IF;
    
    IF p_ano IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'ano_iso = $2');
    END IF;
    
    IF p_semana IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'semana_iso = $3');
    END IF;
    
    IF p_semanas IS NOT NULL AND array_length(p_semanas, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, 'semana_iso = ANY($4)');
    END IF;
    
    IF v_praca_list IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'praca = ANY($5)');
    END IF;
    
    IF v_sub_praca_list IS NOT NULL AND p_sub_pracas IS NOT NULL AND array_length(p_sub_pracas, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, '(sub_praca = ANY($6) OR sub_praca = ANY($7))');
    ELSIF v_sub_praca_list IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'sub_praca = ANY($6)');
    ELSIF p_sub_pracas IS NOT NULL AND array_length(p_sub_pracas, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, 'sub_praca = ANY($7)');
    END IF;
    
    IF v_origem_list IS NOT NULL AND p_origens IS NOT NULL AND array_length(p_origens, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, '(origem = ANY($8) OR origem = ANY($9))');
    ELSIF v_origem_list IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'origem = ANY($8)');
    ELSIF p_origens IS NOT NULL AND array_length(p_origens, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, 'origem = ANY($9)');
    END IF;
    
    IF v_turno_list IS NOT NULL AND p_turnos IS NOT NULL AND array_length(p_turnos, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, '(turno = ANY($10) OR turno = ANY($11))');
    ELSIF v_turno_list IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'turno = ANY($10)');
    ELSIF p_turnos IS NOT NULL AND array_length(p_turnos, 1) > 0 THEN
        v_where_clauses := array_append(v_where_clauses, 'turno = ANY($11)');
    END IF;
    
    IF p_data_inicial IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'data_do_periodo >= $12');
    END IF;
    
    IF p_data_final IS NOT NULL THEN
        v_where_clauses := array_append(v_where_clauses, 'data_do_periodo <= $13');
    END IF;

    IF array_length(v_where_clauses, 1) > 0 THEN
        v_where_text := ' WHERE ' || array_to_string(v_where_clauses, ' AND ');
    ELSE
        v_where_text := '';
    END IF;

    v_sql := format($$
    WITH filtered_data AS (
      SELECT *, 
       EXTRACT(ISODOW FROM data_do_periodo)::integer as dia_iso_calc,
        CASE EXTRACT(ISODOW FROM data_do_periodo)::integer
          WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta'
          WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado' WHEN 7 THEN 'Domingo'
        END as dia_semana_calc
      FROM public.mv_dashboard_resumo
      %s
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
    $$, v_where_text);

    -- Executar a consulta montada dinamicamente passando os valores prevenidos contra SQL Injection
    RETURN QUERY EXECUTE v_sql 
    USING v_org_filter, p_ano, p_semana, p_semanas, v_praca_list, v_sub_praca_list, p_sub_pracas, v_origem_list, p_origens, v_turno_list, p_turnos, p_data_inicial, p_data_final;
    
END;
$function$;


-- 2. Otimização do get_city_last_updates usando bifurcação
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

    -- Bifurcação das queries para otimizar o uso do índice idx_mv_dashboard_org no Query Planner
    IF v_org_filter IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            dc.praca::text AS city,
            to_char(MAX(dc.data_do_periodo), 'YYYY-MM-DD"T"HH24:MI:SS') AS last_update_date
        FROM public.mv_dashboard_resumo dc
        WHERE 
            dc.organization_id = v_org_filter
            AND dc.data_do_periodo >= (CURRENT_DATE - INTERVAL '6 months')::date
        GROUP BY dc.praca
        ORDER BY city;
    ELSE
        RETURN QUERY
        SELECT 
            dc.praca::text AS city,
            to_char(MAX(dc.data_do_periodo), 'YYYY-MM-DD"T"HH24:MI:SS') AS last_update_date
        FROM public.mv_dashboard_resumo dc
        WHERE 
            dc.data_do_periodo >= (CURRENT_DATE - INTERVAL '6 months')::date
        GROUP BY dc.praca
        ORDER BY city;
    END IF;
END;
$function$;


-- 3. Criação de índices específicos para acelerar as consultas lentas das Comboboxes
CREATE INDEX IF NOT EXISTS idx_mv_dashboard_v2_praca ON public.mv_dashboard_resumo_v2 USING btree (praca);
CREATE INDEX IF NOT EXISTS idx_mv_dashboard_ano_iso ON public.mv_dashboard_resumo USING btree (ano_iso);


-- 4. Otimização de listar_anos_disponiveis (Força a emulação de loose index scan para o MAX/MIN)
CREATE OR REPLACE FUNCTION public.listar_anos_disponiveis()
 RETURNS SETOF integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    -- Utilizando recursão CTE direta para emular Skip Scan no PostgreSQL < 17 (muito mais rápido que DISTINCT numa View inteira)
    RETURN QUERY 
    WITH RECURSIVE t AS (
        (SELECT ano_iso FROM public.mv_dashboard_resumo ORDER BY ano_iso DESC LIMIT 1)
        UNION ALL
        SELECT (SELECT ano_iso FROM public.mv_dashboard_resumo WHERE ano_iso < t.ano_iso ORDER BY ano_iso DESC LIMIT 1)
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

-- 5. Otimização de list_pracas_disponiveis
CREATE OR REPLACE FUNCTION public.list_pracas_disponiveis()
 RETURNS TABLE(praca text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  WITH RECURSIVE t AS (
      (SELECT v.praca FROM public.mv_dashboard_resumo_v2 v WHERE v.praca IS NOT NULL ORDER BY v.praca ASC LIMIT 1)
      UNION ALL
      SELECT (SELECT v.praca FROM public.mv_dashboard_resumo_v2 v WHERE v.praca > t.praca AND v.praca IS NOT NULL ORDER BY v.praca ASC LIMIT 1)
      FROM t
      WHERE t.praca IS NOT NULL
  )
  SELECT t.praca FROM t WHERE t.praca IS NOT NULL;
END;
$function$;
