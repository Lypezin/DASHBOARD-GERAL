-- Scoped hash/sort memory and authorized service-role organization scope for the secure RPC path.
-- Only the broad admin year view raises transaction-local work_mem to 32 MB;
-- PostgreSQL applies this limit per sort/hash/tuplestore operation.
CREATE OR REPLACE FUNCTION public.dashboard_resumo(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_semanas integer[] DEFAULT NULL::integer[], p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_turno text DEFAULT NULL::text, p_sub_pracas text[] DEFAULT NULL::text[], p_origens text[] DEFAULT NULL::text[], p_turnos text[] DEFAULT NULL::text[], p_filtro_modo text DEFAULT 'ano_semana'::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text, detailed boolean DEFAULT NULL::boolean)
 RETURNS TABLE(total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, numero_de_pedidos_aceitos_e_concluidos bigint, aderencia_semanal jsonb, aderencia_dia jsonb, aderencia_turno jsonb, aderencia_sub_praca jsonb, aderencia_origem jsonb, aderencia_dia_origem jsonb, dimensoes jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
    v_org_filter uuid;
    v_is_admin boolean;
    v_user_id uuid;

    v_praca_list text[];
    v_sub_praca_list text[];
    v_origem_list text[];
    v_turno_list text[];

    v_sql text;
    v_where_clauses text[];
    v_where_text text;
BEGIN
    v_user_id := auth.uid();

    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true)
    INTO v_is_admin
    FROM public.user_profiles
    WHERE id = v_user_id;

    -- Chamadas do proxy seguro usam service_role. O endpoint valida o usuário e a organização antes desta RPC.
    IF v_user_id IS NULL AND auth.role() = 'service_role' THEN
        v_is_admin := true;
    END IF;

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

    -- A visão inicial administrativa lê todas as praças do ano. Manter a tuplestore em memória
    -- evita dezenas de milhares de blocos temporários; o teto é por operação e não global.
    IF v_is_admin
       AND p_ano IS NOT NULL
       AND p_semana IS NULL
       AND (p_semanas IS NULL OR array_length(p_semanas, 1) IS NULL)
       AND v_praca_list IS NULL
       AND v_sub_praca_list IS NULL
       AND v_origem_list IS NULL
       AND v_turno_list IS NULL
       AND p_data_inicial IS NULL
       AND p_data_final IS NULL THEN
        PERFORM set_config('work_mem', '32MB', true);
    END IF;

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

    v_sql := format($f$
    WITH filtered_data AS (
      SELECT *,
       EXTRACT(ISODOW FROM data_do_periodo)::integer as dia_iso_calc,
        CASE EXTRACT(ISODOW FROM data_do_periodo)::integer
          WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta'
          WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado' WHEN 7 THEN 'Domingo'
        END as dia_semana_calc
      FROM public.vw_dashboard_resumo_current
      %s
    ),
    dimensoes_calc AS (
      SELECT jsonb_build_object(
        'anos', COALESCE(jsonb_agg(DISTINCT fd.ano_iso), '[]'::jsonb),
        'semanas', COALESCE(jsonb_agg(DISTINCT fd.semana_iso), '[]'::jsonb),
        'pracas', COALESCE(jsonb_agg(DISTINCT fd.praca) FILTER (WHERE fd.praca IS NOT NULL), '[]'::jsonb),
        'sub_pracas', COALESCE(jsonb_agg(DISTINCT fd.sub_praca) FILTER (WHERE fd.sub_praca IS NOT NULL), '[]'::jsonb),
        'origens', COALESCE(jsonb_agg(DISTINCT fd.origem) FILTER (WHERE fd.origem IS NOT NULL), '[]'::jsonb),
        'turnos', COALESCE(jsonb_agg(DISTINCT fd.turno) FILTER (WHERE fd.turno IS NOT NULL), '[]'::jsonb)
      ) as dimensoes_json
      FROM filtered_data fd
    )
    SELECT
        COALESCE(SUM(fd.total_ofertadas), 0)::bigint as total_ofertadas,
        COALESCE(SUM(fd.total_aceitas), 0)::bigint as total_aceitas,
        COALESCE(SUM(fd.total_completadas), 0)::bigint as total_completadas,
        COALESCE(SUM(fd.total_rejeitadas), 0)::bigint as total_rejeitadas,
        COALESCE(SUM(fd.total_pedidos_aceitos_e_concluidos), 0)::bigint as numero_de_pedidos_aceitos_e_concluidos,

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
                    SUM(fd.total_completadas) as corridas_completadas,
                    SUM(fd.total_pedidos_aceitos_e_concluidos) as numero_de_pedidos_aceitos_e_concluidos
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
                    SUM(fd.total_completadas) as corridas_completadas,
                    SUM(fd.total_pedidos_aceitos_e_concluidos) as numero_de_pedidos_aceitos_e_concluidos
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
                    SUM(fd.total_completadas) as corridas_completadas,
                    SUM(fd.total_pedidos_aceitos_e_concluidos) as numero_de_pedidos_aceitos_e_concluidos
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
                    SUM(fd.total_completadas) as corridas_completadas,
                    SUM(fd.total_pedidos_aceitos_e_concluidos) as numero_de_pedidos_aceitos_e_concluidos
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
                    SUM(fd.total_completadas) as corridas_completadas,
                    SUM(fd.total_pedidos_aceitos_e_concluidos) as numero_de_pedidos_aceitos_e_concluidos
                FROM filtered_data fd
                WHERE fd.origem IS NOT NULL
                GROUP BY fd.origem
                ORDER BY fd.origem
            ) t
        ), '[]'::jsonb) as aderencia_origem,

        COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT
                    fd.dia_semana_calc as dia,
                    fd.dia_iso_calc as dia_iso,
                    fd.origem,
                    SUM(fd.segundos_planejados) as segundos_planejados,
                    SUM(fd.segundos_realizados) as segundos_realizados,
                    CASE WHEN SUM(fd.segundos_planejados) > 0
                         THEN (SUM(fd.segundos_realizados)::numeric / SUM(fd.segundos_planejados)::numeric) * 100
                         ELSE 0 END as aderencia_percentual,
                    SUM(fd.total_ofertadas) as corridas_ofertadas,
                    SUM(fd.total_aceitas) as corridas_aceitas,
                    SUM(fd.total_rejeitadas) as corridas_rejeitadas,
                    SUM(fd.total_completadas) as corridas_completadas,
                    SUM(fd.total_pedidos_aceitos_e_concluidos) as numero_de_pedidos_aceitos_e_concluidos
                FROM filtered_data fd
                WHERE fd.dia_semana_calc IS NOT NULL AND fd.origem IS NOT NULL
                GROUP BY fd.dia_semana_calc, fd.dia_iso_calc, fd.origem
                ORDER BY fd.dia_iso_calc, fd.origem
            ) t
        ), '[]'::jsonb) as aderencia_dia_origem,

        (SELECT dimensoes_json FROM dimensoes_calc) as dimensoes
    FROM filtered_data fd
    $f$, v_where_text);

    RETURN QUERY EXECUTE v_sql
    USING v_org_filter, p_ano, p_semana, p_semanas, v_praca_list, v_sub_praca_list, p_sub_pracas, v_origem_list, p_origens, v_turno_list, p_turnos, p_data_inicial, p_data_final;

END;
$function$
