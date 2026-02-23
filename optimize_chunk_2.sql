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

