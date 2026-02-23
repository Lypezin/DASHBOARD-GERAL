-- Supabase RPC Optimizations

-- Optimizing: calcular_aderencia_semanal
CREATE OR REPLACE FUNCTION public.calcular_aderencia_semanal(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(semana text, horas_a_entregar text, horas_entregues text, aderencia_percentual numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
  v_is_admin boolean;
  v_org_filter uuid;
BEGIN
  v_org_filter := NULLIF(p_organization_id, '')::uuid;
  SELECT (role = 'admin' OR is_admin = true) INTO v_is_admin FROM public.user_profiles WHERE id = auth.uid();
  
  IF v_is_admin AND v_org_filter IS NULL THEN v_org_filter := NULL;
  ELSIF v_org_filter IS NULL AND NOT v_is_admin THEN SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid(); END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      ano_iso,
      semana_numero,
      data_do_periodo,
      periodo,
      praca,
      sub_praca,
      numero_minimo_de_entregadores_regulares_na_escala,
      hhmmss_to_seconds(duracao_do_periodo) AS duracao_segundos,
      hhmmss_to_seconds(tempo_disponivel_absoluto) AS tempo_disponivel_segundos
    FROM public.dados_corridas
    WHERE data_do_periodo IS NOT NULL
      AND (v_org_filter IS NULL OR organization_id = v_org_filter)
      AND (p_ano IS NULL OR ano_iso = p_ano)
      AND (p_semana IS NULL OR semana_numero = p_semana)
      AND (p_praca IS NULL OR p_praca = '' OR praca = ANY(string_to_array(p_praca, ',')))
      AND (p_sub_praca IS NULL OR p_sub_praca = '' OR sub_praca = ANY(string_to_array(p_sub_praca, ',')))
      AND (p_origem IS NULL OR p_origem = '' OR origem = ANY(string_to_array(p_origem, ',')))
  ),
  unique_turnos AS (
    SELECT DISTINCT ON (
        ano_iso,
        semana_numero,
        data_do_periodo,
        periodo,
        numero_minimo_de_entregadores_regulares_na_escala
      )
      ano_iso,
      semana_numero,
      numero_minimo_de_entregadores_regulares_na_escala,
      duracao_segundos
    FROM base
    WHERE duracao_segundos > 0
    ORDER BY
      ano_iso,
      semana_numero,
      data_do_periodo,
      periodo,
      numero_minimo_de_entregadores_regulares_na_escala,
      duracao_segundos DESC
  ),
  horas_planejadas AS (
    SELECT
      ano_iso,
      semana_numero,
      SUM(numero_minimo_de_entregadores_regulares_na_escala * duracao_segundos) AS segundos_planejados
    FROM unique_turnos
    GROUP BY ano_iso, semana_numero
  ),
  horas_realizadas AS (
    SELECT
      ano_iso,
      semana_numero,
      SUM(tempo_disponivel_segundos) AS segundos_realizados
    FROM base
    WHERE tempo_disponivel_segundos > 0
    GROUP BY ano_iso, semana_numero
  ),
  semanas AS (
    SELECT DISTINCT ano_iso, semana_numero FROM base
  )
  SELECT
    'Semana ' || LPAD(semana_numero::text, 2, '0') AS semana,
    TO_CHAR(
      INTERVAL '1 second' * COALESCE(segundos_planejados, 0),
      'HH24:MI:SS'
    ) AS horas_a_entregar,
    TO_CHAR(
      INTERVAL '1 second' * COALESCE(segundos_realizados, 0),
      'HH24:MI:SS'
    ) AS horas_entregues,
    CASE
      WHEN COALESCE(segundos_planejados, 0) > 0 THEN
        ROUND((COALESCE(segundos_realizados, 0) / segundos_planejados) * 100, 2)
      ELSE 0
    END AS aderencia_percentual
  FROM semanas s
  LEFT JOIN horas_planejadas hp USING (ano_iso, semana_numero)
  LEFT JOIN horas_realizadas hr USING (ano_iso, semana_numero)
  ORDER BY ano_iso DESC, semana_numero DESC;
END;
$function$
;

-- Optimizing: check_mv_refresh_status
CREATE OR REPLACE FUNCTION public.check_mv_refresh_status()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
    refresh_in_progress BOOLEAN;
BEGIN
    -- Verificar se há refresh em progresso na tabela de controle
    SELECT refresh_in_progress INTO refresh_in_progress
    FROM public.mv_refresh_control
    WHERE mv_name = 'mv_dashboard_aderencia_metricas'
    LIMIT 1;
    
    RETURN json_build_object(
        'refresh_in_progress', COALESCE(refresh_in_progress, false),
        'can_refresh', NOT COALESCE(refresh_in_progress, false)
    );
END;
$function$
;

-- Optimizing: check_mv_refresh_system_status
CREATE OR REPLACE FUNCTION public.check_mv_refresh_system_status()
 RETURNS TABLE(sistema_automatico text, triggers_ativos integer, mvs_pendentes integer, ultima_atualizacao timestamp with time zone, job_periodico text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
DECLARE
  trigger_count INTEGER;
  pending_count INTEGER;
  last_refresh_time TIMESTAMPTZ;
  cron_status TEXT;
BEGIN
  -- Contar triggers ativos
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%mv_refresh%';
  
  -- Contar MVs pendentes
  SELECT COUNT(*) INTO pending_count
  FROM public.mv_refresh_control
  WHERE needs_refresh = true;
  
  -- Última atualização
  SELECT MAX(mrc.last_refresh) INTO last_refresh_time
  FROM public.mv_refresh_control mrc
  WHERE mrc.last_refresh IS NOT NULL;
  
  -- Verificar se pg_cron está ativo
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      SELECT COALESCE(
        (SELECT jobname::text FROM cron.job WHERE jobname = 'refresh-pending-mvs' LIMIT 1),
        'Não configurado'
      ) INTO cron_status;
    EXCEPTION WHEN OTHERS THEN
      cron_status := 'Erro ao verificar';
    END;
  ELSE
    cron_status := 'pg_cron não disponível';
  END IF;
  
  RETURN QUERY SELECT
    CASE 
      WHEN trigger_count > 0 THEN 'Ativo'
      ELSE 'Inativo'
    END::text,
    trigger_count::integer,
    pending_count::integer,
    last_refresh_time,
    cron_status;
END;
$function$
;

-- Optimizing: check_mv_status
CREATE OR REPLACE FUNCTION public.check_mv_status()
 RETURNS TABLE(mv_name text, needs_refresh boolean, refresh_in_progress boolean, last_refresh timestamp with time zone, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    mrc.mv_name,
    mrc.needs_refresh,
    mrc.refresh_in_progress,
    mrc.last_refresh,
    CASE 
      WHEN mrc.refresh_in_progress THEN 'Em progresso'
      WHEN mrc.needs_refresh THEN 'Precisa atualizar'
      WHEN mrc.last_refresh IS NULL THEN 'Nunca atualizada'
      ELSE 'Atualizada'
    END as status
  FROM public.mv_refresh_control mrc
  ORDER BY 
    CASE 
      WHEN mrc.refresh_in_progress THEN 1
      WHEN mrc.needs_refresh THEN 2
      ELSE 3
    END,
    mrc.mv_name;
END;
$function$
;

-- Optimizing: debug_entregadores_dados
CREATE OR REPLACE FUNCTION public.debug_entregadores_dados()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  WITH stats AS (
    SELECT 
      COUNT(*) as total_registros,
      COUNT(DISTINCT id_da_pessoa_entregadora) as entregadores_unicos,
      COUNT(DISTINCT data_do_periodo) as datas_unicas,
      MIN(data_do_periodo) as data_min,
      MAX(data_do_periodo) as data_max,
      SUM(CASE WHEN numero_de_corridas_aceitas > 0 THEN 1 ELSE 0 END) as registros_com_corridas
    FROM public.dados_corridas
    WHERE id_da_pessoa_entregadora IS NOT NULL
  )
  SELECT jsonb_build_object(
    'total_registros', s.total_registros,
    'entregadores_unicos', s.entregadores_unicos,
    'datas_unicas', s.datas_unicas,
    'periodo', s.data_min || ' até ' || s.data_max,
    'registros_com_corridas', s.registros_com_corridas
  )
  INTO v_result
  FROM stats s;
  
  RETURN v_result;
END;
$function$
;

-- Optimizing: distribuicao_atividades_hora
CREATE OR REPLACE FUNCTION public.distribuicao_atividades_hora(p_data_inicio timestamp with time zone DEFAULT (now() - '24:00:00'::interval), p_data_fim timestamp with time zone DEFAULT now())
 RETURNS TABLE(hora integer, total_acoes bigint, usuarios_unicos bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM created_at)::INTEGER as hora,
    COUNT(*)::BIGINT as total_acoes,
    COUNT(DISTINCT user_id)::BIGINT as usuarios_unicos
  FROM public.user_activity
  WHERE created_at BETWEEN p_data_inicio AND p_data_fim
  GROUP BY EXTRACT(HOUR FROM created_at)
  ORDER BY hora;
END;
$function$
;

-- Optimizing: distribuicao_por_aba
CREATE OR REPLACE FUNCTION public.distribuicao_por_aba(p_data_inicio timestamp with time zone DEFAULT (now() - '24:00:00'::interval), p_data_fim timestamp with time zone DEFAULT now())
 RETURNS TABLE(tab_name text, total_acoes bigint, usuarios_unicos bigint, percentual numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
DECLARE
  v_total_acoes BIGINT;
BEGIN
  -- Calcular total de ações
  SELECT COUNT(*) INTO v_total_acoes
  FROM public.user_activity
  WHERE created_at BETWEEN p_data_inicio AND p_data_fim
    AND user_activity.tab_name IS NOT NULL;
  
  RETURN QUERY
  SELECT 
    ua.tab_name::TEXT,
    COUNT(*)::BIGINT as total_acoes,
    COUNT(DISTINCT ua.user_id)::BIGINT as usuarios_unicos,
    CASE 
      WHEN v_total_acoes > 0 
      THEN ROUND((COUNT(*)::NUMERIC / v_total_acoes::NUMERIC * 100), 2)
      ELSE 0
    END as percentual
  FROM public.user_activity ua
  WHERE ua.created_at BETWEEN p_data_inicio AND p_data_fim
    AND ua.tab_name IS NOT NULL
  GROUP BY ua.tab_name
  ORDER BY total_acoes DESC;
END;
$function$
;

-- Optimizing: estatisticas_atividade_periodo
CREATE OR REPLACE FUNCTION public.estatisticas_atividade_periodo(p_data_inicio timestamp with time zone DEFAULT (now() - '24:00:00'::interval), p_data_fim timestamp with time zone DEFAULT now())
 RETURNS TABLE(total_acoes bigint, usuarios_unicos bigint, acoes_por_hora numeric, aba_mais_usada text, pico_atividade timestamp with time zone, periodo_mais_ativo text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
DECLARE
  v_total_acoes BIGINT;
  v_usuarios_unicos BIGINT;
  v_acoes_por_hora NUMERIC;
  v_aba_mais_usada TEXT;
  v_pico_atividade TIMESTAMPTZ;
  v_periodo_mais_ativo TEXT;
BEGIN
  -- Total de ações
  SELECT COUNT(*) INTO v_total_acoes
  FROM public.user_activity
  WHERE created_at BETWEEN p_data_inicio AND p_data_fim;
  
  -- Usuários únicos
  SELECT COUNT(DISTINCT user_id) INTO v_usuarios_unicos
  FROM public.user_activity
  WHERE created_at BETWEEN p_data_inicio AND p_data_fim;
  
  -- Ações por hora
  SELECT 
    CASE 
      WHEN EXTRACT(EPOCH FROM (p_data_fim - p_data_inicio)) / 3600 > 0 
      THEN ROUND(v_total_acoes::NUMERIC / (EXTRACT(EPOCH FROM (p_data_fim - p_data_inicio)) / 3600), 2)
      ELSE 0
    END INTO v_acoes_por_hora;
  
  -- Aba mais usada
  SELECT tab_name INTO v_aba_mais_usada
  FROM (
    SELECT tab_name, COUNT(*) as cnt
    FROM public.user_activity
    WHERE created_at BETWEEN p_data_inicio AND p_data_fim
      AND tab_name IS NOT NULL
    GROUP BY tab_name
    ORDER BY cnt DESC
    LIMIT 1
  ) subq;
  
  -- Pico de atividade (hora com mais ações)
  SELECT created_at INTO v_pico_atividade
  FROM (
    SELECT 
      DATE_TRUNC('hour', created_at) as created_at,
      COUNT(*) as cnt
    FROM public.user_activity
    WHERE created_at BETWEEN p_data_inicio AND p_data_fim
    GROUP BY DATE_TRUNC('hour', created_at)
    ORDER BY cnt DESC
    LIMIT 1
  ) subq;
  
  -- Período mais ativo (manhã, tarde, noite)
  SELECT 
    CASE 
      WHEN EXTRACT(HOUR FROM created_at) BETWEEN 6 AND 11 THEN 'Manhã'
      WHEN EXTRACT(HOUR FROM created_at) BETWEEN 12 AND 17 THEN 'Tarde'
      WHEN EXTRACT(HOUR FROM created_at) BETWEEN 18 AND 23 THEN 'Noite'
      ELSE 'Madrugada'
    END INTO v_periodo_mais_ativo
  FROM (
    SELECT created_at,
      CASE 
        WHEN EXTRACT(HOUR FROM created_at) BETWEEN 6 AND 11 THEN 'Manhã'
        WHEN EXTRACT(HOUR FROM created_at) BETWEEN 12 AND 17 THEN 'Tarde'
        WHEN EXTRACT(HOUR FROM created_at) BETWEEN 18 AND 23 THEN 'Noite'
        ELSE 'Madrugada'
      END as periodo,
      COUNT(*) OVER (PARTITION BY 
        CASE 
          WHEN EXTRACT(HOUR FROM created_at) BETWEEN 6 AND 11 THEN 'Manhã'
          WHEN EXTRACT(HOUR FROM created_at) BETWEEN 12 AND 17 THEN 'Tarde'
          WHEN EXTRACT(HOUR FROM created_at) BETWEEN 18 AND 23 THEN 'Noite'
          ELSE 'Madrugada'
        END
      ) as cnt
    FROM public.user_activity
    WHERE created_at BETWEEN p_data_inicio AND p_data_fim
    ORDER BY cnt DESC
    LIMIT 1
  ) subq;
  
  RETURN QUERY SELECT 
    v_total_acoes,
    v_usuarios_unicos,
    v_acoes_por_hora,
    v_aba_mais_usada,
    v_pico_atividade,
    v_periodo_mais_ativo;
END;
$function$
;

-- Optimizing: get_active_weeks_for_year
CREATE OR REPLACE FUNCTION public.get_active_weeks_for_year(year_input integer)
 RETURNS TABLE(data_do_periodo date)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
  SELECT DISTINCT data_do_periodo
  FROM dados_corridas
  WHERE EXTRACT(YEAR FROM data_do_periodo) = year_input
  ORDER BY data_do_periodo DESC;
$function$
;

-- Optimizing: get_admin_stats
CREATE OR REPLACE FUNCTION public.get_admin_stats()
 RETURNS TABLE(total_users integer, pending_users integer, approved_users integer, admin_users integer, total_pracas integer)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
BEGIN
    RETURN QUERY
    WITH user_stats AS (
        SELECT 
            COUNT(*)::INTEGER as total,
            COUNT(CASE WHEN NOT is_approved THEN 1 END)::INTEGER as pending,
            COUNT(CASE WHEN is_approved THEN 1 END)::INTEGER as approved,
            COUNT(CASE WHEN is_admin THEN 1 END)::INTEGER as admins
        FROM public.user_profiles
    ),
    praca_stats AS (
        SELECT COUNT(DISTINCT praca)::INTEGER as pracas
        FROM public.mv_aderencia_agregada
        WHERE praca IS NOT NULL AND praca != ''
    )
    SELECT 
        u.total,
        u.pending,
        u.approved,
        u.admins,
        COALESCE(p.pracas, 0)
    FROM user_stats u
    CROSS JOIN praca_stats p;
END;
$function$
;

-- Optimizing: get_city_last_updates
CREATE OR REPLACE FUNCTION public.get_city_last_updates(p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(city text, last_update_date text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
STABLE
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
$function$
;

-- Optimizing: get_current_user_profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
  v_user_id uuid;
  v_profile json;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', id,
    'email', email,
    'full_name', full_name,
    'role', role,
    'is_admin', (role IN ('admin', 'master')),
    'is_approved', is_approved,
    'organization_id', organization_id,
    'assigned_pracas', assigned_pracas
  ) INTO v_profile
  FROM public.user_profiles
  WHERE id = v_user_id;

  RETURN v_profile;
END;
$function$
;

-- Optimizing: get_entregadores_details
CREATE OR REPLACE FUNCTION public.get_entregadores_details(p_organization_id uuid DEFAULT NULL::uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_tipo text DEFAULT 'ALL'::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_search text DEFAULT NULL::text, p_praca text DEFAULT NULL::text)
 RETURNS TABLE(id_entregador text, nome text, regiao_atuacao text, total_segundos bigint, total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
    v_tipo text;
    v_praca text;
BEGIN
    -- Sanitize inputs
    v_tipo := UPPER(TRIM(p_tipo));
    v_praca := NULLIF(NULLIF(NULLIF(p_praca, 'null'), 'undefined'), '');

    RETURN QUERY
    WITH active_drivers_activity AS (
        SELECT 
            dc.id_da_pessoa_entregadora as id_entregador,
            MAX(dc.pessoa_entregadora) as nome_corrida,
            COALESCE(SUM(dc.tempo_disponivel_absoluto_segundos), 0) as total_segundos,
            COALESCE(SUM(dc.numero_de_corridas_ofertadas), 0) as total_ofertadas,
            COALESCE(SUM(dc.numero_de_corridas_aceitas), 0) as total_aceitas,
            COALESCE(SUM(dc.numero_de_corridas_completadas), 0) as total_completadas,
            COALESCE(SUM(dc.numero_de_corridas_rejeitadas), 0) as total_rejeitadas
        FROM dados_corridas dc
        WHERE (p_organization_id IS NULL OR dc.organization_id = p_organization_id)
        AND (p_start_date IS NULL OR dc.data_do_periodo >= p_start_date)
        AND (p_end_date IS NULL OR dc.data_do_periodo <= p_end_date)
        -- ADD PRACA FILTER
        AND (v_praca IS NULL OR UPPER(TRIM(dc.praca)) = UPPER(TRIM(v_praca)))
        GROUP BY dc.id_da_pessoa_entregadora
    ),
    marketing_ids AS (
        SELECT DISTINCT dmkt.id_entregador 
        FROM dados_marketing dmkt
        WHERE (p_organization_id IS NULL OR dmkt.organization_id = p_organization_id)
        AND dmkt.id_entregador IS NOT NULL
        AND dmkt.data_liberacao IS NOT NULL
    ),
    driver_metadata AS (
        SELECT DISTINCT ON (dmkt.id_entregador) 
            dmkt.id_entregador, 
            dmkt.nome, 
            dmkt.regiao_atuacao 
        FROM dados_marketing dmkt
        WHERE (p_organization_id IS NULL OR dmkt.organization_id = p_organization_id)
        ORDER BY dmkt.id_entregador, dmkt.rodou_dia DESC
    ),
    enriched_drivers AS (
        SELECT 
            ada.id_entregador,
            COALESCE(dm.nome, ada.nome_corrida, 'Desconhecido') as nome,
            COALESCE(dm.regiao_atuacao, '-') as regiao_atuacao,
            ada.total_segundos,
            ada.total_ofertadas,
            ada.total_aceitas,
            ada.total_completadas,
            ada.total_rejeitadas
        FROM active_drivers_activity ada
        LEFT JOIN driver_metadata dm ON ada.id_entregador = dm.id_entregador
    ),
    filtered_final AS (
        SELECT 
            ed.id_entregador,
            ed.nome,
            ed.regiao_atuacao,
            ed.total_segundos,
            ed.total_ofertadas,
            ed.total_aceitas,
            ed.total_completadas,
            ed.total_rejeitadas
        FROM enriched_drivers ed
        WHERE
            (p_search IS NULL OR ed.nome ILIKE '%' || p_search || '%' OR ed.id_entregador ILIKE '%' || p_search || '%')
            AND
            CASE
                WHEN v_tipo = 'MARKETING' THEN EXISTS (SELECT 1 FROM marketing_ids mkt WHERE mkt.id_entregador = ed.id_entregador)
                WHEN v_tipo = 'OPERATIONAL' THEN NOT EXISTS (SELECT 1 FROM marketing_ids mkt WHERE mkt.id_entregador = ed.id_entregador)
                ELSE TRUE
            END
    ),
    total_rows AS (
        SELECT COUNT(*) as cnt FROM filtered_final
    )
    SELECT
        ff.id_entregador::text,
        ff.nome::text,
        ff.regiao_atuacao::text,
        ff.total_segundos::bigint,
        ff.total_ofertadas::bigint,
        ff.total_aceitas::bigint,
        ff.total_completadas::bigint,
        ff.total_rejeitadas::bigint,
        tr.cnt::bigint
    FROM filtered_final ff
    CROSS JOIN total_rows tr
    ORDER BY ff.total_segundos DESC, ff.nome
    LIMIT p_limit
    OFFSET p_offset;
END;
$function$
;

-- Optimizing: get_entregadores_details
CREATE OR REPLACE FUNCTION public.get_entregadores_details(p_organization_id uuid DEFAULT NULL::uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_tipo text DEFAULT 'ALL'::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_search text DEFAULT NULL::text)
 RETURNS TABLE(id_entregador text, nome text, regiao_atuacao text, total_segundos bigint, total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
    v_tipo text;
BEGIN
    -- Sanitize inputs
    v_tipo := UPPER(TRIM(p_tipo));

    RETURN QUERY
    WITH active_drivers_activity AS (
        SELECT 
            dc.id_da_pessoa_entregadora as id_entregador,
            MAX(dc.pessoa_entregadora) as nome_corrida,
            -- MATCH SUMMARY LOGIC: Use absolute seconds, not scaled
            COALESCE(SUM(dc.tempo_disponivel_absoluto_segundos), 0) as total_segundos,
            COALESCE(SUM(dc.numero_de_corridas_ofertadas), 0) as total_ofertadas,
            COALESCE(SUM(dc.numero_de_corridas_aceitas), 0) as total_aceitas,
            COALESCE(SUM(dc.numero_de_corridas_completadas), 0) as total_completadas,
            COALESCE(SUM(dc.numero_de_corridas_rejeitadas), 0) as total_rejeitadas
        FROM dados_corridas dc
        WHERE (p_organization_id IS NULL OR dc.organization_id = p_organization_id)
        AND (p_start_date IS NULL OR dc.data_do_periodo >= p_start_date)
        AND (p_end_date IS NULL OR dc.data_do_periodo <= p_end_date)
        GROUP BY dc.id_da_pessoa_entregadora
    ),
    marketing_ids AS (
        -- MATCH SUMMARY LOGIC: Use dados_marketing with data_liberacao check
        SELECT DISTINCT dmkt.id_entregador 
        FROM dados_marketing dmkt
        WHERE (p_organization_id IS NULL OR dmkt.organization_id = p_organization_id)
        AND dmkt.id_entregador IS NOT NULL
        AND dmkt.data_liberacao IS NOT NULL
    ),
    driver_metadata AS (
        SELECT DISTINCT ON (dmkt.id_entregador) 
            dmkt.id_entregador, 
            dmkt.nome, 
            dmkt.regiao_atuacao 
        FROM dados_marketing dmkt
        WHERE (p_organization_id IS NULL OR dmkt.organization_id = p_organization_id)
        ORDER BY dmkt.id_entregador, dmkt.rodou_dia DESC
    ),
    enriched_drivers AS (
        SELECT 
            ada.id_entregador,
            COALESCE(dm.nome, ada.nome_corrida, 'Desconhecido') as nome,
            COALESCE(dm.regiao_atuacao, '-') as regiao_atuacao,
            ada.total_segundos,
            ada.total_ofertadas,
            ada.total_aceitas,
            ada.total_completadas,
            ada.total_rejeitadas
        FROM active_drivers_activity ada
        LEFT JOIN driver_metadata dm ON ada.id_entregador = dm.id_entregador
    ),
    filtered_final AS (
        SELECT 
            ed.id_entregador,
            ed.nome,
            ed.regiao_atuacao,
            ed.total_segundos,
            ed.total_ofertadas,
            ed.total_aceitas,
            ed.total_completadas,
            ed.total_rejeitadas
        FROM enriched_drivers ed
        WHERE
            (p_search IS NULL OR ed.nome ILIKE '%' || p_search || '%' OR ed.id_entregador ILIKE '%' || p_search || '%')
            AND
            CASE
                WHEN v_tipo = 'MARKETING' THEN EXISTS (SELECT 1 FROM marketing_ids mkt WHERE mkt.id_entregador = ed.id_entregador)
                WHEN v_tipo = 'OPERATIONAL' THEN NOT EXISTS (SELECT 1 FROM marketing_ids mkt WHERE mkt.id_entregador = ed.id_entregador)
                ELSE TRUE
            END
    ),
    total_rows AS (
        SELECT COUNT(*) as cnt FROM filtered_final
    )
    SELECT
        ff.id_entregador::text,
        ff.nome::text,
        ff.regiao_atuacao::text,
        ff.total_segundos::bigint,
        ff.total_ofertadas::bigint,
        ff.total_aceitas::bigint,
        ff.total_completadas::bigint,
        ff.total_rejeitadas::bigint,
        tr.cnt::bigint
    FROM filtered_final ff
    CROSS JOIN total_rows tr
    ORDER BY ff.total_segundos DESC, ff.nome
    LIMIT p_limit
    OFFSET p_offset;
END;
$function$
;

-- Optimizing: get_entregadores_marketing
CREATE OR REPLACE FUNCTION public.get_entregadores_marketing(p_organization_id uuid DEFAULT NULL::uuid, rodou_dia_inicial date DEFAULT NULL::date, rodou_dia_final date DEFAULT NULL::date, data_inicio_inicial date DEFAULT NULL::date, data_inicio_final date DEFAULT NULL::date, cidade text DEFAULT NULL::text)
 RETURNS TABLE(id_entregador text, nome text, total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, total_segundos bigint, ultima_data text, dias_sem_rodar integer, regiao_atuacao text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
STABLE
AS $function$
BEGIN
    -- Se houver filtro de data de início/fim das corridas, precisamos agregar dados_corridas dinamicamente
    IF data_inicio_inicial IS NOT NULL OR data_inicio_final IS NOT NULL THEN
        RETURN QUERY
        WITH entregadores_filtrados AS (
            SELECT 
                mv.id_entregador, 
                mv.nome, 
                mv.regiao_atuacao,
                mv.ultima_data as mv_ultima_data
            FROM public.mv_entregadores_marketing mv
            WHERE (p_organization_id IS NULL OR mv.organization_id = p_organization_id)
              AND (cidade IS NULL OR UPPER(mv.regiao_atuacao) = UPPER(cidade))
              AND (
                  (rodou_dia_inicial IS NULL AND rodou_dia_final IS NULL)
                  OR EXISTS (
                      SELECT 1 FROM public.dados_marketing dm
                      WHERE dm.id_entregador = mv.id_entregador
                        AND (p_organization_id IS NULL OR dm.organization_id = p_organization_id)
                        AND (rodou_dia_inicial IS NULL OR dm.rodou_dia >= rodou_dia_inicial)
                        AND (rodou_dia_final IS NULL OR dm.rodou_dia <= rodou_dia_final)
                  )
              )
        ),
        stats_dinamicas AS (
            SELECT
                dc.id_da_pessoa_entregadora,
                SUM(COALESCE(dc.numero_de_corridas_ofertadas, 0))::bigint as oferta,
                SUM(COALESCE(dc.numero_de_corridas_aceitas, 0))::bigint as aceite,
                SUM(COALESCE(dc.numero_de_corridas_completadas, 0))::bigint as completa,
                SUM(COALESCE(dc.numero_de_corridas_rejeitadas, 0))::bigint as rejeitada,
                SUM(COALESCE(dc.tempo_disponivel_absoluto_segundos, 0))::bigint as segundos,
                MAX(dc.data_do_periodo) as max_data
            FROM public.dados_corridas dc
            WHERE dc.id_da_pessoa_entregadora IN (SELECT ef.id_entregador FROM entregadores_filtrados ef)
              AND (p_organization_id IS NULL OR dc.organization_id = p_organization_id)
              AND (data_inicio_inicial IS NULL OR dc.data_do_periodo >= data_inicio_inicial)
              AND (data_inicio_final IS NULL OR dc.data_do_periodo <= data_inicio_final)
            GROUP BY dc.id_da_pessoa_entregadora
        )
        SELECT
            ef.id_entregador,
            ef.nome,
            COALESCE(sd.oferta, 0),
            COALESCE(sd.aceite, 0),
            COALESCE(sd.completa, 0),
            COALESCE(sd.rejeitada, 0),
            COALESCE(sd.segundos, 0),
            -- Usa a maior data entre a MV (geral) e a filtrada, ou apenas a filtrada se preferir
            -- Aqui vamos retornar a ultima data DESTE PERIODO filtrado
            COALESCE(sd.max_data::TEXT, NULL),
            CASE 
                WHEN sd.max_data IS NOT NULL THEN (CURRENT_DATE - sd.max_data)::INT
                ELSE NULL 
            END,
            ef.regiao_atuacao
        FROM entregadores_filtrados ef
        LEFT JOIN stats_dinamicas sd ON ef.id_entregador = sd.id_da_pessoa_entregadora;
    
    ELSE
        -- Sem filtro de data nas corridas, usa a MV direto (muito mais rápido)
        RETURN QUERY
        SELECT
            mv.id_entregador,
            mv.nome,
            mv.total_ofertadas,
            mv.total_aceitas,
            mv.total_completadas,
            mv.total_rejeitadas,
            mv.total_segundos,
            mv.ultima_data::TEXT,
            CASE 
                WHEN mv.ultima_data IS NOT NULL THEN (CURRENT_DATE - mv.ultima_data)::INT
                ELSE NULL 
            END,
            mv.regiao_atuacao
        FROM public.mv_entregadores_marketing mv
        WHERE (p_organization_id IS NULL OR mv.organization_id = p_organization_id)
          AND (cidade IS NULL OR UPPER(mv.regiao_atuacao) = UPPER(cidade))
          AND (
              (rodou_dia_inicial IS NULL AND rodou_dia_final IS NULL)
              OR EXISTS (
                  SELECT 1 FROM public.dados_marketing dm
                  WHERE dm.id_entregador = mv.id_entregador
                    AND (p_organization_id IS NULL OR dm.organization_id = p_organization_id)
                    AND (rodou_dia_inicial IS NULL OR dm.rodou_dia >= rodou_dia_inicial)
                    AND (rodou_dia_final IS NULL OR dm.rodou_dia <= rodou_dia_final)
              )
          );
    END IF;
END;
$function$
;

-- Optimizing: get_fluxo_semanal
CREATE OR REPLACE FUNCTION public.get_fluxo_semanal(p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id uuid DEFAULT NULL::uuid, p_praca text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
    v_start_date date;
    v_end_date date;
    v_org_uuid uuid;
    v_result json;
    v_max_last_active_week date;
BEGIN
    v_start_date := COALESCE(p_data_inicial, date_trunc('year', CURRENT_DATE)::date);
    v_end_date := COALESCE(p_data_final, CURRENT_DATE);
    v_org_uuid := COALESCE(p_organization_id, '00000000-0000-0000-0000-000000000001'::uuid);

    -- Get max active week globally to determine churn threshold
    SELECT MAX(last_active_week) INTO v_max_last_active_week FROM mv_entregadores_summary;

    WITH 
    weeks AS (
        SELECT to_char(d, 'IYYY-"W"IW') as semana_iso,
               d as week_date
        FROM generate_series(
            date_trunc('week', v_start_date),
            date_trunc('week', v_end_date),
            '1 week'::interval
        ) d
    ),
    
    -- Step 1: Get weekly rides per driver (for Entradas/Saidas)
    driver_weekly_rides AS (
        SELECT 
            id_entregador,
            to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW') as week_date,
            SUM(corridas_completadas) as weekly_rides,
            max(nome_entregador) as nome,
            -- Check is_marketing (global property of the driver)
            COALESCE(bool_or(EXISTS (
                SELECT 1 
                FROM dados_marketing dm 
                WHERE dm.id_entregador = mv_corridas_agregadas.id_entregador 
                  AND dm.organization_id = mv_corridas_agregadas.organization_id
            )), false) AS is_marketing
        FROM mv_corridas_agregadas
        WHERE organization_id = v_org_uuid
          AND (p_praca IS NULL OR praca = p_praca)
        GROUP BY id_entregador, to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW')
    ),

    -- Step 2: Compute cumulative rides per driver over time
    driver_cumulative AS (
        SELECT 
            id_entregador,
            week_date,
            weekly_rides,
            nome,
            is_marketing,
            SUM(weekly_rides) OVER (
                PARTITION BY id_entregador 
                ORDER BY week_date
            ) as cumulative_rides
        FROM driver_weekly_rides
    ),

    -- Step 3: Find activation week = first week where cumulative >= 30
    activation_weeks AS (
        SELECT DISTINCT ON (id_entregador)
            id_entregador,
            week_date as activation_week
        FROM driver_cumulative
        WHERE cumulative_rides >= 30
        ORDER BY id_entregador, week_date
    ),

    -- Step 4: Build filtered_summary using activation_weeks
    filtered_summary AS (
        SELECT 
            dwr.id_entregador,
            aw.activation_week,
            max(dwr.week_date) as last_active_week,
            SUM(dwr.weekly_rides)::bigint as total_rides,
            bool_or(dwr.is_marketing) AS is_marketing,
            max(dwr.nome) as nome
        FROM driver_weekly_rides dwr
        LEFT JOIN activation_weeks aw ON dwr.id_entregador = aw.id_entregador
        GROUP BY dwr.id_entregador, aw.activation_week
    ),
    
    entradas_grouped AS (
        SELECT 
            to_char(activation_week, 'IYYY-"W"IW') as semana_iso,
            COUNT(*) FILTER (WHERE is_marketing) as qtd_mkt,
            COUNT(*) FILTER (WHERE NOT is_marketing) as qtd_ops,
            array_agg(nome) FILTER (WHERE is_marketing) as nomes_mkt,
            array_agg(nome) FILTER (WHERE NOT is_marketing) as nomes_ops
        FROM filtered_summary
        WHERE activation_week IS NOT NULL
          AND activation_week >= v_start_date
          AND activation_week <= v_end_date
        GROUP BY 1
    ),
    
    saidas_grouped AS (
        SELECT 
            to_char(last_active_week, 'IYYY-"W"IW') as semana_iso,
            COUNT(*) FILTER (WHERE is_marketing) as qtd_mkt_matured,
            COUNT(*) FILTER (WHERE NOT is_marketing) as qtd_ops_matured,
            -- "Novice" churn: less than 30 rides
            COUNT(*) FILTER (WHERE is_marketing AND total_rides < 30) as qtd_mkt_novice,
            COUNT(*) FILTER (WHERE NOT is_marketing AND total_rides < 30) as qtd_ops_novice,
            array_agg(nome) FILTER (WHERE is_marketing) as nomes_mkt_matured,
            array_agg(nome) FILTER (WHERE NOT is_marketing) as nomes_ops_matured,
            array_agg(nome) FILTER (WHERE is_marketing AND total_rides < 30) as nomes_mkt_novice,
            array_agg(nome) FILTER (WHERE NOT is_marketing AND total_rides < 30) as nomes_ops_novice
        FROM filtered_summary
        WHERE last_active_week >= v_start_date
          AND last_active_week <= v_end_date
          AND last_active_week < v_max_last_active_week
        GROUP BY 1
    ),

    -- Retomada with LAG (fast)
    mv_weeks_ordered AS (
       SELECT 
          id_entregador, 
          to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW') as week_start_date,
          LAG(to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW')) 
              OVER (PARTITION BY id_entregador ORDER BY to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW')) as prev_week_date
       FROM mv_corridas_agregadas
       WHERE organization_id = v_org_uuid
         AND (p_praca IS NULL OR praca = p_praca)
    ),
    retomada_raw AS (
       SELECT 
           mw.week_start_date,
           mw.id_entregador,
           mw.prev_week_date as origin_date
       FROM mv_weeks_ordered mw
       WHERE mw.week_start_date >= v_start_date
         AND mw.week_start_date <= v_end_date
         AND (mw.prev_week_date IS NULL OR mw.prev_week_date < (mw.week_start_date - interval '1 week'))
         AND EXISTS (
             SELECT 1 FROM filtered_summary s 
             WHERE s.id_entregador = mw.id_entregador 
               AND s.activation_week IS NOT NULL
               AND s.activation_week < mw.week_start_date
         )
    ),
    retomada_breakdown AS (
        SELECT 
            to_char(r.week_start_date, 'IYYY-"W"IW') as semana_iso,
            to_char(r.origin_date, 'IYYY-"W"IW') as origin_week,
            COUNT(*) as qtd
        FROM retomada_raw r
        WHERE r.origin_date IS NOT NULL
        GROUP BY 1, 2
    ),
    retomada_grouped AS (
       SELECT 
           to_char(r.week_start_date, 'IYYY-"W"IW') as semana_iso,
           COUNT(*) FILTER (WHERE e.is_marketing) as qtd_mkt,
           COUNT(*) FILTER (WHERE NOT e.is_marketing) as qtd_ops,
           array_agg(e.nome) FILTER (WHERE e.is_marketing) as nomes_mkt,
           array_agg(e.nome) FILTER (WHERE NOT e.is_marketing) as nomes_ops
       FROM retomada_raw r
       JOIN filtered_summary e ON r.id_entregador = e.id_entregador
       GROUP BY 1
    ),
    retomada_json AS (
        SELECT
            semana_iso,
            jsonb_object_agg(origin_week, qtd) as origin_json
        FROM retomada_breakdown
        GROUP BY 1
    ),

    -- BASE ATIVA: distinct drivers per week (Filtered by Praca + Rides > 0)
    base_ativa_raw AS (
        SELECT 
            to_char(to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW'), 'IYYY-"W"IW') as semana_iso,
            COUNT(DISTINCT id_entregador) as base_ativa
        FROM mv_corridas_agregadas
        WHERE organization_id = v_org_uuid
          AND (p_praca IS NULL OR praca = p_praca)
          AND to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW') >= v_start_date
          AND to_date(ano_iso || lpad(semana_numero, 2, '0'), 'IYYYIW') <= v_end_date
          AND corridas_completadas > 0
        GROUP BY 1
    ),

    result AS (
        SELECT 
            w.semana_iso as semana,
            (COALESCE(e.qtd_mkt, 0) + COALESCE(e.qtd_ops, 0))::bigint as entradas_total,
            COALESCE(e.qtd_mkt, 0)::bigint as entradas_mkt_count,
            COALESCE(e.nomes_mkt, ARRAY[]::text[]) as nomes_entradas_mkt,
            COALESCE(e.nomes_ops, ARRAY[]::text[]) as nomes_entradas_ops,
            (COALESCE(s.qtd_mkt_matured, 0) + COALESCE(s.qtd_ops_matured, 0))::bigint as saidas_total,
            COALESCE(s.qtd_mkt_matured, 0)::bigint as saidas_mkt_count,
            COALESCE(s.nomes_mkt_matured, ARRAY[]::text[]) as nomes_saidas_mkt,
            COALESCE(s.nomes_ops_matured, ARRAY[]::text[]) as nomes_saidas_ops,
            (COALESCE(s.qtd_mkt_novice, 0) + COALESCE(s.qtd_ops_novice, 0))::bigint as saidas_novos_total,
            COALESCE(s.nomes_mkt_novice, ARRAY[]::text[]) as nomes_saidas_novos_mkt,
            COALESCE(s.nomes_ops_novice, ARRAY[]::text[]) as nomes_saidas_ops,
            (COALESCE(r.qtd_mkt, 0) + COALESCE(r.qtd_ops, 0))::bigint as retomada_total,
            COALESCE(r.qtd_mkt, 0)::bigint as retomada_mkt_count,
            COALESCE(r.nomes_mkt, ARRAY[]::text[]) as nomes_retomada_mkt,
            COALESCE(r.nomes_ops, ARRAY[]::text[]) as nomes_retomada_ops,
            COALESCE(rj.origin_json, '{}'::jsonb) as retomada_origins,
            -- SALDO: Entradas - Saidas (SEM Retomada)
            ((COALESCE(e.qtd_mkt, 0) + COALESCE(e.qtd_ops, 0)) - 
             (COALESCE(s.qtd_mkt_matured, 0) + COALESCE(s.qtd_ops_matured, 0)))::bigint as saldo,
            -- BASE ATIVA
            COALESCE(ba.base_ativa, 0)::bigint as base_ativa,
            -- VARIACAO DA BASE (delta vs previous week via window function)
            (COALESCE(ba.base_ativa, 0) - COALESCE(
                LAG(ba.base_ativa) OVER (ORDER BY w.semana_iso), 
                ba.base_ativa
            ))::bigint as variacao_base
        FROM weeks w
        LEFT JOIN entradas_grouped e ON w.semana_iso = e.semana_iso
        LEFT JOIN saidas_grouped s ON w.semana_iso = s.semana_iso
        LEFT JOIN retomada_grouped r ON w.semana_iso = r.semana_iso
        LEFT JOIN retomada_json rj ON r.semana_iso = rj.semana_iso
        LEFT JOIN base_ativa_raw ba ON w.semana_iso = ba.semana_iso
        ORDER BY w.semana_iso
    )
    SELECT json_agg(row_to_json(result)) INTO v_result FROM result;
    RETURN COALESCE(v_result, '[]'::json);
END;
$function$
;

-- Optimizing: get_gamification_leaderboard
CREATE OR REPLACE FUNCTION public.get_gamification_leaderboard()
 RETURNS TABLE(rank bigint, user_name text, avatar_url text, pracas text, total_badges bigint, badges_list jsonb, current_streak integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        RANK() OVER (ORDER BY COUNT(ub.badge_slug) DESC, s.login_streak DESC) as rank,
        COALESCE(p.full_name, split_part(u.email, '@', 1)) as user_name,
        p.avatar_url,
        CASE 
            WHEN p.is_admin = true OR p.role = 'admin' THEN 'Todas'
            WHEN p.assigned_pracas IS NULL OR jsonb_array_length(to_jsonb(p.assigned_pracas)) = 0 THEN 'Sem Acesso'
            ELSE (
                SELECT string_agg(value, ', ')
                FROM jsonb_array_elements_text(to_jsonb(p.assigned_pracas))
            )
        END as pracas,
        COUNT(ub.badge_slug) as total_badges,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'slug', b.slug,
                    'icon', b.icon,
                    'name', b.name,
                    'description', b.description,
                    'category', b.category
                )
            ) FILTER (WHERE b.slug IS NOT NULL),
            '[]'::jsonb
        ) as badges_list,
        COALESCE(s.login_streak, 0) as current_streak
    FROM auth.users u
    JOIN public.user_profiles p ON p.id = u.id
    LEFT JOIN public.gamification_user_stats s ON s.user_id = u.id
    LEFT JOIN public.gamification_user_badges ub ON ub.user_id = u.id
    LEFT JOIN public.gamification_badges b ON ub.badge_slug = b.slug
    GROUP BY u.id, p.id, s.login_streak
    ORDER BY total_badges DESC, current_streak DESC;
END;
$function$
;

-- Optimizing: get_marketing_cities_data
CREATE OR REPLACE FUNCTION public.get_marketing_cities_data(data_envio_inicial text DEFAULT NULL::text, data_envio_final text DEFAULT NULL::text, data_liberacao_inicial text DEFAULT NULL::text, data_liberacao_final text DEFAULT NULL::text, rodou_dia_inicial text DEFAULT NULL::text, rodou_dia_final text DEFAULT NULL::text, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(cidade text, enviado bigint, liberado bigint, rodando_inicio bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
    v_org_uuid uuid;
BEGIN
    -- Safe cast with Fallback
    BEGIN
        v_org_uuid := p_organization_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_org_uuid := NULL; -- Default to NULL if invalid (or specific ID if preferred)
    END;

    RETURN QUERY
    WITH normalized_data AS (
        SELECT 
            -- Apply the split logic for ABC 2.0
            CASE 
                WHEN regiao_atuacao = 'ABC 2.0' AND sub_praca_abc IN ('Vila Aquino', 'São Caetano') THEN 'Santo André'
                WHEN regiao_atuacao = 'ABC 2.0' AND sub_praca_abc IN ('Diadema', 'Nova petrópolis', 'Rudge Ramos') THEN 'São Bernardo'
                ELSE regiao_atuacao
            END as cidade_nome,
            data_envio,
            data_liberacao,
            rodou_dia,
            organization_id
        FROM public.dados_marketing
    )
    SELECT 
        nd.cidade_nome as cidade,
        COUNT(CASE WHEN nd.data_envio IS NOT NULL 
            AND (data_envio_inicial IS NULL OR nd.data_envio >= data_envio_inicial::date)
            AND (data_envio_final IS NULL OR nd.data_envio <= data_envio_final::date)
            THEN 1 END)::bigint as enviado,
        COUNT(CASE WHEN nd.data_liberacao IS NOT NULL 
            AND (data_liberacao_inicial IS NULL OR nd.data_liberacao >= data_liberacao_inicial::date)
            AND (data_liberacao_final IS NULL OR nd.data_liberacao <= data_liberacao_final::date)
            THEN 1 END)::bigint as liberado,
        COUNT(CASE WHEN nd.rodou_dia IS NOT NULL 
            AND (rodou_dia_inicial IS NULL OR nd.rodou_dia >= rodou_dia_inicial::date)
            AND (rodou_dia_final IS NULL OR nd.rodou_dia <= rodou_dia_final::date)
            THEN 1 END)::bigint as rodando_inicio
    FROM normalized_data nd
    WHERE (v_org_uuid IS NULL OR nd.organization_id = v_org_uuid)
    GROUP BY nd.cidade_nome;
END;
$function$
;

-- Optimizing: get_marketing_comparison_weekly
CREATE OR REPLACE FUNCTION public.get_marketing_comparison_weekly(data_inicial date DEFAULT CURRENT_DATE, data_final date DEFAULT CURRENT_DATE, p_organization_id uuid DEFAULT NULL::uuid, p_praca text DEFAULT NULL::text)
 RETURNS TABLE(semana_iso text, segundos_ops bigint, segundos_mkt bigint, ofertadas_ops bigint, ofertadas_mkt bigint, aceitas_ops bigint, aceitas_mkt bigint, concluidas_ops bigint, concluidas_mkt bigint, rejeitadas_ops bigint, rejeitadas_mkt bigint, valor_ops numeric, valor_mkt numeric, entregadores_ops bigint, entregadores_mkt bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
    v_praca text;
BEGIN
    v_praca := NULLIF(NULLIF(NULLIF(p_praca, 'null'), 'undefined'), '');
    
    IF v_praca IS NOT NULL THEN
        v_praca := UPPER(TRIM(v_praca));
    END IF;

    RETURN QUERY
    WITH marketing_ids AS (
        SELECT DISTINCT id_entregador
        FROM public.dados_marketing
        WHERE (p_organization_id IS NULL OR organization_id = p_organization_id)
          AND id_entregador IS NOT NULL
          AND data_liberacao IS NOT NULL 
    ),
    daily_data AS (
        SELECT
            to_char(dc.data_do_periodo, 'IYYY-"W"IW') as semana,
            CASE 
                WHEN m.id_entregador IS NOT NULL THEN true
                ELSE false
            END as is_mkt,
            COALESCE(dc.tempo_disponivel_absoluto_segundos, 0) as segundos,
            COALESCE(dc.numero_de_corridas_ofertadas, 0) as ofertadas,
            COALESCE(dc.numero_de_corridas_aceitas, 0) as aceitas,
            COALESCE(dc.numero_de_corridas_completadas, 0) as concluidas,
            COALESCE(dc.numero_de_corridas_rejeitadas, 0) as rejeitadas,
            COALESCE(dc.soma_das_taxas_das_corridas_aceitas, 0) / 100.0 as valor,
            dc.id_da_pessoa_entregadora
        FROM public.dados_corridas dc
        LEFT JOIN marketing_ids m ON dc.id_da_pessoa_entregadora = m.id_entregador
        WHERE dc.data_do_periodo BETWEEN data_inicial AND data_final
          AND (p_organization_id IS NULL OR dc.organization_id = p_organization_id)
          AND (v_praca IS NULL OR dc.praca = v_praca)
    )
    SELECT 
        dd.semana,
        SUM(CASE WHEN NOT dd.is_mkt THEN dd.segundos ELSE 0 END)::bigint,
        SUM(CASE WHEN dd.is_mkt THEN dd.segundos ELSE 0 END)::bigint,
        SUM(CASE WHEN NOT dd.is_mkt THEN dd.ofertadas ELSE 0 END)::bigint,
        SUM(CASE WHEN dd.is_mkt THEN dd.ofertadas ELSE 0 END)::bigint,
        SUM(CASE WHEN NOT dd.is_mkt THEN dd.aceitas ELSE 0 END)::bigint,
        SUM(CASE WHEN dd.is_mkt THEN dd.aceitas ELSE 0 END)::bigint,
        SUM(CASE WHEN NOT dd.is_mkt THEN dd.concluidas ELSE 0 END)::bigint,
        SUM(CASE WHEN dd.is_mkt THEN dd.concluidas ELSE 0 END)::bigint,
        SUM(CASE WHEN NOT dd.is_mkt THEN dd.rejeitadas ELSE 0 END)::bigint,
        SUM(CASE WHEN dd.is_mkt THEN dd.rejeitadas ELSE 0 END)::bigint,
        ROUND(SUM(CASE WHEN NOT dd.is_mkt THEN dd.valor ELSE 0 END)::numeric, 2),
        ROUND(SUM(CASE WHEN dd.is_mkt THEN dd.valor ELSE 0 END)::numeric, 2),
        COUNT(DISTINCT CASE WHEN NOT dd.is_mkt THEN dd.id_da_pessoa_entregadora ELSE NULL END)::bigint,
        COUNT(DISTINCT CASE WHEN dd.is_mkt THEN dd.id_da_pessoa_entregadora ELSE NULL END)::bigint
    FROM daily_data dd
    GROUP BY 1
    ORDER BY 1;
END;
$function$
;

-- Optimizing: get_marketing_totals
CREATE OR REPLACE FUNCTION public.get_marketing_totals(data_envio_inicial date DEFAULT NULL::date, data_envio_final date DEFAULT NULL::date, data_liberacao_inicial date DEFAULT NULL::date, data_liberacao_final date DEFAULT NULL::date, rodou_dia_inicial date DEFAULT NULL::date, rodou_dia_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(criado bigint, enviado bigint, liberado bigint, rodando_inicio bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
    v_org_uuid uuid;
BEGIN
    -- Safe cast with Fallback
    BEGIN
        v_org_uuid := p_organization_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_org_uuid := NULL;
    END;

    RETURN QUERY
    SELECT
        -- Criado (total na tabela, filtrado apenas por org)
        COUNT(*)::bigint,
        
        -- Enviado
        COUNT(*) FILTER (
            WHERE data_envio IS NOT NULL
            AND (data_envio_inicial IS NULL OR data_envio >= data_envio_inicial)
            AND (data_envio_final IS NULL OR data_envio <= data_envio_final)
        )::bigint,
         
        -- Liberado
        COUNT(*) FILTER (
            WHERE data_liberacao IS NOT NULL
            AND (data_liberacao_inicial IS NULL OR data_liberacao >= data_liberacao_inicial)
            AND (data_liberacao_final IS NULL OR data_liberacao <= data_liberacao_final)
        )::bigint,
         
        -- Rodando Inicio
        COUNT(*) FILTER (
            WHERE rodou_dia IS NOT NULL
            AND (rodou_dia_inicial IS NULL OR rodou_dia >= rodou_dia_inicial)
            AND (rodou_dia_final IS NULL OR rodou_dia <= rodou_dia_final)
        )::bigint
    FROM dados_marketing
    WHERE (v_org_uuid IS NULL OR organization_id = v_org_uuid);
END;
$function$
;

-- Optimizing: get_origens_by_praca
CREATE OR REPLACE FUNCTION public.get_origens_by_praca(p_pracas text[])
 RETURNS SETOF text
 LANGUAGE plpgsql
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT DISTINCT mv.origem
    FROM public.mv_dashboard_resumo mv
    WHERE mv.praca IS NOT NULL
      AND mv.origem IS NOT NULL
      AND (p_pracas IS NULL OR array_length(p_pracas, 1) IS NULL OR mv.praca = ANY(p_pracas))
    ORDER BY mv.origem;
END;
$function$
;

-- Optimizing: get_pending_mvs
CREATE OR REPLACE FUNCTION public.get_pending_mvs()
 RETURNS TABLE(mv_name text, priority integer, needs_refresh boolean, last_refresh timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        mrc.mv_name,
        CASE mrc.mv_name
            -- Tier 1: Core Dashboard (Fast & Critical)
            WHEN 'mv_dashboard_resumo' THEN 1
            WHEN 'mv_dashboard_aderencia_metricas' THEN 1
            WHEN 'mv_aderencia_agregada' THEN 1
            
            -- Tier 2: Aggregated lists
            WHEN 'mv_entregadores_agregados' THEN 2
            WHEN 'mv_valores_entregadores_agregados' THEN 2
            
            -- Tier 3: Details (Large)
            WHEN 'mv_corridas_detalhe' THEN 3
            WHEN 'mv_entregue_detalhe' THEN 3
            WHEN 'mv_planejado_detalhe' THEN 3
            
            -- Default
            ELSE 4
        END as priority,
        mrc.needs_refresh,
        mrc.last_refresh
    FROM mv_refresh_control mrc
    WHERE mrc.needs_refresh = true
        AND mrc.refresh_in_progress = false
    ORDER BY 
        priority ASC,
        mrc.mv_name ASC;
END;
$function$
;

-- Optimizing: get_semanas_data_v2
CREATE OR REPLACE FUNCTION public.get_semanas_data_v2(ano_param integer)
 RETURNS TABLE(data_do_periodo date)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
  SELECT DISTINCT data_do_periodo
  FROM dados_corridas
  WHERE EXTRACT(YEAR FROM data_do_periodo) = ano_param
  ORDER BY data_do_periodo DESC;
$function$
;

-- Optimizing: get_subpracas_by_praca
CREATE OR REPLACE FUNCTION public.get_subpracas_by_praca(p_pracas text[])
 RETURNS SETOF text
 LANGUAGE plpgsql
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT DISTINCT mv.sub_praca
    FROM public.mv_dashboard_resumo mv
    WHERE mv.praca IS NOT NULL
      AND mv.sub_praca IS NOT NULL
      AND (p_pracas IS NULL OR array_length(p_pracas, 1) IS NULL OR mv.praca = ANY(p_pracas))
    ORDER BY mv.sub_praca;
END;
$function$
;

-- Optimizing: get_turnos_by_praca
CREATE OR REPLACE FUNCTION public.get_turnos_by_praca(p_pracas text[])
 RETURNS SETOF text
 LANGUAGE plpgsql
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT DISTINCT mv.turno
    FROM public.mv_dashboard_resumo mv
    WHERE mv.praca IS NOT NULL
      AND mv.turno IS NOT NULL
      AND (p_pracas IS NULL OR array_length(p_pracas, 1) IS NULL OR mv.praca = ANY(p_pracas))
    ORDER BY mv.turno;
END;
$function$
;

-- Optimizing: historico_atividades_usuario
CREATE OR REPLACE FUNCTION public.historico_atividades_usuario(p_user_id uuid, p_start_date timestamp with time zone DEFAULT (now() - '7 days'::interval), p_end_date timestamp with time zone DEFAULT now())
 RETURNS TABLE(id uuid, action_type text, action_details text, tab_name text, filters_applied jsonb, created_at timestamp with time zone, session_id text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.is_admin = true OR auth.uid() = p_user_id)
    ) THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;

    RETURN QUERY
    SELECT
        ua.id,
        ua.action_type,
        ua.action_details,
        ua.tab_name,
        ua.filters_applied,
        ua.created_at,
        ua.session_id
    FROM public.user_activities ua
    WHERE ua.user_id = p_user_id
      AND ua.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY ua.created_at DESC
    LIMIT 1000;

END;
$function$
;

-- Optimizing: is_admin_or_master
CREATE OR REPLACE FUNCTION public.is_admin_or_master()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  RETURN v_role IN ('admin', 'master');
END;
$function$
;

-- Optimizing: is_global_admin
CREATE OR REPLACE FUNCTION public.is_global_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    );
$function$
;

-- Optimizing: list_all_users
CREATE OR REPLACE FUNCTION public.list_all_users()
 RETURNS TABLE(id uuid, full_name text, email text, role text, is_admin boolean, is_approved boolean, created_at timestamp with time zone, approved_at timestamp with time zone, organization_id uuid, assigned_pracas text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user is admin
  SELECT (up.role = 'admin' OR up.is_admin = true) INTO v_is_admin
  FROM public.user_profiles up
  WHERE up.id = v_user_id;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    (p.role = 'admin' OR p.is_admin = true) as is_admin,
    p.is_approved,
    p.created_at,
    p.approved_at,
    p.organization_id,
    p.assigned_pracas
  FROM public.user_profiles p
  ORDER BY p.created_at DESC;
END;
$function$
;

-- Optimizing: list_all_users_optimized
CREATE OR REPLACE FUNCTION public.list_all_users_optimized()
 RETURNS TABLE(id uuid, full_name text, email text, is_admin boolean, is_approved boolean, assigned_pracas text[], created_at timestamp with time zone, approved_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        COALESCE(up.full_name, au.email)::TEXT as full_name,
        au.email::TEXT,
        COALESCE(up.is_admin, FALSE) as is_admin,
        COALESCE(up.is_approved, FALSE) as is_approved,
        COALESCE(up.assigned_pracas, ARRAY[]::TEXT[]) as assigned_pracas,
        COALESCE(up.created_at, au.created_at) as created_at,
        up.approved_at
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE au.deleted_at IS NULL
    ORDER BY 
        CASE WHEN up.is_approved = FALSE THEN 0 ELSE 1 END,
        up.created_at DESC NULLS LAST;
END;
$function$
;

-- Optimizing: list_pending_users
CREATE OR REPLACE FUNCTION public.list_pending_users()
 RETURNS TABLE(id uuid, full_name text, email text, role text, is_admin boolean, is_approved boolean, created_at timestamp with time zone, approved_at timestamp with time zone, organization_id uuid, assigned_pracas text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user is admin
  SELECT (up.role = 'admin' OR up.is_admin = true) INTO v_is_admin
  FROM public.user_profiles up
  WHERE up.id = v_user_id;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    (p.role = 'admin' OR p.is_admin = true) as is_admin,
    p.is_approved,
    p.created_at,
    p.approved_at,
    p.organization_id,
    p.assigned_pracas
  FROM public.user_profiles p
  WHERE p.is_approved = false
  ORDER BY p.created_at DESC;
END;
$function$
;

-- Optimizing: list_pracas_disponiveis_otimizada
CREATE OR REPLACE FUNCTION public.list_pracas_disponiveis_otimizada()
 RETURNS TABLE(praca text)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
BEGIN
    -- Tentar primeiro da MV (mais rápido)
    RETURN QUERY
    SELECT DISTINCT s.praca::TEXT
    FROM public.mv_aderencia_agregada s
    WHERE s.praca IS NOT NULL 
      AND s.praca != ''
      AND LENGTH(TRIM(s.praca)) > 0
    ORDER BY s.praca::TEXT
    LIMIT 100;
    
    -- Se não retornou nenhuma linha, tentar da tabela principal
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT DISTINCT d.praca::TEXT
        FROM public.dados_corridas d
        WHERE d.praca IS NOT NULL 
          AND d.praca != ''
          AND LENGTH(TRIM(d.praca)) > 0
        ORDER BY d.praca::TEXT
        LIMIT 100;
    END IF;
    
    RETURN;
END;
$function$
;

-- Optimizing: listar_anos_disponiveis
CREATE OR REPLACE FUNCTION public.listar_anos_disponiveis()
 RETURNS SETOF integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
STABLE
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
$function$
;

-- Optimizing: listar_entregadores
CREATE OR REPLACE FUNCTION public.listar_entregadores(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
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
    'entregadores', COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb),
    'total', COUNT(*)
  ) INTO v_result
  FROM (
    SELECT 
      id_da_pessoa_entregadora as id_entregador,
      pessoa_entregadora as nome_entregador,
      SUM(numero_de_corridas_ofertadas) as corridas_ofertadas,
      SUM(numero_de_corridas_aceitas) as corridas_aceitas,
      SUM(numero_de_corridas_rejeitadas) as corridas_rejeitadas,
      SUM(numero_de_corridas_completadas) as corridas_completadas,
      CASE WHEN SUM(numero_de_corridas_ofertadas) > 0 
        THEN ROUND((SUM(numero_de_corridas_aceitas)::numeric / NULLIF(SUM(numero_de_corridas_ofertadas), 0)) * 100, 2)
        ELSE 0 END as aderencia_percentual,
      CASE WHEN SUM(numero_de_corridas_ofertadas) > 0 
        THEN ROUND((SUM(numero_de_corridas_rejeitadas)::numeric / NULLIF(SUM(numero_de_corridas_ofertadas), 0)) * 100, 2)
        ELSE 0 END as rejeicao_percentual
    FROM public.dados_corridas
    WHERE (CASE
      WHEN p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN data_do_periodo >= p_data_inicial AND data_do_periodo <= p_data_final
      WHEN p_ano IS NOT NULL AND p_semana IS NOT NULL THEN ano_iso = p_ano AND semana_numero = p_semana
      WHEN p_ano IS NOT NULL THEN EXTRACT(YEAR FROM data_do_periodo) = p_ano
      ELSE data_do_periodo >= CURRENT_DATE - 14 AND data_do_periodo <= CURRENT_DATE
    END)
      AND (v_org_filter IS NULL OR organization_id = v_org_filter)
      AND (p_praca IS NULL OR p_praca = '' OR praca = ANY(string_to_array(p_praca, ',')))
      AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR origem = p_origem)
      AND pessoa_entregadora IS NOT NULL
    GROUP BY id_da_pessoa_entregadora, pessoa_entregadora
    ORDER BY corridas_completadas DESC
    -- LIMIT removido
  ) t;

  RETURN v_result;
END;
$function$
;

-- Optimizing: listar_evolucao_mensal
CREATE OR REPLACE FUNCTION public.listar_evolucao_mensal(p_ano integer, p_praca text DEFAULT NULL::text)
 RETURNS TABLE(ano integer, mes integer, mes_nome text, corridas_ofertadas bigint, corridas_aceitas bigint, corridas_completadas bigint, corridas_rejeitadas bigint, total_segundos numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
  -- ⚠️ OTIMIZAÇÃO: EXIGIR filtro de ano para evitar scan completo
  IF p_ano IS NULL THEN
    RAISE EXCEPTION 'Filtro de ano (p_ano) é obrigatório para evitar timeout';
  END IF;

  RETURN QUERY
  WITH filtered_data AS (
    SELECT
      ano_iso,
      EXTRACT(MONTH FROM data_do_periodo)::integer AS mes_numero,
      total_ofertadas,
      total_aceitas,
      total_completadas,
      total_rejeitadas,
      segundos_realizados AS tempo_segundos
    FROM public.mv_dashboard_resumo
    WHERE ano_iso = p_ano
      AND (
        p_praca IS NULL
        OR p_praca = ''
        OR (p_praca NOT LIKE '%,%' AND praca = p_praca)
        OR (p_praca LIKE '%,%' AND praca = ANY(string_to_array(p_praca, ',')))
      )
  ),
  mes_agg AS (
    SELECT
      filtered_data.ano_iso,
      mes_numero,
      SUM(total_ofertadas) AS total_ofertadas,
      SUM(total_aceitas) AS total_aceitas,
      SUM(total_completadas) AS total_completadas,
      SUM(total_rejeitadas) AS total_rejeitadas,
      SUM(tempo_segundos) AS total_segundos
    FROM filtered_data
    GROUP BY filtered_data.ano_iso, mes_numero
    HAVING SUM(total_ofertadas) > 0 OR SUM(total_aceitas) > 0 OR SUM(total_completadas) > 0
  )
  SELECT
    mes_agg.ano_iso::INTEGER AS ano,
    mes_agg.mes_numero AS mes,
    CASE mes_agg.mes_numero
        WHEN 1 THEN 'Janeiro'
        WHEN 2 THEN 'Fevereiro'
        WHEN 3 THEN 'Março'
        WHEN 4 THEN 'Abril'
        WHEN 5 THEN 'Maio'
        WHEN 6 THEN 'Junho'
        WHEN 7 THEN 'Julho'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Setembro'
        WHEN 10 THEN 'Outubro'
        WHEN 11 THEN 'Novembro'
        WHEN 12 THEN 'Dezembro'
        ELSE 'Desconhecido'
    END AS mes_nome,
    mes_agg.total_ofertadas::BIGINT AS corridas_ofertadas,
    mes_agg.total_aceitas::BIGINT AS corridas_aceitas,
    mes_agg.total_completadas::BIGINT AS corridas_completadas,
    mes_agg.total_rejeitadas::BIGINT AS corridas_rejeitadas,
    mes_agg.total_segundos::NUMERIC AS total_segundos
  FROM mes_agg
  ORDER BY mes_agg.ano_iso ASC, mes_agg.mes_numero ASC;
END;
$function$
;

-- Optimizing: listar_evolucao_semanal
CREATE OR REPLACE FUNCTION public.listar_evolucao_semanal(p_ano integer, p_limite_semanas integer DEFAULT 12, p_praca text DEFAULT NULL::text)
 RETURNS TABLE(ano integer, semana integer, semana_label text, corridas_ofertadas bigint, corridas_aceitas bigint, corridas_completadas bigint, corridas_rejeitadas bigint, total_segundos numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
  -- ⚠️ OTIMIZAÇÃO: EXIGIR filtro de ano para evitar scan completo
  IF p_ano IS NULL THEN
    RAISE EXCEPTION 'Filtro de ano (p_ano) é obrigatório para evitar timeout';
  END IF;

  RETURN QUERY
  WITH filtered_data AS (
    SELECT
      ano_iso,
      semana_iso AS semana_numero,
      total_ofertadas,
      total_aceitas,
      total_completadas,
      total_rejeitadas,
      segundos_realizados AS tempo_segundos
    FROM public.mv_dashboard_resumo
    WHERE ano_iso = p_ano
      AND (
        p_praca IS NULL
        OR p_praca = ''
        OR (p_praca NOT LIKE '%,%' AND praca = p_praca)
        OR (p_praca LIKE '%,%' AND praca = ANY(string_to_array(p_praca, ',')))
      )
  ),
  semana_agg AS (
    SELECT
      filtered_data.ano_iso,
      semana_numero,
      SUM(total_ofertadas) AS total_ofertadas,
      SUM(total_aceitas) AS total_aceitas,
      SUM(total_completadas) AS total_completadas,
      SUM(total_rejeitadas) AS total_rejeitadas,
      SUM(tempo_segundos) AS total_segundos
    FROM filtered_data
    GROUP BY filtered_data.ano_iso, semana_numero
    HAVING SUM(total_ofertadas) > 0 OR SUM(total_aceitas) > 0 OR SUM(total_completadas) > 0
  )
  SELECT
    s.ano_iso::INTEGER AS ano,
    s.semana_numero AS semana,
    'Semana ' || LPAD(s.semana_numero::TEXT, 2, '0') AS semana_label,
    s.total_ofertadas::BIGINT AS corridas_ofertadas,
    s.total_aceitas::BIGINT AS corridas_aceitas,
    s.total_completadas::BIGINT AS corridas_completadas,
    s.total_rejeitadas::BIGINT AS corridas_rejeitadas,
    s.total_segundos::NUMERIC AS total_segundos
  FROM semana_agg s
  ORDER BY s.ano_iso ASC, s.semana_numero ASC
  LIMIT p_limite_semanas;
END;
$function$
;

-- Optimizing: listar_evolucao_semanal
CREATE OR REPLACE FUNCTION public.listar_evolucao_semanal(p_ano integer, p_praca text DEFAULT NULL::text, p_limite_semanas integer DEFAULT 53)
 RETURNS TABLE(ano integer, semana integer, semana_label text, corridas_ofertadas bigint, corridas_aceitas bigint, corridas_completadas bigint, corridas_rejeitadas bigint, total_segundos numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
  -- ⚠️ OTIMIZAÇÃO: EXIGIR filtro de ano para evitar scan completo
  IF p_ano IS NULL THEN
    RAISE EXCEPTION 'Filtro de ano (p_ano) é obrigatório para evitar timeout';
  END IF;

  RETURN QUERY
  WITH filtered_data AS (
    SELECT
      ano_iso,
      semana_iso AS semana_numero,
      total_ofertadas,
      total_aceitas,
      total_completadas,
      total_rejeitadas,
      segundos_realizados AS tempo_segundos
    FROM public.tb_dashboard_resumo
    WHERE ano_iso = p_ano
      AND (
        p_praca IS NULL
        OR p_praca = ''
        OR (p_praca NOT LIKE '%,%' AND praca = p_praca)
        OR (p_praca LIKE '%,%' AND praca = ANY(string_to_array(p_praca, ',')))
      )
  ),
  semana_agg AS (
    SELECT
      filtered_data.ano_iso,
      semana_numero,
      SUM(total_ofertadas) AS total_ofertadas,
      SUM(total_aceitas) AS total_aceitas,
      SUM(total_completadas) AS total_completadas,
      SUM(total_rejeitadas) AS total_rejeitadas,
      SUM(tempo_segundos) AS total_segundos
    FROM filtered_data
    GROUP BY filtered_data.ano_iso, semana_numero
    HAVING SUM(total_ofertadas) > 0 OR SUM(total_aceitas) > 0 OR SUM(total_completadas) > 0
  )
  SELECT
    s.ano_iso::INTEGER AS ano,
    s.semana_numero AS semana,
    'Semana ' || LPAD(s.semana_numero::TEXT, 2, '0') AS semana_label,
    s.total_ofertadas::BIGINT AS corridas_ofertadas,
    s.total_aceitas::BIGINT AS corridas_aceitas,
    s.total_completadas::BIGINT AS corridas_completadas,
    s.total_rejeitadas::BIGINT AS corridas_rejeitadas,
    s.total_segundos::NUMERIC AS total_segundos
  FROM semana_agg s
  ORDER BY s.ano_iso ASC, s.semana_numero ASC
  LIMIT p_limite_semanas;
END;
$function$
;

-- Optimizing: listar_todas_semanas
CREATE OR REPLACE FUNCTION public.listar_todas_semanas()
 RETURNS TABLE(semana integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT semana_iso
  FROM public.mv_dashboard_resumo
  WHERE semana_iso IS NOT NULL
  ORDER BY semana_iso DESC;
END;
$function$
;

-- Optimizing: pesquisar_entregadores
CREATE OR REPLACE FUNCTION public.pesquisar_entregadores(termo_busca text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'entregadores', COALESCE(jsonb_agg(
            jsonb_build_object(
                'id_entregador', entregador.id_entregador,
                'nome_entregador', entregador.nome_entregador,
                'corridas_ofertadas', entregador.corridas_ofertadas,
                'corridas_aceitas', entregador.corridas_aceitas,
                'corridas_rejeitadas', entregador.corridas_rejeitadas,
                'corridas_completadas', entregador.corridas_completadas,
                'aderencia_percentual', entregador.aderencia_percentual,
                'rejeicao_percentual', entregador.rejeicao_percentual
            )
        ), '[]'::jsonb),
        'total', COUNT(*)
    )
    INTO v_result
    FROM (
        SELECT 
            d.id_da_pessoa_entregadora as id_entregador,
            -- Campo correto: pessoa_entregadora
            COALESCE(MAX(d.pessoa_entregadora), d.id_da_pessoa_entregadora) as nome_entregador,
            SUM(COALESCE(d.numero_de_corridas_ofertadas, 0))::integer as corridas_ofertadas,
            SUM(COALESCE(d.numero_de_corridas_aceitas, 0))::integer as corridas_aceitas,
            SUM(COALESCE(d.numero_de_corridas_rejeitadas, 0))::integer as corridas_rejeitadas,
            SUM(COALESCE(d.numero_de_corridas_completadas, 0))::integer as corridas_completadas,
            COALESCE(
                ROUND(
                    AVG(
                        CASE 
                            WHEN COALESCE(d.duracao_segundos, 0) > 0 
                            THEN (COALESCE(d.tempo_disponivel_escalado_segundos, 0)::numeric / d.duracao_segundos::numeric) * 100
                            ELSE NULL
                        END
                    )::numeric, 2
                ), 0
            ) as aderencia_percentual,
            COALESCE(
                ROUND(
                    CASE 
                        WHEN SUM(COALESCE(d.numero_de_corridas_ofertadas, 0)) > 0 
                        THEN (SUM(COALESCE(d.numero_de_corridas_rejeitadas, 0))::numeric / SUM(COALESCE(d.numero_de_corridas_ofertadas, 0))::numeric) * 100
                        ELSE 0 
                    END::numeric, 2
                ), 0
            ) as rejeicao_percentual
        FROM public.dados_corridas d
        WHERE d.id_da_pessoa_entregadora IS NOT NULL
            AND d.id_da_pessoa_entregadora != ''
            AND (
                termo_busca IS NULL OR 
                termo_busca = '' OR
                LOWER(COALESCE(d.pessoa_entregadora, d.id_da_pessoa_entregadora)) LIKE '%' || LOWER(TRIM(termo_busca)) || '%'
            )
        GROUP BY d.id_da_pessoa_entregadora
        HAVING COUNT(*) > 0
        ORDER BY aderencia_percentual DESC NULLS LAST
        LIMIT 5000
    ) entregador;

    IF v_result IS NULL THEN
        v_result := jsonb_build_object('entregadores', '[]'::jsonb, 'total', 0);
    END IF;

    RETURN v_result;
END;
$function$
;

-- Optimizing: pesquisar_valores_entregadores
CREATE OR REPLACE FUNCTION public.pesquisar_valores_entregadores(termo_busca text)
 RETURNS TABLE(id_entregador text, nome_entregador text, total_taxas numeric, numero_corridas_aceitas bigint, taxa_media numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
BEGIN
    -- PESQUISA EM TODOS OS DADOS HISTÓRICOS - IGNORA TODOS OS FILTROS DE TEMPO
    RETURN QUERY
    SELECT 
        COALESCE(s.id_da_pessoa_entregadora, 'N/A')::TEXT AS id_entregador,
        COALESCE(MAX(s.pessoa_entregadora), COALESCE(s.id_da_pessoa_entregadora, 'Desconhecido'))::TEXT AS nome_entregador,
        COALESCE(ROUND((SUM(s.soma_das_taxas_das_corridas_aceitas) / 100.0)::NUMERIC, 2), 0) AS total_taxas,
        COALESCE(SUM(s.numero_de_corridas_aceitas), 0)::BIGINT AS numero_corridas_aceitas,
        CASE 
            WHEN SUM(s.numero_de_corridas_aceitas) > 0 
            THEN ROUND(((SUM(s.soma_das_taxas_das_corridas_aceitas) / 100.0) / SUM(s.numero_de_corridas_aceitas))::NUMERIC, 2)
            ELSE 0
        END AS taxa_media
    FROM public.dados_corridas s
    WHERE
        -- APENAS FILTRO DE BUSCA - NENHUM FILTRO DE TEMPO/LOCALIZAÇÃO
        (
            termo_busca IS NULL OR 
            LOWER(COALESCE(s.pessoa_entregadora, s.id_da_pessoa_entregadora, '')) LIKE '%' || LOWER(termo_busca) || '%' OR
            LOWER(s.id_da_pessoa_entregadora) LIKE '%' || LOWER(termo_busca) || '%'
        ) AND
        s.id_da_pessoa_entregadora IS NOT NULL AND
        s.data_do_periodo IS NOT NULL
    GROUP BY s.id_da_pessoa_entregadora
    HAVING SUM(s.numero_de_corridas_aceitas) > 0
    ORDER BY total_taxas DESC
    LIMIT 10000; -- Limite muito alto para garantir que encontre qualquer entregador
END;
$function$
;

-- Optimizing: ping
CREATE OR REPLACE FUNCTION public.ping()
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
  SELECT '{"message": "pong"}'::json;
$function$
;

-- Optimizing: refresh_mvs_prioritized
CREATE OR REPLACE FUNCTION public.refresh_mvs_prioritized(refresh_critical_only boolean DEFAULT false)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '0'
STABLE
AS $function$
DECLARE
    result json;
    results json[] := '{}';
    total_start TIMESTAMP;
    mv_record RECORD;
    single_mv_result json;
BEGIN
    total_start := clock_timestamp();
    
    -- Lista de MVs em ordem de prioridade
    FOR mv_record IN
        SELECT 
            mv_name,
            priority
        FROM (
            VALUES
                -- Prioridade 1: Críticas (dashboard principal)
                ('mv_dashboard_resumo', 1), -- ADICIONADO AQUI
                ('mv_dashboard_aderencia_metricas', 1),
                ('mv_aderencia_agregada', 1),
                
                -- Prioridade 2: Grandes (se não for critical_only)
                ('mv_entregadores_agregados', 2),
                ('mv_valores_entregadores_agregados', 2),
                
                -- Prioridade 3: Médias
                ('mv_corridas_detalhe', 3),
                ('mv_entregue_detalhe', 3),
                ('mv_planejado_detalhe', 3),
                
                -- Prioridade 4: Pequenas
                ('mv_entregadores_marketing', 4),
                ('mv_dashboard_admin', 4),
                ('mv_aderencia_dia', 4),
                ('mv_dashboard_lite', 4),
                ('mv_aderencia_semana', 4),
                ('mv_dashboard_micro', 4)
        ) AS mvs(mv_name, priority)
        WHERE 
            -- Se refresh_critical_only = true, apenas prioridade 1
            (refresh_critical_only = false OR priority = 1)
        ORDER BY priority, mv_name
    LOOP
        BEGIN
            -- Usar refresh_single_mv que já tem fallback implementado
            -- force_normal = false para tentar CONCURRENTLY primeiro
            single_mv_result := public.refresh_single_mv(mv_record.mv_name, false);
            
            -- Adicionar resultado ao array
            results := array_append(results, json_build_object(
                'view', mv_record.mv_name,
                'success', (single_mv_result->>'success')::boolean,
                'duration_seconds', (single_mv_result->>'duration_seconds')::numeric,
                'method', COALESCE(single_mv_result->>'method', 'NORMAL'),
                'priority', mv_record.priority,
                'error', single_mv_result->>'error'
            ));
            
        EXCEPTION WHEN OTHERS THEN
            -- Em caso de erro na chamada da função, adicionar erro
            results := array_append(results, json_build_object(
                'view', mv_record.mv_name,
                'success', false,
                'error', SQLERRM,
                'priority', mv_record.priority
            ));
        END;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'total_duration_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - total_start)),
        'views_refreshed', array_length(results, 1),
        'critical_only', refresh_critical_only,
        'results', results
    );
END;
$function$
;

-- Optimizing: refresh_pending_mvs
CREATE OR REPLACE FUNCTION public.refresh_pending_mvs()
 RETURNS TABLE(mv_name text, success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
 SET statement_timeout TO '0'
STABLE
AS $function$
DECLARE
  mv_record RECORD;
  result_json json;
BEGIN
  FOR mv_record IN 
    SELECT mrc.mv_name 
    FROM public.mv_refresh_control mrc
    WHERE mrc.needs_refresh = true 
      AND mrc.refresh_in_progress = false
    ORDER BY 
      CASE mrc.mv_name
        -- Priority 0: Base Aggregations (Must refresh first)
        WHEN 'mv_corridas_agregadas' THEN 0
        
        -- Priority 1: High Level Metrics
        WHEN 'mv_dashboard_aderencia_metricas' THEN 1
        WHEN 'mv_entregadores_summary' THEN 1 -- Depends on mv_corridas_agregadas
        
        -- Priority 2: Secondary Aggregations
        WHEN 'mv_aderencia_agregada' THEN 2
        WHEN 'mv_entregadores_agregados' THEN 3
        WHEN 'mv_valores_entregadores_agregados' THEN 4
        
        ELSE 5
      END
    LIMIT 3
  LOOP
    BEGIN
      result_json := public.refresh_single_mv(mv_record.mv_name, false);
      
      IF (result_json->>'success')::boolean THEN
        RETURN QUERY SELECT mv_record.mv_name, true, 
          format('Atualizada com sucesso (%s em %s segundos)', 
            COALESCE(result_json->>'method', 'CONCURRENTLY'),
            COALESCE((result_json->>'duration_seconds')::text, 'N/A')
          );
      ELSE
        RETURN QUERY SELECT mv_record.mv_name, false, 
          COALESCE(result_json->>'error', 'Erro desconhecido');
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT mv_record.mv_name, false, SQLERRM;
    END;
  END LOOP;
  
  RETURN;
END;
$function$
;

-- Optimizing: refresh_pending_mvs_if_needed
CREATE OR REPLACE FUNCTION public.refresh_pending_mvs_if_needed()
 RETURNS TABLE(executado boolean, mvs_processadas integer, mensagem text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
DECLARE
  pending_count INTEGER;
  result_count INTEGER;
BEGIN
  -- Verificação ULTRA rápida usando índice parcial
  -- Esta query é otimizada para retornar imediatamente quando não há pendências
  SELECT COUNT(*) INTO pending_count
  FROM public.mv_refresh_control
  WHERE needs_refresh = true 
    AND refresh_in_progress = false;
  
  -- Se não houver MVs pendentes, retornar imediatamente
  -- Esta é a execução mais comum e mais rápida
  IF pending_count = 0 THEN
    RETURN QUERY SELECT 
      false::boolean,
      0::integer,
      'Nenhuma MV pendente - verificação concluída em <1ms'::text;
    RETURN;
  END IF;
  
  -- Se houver MVs pendentes, executar o refresh
  -- Esta parte só executa quando realmente há trabalho a fazer
  SELECT COUNT(*) INTO result_count
  FROM public.refresh_pending_mvs();
  
  RETURN QUERY SELECT 
    true::boolean,
    result_count::integer,
    format('Processadas %s MVs pendentes', result_count)::text;
END;
$function$
;

-- Optimizing: resumo_semanal_drivers
CREATE OR REPLACE FUNCTION public.resumo_semanal_drivers(p_ano integer, p_organization_id text, p_pracas text[] DEFAULT NULL::text[])
 RETURNS TABLE(ano integer, semana integer, total_drivers bigint, total_slots bigint)
 LANGUAGE plpgsql
 SET search_path TO ''
STABLE
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
$function$
;

-- Optimizing: resumo_semanal_pedidos
CREATE OR REPLACE FUNCTION public.resumo_semanal_pedidos(p_ano integer, p_organization_id text, p_pracas text[] DEFAULT NULL::text[])
 RETURNS TABLE(ano integer, semana integer, total_drivers bigint, total_slots bigint, total_pedidos bigint, total_sh numeric, aderencia_media numeric, utr numeric, aderencia numeric, rejeite numeric)
 LANGUAGE plpgsql
 SET search_path TO ''
STABLE
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
$function$
;

-- Optimizing: sync_user_organization_to_metadata
CREATE OR REPLACE FUNCTION public.sync_user_organization_to_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
STABLE
AS $function$
DECLARE
  current_org_id UUID;
BEGIN
  -- Obter organization_id do user_profiles
  SELECT organization_id INTO current_org_id
  FROM public.user_profiles
  WHERE id = NEW.id;
  
  -- Atualizar user_metadata no Supabase Auth
  -- Nota: Esta atualização será feita via API do Supabase no frontend
  -- pois não temos acesso direto ao auth.users aqui
  
  RETURN NEW;
END;
$function$
;

-- Optimizing: top_usuarios_ativos
CREATE OR REPLACE FUNCTION public.top_usuarios_ativos(p_limite integer DEFAULT 10, p_data_inicio timestamp with time zone DEFAULT (now() - '24:00:00'::interval), p_data_fim timestamp with time zone DEFAULT now())
 RETURNS TABLE(user_id uuid, user_name text, user_email text, total_acoes bigint, abas_diferentes bigint, ultima_atividade timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH atividades_usuario AS (
    SELECT 
      ua.user_id,
      COUNT(*) as total_acoes,
      COUNT(DISTINCT ua.tab_name) as abas_diferentes,
      MAX(ua.created_at) as ultima_atividade
    FROM public.user_activity ua
    WHERE ua.created_at BETWEEN p_data_inicio AND p_data_fim
    GROUP BY ua.user_id
  )
  SELECT 
    au_stats.user_id,
    COALESCE(
      up.full_name,
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'fullName',
      SPLIT_PART(au.email::TEXT, '@', 1)
    )::TEXT as user_name,
    au.email::TEXT as user_email,
    au_stats.total_acoes,
    au_stats.abas_diferentes,
    au_stats.ultima_atividade
  FROM atividades_usuario au_stats
  INNER JOIN auth.users au ON au.id = au_stats.user_id
  LEFT JOIN public.user_profiles up ON up.id = au_stats.user_id
  ORDER BY au_stats.total_acoes DESC
  LIMIT p_limite;
END;
$function$
;

