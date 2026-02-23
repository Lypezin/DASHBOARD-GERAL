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

