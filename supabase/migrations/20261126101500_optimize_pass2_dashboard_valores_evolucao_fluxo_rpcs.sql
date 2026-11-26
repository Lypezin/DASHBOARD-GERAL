-- 1. Index for vw_corridas_agregadas_current incremental table lookups + view optimizations
CREATE INDEX IF NOT EXISTS idx_tb_corridas_agregadas_inc_org_week_praca_cover_v2
  ON public.tb_corridas_agregadas_incremental (organization_id, week_start_date, praca)
  INCLUDE (id_entregador, nome_entregador, corridas_completadas);

ANALYZE public.tb_corridas_agregadas_incremental;

CREATE OR REPLACE VIEW public.vw_dashboard_resumo_current AS
 SELECT mv.data_do_periodo,
    mv.ano_iso,
    mv.semana_iso,
    mv.praca,
    mv.sub_praca,
    mv.origem,
    mv.turno,
    mv.organization_id,
    mv.total_ofertadas,
    mv.total_aceitas,
    mv.total_rejeitadas,
    mv.total_completadas,
    mv.total_pedidos_aceitos_e_concluidos,
    mv.total_valor_bruto_centavos,
    mv.segundos_planejados,
    mv.segundos_realizados
   FROM public.mv_dashboard_resumo mv
  WHERE NOT (EXISTS (
    SELECT 1
    FROM public.tb_dashboard_resumo_incremental t
    WHERE t.organization_id = mv.organization_id
      AND t.ano_iso = mv.ano_iso
      AND t.data_do_periodo = mv.data_do_periodo
      AND COALESCE(t.praca, ''::text) = COALESCE(mv.praca, ''::text)
      AND COALESCE(t.sub_praca, ''::text) = COALESCE(mv.sub_praca, ''::text)
      AND COALESCE(t.origem, ''::text) = COALESCE(mv.origem, ''::text)
      AND COALESCE(t.turno, ''::text) = COALESCE(mv.turno, ''::text)
      AND NOT (t.praca IS DISTINCT FROM mv.praca)
      AND NOT (t.sub_praca IS DISTINCT FROM mv.sub_praca)
      AND NOT (t.origem IS DISTINCT FROM mv.origem)
      AND NOT (t.turno IS DISTINCT FROM mv.turno)
  ))
UNION ALL
 SELECT t.data_do_periodo,
    t.ano_iso,
    t.semana_iso,
    t.praca,
    t.sub_praca,
    t.origem,
    t.turno,
    t.organization_id,
    t.total_ofertadas,
    t.total_aceitas,
    t.total_rejeitadas,
    t.total_completadas,
    t.total_pedidos_aceitos_e_concluidos,
    t.total_valor_bruto_centavos,
    t.segundos_planejados,
    t.segundos_realizados
   FROM public.tb_dashboard_resumo_incremental t;

CREATE OR REPLACE VIEW public.vw_corridas_agregadas_current AS
 WITH incremental_scopes AS MATERIALIZED (
   SELECT DISTINCT tb_corridas_agregadas_incremental.organization_id,
      tb_corridas_agregadas_incremental.week_start_date,
      tb_corridas_agregadas_incremental.praca
   FROM public.tb_corridas_agregadas_incremental
 )
 SELECT mv.id_entregador,
    mv.nome_entregador,
    mv.praca,
    mv.ano_iso,
    mv.semana_numero,
    mv.week_start_date,
    mv.corridas_completadas,
    mv.organization_id
   FROM public.mv_corridas_agregadas mv
  WHERE NOT (EXISTS (
    SELECT 1
    FROM incremental_scopes s
    WHERE s.organization_id = mv.organization_id
      AND s.week_start_date = mv.week_start_date
      AND COALESCE(s.praca, ''::text) = COALESCE(mv.praca, ''::text)
      AND NOT (s.praca IS DISTINCT FROM mv.praca)
  ))
UNION ALL
 SELECT t.id_entregador,
    t.nome_entregador,
    t.praca,
    t.ano_iso,
    t.semana_numero,
    t.week_start_date,
    t.corridas_completadas,
    t.organization_id
   FROM public.tb_corridas_agregadas_incremental t;

