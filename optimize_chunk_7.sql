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