-- 2. Single-pass GROUPING SETS rewrite for dashboard_resumo (15-param overload)
CREATE OR REPLACE FUNCTION public.dashboard_resumo(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_semanas integer[] DEFAULT NULL::integer[], p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_turno text DEFAULT NULL::text, p_sub_pracas text[] DEFAULT NULL::text[], p_origens text[] DEFAULT NULL::text[], p_turnos text[] DEFAULT NULL::text[], p_filtro_modo text DEFAULT 'ano_semana'::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text, detailed boolean DEFAULT NULL::boolean)
 RETURNS TABLE(total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, numero_de_pedidos_aceitos_e_concluidos bigint, aderencia_semanal jsonb, aderencia_dia jsonb, aderencia_turno jsonb, aderencia_sub_praca jsonb, aderencia_origem jsonb, aderencia_dia_origem jsonb, dimensoes jsonb)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
 SET work_mem TO '64MB'
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
      SELECT
        ano_iso,
        semana_iso,
        praca,
        sub_praca,
        origem,
        turno,
        total_ofertadas,
        total_aceitas,
        total_rejeitadas,
        total_completadas,
        total_pedidos_aceitos_e_concluidos,
        segundos_planejados,
        segundos_realizados,
        EXTRACT(ISODOW FROM data_do_periodo)::integer AS dia_iso_calc
      FROM public.vw_dashboard_resumo_current
      %s
    ),
    grouped AS MATERIALIZED (
      SELECT
        GROUPING(ano_iso, semana_iso, dia_iso_calc, praca, sub_praca, origem, turno) AS gid,
        ano_iso,
        semana_iso,
        dia_iso_calc,
        praca,
        sub_praca,
        origem,
        turno,
        COALESCE(SUM(segundos_planejados), 0) AS segundos_planejados,
        COALESCE(SUM(segundos_realizados), 0) AS segundos_realizados,
        COALESCE(SUM(total_ofertadas), 0)::bigint AS total_ofertadas,
        COALESCE(SUM(total_aceitas), 0)::bigint AS total_aceitas,
        COALESCE(SUM(total_rejeitadas), 0)::bigint AS total_rejeitadas,
        COALESCE(SUM(total_completadas), 0)::bigint AS total_completadas,
        COALESCE(SUM(total_pedidos_aceitos_e_concluidos), 0)::bigint AS total_pedidos_aceitos_e_concluidos
      FROM filtered_data
      GROUP BY GROUPING SETS (
        (),
        (ano_iso),
        (semana_iso),
        (dia_iso_calc),
        (praca),
        (sub_praca),
        (origem),
        (turno),
        (dia_iso_calc, origem)
      )
    ),
    dimensoes_calc AS (
      SELECT jsonb_build_object(
        'anos', COALESCE(jsonb_agg(g.ano_iso ORDER BY g.ano_iso) FILTER (WHERE g.gid = 63 AND g.ano_iso IS NOT NULL), '[]'::jsonb),
        'semanas', COALESCE(jsonb_agg(g.semana_iso ORDER BY g.semana_iso) FILTER (WHERE g.gid = 95 AND g.semana_iso IS NOT NULL), '[]'::jsonb),
        'pracas', COALESCE(jsonb_agg(g.praca ORDER BY g.praca) FILTER (WHERE g.gid = 119 AND g.praca IS NOT NULL), '[]'::jsonb),
        'sub_pracas', COALESCE(jsonb_agg(g.sub_praca ORDER BY g.sub_praca) FILTER (WHERE g.gid = 123 AND g.sub_praca IS NOT NULL), '[]'::jsonb),
        'origens', COALESCE(jsonb_agg(g.origem ORDER BY g.origem) FILTER (WHERE g.gid = 125 AND g.origem IS NOT NULL), '[]'::jsonb),
        'turnos', COALESCE(jsonb_agg(g.turno ORDER BY g.turno) FILTER (WHERE g.gid = 126 AND g.turno IS NOT NULL), '[]'::jsonb)
      ) AS dimensoes_json
      FROM grouped g
      WHERE g.gid IN (63, 95, 119, 123, 125, 126)
    )
    SELECT
        COALESCE(t.total_ofertadas, 0)::bigint AS total_ofertadas,
        COALESCE(t.total_aceitas, 0)::bigint AS total_aceitas,
        COALESCE(t.total_completadas, 0)::bigint AS total_completadas,
        COALESCE(t.total_rejeitadas, 0)::bigint AS total_rejeitadas,
        COALESCE(t.total_pedidos_aceitos_e_concluidos, 0)::bigint AS numero_de_pedidos_aceitos_e_concluidos,

        COALESCE((
            SELECT jsonb_agg(row_data) FROM (
                SELECT
                    g.semana_iso AS semana,
                    g.segundos_planejados,
                    g.segundos_realizados,
                    CASE WHEN g.segundos_planejados > 0
                         THEN (g.segundos_realizados::numeric / g.segundos_planejados::numeric) * 100
                         ELSE 0 END AS aderencia_percentual,
                    g.total_ofertadas AS corridas_ofertadas,
                    g.total_aceitas AS corridas_aceitas,
                    g.total_rejeitadas AS corridas_rejeitadas,
                    g.total_completadas AS corridas_completadas,
                    g.total_pedidos_aceitos_e_concluidos AS numero_de_pedidos_aceitos_e_concluidos
                FROM grouped g
                WHERE g.gid = 95 AND g.semana_iso IS NOT NULL
                ORDER BY g.semana_iso
            ) row_data
        ), '[]'::jsonb) AS aderencia_semanal,

        COALESCE((
            SELECT jsonb_agg(row_data) FROM (
                SELECT
                    CASE g.dia_iso_calc
                        WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta'
                        WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado' WHEN 7 THEN 'Domingo'
                    END AS dia,
                    g.dia_iso_calc AS dia_iso,
                    g.segundos_planejados,
                    g.segundos_realizados,
                    CASE WHEN g.segundos_planejados > 0
                         THEN (g.segundos_realizados::numeric / g.segundos_planejados::numeric) * 100
                         ELSE 0 END AS aderencia_percentual,
                    g.total_ofertadas AS corridas_ofertadas,
                    g.total_aceitas AS corridas_aceitas,
                    g.total_rejeitadas AS corridas_rejeitadas,
                    g.total_completadas AS corridas_completadas,
                    g.total_pedidos_aceitos_e_concluidos AS numero_de_pedidos_aceitos_e_concluidos
                FROM grouped g
                WHERE g.gid = 111 AND g.dia_iso_calc IS NOT NULL
                ORDER BY g.dia_iso_calc
            ) row_data
        ), '[]'::jsonb) AS aderencia_dia,

        COALESCE((
            SELECT jsonb_agg(row_data) FROM (
                SELECT
                    g.turno,
                    g.segundos_planejados,
                    g.segundos_realizados,
                    CASE WHEN g.segundos_planejados > 0
                         THEN (g.segundos_realizados::numeric / g.segundos_planejados::numeric) * 100
                         ELSE 0 END AS aderencia_percentual,
                    g.total_ofertadas AS corridas_ofertadas,
                    g.total_aceitas AS corridas_aceitas,
                    g.total_rejeitadas AS corridas_rejeitadas,
                    g.total_completadas AS corridas_completadas,
                    g.total_pedidos_aceitos_e_concluidos AS numero_de_pedidos_aceitos_e_concluidos
                FROM grouped g
                WHERE g.gid = 126 AND g.turno IS NOT NULL
                ORDER BY g.turno
            ) row_data
        ), '[]'::jsonb) AS aderencia_turno,

        COALESCE((
            SELECT jsonb_agg(row_data) FROM (
                SELECT
                    g.sub_praca,
                    g.segundos_planejados,
                    g.segundos_realizados,
                    CASE WHEN g.segundos_planejados > 0
                         THEN (g.segundos_realizados::numeric / g.segundos_planejados::numeric) * 100
                         ELSE 0 END AS aderencia_percentual,
                    g.total_ofertadas AS corridas_ofertadas,
                    g.total_aceitas AS corridas_aceitas,
                    g.total_rejeitadas AS corridas_rejeitadas,
                    g.total_completadas AS corridas_completadas,
                    g.total_pedidos_aceitos_e_concluidos AS numero_de_pedidos_aceitos_e_concluidos
                FROM grouped g
                WHERE g.gid = 123 AND g.sub_praca IS NOT NULL
                ORDER BY g.sub_praca
            ) row_data
        ), '[]'::jsonb) AS aderencia_sub_praca,

        COALESCE((
            SELECT jsonb_agg(row_data) FROM (
                SELECT
                    g.origem,
                    g.segundos_planejados,
                    g.segundos_realizados,
                    CASE WHEN g.segundos_planejados > 0
                         THEN (g.segundos_realizados::numeric / g.segundos_planejados::numeric) * 100
                         ELSE 0 END AS aderencia_percentual,
                    g.total_ofertadas AS corridas_ofertadas,
                    g.total_aceitas AS corridas_aceitas,
                    g.total_rejeitadas AS corridas_rejeitadas,
                    g.total_completadas AS corridas_completadas,
                    g.total_pedidos_aceitos_e_concluidos AS numero_de_pedidos_aceitos_e_concluidos
                FROM grouped g
                WHERE g.gid = 125 AND g.origem IS NOT NULL
                ORDER BY g.origem
            ) row_data
        ), '[]'::jsonb) AS aderencia_origem,

        COALESCE((
            SELECT jsonb_agg(row_data) FROM (
                SELECT
                    CASE g.dia_iso_calc
                        WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta'
                        WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado' WHEN 7 THEN 'Domingo'
                    END AS dia,
                    g.dia_iso_calc AS dia_iso,
                    g.origem,
                    g.segundos_planejados,
                    g.segundos_realizados,
                    CASE WHEN g.segundos_planejados > 0
                         THEN (g.segundos_realizados::numeric / g.segundos_planejados::numeric) * 100
                         ELSE 0 END AS aderencia_percentual,
                    g.total_ofertadas AS corridas_ofertadas,
                    g.total_aceitas AS corridas_aceitas,
                    g.total_rejeitadas AS corridas_rejeitadas,
                    g.total_completadas AS corridas_completadas,
                    g.total_pedidos_aceitos_e_concluidos AS numero_de_pedidos_aceitos_e_concluidos
                FROM grouped g
                WHERE g.gid = 109 AND g.dia_iso_calc IS NOT NULL AND g.origem IS NOT NULL
                ORDER BY g.dia_iso_calc, g.origem
            ) row_data
        ), '[]'::jsonb) AS aderencia_dia_origem,

        (SELECT dimensoes_json FROM dimensoes_calc) AS dimensoes
    FROM (SELECT * FROM grouped WHERE gid = 127 LIMIT 1) t
    $f$, v_where_text);

    RETURN QUERY EXECUTE v_sql
    USING v_org_filter, p_ano, p_semana, p_semanas, v_praca_list, v_sub_praca_list, p_sub_pracas, v_origem_list, p_origens, v_turno_list, p_turnos, p_data_inicial, p_data_final;
END;
$function$;

-- 3. Optimize dashboard_evolucao_bundle_org_year_fast
CREATE OR REPLACE FUNCTION public.dashboard_evolucao_bundle_org_year_fast(p_ano integer, p_organization_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
 SET work_mem TO '64MB'
AS $function$
declare
  v_org_filter uuid;
begin
  if p_ano is null then
    return jsonb_build_object('mensal', '[]'::jsonb, 'semanal', '[]'::jsonb, 'utr', '[]'::jsonb);
  end if;

  begin
    v_org_filter := nullif(p_organization_id, '')::uuid;
  exception when others then
    v_org_filter := null;
  end;

  if v_org_filter is null then
    return jsonb_build_object('mensal', '[]'::jsonb, 'semanal', '[]'::jsonb, 'utr', '[]'::jsonb);
  end if;

  return (
    with incremental_scopes as materialized (
      select distinct
        inc.organization_id,
        inc.ano_iso,
        inc.data_do_periodo,
        inc.praca,
        inc.sub_praca,
        inc.origem,
        inc.turno
      from public.tb_dashboard_resumo_incremental inc
      where inc.organization_id = v_org_filter
        and inc.ano_iso = p_ano
    ),
    base_filtered_data as materialized (
      select
        mv.ano_iso,
        mv.semana_iso,
        extract(year from mv.data_do_periodo)::integer as ano_calendario,
        extract(month from mv.data_do_periodo)::integer as mes_calendario,
        mv.total_ofertadas,
        mv.total_aceitas,
        mv.total_rejeitadas,
        mv.total_pedidos_aceitos_e_concluidos as total_completadas,
        mv.segundos_realizados
      from public.mv_dashboard_resumo mv
      where mv.organization_id = v_org_filter
        and mv.ano_iso = p_ano
        and not exists (
          select 1
          from incremental_scopes s
          where s.organization_id = mv.organization_id
            and s.ano_iso = mv.ano_iso
            and s.data_do_periodo = mv.data_do_periodo
            and coalesce(s.praca, ''::text) = coalesce(mv.praca, ''::text)
            and coalesce(s.sub_praca, ''::text) = coalesce(mv.sub_praca, ''::text)
            and coalesce(s.origem, ''::text) = coalesce(mv.origem, ''::text)
            and coalesce(s.turno, ''::text) = coalesce(mv.turno, ''::text)
            and not s.praca is distinct from mv.praca
            and not s.sub_praca is distinct from mv.sub_praca
            and not s.origem is distinct from mv.origem
            and not s.turno is distinct from mv.turno
        )
      union all
      select
        inc.ano_iso,
        inc.semana_iso,
        extract(year from inc.data_do_periodo)::integer as ano_calendario,
        extract(month from inc.data_do_periodo)::integer as mes_calendario,
        inc.total_ofertadas,
        inc.total_aceitas,
        inc.total_rejeitadas,
        inc.total_pedidos_aceitos_e_concluidos as total_completadas,
        inc.segundos_realizados
      from public.tb_dashboard_resumo_incremental inc
      where inc.organization_id = v_org_filter
        and inc.ano_iso = p_ano
    ),
    mensal_data as (
      select
        p_ano as ano,
        bfd.mes_calendario as mes,
        case bfd.mes_calendario
          when 1 then 'Janeiro' when 2 then 'Fevereiro' when 3 then 'Março'
          when 4 then 'Abril' when 5 then 'Maio' when 6 then 'Junho'
          when 7 then 'Julho' when 8 then 'Agosto' when 9 then 'Setembro'
          when 10 then 'Outubro' when 11 then 'Novembro' when 12 then 'Dezembro'
        end as mes_nome,
        sum(coalesce(bfd.total_ofertadas, 0) + coalesce(bfd.total_aceitas, 0) + coalesce(bfd.total_rejeitadas, 0) + coalesce(bfd.total_completadas, 0))::bigint as total_corridas,
        sum(coalesce(bfd.total_completadas, 0))::bigint as corridas_completadas,
        sum(coalesce(bfd.total_ofertadas, 0))::bigint as corridas_ofertadas,
        sum(coalesce(bfd.total_aceitas, 0))::bigint as corridas_aceitas,
        sum(coalesce(bfd.total_rejeitadas, 0))::bigint as corridas_rejeitadas,
        sum(coalesce(bfd.segundos_realizados, 0))::numeric as total_segundos
      from base_filtered_data bfd
      where bfd.ano_calendario = p_ano
      group by bfd.mes_calendario
      order by bfd.mes_calendario
    ),
    semanal_data as materialized (
      select
        bfd.ano_iso as ano,
        bfd.semana_iso as semana,
        sum(coalesce(bfd.total_ofertadas, 0) + coalesce(bfd.total_aceitas, 0) + coalesce(bfd.total_rejeitadas, 0) + coalesce(bfd.total_completadas, 0))::bigint as total_corridas,
        sum(coalesce(bfd.total_completadas, 0))::bigint as corridas_completadas,
        sum(coalesce(bfd.total_ofertadas, 0))::bigint as corridas_ofertadas,
        sum(coalesce(bfd.total_aceitas, 0))::bigint as corridas_aceitas,
        sum(coalesce(bfd.total_rejeitadas, 0))::bigint as corridas_rejeitadas,
        sum(coalesce(bfd.segundos_realizados, 0))::numeric as total_segundos
      from base_filtered_data bfd
      group by bfd.ano_iso, bfd.semana_iso
      order by bfd.ano_iso, bfd.semana_iso
    ),
    utr_data as (
      select
        s.ano,
        s.semana,
        (s.total_segundos / 3600.0) as tempo_horas,
        s.corridas_completadas as total_corridas,
        case
          when s.total_segundos > 0 then (s.corridas_completadas::numeric / (s.total_segundos / 3600.0))
          else 0
        end as utr
      from semanal_data s
      order by s.ano, s.semana
    )
    select jsonb_build_object(
      'mensal', coalesce((select jsonb_agg(row_to_json(m)) from mensal_data m), '[]'::jsonb),
      'semanal', coalesce((select jsonb_agg(row_to_json(s)) from semanal_data s), '[]'::jsonb),
      'utr', coalesce((select jsonb_agg(row_to_json(u)) from utr_data u), '[]'::jsonb)
    )
  );
end;
$function$;

-- 4. Route _listar_valores_entregadores_source_20260719 to weekly aggregates + fix scope parity
CREATE OR REPLACE FUNCTION public._listar_valores_entregadores_source_20260719(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
 SET work_mem TO '64MB'
AS $function$
declare
  v_result jsonb;
  v_org_filter uuid;
  v_is_admin boolean := false;
  v_pracas text[];
  v_sub_pracas text[];
  v_origens text[];
  v_weekly_ready boolean := false;
begin
  begin
    v_org_filter := nullif(p_organization_id, '')::uuid;
  exception when others then
    v_org_filter := null;
  end;

  select coalesce((role in ('admin', 'marketing', 'master') or is_admin = true), false)
  into v_is_admin
  from public.user_profiles
  where id = auth.uid();

  if v_org_filter is null and not v_is_admin then
    select organization_id
    into v_org_filter
    from public.user_profiles
    where id = auth.uid();
  end if;

  if p_praca is not null and btrim(p_praca) <> '' and lower(btrim(p_praca)) not in ('todas', 'todos', 'all') then
    select array_agg(item)
    into v_pracas
    from (
      select distinct btrim(value) as item
      from unnest(string_to_array(p_praca, ',')) as value
      where btrim(value) <> ''
    ) praca_values;
  end if;

  if p_sub_praca is not null and btrim(p_sub_praca) <> '' and lower(btrim(p_sub_praca)) not in ('todas', 'todos', 'all') then
    select array_agg(item)
    into v_sub_pracas
    from (
      select distinct btrim(value) as item
      from unnest(string_to_array(p_sub_praca, ',')) as value
      where btrim(value) <> ''
    ) sub_praca_values;
  end if;

  if p_origem is not null and btrim(p_origem) <> '' and lower(btrim(p_origem)) not in ('todas', 'todos', 'all') then
    select array_agg(item)
    into v_origens
    from (
      select distinct btrim(value) as item
      from unnest(string_to_array(p_origem, ',')) as value
      where btrim(value) <> ''
    ) origem_values;
  end if;

  if v_org_filter is not null and p_ano is not null and p_data_inicial is null and p_data_final is null
     and v_sub_pracas is null and v_origens is null then
    v_weekly_ready := not exists (
      select 1
      from public.dashboard_entregadores_weekly_backfill b
      where b.organization_id = v_org_filter
        and (b.driver_completed_at is null or b.completed_at is null)
    ) and not exists (
      select 1
      from public.mv_refresh_impacts i
      where i.source = 'corridas'
        and i.organization_id = v_org_filter
        and i.entregadores_agregado_processed_at is null
    );

    if v_weekly_ready and v_pracas is null then
      with aggregated_data as (
        select
          coalesce(
            max(nullif(btrim(d.nome_entregador), '')) filter (
              where position(chr(195) in d.nome_entregador) = 0
                and position(chr(194) in d.nome_entregador) = 0
            ),
            max(nullif(btrim(d.nome_entregador), '')),
            d.id_entregador
          ) as nome_entregador,
          d.id_entregador,
          round((sum(d.soma_taxas_aceitas)::numeric / 100), 2) as total_taxas,
          sum(d.corridas_aceitas)::bigint as numero_corridas_aceitas,
          case
            when sum(d.corridas_aceitas) > 0 then round((sum(d.soma_taxas_aceitas)::numeric / 100) / sum(d.corridas_aceitas), 2)
            else 0
          end as taxa_media
        from public.dashboard_entregadores_agregado_semanal_entregador d
        where d.organization_id = v_org_filter
          and d.ano_iso = p_ano
          and (p_semana is null or d.semana_numero = p_semana)
          and d.nome_entregador is not null
        group by d.id_entregador
      )
      select jsonb_build_object(
        'entregadores', coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb),
        'total', count(*)
      )
      into v_result
      from aggregated_data t;

      return coalesce(v_result, jsonb_build_object('entregadores', '[]'::jsonb, 'total', 0));
    end if;

    if v_weekly_ready and v_pracas is not null then
      with aggregated_data as (
        select
          coalesce(
            max(nullif(btrim(w.nome_entregador), '')) filter (
              where position(chr(195) in w.nome_entregador) = 0
                and position(chr(194) in w.nome_entregador) = 0
            ),
            max(nullif(btrim(w.nome_entregador), '')),
            w.id_entregador
          ) as nome_entregador,
          w.id_entregador,
          round((sum(w.soma_taxas_aceitas)::numeric / 100), 2) as total_taxas,
          sum(w.corridas_aceitas)::bigint as numero_corridas_aceitas,
          case
            when sum(w.corridas_aceitas) > 0 then round((sum(w.soma_taxas_aceitas)::numeric / 100) / sum(w.corridas_aceitas), 2)
            else 0
          end as taxa_media
        from public.dashboard_entregadores_agregado_semanal w
        where w.organization_id = v_org_filter
          and w.ano_iso = p_ano
          and (p_semana is null or w.semana_numero = p_semana)
          and w.praca = any(v_pracas)
          and w.nome_entregador is not null
        group by w.id_entregador
      )
      select jsonb_build_object(
        'entregadores', coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb),
        'total', count(*)
      )
      into v_result
      from aggregated_data t;

      return coalesce(v_result, jsonb_build_object('entregadores', '[]'::jsonb, 'total', 0));
    end if;
  end if;

  if v_org_filter is not null
     and p_ano is not null
     and p_semana is null
     and p_data_inicial is null
     and p_data_final is null
     and v_pracas is null
     and v_sub_pracas is null
     and v_origens is null then
    with incremental_scopes as materialized (
      select
        s.organization_id,
        s.data_do_periodo,
        s.praca,
        s.sub_praca,
        s.origem
      from public.dashboard_entregadores_incremental_scopes s
      where s.organization_id = v_org_filter
    ),
    filtered_data as (
      select
        mv.id_entregador,
        mv.nome_entregador,
        mv.corridas_aceitas as numero_corridas_aceitas,
        mv.soma_taxas_aceitas
      from public.mv_entregadores_agregado mv
      where mv.organization_id = v_org_filter
        and mv.ano_iso = p_ano
        and mv.nome_entregador is not null
        and not exists (
          select 1
          from incremental_scopes s
          where s.organization_id = mv.organization_id
            and s.data_do_periodo = mv.data_do_periodo
            and s.praca is not distinct from mv.praca
            and s.sub_praca is not distinct from mv.sub_praca
            and s.origem is not distinct from mv.origem
        )
      union all
      select
        inc.id_entregador,
        inc.nome_entregador,
        inc.corridas_aceitas as numero_corridas_aceitas,
        inc.soma_taxas_aceitas
      from public.tb_entregadores_agregado_incremental inc
      where inc.organization_id = v_org_filter
        and inc.ano_iso = p_ano
        and inc.nome_entregador is not null
    ),
    aggregated_data as (
      select
        coalesce(
          max(nullif(btrim(nome_entregador), '')) filter (
            where position(chr(195) in nome_entregador) = 0
              and position(chr(194) in nome_entregador) = 0
          ),
          max(nullif(btrim(nome_entregador), '')),
          id_entregador
        ) as nome_entregador,
        id_entregador,
        round((sum(soma_taxas_aceitas)::numeric / 100), 2) as total_taxas,
        sum(numero_corridas_aceitas) as numero_corridas_aceitas,
        case
          when sum(numero_corridas_aceitas) > 0 then round((sum(soma_taxas_aceitas)::numeric / 100) / sum(numero_corridas_aceitas), 2)
          else 0
        end as taxa_media
      from filtered_data
      group by id_entregador
    )
    select jsonb_build_object(
      'entregadores', coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb),
      'total', count(*)
    )
    into v_result
    from aggregated_data t;

    return coalesce(v_result, jsonb_build_object('entregadores', '[]'::jsonb, 'total', 0));
  end if;

  if v_org_filter is not null
     and p_ano is not null
     and p_semana is not null
     and p_data_inicial is null
     and p_data_final is null
     and v_pracas is null
     and v_sub_pracas is null
     and v_origens is null then
    with incremental_scopes as materialized (
      select s.organization_id, s.data_do_periodo, s.praca, s.sub_praca, s.origem
      from public.dashboard_entregadores_incremental_scopes s
      where s.organization_id = v_org_filter
    ),
    filtered_data as (
      select
        mv.id_entregador,
        mv.nome_entregador,
        mv.corridas_aceitas as numero_corridas_aceitas,
        mv.soma_taxas_aceitas
      from public.mv_entregadores_agregado mv
      where mv.organization_id = v_org_filter
        and mv.ano_iso = p_ano
        and mv.semana_numero = p_semana
        and mv.nome_entregador is not null
        and not exists (
          select 1
          from incremental_scopes s
          where s.organization_id = mv.organization_id
            and s.data_do_periodo = mv.data_do_periodo
            and s.praca is not distinct from mv.praca
            and s.sub_praca is not distinct from mv.sub_praca
            and s.origem is not distinct from mv.origem
        )
      union all
      select
        inc.id_entregador,
        inc.nome_entregador,
        inc.corridas_aceitas as numero_corridas_aceitas,
        inc.soma_taxas_aceitas
      from public.tb_entregadores_agregado_incremental inc
      where inc.organization_id = v_org_filter
        and inc.ano_iso = p_ano
        and inc.semana_numero = p_semana
        and inc.nome_entregador is not null
    ),
    aggregated_data as (
      select
        coalesce(
          max(nullif(btrim(nome_entregador), '')) filter (
            where position(chr(195) in nome_entregador) = 0
              and position(chr(194) in nome_entregador) = 0
          ),
          max(nullif(btrim(nome_entregador), '')),
          id_entregador
        ) as nome_entregador,
        id_entregador,
        round((sum(soma_taxas_aceitas)::numeric / 100), 2) as total_taxas,
        sum(numero_corridas_aceitas) as numero_corridas_aceitas,
        case
          when sum(numero_corridas_aceitas) > 0 then round((sum(soma_taxas_aceitas)::numeric / 100) / sum(numero_corridas_aceitas), 2)
          else 0
        end as taxa_media
      from filtered_data
      group by id_entregador
    )
    select jsonb_build_object(
      'entregadores', coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb),
      'total', count(*)
    )
    into v_result
    from aggregated_data t;

    return coalesce(v_result, jsonb_build_object('entregadores', '[]'::jsonb, 'total', 0));
  end if;

  if v_org_filter is not null
     and p_data_inicial is not null
     and p_data_final is not null
     and p_ano is null
     and p_semana is null
     and array_length(v_pracas, 1) = 1
     and v_sub_pracas is null
     and v_origens is null then
    with incremental_scopes as materialized (
      select s.organization_id, s.data_do_periodo, s.praca, s.sub_praca, s.origem
      from public.dashboard_entregadores_incremental_scopes s
      where s.organization_id = v_org_filter
        and s.data_do_periodo >= p_data_inicial
        and s.data_do_periodo <= p_data_final
        and s.praca = v_pracas[1]
    ),
    filtered_data as (
      select
        mv.id_entregador,
        mv.nome_entregador,
        mv.corridas_aceitas as numero_corridas_aceitas,
        mv.soma_taxas_aceitas
      from public.mv_entregadores_agregado mv
      where mv.organization_id = v_org_filter
        and mv.data_do_periodo >= p_data_inicial
        and mv.data_do_periodo <= p_data_final
        and mv.praca = v_pracas[1]
        and mv.nome_entregador is not null
        and not exists (
          select 1
          from incremental_scopes s
          where s.organization_id = mv.organization_id
            and s.data_do_periodo = mv.data_do_periodo
            and s.praca is not distinct from mv.praca
            and s.sub_praca is not distinct from mv.sub_praca
            and s.origem is not distinct from mv.origem
        )
      union all
      select
        inc.id_entregador,
        inc.nome_entregador,
        inc.corridas_aceitas as numero_corridas_aceitas,
        inc.soma_taxas_aceitas
      from public.tb_entregadores_agregado_incremental inc
      where inc.organization_id = v_org_filter
        and inc.data_do_periodo >= p_data_inicial
        and inc.data_do_periodo <= p_data_final
        and inc.praca = v_pracas[1]
        and inc.nome_entregador is not null
    ),
    aggregated_data as (
      select
        nome_entregador,
        id_entregador,
        round((sum(soma_taxas_aceitas)::numeric / 100), 2) as total_taxas,
        sum(numero_corridas_aceitas) as numero_corridas_aceitas,
        case
          when sum(numero_corridas_aceitas) > 0 then round((sum(soma_taxas_aceitas)::numeric / 100) / sum(numero_corridas_aceitas), 2)
          else 0
        end as taxa_media
      from filtered_data
      group by id_entregador, nome_entregador
    )
    select jsonb_build_object(
      'entregadores', coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb),
      'total', count(*)
    )
    into v_result
    from aggregated_data t;

    return coalesce(v_result, jsonb_build_object('entregadores', '[]'::jsonb, 'total', 0));
  end if;

  return public._listar_valores_entregadores_legacy_v1(
    p_ano,
    p_semana,
    p_praca,
    p_sub_praca,
    p_origem,
    p_data_inicial,
    p_data_final,
    p_organization_id
  );
end;
$function$;

-- 5. Add ISO year date bounds to _listar_valores_entregadores_detalhado_core_legacy_v1
CREATE OR REPLACE FUNCTION public._listar_valores_entregadores_detalhado_core_legacy_v1(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
 SET work_mem TO '64MB'
AS $function$
declare
    v_result jsonb;
    v_org_filter uuid;
    v_is_admin boolean := false;
    v_pracas text[];
    v_sub_pracas text[];
    v_origens text[];
    v_limit integer := greatest(coalesce(p_limit, 25), 0);
    v_offset integer := greatest(coalesce(p_offset, 0), 0);
    v_iso_start date;
    v_iso_end date;
begin
    begin
        v_org_filter := nullif(p_organization_id, '')::uuid;
    exception when others then
        v_org_filter := null;
    end;

    select coalesce((role in ('admin', 'marketing', 'master') or is_admin = true), false)
    into v_is_admin
    from public.user_profiles
    where id = auth.uid();

    if v_org_filter is null and not v_is_admin then
        select organization_id
        into v_org_filter
        from public.user_profiles
        where id = auth.uid();
    end if;

    if p_praca is not null and btrim(p_praca) <> '' and lower(btrim(p_praca)) not in ('todas', 'todos', 'all') then
        select array_agg(item)
        into v_pracas
        from (
            select distinct btrim(value) as item
            from unnest(string_to_array(p_praca, ',')) as value
            where btrim(value) <> ''
        ) praca_values;
    end if;

    if p_sub_praca is not null and btrim(p_sub_praca) <> '' and lower(btrim(p_sub_praca)) not in ('todas', 'todos', 'all') then
        select array_agg(item)
        into v_sub_pracas
        from (
            select distinct btrim(value) as item
            from unnest(string_to_array(p_sub_praca, ',')) as value
            where btrim(value) <> ''
        ) sub_praca_values;
    end if;

    if p_origem is not null and btrim(p_origem) <> '' and lower(btrim(p_origem)) not in ('todas', 'todos', 'all') then
        select array_agg(item)
        into v_origens
        from (
            select distinct btrim(value) as item
            from unnest(string_to_array(p_origem, ',')) as value
            where btrim(value) <> ''
        ) origem_values;
    end if;

    if p_data_inicial is not null and p_data_final is not null then
        with aggregated_data as materialized (
            select
                dc.pessoa_entregadora as nome_entregador,
                dc.id_da_pessoa_entregadora as id_entregador,
                dc.periodo as turno,
                dc.sub_praca,
                round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100), 2) as total_taxas,
                sum(dc.numero_de_corridas_aceitas) as numero_corridas_aceitas,
                case
                    when sum(dc.numero_de_corridas_aceitas) > 0 then round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100) / sum(dc.numero_de_corridas_aceitas), 2)
                    else 0
                end as taxa_media
            from public.dados_corridas dc
            where (v_org_filter is null or dc.organization_id = v_org_filter)
              and dc.data_do_periodo >= p_data_inicial
              and dc.data_do_periodo <= p_data_final
              and (v_pracas is null or dc.praca = any(v_pracas))
              and (v_sub_pracas is null or dc.sub_praca = any(v_sub_pracas))
              and (v_origens is null or dc.origem = any(v_origens))
              and dc.pessoa_entregadora is not null
            group by dc.id_da_pessoa_entregadora, dc.pessoa_entregadora, dc.periodo, dc.sub_praca
        ),
        paged_data as (
            select * from aggregated_data order by total_taxas desc limit v_limit offset v_offset
        ),
        total_data as (
            select count(*) as total_count from aggregated_data
        )
        select jsonb_build_object(
            'entregadores', coalesce((select jsonb_agg(row_to_json(paged_data)) from paged_data), '[]'::jsonb),
            'total', coalesce((select total_count from total_data), 0)
        )
        into v_result;
    elsif p_ano is not null and p_semana is not null then
        with aggregated_data as materialized (
            select
                dc.pessoa_entregadora as nome_entregador,
                dc.id_da_pessoa_entregadora as id_entregador,
                dc.periodo as turno,
                dc.sub_praca,
                round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100), 2) as total_taxas,
                sum(dc.numero_de_corridas_aceitas) as numero_corridas_aceitas,
                case
                    when sum(dc.numero_de_corridas_aceitas) > 0 then round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100) / sum(dc.numero_de_corridas_aceitas), 2)
                    else 0
                end as taxa_media
            from public.dados_corridas dc
            where (v_org_filter is null or dc.organization_id = v_org_filter)
              and dc.ano_iso = p_ano
              and dc.semana_numero = p_semana
              and (v_pracas is null or dc.praca = any(v_pracas))
              and (v_sub_pracas is null or dc.sub_praca = any(v_sub_pracas))
              and (v_origens is null or dc.origem = any(v_origens))
              and dc.pessoa_entregadora is not null
            group by dc.id_da_pessoa_entregadora, dc.pessoa_entregadora, dc.periodo, dc.sub_praca
        ),
        paged_data as (
            select * from aggregated_data order by total_taxas desc limit v_limit offset v_offset
        ),
        total_data as (
            select count(*) as total_count from aggregated_data
        )
        select jsonb_build_object(
            'entregadores', coalesce((select jsonb_agg(row_to_json(paged_data)) from paged_data), '[]'::jsonb),
            'total', coalesce((select total_count from total_data), 0)
        )
        into v_result;
    elsif p_ano is not null then
        v_iso_start := (make_date(p_ano, 1, 4) - (extract(isodow from make_date(p_ano, 1, 4))::int - 1))::date;
        v_iso_end := (make_date(p_ano + 1, 1, 4) - extract(isodow from make_date(p_ano + 1, 1, 4))::int)::date;

        with aggregated_data as materialized (
            select
                dc.pessoa_entregadora as nome_entregador,
                dc.id_da_pessoa_entregadora as id_entregador,
                dc.periodo as turno,
                dc.sub_praca,
                round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100), 2) as total_taxas,
                sum(dc.numero_de_corridas_aceitas) as numero_corridas_aceitas,
                case
                    when sum(dc.numero_de_corridas_aceitas) > 0 then round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100) / sum(dc.numero_de_corridas_aceitas), 2)
                    else 0
                end as taxa_media
            from public.dados_corridas dc
            where (v_org_filter is null or dc.organization_id = v_org_filter)
              and dc.data_do_periodo >= v_iso_start
              and dc.data_do_periodo <= v_iso_end
              and dc.ano_iso = p_ano
              and (v_pracas is null or dc.praca = any(v_pracas))
              and (v_sub_pracas is null or dc.sub_praca = any(v_sub_pracas))
              and (v_origens is null or dc.origem = any(v_origens))
              and dc.pessoa_entregadora is not null
            group by dc.id_da_pessoa_entregadora, dc.pessoa_entregadora, dc.periodo, dc.sub_praca
        ),
        paged_data as (
            select * from aggregated_data order by total_taxas desc limit v_limit offset v_offset
        ),
        total_data as (
            select count(*) as total_count from aggregated_data
        )
        select jsonb_build_object(
            'entregadores', coalesce((select jsonb_agg(row_to_json(paged_data)) from paged_data), '[]'::jsonb),
            'total', coalesce((select total_count from total_data), 0)
        )
        into v_result;
    else
        with aggregated_data as materialized (
            select
                dc.pessoa_entregadora as nome_entregador,
                dc.id_da_pessoa_entregadora as id_entregador,
                dc.periodo as turno,
                dc.sub_praca,
                round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100), 2) as total_taxas,
                sum(dc.numero_de_corridas_aceitas) as numero_corridas_aceitas,
                case
                    when sum(dc.numero_de_corridas_aceitas) > 0 then round((sum(dc.soma_das_taxas_das_corridas_aceitas)::numeric / 100) / sum(dc.numero_de_corridas_aceitas), 2)
                    else 0
                end as taxa_media
            from public.dados_corridas dc
            where (v_org_filter is null or dc.organization_id = v_org_filter)
              and (v_pracas is null or dc.praca = any(v_pracas))
              and (v_sub_pracas is null or dc.sub_praca = any(v_sub_pracas))
              and (v_origens is null or dc.origem = any(v_origens))
              and dc.pessoa_entregadora is not null
            group by dc.id_da_pessoa_entregadora, dc.pessoa_entregadora, dc.periodo, dc.sub_praca
        ),
        paged_data as (
            select * from aggregated_data order by total_taxas desc limit v_limit offset v_offset
        ),
        total_data as (
            select count(*) as total_count from aggregated_data
        )
        select jsonb_build_object(
            'entregadores', coalesce((select jsonb_agg(row_to_json(paged_data)) from paged_data), '[]'::jsonb),
            'total', coalesce((select total_count from total_data), 0)
        )
        into v_result;
    end if;

    return coalesce(v_result, jsonb_build_object('entregadores', '[]'::jsonb, 'total', 0));
end;
$function$;

-- 6. Eliminate duplicate scan & pre-parse pracas in get_fluxo_semanal (4-arg & 5-arg)
CREATE OR REPLACE FUNCTION public.get_fluxo_semanal(p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id uuid DEFAULT NULL::uuid, p_praca text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
 SET work_mem TO '256MB'
AS $function$
declare
    v_start_date date;
    v_end_date date;
    v_start_week date;
    v_end_week date;
    v_org_uuid uuid;
    v_result json;
    v_current_week_start date;
    v_pracas text[];
begin
    v_start_date := coalesce(p_data_inicial, date_trunc('year', current_date)::date);
    v_end_date := coalesce(p_data_final, current_date);
    v_start_week := date_trunc('week', v_start_date)::date;
    v_end_week := date_trunc('week', v_end_date)::date;
    v_current_week_start := date_trunc('week', current_date)::date;
    v_org_uuid := coalesce(p_organization_id, '00000000-0000-0000-0000-000000000001'::uuid);

    if p_praca is not null and btrim(p_praca) <> '' then
      select array_agg(btrim(val))
      into v_pracas
      from unnest(string_to_array(p_praca, ',')) as val
      where btrim(val) <> '';
    end if;

    with weeks as (
        select
            to_char(d, 'IYYY-"W"IW') as semana_iso,
            d::date as week_date
        from generate_series(v_start_week, v_end_week, '1 week'::interval) d
    ),
    marketing_entregadores as materialized (
        select distinct dm.id_entregador
        from public.dados_marketing dm
        where dm.id_entregador is not null
          and dm.organization_id = v_org_uuid
    ),
    driver_weekly_rides as materialized (
        select
            mca.id_entregador,
            mca.week_start_date as week_date,
            sum(coalesce(mca.corridas_completadas, 0))::bigint as weekly_rides,
            max(mca.nome_entregador) as nome,
            bool_or(me.id_entregador is not null) as is_marketing
        from public.vw_corridas_agregadas_current mca
        left join marketing_entregadores me
          on me.id_entregador = mca.id_entregador
        where mca.organization_id = v_org_uuid
          and mca.week_start_date <= v_end_week
          and (v_pracas is null or mca.praca = any(v_pracas))
        group by mca.id_entregador, mca.week_start_date
    ),
    exit_reference as (
        select least(
            coalesce((select max(dwr.week_date) from driver_weekly_rides dwr), v_end_week),
            v_current_week_start - interval '7 days'
        )::date as exit_ref_week
    ),
    driver_cumulative as materialized (
        select
            dwr.id_entregador,
            dwr.week_date,
            dwr.weekly_rides,
            dwr.nome,
            dwr.is_marketing,
            sum(dwr.weekly_rides) over (
                partition by dwr.id_entregador
                order by dwr.week_date
            )::bigint as cumulative_rides
        from driver_weekly_rides dwr
    ),
    filtered_summary as materialized (
        select
            dc.id_entregador,
            min(dc.week_date) filter (where dc.cumulative_rides >= 30) as activation_week,
            max(dc.week_date) as last_active_week,
            sum(dc.weekly_rides)::bigint as total_rides,
            bool_or(dc.is_marketing) as is_marketing,
            max(dc.nome) as nome
        from driver_cumulative dc
        group by dc.id_entregador
    ),
    entradas_grouped as (
        select
            to_char(fs.activation_week, 'IYYY-"W"IW') as semana_iso,
            count(*) filter (where fs.is_marketing)::bigint as qtd_mkt,
            count(*) filter (where not fs.is_marketing)::bigint as qtd_ops,
            array_agg(fs.nome) filter (where fs.is_marketing) as nomes_mkt,
            array_agg(fs.nome) filter (where not fs.is_marketing) as nomes_ops
        from filtered_summary fs
        where fs.activation_week is not null
          and fs.activation_week >= v_start_week
          and fs.activation_week <= v_end_week
        group by 1
    ),
    saidas_grouped as (
        select
            to_char(fs.last_active_week, 'IYYY-"W"IW') as semana_iso,
            count(*) filter (where fs.is_marketing)::bigint as qtd_mkt_matured,
            count(*) filter (where not fs.is_marketing)::bigint as qtd_ops_matured,
            count(*) filter (where fs.is_marketing and fs.total_rides < 30)::bigint as qtd_mkt_novice,
            count(*) filter (where not fs.is_marketing and fs.total_rides < 30)::bigint as qtd_ops_novice,
            array_agg(fs.nome) filter (where fs.is_marketing) as nomes_mkt_matured,
            array_agg(fs.nome) filter (where not fs.is_marketing) as nomes_ops_matured,
            array_agg(fs.nome) filter (where fs.is_marketing and fs.total_rides < 30) as nomes_mkt_novice,
            array_agg(fs.nome) filter (where not fs.is_marketing and fs.total_rides < 30) as nomes_ops_novice
        from filtered_summary fs
        cross join exit_reference er
        where fs.last_active_week >= v_start_week
          and fs.last_active_week <= v_end_week
          and fs.last_active_week < coalesce(er.exit_ref_week, fs.last_active_week + interval '1 week')
        group by 1
    ),
    weeks_ordered as (
        select
            dwr.id_entregador,
            dwr.week_date as week_start_date,
            lag(dwr.week_date) over (
                partition by dwr.id_entregador
                order by dwr.week_date
            ) as prev_week_date
        from driver_weekly_rides dwr
        where dwr.weekly_rides > 0
    ),
    retomada_raw as (
        select
            wo.week_start_date,
            wo.id_entregador,
            wo.prev_week_date as origin_date
        from weeks_ordered wo
        where wo.week_start_date >= v_start_week
          and wo.week_start_date <= v_end_week
          and (wo.prev_week_date is null or wo.prev_week_date < (wo.week_start_date - interval '1 week'))
          and exists (
              select 1
              from filtered_summary fs
              where fs.id_entregador = wo.id_entregador
                and fs.activation_week is not null
                and fs.activation_week < wo.week_start_date
          )
    ),
    retomada_breakdown as (
        select
            to_char(rr.week_start_date, 'IYYY-"W"IW') as semana_iso,
            to_char(rr.origin_date, 'IYYY-"W"IW') as origin_week,
            count(*)::bigint as qtd
        from retomada_raw rr
        where rr.origin_date is not null
        group by 1, 2
    ),
    retomada_grouped as (
        select
            to_char(rr.week_start_date, 'IYYY-"W"IW') as semana_iso,
            count(*) filter (where fs.is_marketing)::bigint as qtd_mkt,
            count(*) filter (where not fs.is_marketing)::bigint as qtd_ops,
            array_agg(fs.nome) filter (where fs.is_marketing) as nomes_mkt,
            array_agg(fs.nome) filter (where not fs.is_marketing) as nomes_ops
        from retomada_raw rr
        join filtered_summary fs
          on fs.id_entregador = rr.id_entregador
        group by 1
    ),
    retomada_json as (
        select
            rb.semana_iso,
            jsonb_object_agg(rb.origin_week, rb.qtd) as origin_json
        from retomada_breakdown rb
        group by rb.semana_iso
    ),
    base_ativa_raw as (
        select
            to_char(dwr.week_date, 'IYYY-"W"IW') as semana_iso,
            count(distinct dwr.id_entregador)::bigint as base_ativa
        from driver_weekly_rides dwr
        where dwr.week_date >= v_start_week
          and dwr.week_date <= v_end_week
          and dwr.weekly_rides > 0
        group by 1
    ),
    result as (
        select
            w.semana_iso as semana,
            (coalesce(eg.qtd_mkt, 0) + coalesce(eg.qtd_ops, 0))::bigint as entradas_total,
            coalesce(eg.qtd_mkt, 0)::bigint as entradas_mkt_count,
            coalesce(eg.nomes_mkt, array[]::text[]) as nomes_entradas_mkt,
            coalesce(eg.nomes_ops, array[]::text[]) as nomes_entradas_ops,
            (coalesce(sg.qtd_mkt_matured, 0) + coalesce(sg.qtd_ops_matured, 0))::bigint as saidas_total,
            coalesce(sg.qtd_mkt_matured, 0)::bigint as saidas_mkt_count,
            coalesce(sg.nomes_mkt_matured, array[]::text[]) as nomes_saidas_mkt,
            coalesce(sg.nomes_ops_matured, array[]::text[]) as nomes_saidas_ops,
            (coalesce(sg.qtd_mkt_novice, 0) + coalesce(sg.qtd_ops_novice, 0))::bigint as saidas_novos_total,
            coalesce(sg.nomes_mkt_novice, array[]::text[]) as nomes_saidas_novos_mkt,
            coalesce(sg.nomes_ops_novice, array[]::text[]) as nomes_saidas_novos_ops,
            (coalesce(rg.qtd_mkt, 0) + coalesce(rg.qtd_ops, 0))::bigint as retomada_total,
            coalesce(rg.qtd_mkt, 0)::bigint as retomada_mkt_count,
            coalesce(rg.nomes_mkt, array[]::text[]) as nomes_retomada_mkt,
            coalesce(rg.nomes_ops, array[]::text[]) as nomes_retomada_ops,
            coalesce(rj.origin_json, '{}'::jsonb) as retomada_origins,
            ((coalesce(eg.qtd_mkt, 0) + coalesce(eg.qtd_ops, 0)) - (coalesce(sg.qtd_mkt_matured, 0) + coalesce(sg.qtd_ops_matured, 0)))::bigint as saldo,
            coalesce(ba.base_ativa, 0)::bigint as base_ativa,
            (coalesce(ba.base_ativa, 0) - coalesce(lag(ba.base_ativa) over (order by w.semana_iso), ba.base_ativa))::bigint as variacao_base
        from weeks w
        left join entradas_grouped eg on eg.semana_iso = w.semana_iso
        left join saidas_grouped sg on sg.semana_iso = w.semana_iso
        left join retomada_grouped rg on rg.semana_iso = w.semana_iso
        left join retomada_json rj on rj.semana_iso = w.semana_iso
        left join base_ativa_raw ba on ba.semana_iso = w.semana_iso
        order by w.semana_iso
    )
    select json_agg(row_to_json(result))
      into v_result
      from result;

    return coalesce(v_result, '[]'::json);
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_fluxo_semanal(p_data_inicial date, p_data_final date, p_organization_id uuid, p_praca text, p_include_names boolean)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
 SET work_mem TO '256MB'
AS $function$
declare
    v_start_date date;
    v_end_date date;
    v_start_week date;
    v_end_week date;
    v_org_uuid uuid;
    v_result json;
    v_current_week_start date;
    v_pracas text[];
begin
    if p_include_names then
        return public.get_fluxo_semanal(
            p_data_inicial,
            p_data_final,
            p_organization_id,
            p_praca
        );
    end if;

    v_start_date := coalesce(p_data_inicial, date_trunc('year', current_date)::date);
    v_end_date := coalesce(p_data_final, current_date);
    v_start_week := date_trunc('week', v_start_date)::date;
    v_end_week := date_trunc('week', v_end_date)::date;
    v_current_week_start := date_trunc('week', current_date)::date;
    v_org_uuid := coalesce(p_organization_id, '00000000-0000-0000-0000-000000000001'::uuid);

    if p_praca is not null and btrim(p_praca) <> '' then
      select array_agg(btrim(val))
      into v_pracas
      from unnest(string_to_array(p_praca, ',')) as val
      where btrim(val) <> '';
    end if;

    with weeks as (
        select to_char(d, 'IYYY-"W"IW') as semana_iso, d::date as week_date
        from generate_series(v_start_week, v_end_week, '1 week'::interval) d
    ),
    marketing_entregadores as materialized (
        select distinct dm.id_entregador
        from public.dados_marketing dm
        where dm.id_entregador is not null
          and dm.organization_id = v_org_uuid
    ),
    driver_weekly_rides as materialized (
        select
            mca.id_entregador,
            mca.week_start_date as week_date,
            sum(coalesce(mca.corridas_completadas, 0))::bigint as weekly_rides,
            bool_or(me.id_entregador is not null) as is_marketing
        from public.vw_corridas_agregadas_current mca
        left join marketing_entregadores me on me.id_entregador = mca.id_entregador
        where mca.organization_id = v_org_uuid
          and mca.week_start_date <= v_end_week
          and (v_pracas is null or mca.praca = any(v_pracas))
        group by mca.id_entregador, mca.week_start_date
    ),
    exit_reference as (
        select least(
            coalesce((select max(dwr.week_date) from driver_weekly_rides dwr), v_end_week),
            v_current_week_start - interval '7 days'
        )::date as exit_ref_week
    ),
    driver_cumulative as (
        select
            dwr.id_entregador,
            dwr.week_date,
            dwr.weekly_rides,
            dwr.is_marketing,
            sum(dwr.weekly_rides) over (partition by dwr.id_entregador order by dwr.week_date)::bigint as cumulative_rides
        from driver_weekly_rides dwr
    ),
    filtered_summary as materialized (
        select
            dc.id_entregador,
            min(dc.week_date) filter (where dc.cumulative_rides >= 30) as activation_week,
            max(dc.week_date) as last_active_week,
            sum(dc.weekly_rides)::bigint as total_rides,
            bool_or(dc.is_marketing) as is_marketing
        from driver_cumulative dc
        group by dc.id_entregador
    ),
    entradas_grouped as (
        select
            to_char(fs.activation_week, 'IYYY-"W"IW') as semana_iso,
            count(*) filter (where fs.is_marketing)::bigint as qtd_mkt,
            count(*) filter (where not fs.is_marketing)::bigint as qtd_ops
        from filtered_summary fs
        where fs.activation_week is not null and fs.activation_week >= v_start_week and fs.activation_week <= v_end_week
        group by 1
    ),
    saidas_grouped as (
        select
            to_char(fs.last_active_week, 'IYYY-"W"IW') as semana_iso,
            count(*) filter (where fs.is_marketing)::bigint as qtd_mkt_matured,
            count(*) filter (where not fs.is_marketing)::bigint as qtd_ops_matured,
            count(*) filter (where fs.is_marketing and fs.total_rides < 30)::bigint as qtd_mkt_novice,
            count(*) filter (where not fs.is_marketing and fs.total_rides < 30)::bigint as qtd_ops_novice
        from filtered_summary fs
        cross join exit_reference er
        where fs.last_active_week >= v_start_week
          and fs.last_active_week <= v_end_week
          and fs.last_active_week < coalesce(er.exit_ref_week, fs.last_active_week + interval '1 week')
        group by 1
    ),
    weeks_ordered as (
        select
            dwr.id_entregador,
            dwr.week_date as week_start_date,
            lag(dwr.week_date) over (partition by dwr.id_entregador order by dwr.week_date) as prev_week_date
        from driver_weekly_rides dwr
        where dwr.weekly_rides > 0
    ),
    retomada_raw as (
        select wo.week_start_date, wo.id_entregador, wo.prev_week_date as origin_date
        from weeks_ordered wo
        where wo.week_start_date >= v_start_week
          and wo.week_start_date <= v_end_week
          and (wo.prev_week_date is null or wo.prev_week_date < (wo.week_start_date - interval '1 week'))
          and exists (
              select 1 from filtered_summary fs
              where fs.id_entregador = wo.id_entregador
                and fs.activation_week is not null
                and fs.activation_week < wo.week_start_date
          )
    ),
    retomada_breakdown as (
        select to_char(rr.week_start_date, 'IYYY-"W"IW') as semana_iso, to_char(rr.origin_date, 'IYYY-"W"IW') as origin_week, count(*)::bigint as qtd
        from retomada_raw rr
        where rr.origin_date is not null
        group by 1, 2
    ),
    retomada_grouped as (
        select
            to_char(rr.week_start_date, 'IYYY-"W"IW') as semana_iso,
            count(*) filter (where fs.is_marketing)::bigint as qtd_mkt,
            count(*) filter (where not fs.is_marketing)::bigint as qtd_ops
        from retomada_raw rr
        join filtered_summary fs on fs.id_entregador = rr.id_entregador
        group by 1
    ),
    retomada_json as (
        select rb.semana_iso, jsonb_object_agg(rb.origin_week, rb.qtd) as origin_json
        from retomada_breakdown rb
        group by rb.semana_iso
    ),
    base_ativa_raw as (
        select to_char(dwr.week_date, 'IYYY-"W"IW') as semana_iso, count(distinct dwr.id_entregador)::bigint as base_ativa
        from driver_weekly_rides dwr
        where dwr.week_date >= v_start_week and dwr.week_date <= v_end_week and dwr.weekly_rides > 0
        group by 1
    ),
    result as (
        select
            w.semana_iso as semana,
            (coalesce(eg.qtd_mkt, 0) + coalesce(eg.qtd_ops, 0))::bigint as entradas_total,
            coalesce(eg.qtd_mkt, 0)::bigint as entradas_mkt_count,
            array[]::text[] as nomes_entradas_mkt,
            array[]::text[] as nomes_entradas_ops,
            (coalesce(sg.qtd_mkt_matured, 0) + coalesce(sg.qtd_ops_matured, 0))::bigint as saidas_total,
            coalesce(sg.qtd_mkt_matured, 0)::bigint as saidas_mkt_count,
            array[]::text[] as nomes_saidas_mkt,
            array[]::text[] as nomes_saidas_ops,
            (coalesce(sg.qtd_mkt_novice, 0) + coalesce(sg.qtd_ops_novice, 0))::bigint as saidas_novos_total,
            array[]::text[] as nomes_saidas_novos_mkt,
            array[]::text[] as nomes_saidas_novos_ops,
            (coalesce(rg.qtd_mkt, 0) + coalesce(rg.qtd_ops, 0))::bigint as retomada_total,
            coalesce(rg.qtd_mkt, 0)::bigint as retomada_mkt_count,
            array[]::text[] as nomes_retomada_mkt,
            array[]::text[] as nomes_retomada_ops,
            coalesce(rj.origin_json, '{}'::jsonb) as retomada_origins,
            ((coalesce(eg.qtd_mkt, 0) + coalesce(eg.qtd_ops, 0)) - (coalesce(sg.qtd_mkt_matured, 0) + coalesce(sg.qtd_ops_matured, 0)))::bigint as saldo,
            coalesce(ba.base_ativa, 0)::bigint as base_ativa,
            (coalesce(ba.base_ativa, 0) - coalesce(lag(ba.base_ativa) over (order by w.semana_iso), ba.base_ativa))::bigint as variacao_base
        from weeks w
        left join entradas_grouped eg on eg.semana_iso = w.semana_iso
        left join saidas_grouped sg on sg.semana_iso = w.semana_iso
        left join retomada_grouped rg on rg.semana_iso = w.semana_iso
        left join retomada_json rj on rj.semana_iso = w.semana_iso
        left join base_ativa_raw ba on ba.semana_iso = w.semana_iso
        order by w.semana_iso
    )
    select json_agg(row_to_json(result)) into v_result from result;

    return coalesce(v_result, '[]'::json);
end;
$function$;
