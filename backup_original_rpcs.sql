-- =========================================================
-- BACKUP ORIGINAL DAS FUNÇÕES RPC (Supabase)
-- Gerado antes das otimizações STABLE e search_path
-- =========================================================

-- Nome: approve_user
CREATE OR REPLACE FUNCTION public.approve_user(user_id uuid, pracas text[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Atualizar o usuário
  UPDATE public.user_profiles
  SET 
    is_approved = TRUE,
    assigned_pracas = pracas,
    approved_at = NOW(),
    approved_by = auth.uid()
  WHERE id = user_id;

  RETURN TRUE;
END;
$function$
;

-- Nome: approve_user
CREATE OR REPLACE FUNCTION public.approve_user(user_id uuid, pracas text[], p_role text DEFAULT 'user'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Validar o role
  IF p_role NOT IN ('admin', 'marketing', 'user') THEN
    RAISE EXCEPTION 'Role inválido. Deve ser admin, marketing ou user';
  END IF;

  -- Validar que se não for marketing, deve ter pelo menos uma praça
  IF p_role != 'marketing' AND (pracas IS NULL OR array_length(pracas, 1) = 0) THEN
    RAISE EXCEPTION 'Usuários não-marketing devem ter pelo menos uma praça atribuída';
  END IF;

  -- Atualizar o usuário
  UPDATE public.user_profiles
  SET 
    is_approved = TRUE,
    assigned_pracas = CASE 
      WHEN p_role = 'marketing' THEN ARRAY[]::TEXT[] 
      ELSE COALESCE(pracas, ARRAY[]::TEXT[])
    END,
    role = p_role,
    is_admin = (p_role = 'admin'),
    approved_at = NOW(),
    approved_by = auth.uid()
  WHERE id = user_id;

  RETURN TRUE;
END;
$function$
;

-- Nome: approve_user
CREATE OR REPLACE FUNCTION public.approve_user(user_id uuid, pracas text[], p_role text DEFAULT 'user'::text, p_organization_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  default_org_id UUID;
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Se organization_id não foi fornecido, usar organização padrão
  IF p_organization_id IS NULL THEN
    default_org_id := '00000000-0000-0000-0000-000000000001'::UUID;
  ELSE
    default_org_id := p_organization_id;
  END IF;

  -- Validar role
  IF p_role NOT IN ('admin', 'marketing', 'user') THEN
    RAISE EXCEPTION 'Role inválido. Use: admin, marketing ou user';
  END IF;

  -- Atualizar o usuário
  UPDATE public.user_profiles
  SET 
    is_approved = TRUE,
    assigned_pracas = CASE 
      WHEN p_role = 'marketing' THEN ARRAY[]::TEXT[]
      ELSE pracas
    END,
    role = p_role,
    is_admin = (p_role = 'admin'),
    organization_id = default_org_id,
    approved_at = NOW(),
    approved_by = auth.uid()
  WHERE id = user_id;

  RETURN TRUE;
END;
$function$
;

-- Nome: atualizar_colunas_derivadas
CREATE OR REPLACE FUNCTION public.atualizar_colunas_derivadas()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  IF NEW.data_do_periodo IS NOT NULL THEN
    NEW.ano_iso := date_part('isoyear', NEW.data_do_periodo)::int;
    NEW.semana_numero := date_part('week', NEW.data_do_periodo)::int;
    NEW.dia_iso := date_part('isodow', NEW.data_do_periodo)::int;
  END IF;
  RETURN NEW;
END;
$function$
;

-- Nome: atualizar_materialized_views_entregadores
CREATE OR REPLACE FUNCTION public.atualizar_materialized_views_entregadores()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Esta função gerenciava MVs que foram deprecadas/removedas.
  -- Mantida vazia para compatibilidade.
  NULL;
END;
$function$
;

-- Nome: calcular_aderencia_por_dia
CREATE OR REPLACE FUNCTION public.calcular_aderencia_por_dia(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(dia_iso integer, dia_da_semana text, horas_a_entregar text, horas_entregues text, aderencia_percentual numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_org_filter uuid;
BEGIN
  BEGIN v_org_filter := NULLIF(p_organization_id, '')::uuid; EXCEPTION WHEN OTHERS THEN v_org_filter := NULL; END;
  SELECT (role = 'admin' OR is_admin = true) INTO v_is_admin FROM public.user_profiles WHERE id = auth.uid();
  
  IF v_is_admin AND v_org_filter IS NULL THEN v_org_filter := NULL;
  ELSIF v_org_filter IS NULL AND NOT v_is_admin THEN SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid(); END IF;

  RETURN QUERY
  SELECT
    EXTRACT(ISODOW FROM mv.data_do_periodo)::integer as dia_iso,
    CASE EXTRACT(ISODOW FROM mv.data_do_periodo)::integer
      WHEN 1 THEN 'Segunda'
      WHEN 2 THEN 'Terça'
      WHEN 3 THEN 'Quarta'
      WHEN 4 THEN 'Quinta'
      WHEN 5 THEN 'Sexta'
      WHEN 6 THEN 'Sábado'
      WHEN 7 THEN 'Domingo'
      ELSE 'Unknown'
    END AS dia_da_semana,
    FLOOR(SUM(mv.segundos_planejados) / 3600.0)::text || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_planejados), 3600) / 60)::text, 2, '0') || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_planejados), 60))::text, 2, '0') AS horas_a_entregar,
    FLOOR(SUM(mv.segundos_realizados) / 3600.0)::text || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_realizados), 3600) / 60)::text, 2, '0') || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_realizados), 60))::text, 2, '0') AS horas_entregues,
    CASE 
      WHEN SUM(mv.segundos_planejados) > 0 THEN ROUND((SUM(mv.segundos_realizados) / SUM(mv.segundos_planejados)) * 100, 2) 
      ELSE 0 
    END AS aderencia_percentual
  FROM public.mv_dashboard_resumo mv
  WHERE (p_ano IS NULL OR mv.ano_iso = p_ano)
    AND (p_semana IS NULL OR mv.semana_iso = p_semana)
    AND (p_praca IS NULL OR mv.praca = p_praca)
    AND (p_sub_praca IS NULL OR mv.sub_praca = p_sub_praca)
    AND (v_org_filter IS NULL OR mv.organization_id = v_org_filter)
  GROUP BY EXTRACT(ISODOW FROM mv.data_do_periodo)
  ORDER BY dia_iso;
END;
$function$
;

-- Nome: calcular_aderencia_por_origem
CREATE OR REPLACE FUNCTION public.calcular_aderencia_por_origem(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(origem text, horas_a_entregar text, horas_entregues text, aderencia_percentual numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_org_filter uuid;
BEGIN
  BEGIN v_org_filter := NULLIF(p_organization_id, '')::uuid; EXCEPTION WHEN OTHERS THEN v_org_filter := NULL; END;
  SELECT (role = 'admin' OR is_admin = true) INTO v_is_admin FROM public.user_profiles WHERE id = auth.uid();
  
  IF v_is_admin AND v_org_filter IS NULL THEN v_org_filter := NULL;
  ELSIF v_org_filter IS NULL AND NOT v_is_admin THEN SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid(); END IF;

  RETURN QUERY
  SELECT
    mv.origem,
    FLOOR(SUM(mv.segundos_planejados) / 3600.0)::text || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_planejados), 3600) / 60)::text, 2, '0') || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_planejados), 60))::text, 2, '0') AS horas_a_entregar,
    FLOOR(SUM(mv.segundos_realizados) / 3600.0)::text || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_realizados), 3600) / 60)::text, 2, '0') || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_realizados), 60))::text, 2, '0') AS horas_entregues,
    CASE 
      WHEN SUM(mv.segundos_planejados) > 0 THEN ROUND((SUM(mv.segundos_realizados) / SUM(mv.segundos_planejados)) * 100, 2) 
      ELSE 0 
    END AS aderencia_percentual
  FROM public.mv_dashboard_resumo mv
  WHERE (p_ano IS NULL OR mv.ano_iso = p_ano)
    AND (p_semana IS NULL OR mv.semana_iso = p_semana)
    AND (p_praca IS NULL OR mv.praca = p_praca)
    AND (p_sub_praca IS NULL OR mv.sub_praca = p_sub_praca)
    AND (v_org_filter IS NULL OR mv.organization_id = v_org_filter)
    AND mv.origem IS NOT NULL
  GROUP BY mv.origem
  ORDER BY aderencia_percentual DESC;
END;
$function$
;

-- Nome: calcular_aderencia_por_sub_praca
CREATE OR REPLACE FUNCTION public.calcular_aderencia_por_sub_praca(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(sub_praca text, horas_a_entregar text, horas_entregues text, aderencia_percentual numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_org_filter uuid;
BEGIN
  BEGIN v_org_filter := NULLIF(p_organization_id, '')::uuid; EXCEPTION WHEN OTHERS THEN v_org_filter := NULL; END;
  SELECT (role = 'admin' OR is_admin = true) INTO v_is_admin FROM public.user_profiles WHERE id = auth.uid();
  
  IF v_is_admin AND v_org_filter IS NULL THEN v_org_filter := NULL;
  ELSIF v_org_filter IS NULL AND NOT v_is_admin THEN SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid(); END IF;

  RETURN QUERY
  SELECT
    mv.sub_praca,
    FLOOR(SUM(mv.segundos_planejados) / 3600.0)::text || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_planejados), 3600) / 60)::text, 2, '0') || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_planejados), 60))::text, 2, '0') AS horas_a_entregar,
    FLOOR(SUM(mv.segundos_realizados) / 3600.0)::text || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_realizados), 3600) / 60)::text, 2, '0') || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_realizados), 60))::text, 2, '0') AS horas_entregues,
    CASE 
      WHEN SUM(mv.segundos_planejados) > 0 THEN ROUND((SUM(mv.segundos_realizados) / SUM(mv.segundos_planejados)) * 100, 2) 
      ELSE 0 
    END AS aderencia_percentual
  FROM public.mv_dashboard_resumo mv
  WHERE (p_ano IS NULL OR mv.ano_iso = p_ano)
    AND (p_semana IS NULL OR mv.semana_iso = p_semana)
    AND (p_praca IS NULL OR mv.praca = p_praca)
    AND (p_origem IS NULL OR mv.origem = p_origem)
    AND (v_org_filter IS NULL OR mv.organization_id = v_org_filter)
    AND mv.sub_praca IS NOT NULL
  GROUP BY mv.sub_praca
  ORDER BY aderencia_percentual DESC;
END;
$function$
;

-- Nome: calcular_aderencia_por_turno
CREATE OR REPLACE FUNCTION public.calcular_aderencia_por_turno(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(periodo text, horas_a_entregar text, horas_entregues text, aderencia_percentual numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_org_filter uuid;
BEGIN
  BEGIN v_org_filter := NULLIF(p_organization_id, '')::uuid; EXCEPTION WHEN OTHERS THEN v_org_filter := NULL; END;
  SELECT (role = 'admin' OR is_admin = true) INTO v_is_admin FROM public.user_profiles WHERE id = auth.uid();
  
  IF v_is_admin AND v_org_filter IS NULL THEN v_org_filter := NULL;
  ELSIF v_org_filter IS NULL AND NOT v_is_admin THEN SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid(); END IF;

  RETURN QUERY
  SELECT
    mv.turno as periodo,
    FLOOR(SUM(mv.segundos_planejados) / 3600.0)::text || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_planejados), 3600) / 60)::text, 2, '0') || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_planejados), 60))::text, 2, '0') AS horas_a_entregar,
    FLOOR(SUM(mv.segundos_realizados) / 3600.0)::text || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_realizados), 3600) / 60)::text, 2, '0') || ':' || 
      LPAD(FLOOR(MOD(SUM(mv.segundos_realizados), 60))::text, 2, '0') AS horas_entregues,
    CASE 
      WHEN SUM(mv.segundos_planejados) > 0 THEN ROUND((SUM(mv.segundos_realizados) / SUM(mv.segundos_planejados)) * 100, 2) 
      ELSE 0 
    END AS aderencia_percentual
  FROM public.mv_dashboard_resumo mv
  WHERE (p_ano IS NULL OR mv.ano_iso = p_ano)
    AND (p_semana IS NULL OR mv.semana_iso = p_semana)
    AND (p_praca IS NULL OR mv.praca = p_praca)
    AND (p_sub_praca IS NULL OR mv.sub_praca = p_sub_praca)
    AND (v_org_filter IS NULL OR mv.organization_id = v_org_filter)
    AND mv.turno IS NOT NULL
  GROUP BY mv.turno
  ORDER BY aderencia_percentual DESC;
END;
$function$
;

-- Nome: calcular_aderencia_semanal
CREATE OR REPLACE FUNCTION public.calcular_aderencia_semanal(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(semana text, horas_a_entregar text, horas_entregues text, aderencia_percentual numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: calcular_utr
CREATE OR REPLACE FUNCTION public.calcular_utr(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_semanas integer[] DEFAULT NULL::integer[], p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_turno text DEFAULT NULL::text, p_sub_pracas text[] DEFAULT NULL::text[], p_origens text[] DEFAULT NULL::text[], p_turnos text[] DEFAULT NULL::text[], p_filtro_modo text DEFAULT 'ano_semana'::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_sql text;
    v_where text := ' WHERE 1=1 ';
    v_result jsonb;
    v_org_filter uuid;
    v_is_admin boolean;
BEGIN
    -- Auth Logic
    BEGIN 
        v_org_filter := NULLIF(p_organization_id, '')::uuid; 
    EXCEPTION WHEN OTHERS THEN 
        v_org_filter := NULL; 
    END;

    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) INTO v_is_admin FROM public.user_profiles WHERE id = auth.uid();
    
    IF v_org_filter IS NULL THEN
        IF v_is_admin IS NOT TRUE THEN
            SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid();
            IF v_org_filter IS NULL THEN
                v_org_filter := '00000000-0000-0000-0000-000000000000'; 
            END IF;
        END IF;
    END IF;

    IF v_org_filter IS NOT NULL THEN
        v_where := v_where || format(' AND organization_id = %L ', v_org_filter);
    END IF;

    -- Date Logic
    IF (p_filtro_modo = 'periodo') AND p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN
        v_where := v_where || format(' AND data_do_periodo >= %L AND data_do_periodo <= %L ', p_data_inicial, p_data_final);
    ELSIF (p_filtro_modo = 'ano_semana' OR p_filtro_modo IS NULL) THEN
        IF p_ano IS NOT NULL AND p_semana IS NOT NULL THEN
            v_where := v_where || format(' AND ano_iso = %L AND semana_numero = %L ', p_ano, p_semana);
        ELSIF p_ano IS NOT NULL THEN
            v_where := v_where || format(' AND ano_iso = %L ', p_ano);
        ELSIF p_semanas IS NOT NULL AND array_length(p_semanas, 1) > 0 THEN
             -- If passing multiple weeks, we filter by them (assuming current year if not specified, or handle logic)
             -- For safety in this specific function which usually returns single-week stats, we might just filter by the weeks.
             -- But typically this function is called for a specific week.
             -- If p_ano is passed with p_semanas, we assume p_semanas belongs to p_ano.
             IF p_ano IS NOT NULL THEN
                v_where := v_where || format(' AND ano_iso = %L AND semana_numero = ANY(%L) ', p_ano, p_semanas);
             ELSE
                v_where := v_where || format(' AND semana_numero = ANY(%L) ', p_semanas);
             END IF;
        ELSE
            -- Default to last 30 days
            v_where := v_where || format(' AND data_do_periodo >= %L ', CURRENT_DATE - 30);
        END IF;
    ELSE
        -- Fallback
        v_where := v_where || format(' AND data_do_periodo >= %L ', CURRENT_DATE - 30);
    END IF;

    -- Filters (Single values)
    IF p_praca IS NOT NULL AND p_praca <> '' AND LOWER(p_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND praca = ANY(string_to_array(%L, '','')) ', p_praca);
    END IF;

    IF p_sub_praca IS NOT NULL AND p_sub_praca <> '' AND LOWER(p_sub_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND sub_praca = ANY(string_to_array(%L, '','')) ', p_sub_praca);
    END IF;

    IF p_origem IS NOT NULL AND p_origem <> '' AND LOWER(p_origem) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND origem = ANY(string_to_array(%L, '','')) ', p_origem);
    END IF;
    
    IF p_turno IS NOT NULL AND p_turno <> '' AND LOWER(p_turno) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND periodo = ANY(string_to_array(%L, '','')) ', p_turno);
    END IF;

    -- Filters (Arrays - if used)
    IF p_sub_pracas IS NOT NULL AND array_length(p_sub_pracas, 1) > 0 THEN
        v_where := v_where || format(' AND sub_praca = ANY(%L) ', p_sub_pracas);
    END IF;

    IF p_origens IS NOT NULL AND array_length(p_origens, 1) > 0 THEN
        v_where := v_where || format(' AND origem = ANY(%L) ', p_origens);
    END IF;

    IF p_turnos IS NOT NULL AND array_length(p_turnos, 1) > 0 THEN
        v_where := v_where || format(' AND periodo = ANY(%L) ', p_turnos);
    END IF;

    -- Main Query using Materialized View (mv_utr_stats)
    v_sql := '
    SELECT jsonb_build_object(
        ''geral'', (
            SELECT row_to_json(t) FROM (
                SELECT 
                    COALESCE(SUM(total_tempo_segundos) / 3600.0, 0) as tempo_horas,
                    COALESCE(SUM(total_corridas), 0) as corridas,
                    CASE WHEN SUM(total_tempo_segundos) > 0 
                        THEN ROUND((SUM(total_corridas)::numeric / (SUM(total_tempo_segundos) / 3600.0)), 2) 
                        ELSE 0 END as utr
                FROM public.mv_utr_stats
                ' || v_where || '
            ) t
        )
    );';

    EXECUTE v_sql INTO v_result;
    RETURN v_result;
END;
$function$
;

-- Nome: calcular_utr_completo
CREATE OR REPLACE FUNCTION public.calcular_utr_completo(p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_organization_id uuid DEFAULT NULL::uuid, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_turno text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_sql text;
    v_where text := ' WHERE 1=1 ';
    v_result jsonb;
    v_org_filter uuid;
    v_is_admin boolean;
BEGIN
    -- Auth Logic
    BEGIN 
        v_org_filter := NULLIF(p_organization_id, '')::uuid; 
    EXCEPTION WHEN OTHERS THEN 
        v_org_filter := NULL; 
    END;

    -- Standard Organization resolution from Profile
    IF v_org_filter IS NULL THEN
        SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) INTO v_is_admin FROM public.user_profiles WHERE id = auth.uid();
        IF v_is_admin IS NOT TRUE THEN
            SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid();
        END IF;
    END IF;
    
    -- Hard Fallback for mismatched contexts (e.g. Admin default profile)
    IF v_org_filter IS NULL OR v_org_filter = '00000000-0000-0000-0000-000000000000' THEN
        v_org_filter := '00000000-0000-0000-0000-000000000001';
    END IF;

    IF v_org_filter IS NOT NULL THEN
        v_where := v_where || format(' AND organization_id = %L ', v_org_filter);
    END IF;

    -- Date Logic
    IF p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN
        v_where := v_where || format(' AND data_do_periodo >= %L AND data_do_periodo <= %L ', p_data_inicial, p_data_final);
    ELSIF p_ano IS NOT NULL AND p_semana IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L AND semana_iso = %L ', p_ano, p_semana);
    ELSIF p_ano IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L ', p_ano);
    ELSE
        v_where := v_where || format(' AND data_do_periodo >= %L ', CURRENT_DATE - 30);
    END IF;

    -- Filters
    IF p_praca IS NOT NULL AND p_praca <> '' AND LOWER(p_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND praca = ANY(string_to_array(%L, '','')) ', p_praca);
    END IF;
    IF p_sub_praca IS NOT NULL AND p_sub_praca <> '' AND LOWER(p_sub_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND sub_praca = ANY(string_to_array(%L, '','')) ', p_sub_praca);
    END IF;
    IF p_origem IS NOT NULL AND p_origem <> '' AND LOWER(p_origem) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND origem = ANY(string_to_array(%L, '','')) ', p_origem);
    END IF;
    IF p_turno IS NOT NULL AND p_turno <> '' AND LOWER(p_turno) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND turno = ANY(string_to_array(%L, '','')) ', p_turno);
    END IF;

    -- CORREÇÃO: Usar segundos_realizados (horas entregues) em vez de segundos_planejados (horas a entregar)
    v_sql := format('
    WITH aggregates AS (
        SELECT 
            SUM(total_completadas)::numeric as corridas,
            SUM(segundos_realizados)::numeric / 3600.0 as tempo_horas,
            GROUPING(praca) as g_praca,
            GROUPING(sub_praca) as g_sub_praca,
            GROUPING(origem) as g_origem,
            GROUPING(turno) as g_turno,
            praca,
            sub_praca,
            origem,
            turno
        FROM 
            mv_dashboard_resumo
        %s
        GROUP BY GROUPING SETS (
            (),
            (praca),
            (sub_praca),
            (origem),
            (turno)
        )
    )
    SELECT jsonb_build_object(
        ''geral'', (
            SELECT COALESCE(row_to_json(t), ''{"tempo_horas": 0, "corridas": 0, "utr": 0}''::json) FROM (
                SELECT 
                    ROUND(COALESCE(tempo_horas, 0), 2) as tempo_horas,
                    COALESCE(corridas, 0) as corridas,
                    CASE 
                        WHEN tempo_horas > 0 THEN ROUND((corridas / tempo_horas), 2) 
                        ELSE 0 
                    END as utr
                FROM aggregates 
                WHERE g_praca=1 AND g_sub_praca=1 AND g_origem=1 AND g_turno=1
            ) t
        ),
        ''praca'', (
            SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (
                SELECT 
                    praca, 
                    tempo_horas, 
                    corridas,
                    CASE WHEN tempo_horas > 0 THEN ROUND((corridas / tempo_horas), 2) ELSE 0 END as utr
                FROM aggregates 
                WHERE g_praca=0
                ORDER BY utr DESC
                LIMIT 50
            ) t
        ),
        ''sub_praca'', (
            SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (
                SELECT 
                    sub_praca, 
                    tempo_horas, 
                    corridas,
                    CASE WHEN tempo_horas > 0 THEN ROUND((corridas / tempo_horas), 2) ELSE 0 END as utr
                FROM aggregates 
                WHERE g_sub_praca=0
                ORDER BY utr DESC
                LIMIT 50
            ) t
        ),
        ''origem'', (
            SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (
                SELECT 
                    origem, 
                    tempo_horas, 
                    corridas,
                    CASE WHEN tempo_horas > 0 THEN ROUND((corridas / tempo_horas), 2) ELSE 0 END as utr
                FROM aggregates 
                WHERE g_origem=0
                ORDER BY utr DESC
                LIMIT 50
            ) t
        ),
        ''turno'', (
            SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (
                SELECT 
                    turno, 
                    tempo_horas, 
                    corridas,
                    CASE WHEN tempo_horas > 0 THEN ROUND((corridas / tempo_horas), 2) ELSE 0 END as utr
                FROM aggregates 
                WHERE g_turno=0
                ORDER BY utr DESC
                LIMIT 50
            ) t
        )
    );', v_where);

    EXECUTE v_sql INTO v_result;
    RETURN v_result;
END;
$function$
;

-- Nome: check_mv_refresh_status
CREATE OR REPLACE FUNCTION public.check_mv_refresh_status()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: check_mv_refresh_system_status
CREATE OR REPLACE FUNCTION public.check_mv_refresh_system_status()
 RETURNS TABLE(sistema_automatico text, triggers_ativos integer, mvs_pendentes integer, ultima_atualizacao timestamp with time zone, job_periodico text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
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

-- Nome: check_mv_status
CREATE OR REPLACE FUNCTION public.check_mv_status()
 RETURNS TABLE(mv_name text, needs_refresh boolean, refresh_in_progress boolean, last_refresh timestamp with time zone, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
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

-- Nome: clear_admin_cache
CREATE OR REPLACE FUNCTION public.clear_admin_cache()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
    -- Esta função pode ser chamada quando há mudanças administrativas
    -- para invalidar caches no frontend
    PERFORM pg_notify('admin_cache_clear', json_build_object(
        'timestamp', EXTRACT(EPOCH FROM NOW()),
        'action', 'cache_clear'
    )::text);
END;
$function$
;

-- Nome: count_unmigrated_records
CREATE OR REPLACE FUNCTION public.count_unmigrated_records()
 RETURNS TABLE(table_name text, unmigrated_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT 'user_profiles'::TEXT, COUNT(*)::BIGINT
    FROM public.user_profiles WHERE organization_id IS NULL
    UNION ALL
    SELECT 'dados_corridas'::TEXT, COUNT(*)::BIGINT
    FROM public.dados_corridas WHERE organization_id IS NULL
    UNION ALL
    SELECT 'dados_marketing'::TEXT, COUNT(*)::BIGINT
    FROM public.dados_marketing WHERE organization_id IS NULL
    UNION ALL
    SELECT 'dados_valores_cidade'::TEXT, COUNT(*)::BIGINT
    FROM public.dados_valores_cidade WHERE organization_id IS NULL;
$function$
;

-- Nome: create_organization
CREATE OR REPLACE FUNCTION public.create_organization(p_name text, p_slug text, p_max_users integer DEFAULT 10)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_org_id UUID;
BEGIN
  -- Apenas admin global pode criar organizações
  IF NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'Apenas administradores globais podem criar organizações';
  END IF;
  
  -- Validar slug (deve ser único e seguir padrão)
  IF p_slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Slug inválido. Use apenas letras minúsculas, números e hífens';
  END IF;
  
  -- Verificar se slug já existe
  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Slug já existe. Escolha outro.';
  END IF;
  
  -- Criar organização
  INSERT INTO public.organizations (name, slug, max_users, is_active)
  VALUES (p_name, p_slug, p_max_users, true)
  RETURNING id INTO new_org_id;
  
  RETURN new_org_id;
END;
$function$
;

-- Nome: dashboard_evolucao_mensal
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
$function$
;

-- Nome: dashboard_evolucao_semanal
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
$function$
;

-- Nome: dashboard_resumo
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
$function$
;

-- Nome: dashboard_resumo_v2
CREATE OR REPLACE FUNCTION public.dashboard_resumo_v2(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_semanas integer[] DEFAULT NULL::integer[], p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_turno text DEFAULT NULL::text, p_sub_pracas text[] DEFAULT NULL::text[], p_origens text[] DEFAULT NULL::text[], p_turnos text[] DEFAULT NULL::text[], p_filtro_modo text DEFAULT 'ano_semana'::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, aderencia_semanal jsonb, aderencia_dia jsonb, aderencia_turno jsonb, aderencia_sub_praca jsonb, aderencia_origem jsonb, dimensoes jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_org_filter uuid;
    v_is_admin boolean;
    v_user_id uuid;
    v_sql text;
    v_where text := ' WHERE 1=1 ';
BEGIN
    v_user_id := auth.uid();
    
    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) 
    INTO v_is_admin 
    FROM public.user_profiles 
    WHERE id = v_user_id;

    -- Organization Filter
    IF v_is_admin = true THEN
         v_org_filter := NULL;
         IF p_organization_id IS NOT NULL AND p_organization_id != '' THEN
             BEGIN v_org_filter := p_organization_id::uuid; EXCEPTION WHEN OTHERS THEN NULL; END;
         END IF;
    ELSE
         SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = v_user_id;
    END IF;

    IF v_org_filter IS NOT NULL THEN
        v_where := v_where || format(' AND organization_id = %L ', v_org_filter);
    END IF;

    -- Date Filter
    IF p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN
        v_where := v_where || format(' AND data_do_periodo >= %L AND data_do_periodo <= %L ', p_data_inicial, p_data_final);
    ELSIF p_filtro_modo = 'multiplas_semanas' AND p_semanas IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L AND semana_iso = ANY(%L) ', p_ano, p_semanas);
    ELSIF p_ano IS NOT NULL AND p_semana IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L AND semana_iso = %L ', p_ano, p_semana);
    ELSIF p_ano IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L ', p_ano);
    ELSE 
         v_where := v_where || format(' AND data_do_periodo >= %L ', CURRENT_DATE - 30);
    END IF;

    -- Filters
    IF p_praca IS NOT NULL AND p_praca <> '' AND LOWER(p_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND praca = ANY(string_to_array(%L, '','')) ', p_praca);
    END IF;
    IF p_sub_pracas IS NOT NULL AND array_length(p_sub_pracas, 1) > 0 THEN
        v_where := v_where || format(' AND sub_praca = ANY(%L) ', p_sub_pracas);
    ELSIF p_sub_praca IS NOT NULL AND p_sub_praca <> '' AND LOWER(p_sub_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND sub_praca = ANY(string_to_array(%L, '','')) ', p_sub_praca);
    END IF;
    IF p_origens IS NOT NULL AND array_length(p_origens, 1) > 0 THEN
        v_where := v_where || format(' AND origem = ANY(%L) ', p_origens);
    ELSIF p_origem IS NOT NULL AND p_origem <> '' AND LOWER(p_origem) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND origem = ANY(string_to_array(%L, '','')) ', p_origem);
    END IF;
    IF p_turnos IS NOT NULL AND array_length(p_turnos, 1) > 0 THEN
        v_where := v_where || format(' AND turno = ANY(%L) ', p_turnos);
    ELSIF p_turno IS NOT NULL AND p_turno <> '' AND LOWER(p_turno) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND turno = ANY(string_to_array(%L, '','')) ', p_turno);
    END IF;

    v_sql := '
    WITH filtered_data AS (
        SELECT * FROM public.mv_dashboard_resumo_v2
        ' || v_where || '
    ),
    dimensoes_calc AS (
        SELECT jsonb_build_object(
            ''pracas'', (SELECT COALESCE(jsonb_agg(DISTINCT praca) FILTER (WHERE praca IS NOT NULL), ''[]'') FROM filtered_data),
            ''sub_pracas'', (SELECT COALESCE(jsonb_agg(DISTINCT sub_praca) FILTER (WHERE sub_praca IS NOT NULL), ''[]'') FROM filtered_data),
            ''origens'', (SELECT COALESCE(jsonb_agg(DISTINCT origem) FILTER (WHERE origem IS NOT NULL), ''[]'') FROM filtered_data),
            ''turnos'', (SELECT COALESCE(jsonb_agg(DISTINCT turno) FILTER (WHERE turno IS NOT NULL), ''[]'') FROM filtered_data)
        ) as dimensoes_json
    )
    SELECT
        COALESCE(SUM(total_ofertadas), 0)::bigint as total_ofertadas, -- EXPLICIT CAST
        COALESCE(SUM(total_aceitas), 0)::bigint as total_aceitas,
        COALESCE(SUM(total_completadas), 0)::bigint as total_completadas,
        COALESCE(SUM(total_rejeitadas), 0)::bigint as total_rejeitadas,
        
        COALESCE((
            SELECT jsonb_agg(t) FROM (
                 SELECT semana_iso as semana, 
                        SUM(segundos_planejados) as segundos_planejados, 
                        SUM(segundos_realizados) as segundos_realizados
                 FROM filtered_data 
                 GROUP BY semana_iso ORDER BY semana_iso
            ) t
        ), ''[]''::jsonb) as aderencia_semanal,

        COALESCE((
            SELECT jsonb_agg(t) FROM (
                 SELECT data_do_periodo as data, -- Correctly aliased
                        SUM(segundos_planejados) as segundos_planejados, 
                        SUM(segundos_realizados) as segundos_realizados
                 FROM filtered_data 
                 GROUP BY data_do_periodo ORDER BY data_do_periodo
            ) t
        ), ''[]''::jsonb) as aderencia_dia,

        COALESCE((
            SELECT jsonb_agg(t) FROM (
                 SELECT turno, 
                        SUM(segundos_planejados) as segundos_planejados, 
                        SUM(segundos_realizados) as segundos_realizados
                 FROM filtered_data 
                 WHERE turno IS NOT NULL GROUP BY turno ORDER BY turno
            ) t
        ), ''[]''::jsonb) as aderencia_turno,

        COALESCE((
             SELECT jsonb_agg(t) FROM (
                  SELECT sub_praca, 
                         SUM(segundos_planejados) as segundos_planejados, 
                         SUM(segundos_realizados) as segundos_realizados
                  FROM filtered_data 
                  WHERE sub_praca IS NOT NULL GROUP BY sub_praca ORDER BY sub_praca
             ) t
        ), ''[]''::jsonb) as aderencia_sub_praca,

        COALESCE((
             SELECT jsonb_agg(t) FROM (
                  SELECT origem, 
                         SUM(segundos_planejados) as segundos_planejados, 
                         SUM(segundos_realizados) as segundos_realizados
                  FROM filtered_data 
                  WHERE origem IS NOT NULL GROUP BY origem ORDER BY origem
             ) t
        ), ''[]''::jsonb) as aderencia_origem,
        
        (SELECT dimensoes_json FROM dimensoes_calc) as dimensoes
    FROM filtered_data;';

    RETURN QUERY EXECUTE v_sql;
END;
$function$
;

-- Nome: dashboard_totals
CREATE OR REPLACE FUNCTION public.dashboard_totals(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text)
 RETURNS TABLE(corridas_ofertadas numeric, corridas_aceitas numeric, corridas_rejeitadas numeric, corridas_completadas numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(SUM(numero_de_corridas_ofertadas), 0)::numeric AS corridas_ofertadas,
    COALESCE(SUM(numero_de_corridas_aceitas), 0)::numeric AS corridas_aceitas,
    COALESCE(SUM(numero_de_corridas_rejeitadas), 0)::numeric AS corridas_rejeitadas,
    COALESCE(SUM(numero_de_corridas_completadas), 0)::numeric AS corridas_completadas
  FROM public.dados_corridas
  WHERE 
    -- Filtro por organization_id (admin global vê todos)
    (public.is_global_admin() OR organization_id = public.get_user_organization_id())
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR p_praca = '' OR praca = ANY(string_to_array(p_praca, ',')))
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem);
$function$
;

-- Nome: dashboard_utr_semanal
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
$function$
;

-- Nome: debug_dados_semana_35
CREATE OR REPLACE FUNCTION public.debug_dados_semana_35()
 RETURNS TABLE(data_periodo text, periodo text, escala_minima integer, duracao_periodo text, tempo_disponivel_absoluto text, horas_calculadas_segundos numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    TO_CHAR(data_do_periodo, 'YYYY-MM-DD') as data_periodo,
    periodo,
    numero_minimo_de_entregadores_regulares_na_escala,
    duracao_do_periodo,
    tempo_disponivel_absoluto,
    -- Calcula escala × duração em segundos
    numero_minimo_de_entregadores_regulares_na_escala::numeric *
    (EXTRACT(EPOCH FROM (duracao_do_periodo::interval)) / 3600.0) as horas_calculadas_segundos
  FROM public.dados_corridas
  WHERE TO_CHAR(data_do_periodo, 'WW') = '35'
    AND data_do_periodo IS NOT NULL
    AND periodo IS NOT NULL
    AND numero_minimo_de_entregadores_regulares_na_escala IS NOT NULL
    AND duracao_do_periodo IS NOT NULL
  ORDER BY data_do_periodo, periodo, numero_minimo_de_entregadores_regulares_na_escala;
$function$
;

-- Nome: debug_entregadores_dados
CREATE OR REPLACE FUNCTION public.debug_entregadores_dados()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
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

-- Nome: debug_utr_count
CREATE OR REPLACE FUNCTION public.debug_utr_count(p_ano integer, p_semana integer, p_org uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_sql text;
    v_count integer;
    v_where text := ' WHERE 1=1 ';
BEGIN
    v_where := v_where || format(' AND organization_id = %L ', p_org);
    v_where := v_where || format(' AND ano_iso = %L AND semana_iso = %L ', p_ano, p_semana);
    
    v_sql := format('SELECT count(*)::int FROM mv_dashboard_resumo %s', v_where);
    
    RAISE NOTICE 'SQL: %', v_sql;
    
    EXECUTE v_sql INTO v_count;
    RETURN v_count;
END;
$function$
;

-- Nome: debug_utr_raw
CREATE OR REPLACE FUNCTION public.debug_utr_raw(p_ano integer, p_semana integer, p_org uuid)
 RETURNS TABLE(corridas numeric, tempo_horas numeric, g_praca integer, g_sub_praca integer, g_origem integer, g_turno integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_sql text;
    v_where text := ' WHERE 1=1 ';
BEGIN
    v_where := v_where || format(' AND organization_id = %L ', p_org);
    v_where := v_where || format(' AND ano_iso = %L AND semana_iso = %L ', p_ano, p_semana);
    
    v_sql := format('
        SELECT 
            SUM(total_completadas)::numeric as corridas,
            SUM(segundos_planejados) / 3600.0 as tempo_horas,
            GROUPING(praca) as g_praca,
            GROUPING(sub_praca) as g_sub_praca,
            GROUPING(origem) as g_origem,
            GROUPING(turno) as g_turno
        FROM 
            mv_dashboard_resumo
        %s
        GROUP BY GROUPING SETS (
            (),
            (praca),
            (sub_praca),
            (origem),
            (turno)
        )
    ', v_where);
    
    RETURN QUERY EXECUTE v_sql;
END;
$function$
;

-- Nome: delete_all_dados_marketing
CREATE OR REPLACE FUNCTION public.delete_all_dados_marketing()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET statement_timeout TO '120s'
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count integer := 0;
  batch_count integer;
  batch_size integer := 2000;
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar todos os dados de marketing';
  END IF;
  
  -- Deletar em lotes para evitar timeout
  LOOP
    DELETE FROM public.dados_marketing
    WHERE id IN (
      SELECT id FROM public.dados_marketing LIMIT batch_size
    );
    
    GET DIAGNOSTICS batch_count = ROW_COUNT;
    deleted_count := deleted_count + batch_count;
    
    -- Sair do loop quando não houver mais registros
    EXIT WHEN batch_count = 0;
    
    -- Commit implícito entre lotes (cada iteração é uma nova transação parcial)
  END LOOP;
  
  RETURN deleted_count;
END;
$function$
;

-- Nome: delete_all_dados_valores_cidade
CREATE OR REPLACE FUNCTION public.delete_all_dados_valores_cidade()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count BIGINT;
BEGIN
  -- Obter contagem antes de deletar
  SELECT COUNT(*) INTO deleted_count FROM public.dados_valores_cidade;
  
  -- Usar TRUNCATE que é mais eficiente para deletar todos os registros
  -- TRUNCATE não requer WHERE clause e é mais rápido
  TRUNCATE TABLE public.dados_valores_cidade RESTART IDENTITY;
  
  RETURN deleted_count;
END;
$function$
;

-- Nome: distribuicao_atividades_hora
CREATE OR REPLACE FUNCTION public.distribuicao_atividades_hora(p_data_inicio timestamp with time zone DEFAULT (now() - '24:00:00'::interval), p_data_fim timestamp with time zone DEFAULT now())
 RETURNS TABLE(hora integer, total_acoes bigint, usuarios_unicos bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
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

-- Nome: distribuicao_por_aba
CREATE OR REPLACE FUNCTION public.distribuicao_por_aba(p_data_inicio timestamp with time zone DEFAULT (now() - '24:00:00'::interval), p_data_fim timestamp with time zone DEFAULT now())
 RETURNS TABLE(tab_name text, total_acoes bigint, usuarios_unicos bigint, percentual numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
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

-- Nome: estatisticas_atividade_periodo
CREATE OR REPLACE FUNCTION public.estatisticas_atividade_periodo(p_data_inicio timestamp with time zone DEFAULT (now() - '24:00:00'::interval), p_data_fim timestamp with time zone DEFAULT now())
 RETURNS TABLE(total_acoes bigint, usuarios_unicos bigint, acoes_por_hora numeric, aba_mais_usada text, pico_atividade timestamp with time zone, periodo_mais_ativo text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
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

-- Nome: force_refresh_mv_dashboard_aderencia_metricas
CREATE OR REPLACE FUNCTION public.force_refresh_mv_dashboard_aderencia_metricas()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  result_text TEXT;
BEGIN
  -- Desbloquear se estiver travada
  UPDATE public.mv_refresh_control
  SET refresh_in_progress = false
  WHERE mv_name = 'mv_dashboard_aderencia_metricas';
  
  -- Tentar atualizar a MV com timeout maior
  BEGIN
    SET statement_timeout = '300s'; -- 5 minutos
    REFRESH MATERIALIZED VIEW public.mv_dashboard_aderencia_metricas;
    RESET statement_timeout;
    
    -- Marcar como atualizada
    UPDATE public.mv_refresh_control
    SET 
      needs_refresh = false,
      refresh_in_progress = false,
      last_refresh = NOW(),
      updated_at = NOW()
    WHERE mv_name = 'mv_dashboard_aderencia_metricas';
    
    result_text := 'MV atualizada com sucesso';
  EXCEPTION WHEN OTHERS THEN
    RESET statement_timeout;
    result_text := 'Erro ao atualizar: ' || SQLERRM;
    RAISE WARNING 'Erro ao atualizar mv_dashboard_aderencia_metricas: %', SQLERRM;
  END;
  
  RETURN result_text;
END;
$function$
;

-- Nome: get_active_weeks_for_year
CREATE OR REPLACE FUNCTION public.get_active_weeks_for_year(year_input integer)
 RETURNS TABLE(data_do_periodo date)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT data_do_periodo
  FROM dados_corridas
  WHERE EXTRACT(YEAR FROM data_do_periodo) = year_input
  ORDER BY data_do_periodo DESC;
$function$
;

-- Nome: get_admin_stats
CREATE OR REPLACE FUNCTION public.get_admin_stats()
 RETURNS TABLE(total_users integer, pending_users integer, approved_users integer, admin_users integer, total_pracas integer)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
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

-- Nome: get_available_weeks
CREATE OR REPLACE FUNCTION public.get_available_weeks(p_ano_iso integer)
 RETURNS TABLE(semana_iso integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT semana_iso 
  FROM mv_dashboard_resumo 
  WHERE ano_iso = p_ano_iso 
  AND semana_iso IS NOT NULL
  ORDER BY semana_iso DESC;
$function$
;

-- Nome: get_available_weeks
CREATE OR REPLACE FUNCTION public.get_available_weeks(p_ano_iso integer, p_organization_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(semana_iso integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT semana_iso
  FROM mv_dashboard_resumo
  WHERE ano_iso = p_ano_iso
  AND (p_organization_id IS NULL OR organization_id = p_organization_id)
  AND semana_iso IS NOT NULL
  ORDER BY semana_iso DESC;
$function$
;

-- Nome: get_city_last_updates
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
$function$
;

-- Nome: get_current_user_profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: get_entregadores_details
CREATE OR REPLACE FUNCTION public.get_entregadores_details(p_organization_id uuid DEFAULT NULL::uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_tipo text DEFAULT 'ALL'::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_search text DEFAULT NULL::text, p_praca text DEFAULT NULL::text)
 RETURNS TABLE(id_entregador text, nome text, regiao_atuacao text, total_segundos bigint, total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: get_entregadores_details
CREATE OR REPLACE FUNCTION public.get_entregadores_details(p_organization_id uuid DEFAULT NULL::uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_tipo text DEFAULT 'ALL'::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_search text DEFAULT NULL::text)
 RETURNS TABLE(id_entregador text, nome text, regiao_atuacao text, total_segundos bigint, total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: get_entregadores_marketing
CREATE OR REPLACE FUNCTION public.get_entregadores_marketing(p_organization_id uuid DEFAULT NULL::uuid, rodou_dia_inicial date DEFAULT NULL::date, rodou_dia_final date DEFAULT NULL::date, data_inicio_inicial date DEFAULT NULL::date, data_inicio_final date DEFAULT NULL::date, cidade text DEFAULT NULL::text)
 RETURNS TABLE(id_entregador text, nome text, total_ofertadas bigint, total_aceitas bigint, total_completadas bigint, total_rejeitadas bigint, total_segundos bigint, ultima_data text, dias_sem_rodar integer, regiao_atuacao text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
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

-- Nome: get_fluxo_semanal
CREATE OR REPLACE FUNCTION public.get_fluxo_semanal(p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id uuid DEFAULT NULL::uuid, p_praca text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: get_gamification_leaderboard
CREATE OR REPLACE FUNCTION public.get_gamification_leaderboard()
 RETURNS TABLE(rank bigint, user_name text, avatar_url text, pracas text, total_badges bigint, badges_list jsonb, current_streak integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: get_marketing_atendentes_data
CREATE OR REPLACE FUNCTION public.get_marketing_atendentes_data(data_envio_inicial text DEFAULT NULL::text, data_envio_final text DEFAULT NULL::text, data_liberacao_inicial text DEFAULT NULL::text, data_liberacao_final text DEFAULT NULL::text, p_organization_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(responsavel text, enviado bigint, liberado bigint, cidade text, cidade_enviado bigint, cidade_liberado bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Se organization_id for NULL, retornar vazio
  IF p_organization_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH base_data AS (
    SELECT 
      dm.responsavel,
      CASE 
        WHEN dm.regiao_atuacao = 'ABC 2.0' AND dm.sub_praca_abc IN ('Vila Aquino', 'São Caetano') THEN 'Santo André'
        WHEN dm.regiao_atuacao = 'ABC 2.0' AND dm.sub_praca_abc IN ('Diadema', 'Nova petrópolis', 'Rudge Ramos') THEN 'São Bernardo'
        ELSE dm.regiao_atuacao
      END as cidade_nome,
      dm.data_envio,
      dm.data_liberacao
    FROM public.dados_marketing dm
    WHERE dm.organization_id = p_organization_id
      AND dm.responsavel IS NOT NULL
  )
  SELECT 
    bd.responsavel::text,
    COUNT(*) FILTER (
      WHERE bd.data_envio IS NOT NULL
        AND (data_envio_inicial IS NULL OR bd.data_envio >= data_envio_inicial::date)
        AND (data_envio_final IS NULL OR bd.data_envio <= data_envio_final::date)
    )::bigint as enviado,
    COUNT(*) FILTER (
      WHERE bd.data_liberacao IS NOT NULL
        AND (data_liberacao_inicial IS NULL OR bd.data_liberacao >= data_liberacao_inicial::date)
        AND (data_liberacao_final IS NULL OR bd.data_liberacao <= data_liberacao_final::date)
    )::bigint as liberado,
    bd.cidade_nome::text,
    COUNT(*) FILTER (
      WHERE bd.data_envio IS NOT NULL
        AND (data_envio_inicial IS NULL OR bd.data_envio >= data_envio_inicial::date)
        AND (data_envio_final IS NULL OR bd.data_envio <= data_envio_final::date)
    )::bigint as cidade_enviado,
    COUNT(*) FILTER (
      WHERE bd.data_liberacao IS NOT NULL
        AND (data_liberacao_inicial IS NULL OR bd.data_liberacao >= data_liberacao_inicial::date)
        AND (data_liberacao_final IS NULL OR bd.data_liberacao <= data_liberacao_final::date)
    )::bigint as cidade_liberado
  FROM base_data bd
  GROUP BY bd.responsavel, bd.cidade_nome
  ORDER BY bd.responsavel, bd.cidade_nome;
END;
$function$
;

-- Nome: get_marketing_atendentes_data
CREATE OR REPLACE FUNCTION public.get_marketing_atendentes_data(data_envio_inicial text DEFAULT NULL::text, data_envio_final text DEFAULT NULL::text, data_liberacao_inicial text DEFAULT NULL::text, data_liberacao_final text DEFAULT NULL::text)
 RETURNS TABLE(responsavel text, enviado bigint, liberado bigint, cidade text, cidade_enviado bigint, cidade_liberado bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_org_id UUID;
BEGIN
  -- Obter organization_id do usuário
  IF public.is_global_admin() THEN
    user_org_id := NULL;
  ELSE
    user_org_id := public.get_user_organization_id();
  END IF;
  
  RETURN QUERY
  WITH base_data AS (
    SELECT 
      dm.responsavel,
      CASE 
        WHEN dm.regiao_atuacao = 'ABC 2.0' AND dm.sub_praca_abc IN ('Vila Aquino', 'São Caetano') THEN 'Santo André'
        WHEN dm.regiao_atuacao = 'ABC 2.0' AND dm.sub_praca_abc IN ('Diadema', 'Nova petrópolis', 'Rudge Ramos') THEN 'São Bernardo'
        ELSE dm.regiao_atuacao
      END as cidade_nome,
      dm.data_envio,
      dm.data_liberacao
    FROM public.dados_marketing dm
    WHERE dm.responsavel IS NOT NULL
      AND (user_org_id IS NULL OR dm.organization_id = user_org_id)
  )
  SELECT 
    bd.responsavel::text,
    COUNT(*) FILTER (
      WHERE bd.data_envio IS NOT NULL
        AND (data_envio_inicial IS NULL OR bd.data_envio >= data_envio_inicial::date)
        AND (data_envio_final IS NULL OR bd.data_envio <= data_envio_final::date)
    )::bigint as enviado,
    COUNT(*) FILTER (
      WHERE bd.data_liberacao IS NOT NULL
        AND (data_liberacao_inicial IS NULL OR bd.data_liberacao >= data_liberacao_inicial::date)
        AND (data_liberacao_final IS NULL OR bd.data_liberacao <= data_liberacao_final::date)
    )::bigint as liberado,
    bd.cidade_nome::text,
    COUNT(*) FILTER (
      WHERE bd.data_envio IS NOT NULL
        AND (data_envio_inicial IS NULL OR bd.data_envio >= data_envio_inicial::date)
        AND (data_envio_final IS NULL OR bd.data_envio <= data_envio_final::date)
    )::bigint as cidade_enviado,
    COUNT(*) FILTER (
      WHERE bd.data_liberacao IS NOT NULL
        AND (data_liberacao_inicial IS NULL OR bd.data_liberacao >= data_liberacao_inicial::date)
        AND (data_liberacao_final IS NULL OR bd.data_liberacao <= data_liberacao_final::date)
    )::bigint as cidade_liberado
  FROM base_data bd
  GROUP BY bd.responsavel, bd.cidade_nome
  ORDER BY bd.responsavel, bd.cidade_nome;
END;
$function$
;

-- Nome: get_marketing_cities_data
CREATE OR REPLACE FUNCTION public.get_marketing_cities_data(data_envio_inicial text DEFAULT NULL::text, data_envio_final text DEFAULT NULL::text, data_liberacao_inicial text DEFAULT NULL::text, data_liberacao_final text DEFAULT NULL::text, rodou_dia_inicial text DEFAULT NULL::text, rodou_dia_final text DEFAULT NULL::text, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(cidade text, enviado bigint, liberado bigint, rodando_inicio bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: get_marketing_cities_data
CREATE OR REPLACE FUNCTION public.get_marketing_cities_data(data_envio_inicial text DEFAULT NULL::text, data_envio_final text DEFAULT NULL::text, data_liberacao_inicial text DEFAULT NULL::text, data_liberacao_final text DEFAULT NULL::text, rodou_dia_inicial text DEFAULT NULL::text, rodou_dia_final text DEFAULT NULL::text)
 RETURNS TABLE(cidade text, enviado bigint, liberado bigint, rodando_inicio bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_org_id UUID;
BEGIN
  -- Obter organization_id do usuário
  IF public.is_global_admin() THEN
    user_org_id := NULL;
  ELSE
    user_org_id := public.get_user_organization_id();
  END IF;
  
  RETURN QUERY
  WITH cidade_data AS (
    SELECT 
      CASE 
        WHEN regiao_atuacao = 'ABC 2.0' AND sub_praca_abc IN ('Vila Aquino', 'São Caetano') THEN 'Santo André'
        WHEN regiao_atuacao = 'ABC 2.0' AND sub_praca_abc IN ('Diadema', 'Nova petrópolis', 'Rudge Ramos') THEN 'São Bernardo'
        ELSE regiao_atuacao
      END as cidade_nome,
      COUNT(*) FILTER (
        WHERE data_envio IS NOT NULL
          AND (data_envio_inicial IS NULL OR data_envio >= data_envio_inicial::date)
          AND (data_envio_final IS NULL OR data_envio <= data_envio_final::date)
      )::bigint as enviado,
      COUNT(*) FILTER (
        WHERE data_liberacao IS NOT NULL
          AND (data_liberacao_inicial IS NULL OR data_liberacao >= data_liberacao_inicial::date)
          AND (data_liberacao_final IS NULL OR data_liberacao <= data_liberacao_final::date)
      )::bigint as liberado,
      COUNT(*) FILTER (
        WHERE rodou_dia IS NOT NULL
          AND (rodou_dia_inicial IS NULL OR rodou_dia >= rodou_dia_inicial::date)
          AND (rodou_dia_final IS NULL OR rodou_dia <= rodou_dia_final::date)
      )::bigint as rodando_inicio
    FROM public.dados_marketing
    WHERE regiao_atuacao IS NOT NULL
      AND (user_org_id IS NULL OR organization_id = user_org_id)
    GROUP BY cidade_nome
  )
  SELECT 
    cidade_nome::text,
    COALESCE(enviado, 0)::bigint,
    COALESCE(liberado, 0)::bigint,
    COALESCE(rodando_inicio, 0)::bigint
  FROM cidade_data
  ORDER BY cidade_nome;
END;
$function$
;

-- Nome: get_marketing_comparison_weekly
CREATE OR REPLACE FUNCTION public.get_marketing_comparison_weekly(data_inicial date DEFAULT CURRENT_DATE, data_final date DEFAULT CURRENT_DATE, p_organization_id uuid DEFAULT NULL::uuid, p_praca text DEFAULT NULL::text)
 RETURNS TABLE(semana_iso text, segundos_ops bigint, segundos_mkt bigint, ofertadas_ops bigint, ofertadas_mkt bigint, aceitas_ops bigint, aceitas_mkt bigint, concluidas_ops bigint, concluidas_mkt bigint, rejeitadas_ops bigint, rejeitadas_mkt bigint, valor_ops numeric, valor_mkt numeric, entregadores_ops bigint, entregadores_mkt bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: get_marketing_totals
CREATE OR REPLACE FUNCTION public.get_marketing_totals(data_envio_inicial date DEFAULT NULL::date, data_envio_final date DEFAULT NULL::date, data_liberacao_inicial date DEFAULT NULL::date, data_liberacao_final date DEFAULT NULL::date, rodou_dia_inicial date DEFAULT NULL::date, rodou_dia_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS TABLE(criado bigint, enviado bigint, liberado bigint, rodando_inicio bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: get_my_organization_id
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT organization_id 
  FROM public.user_profiles 
  WHERE id = auth.uid();
$function$
;

-- Nome: get_origens_by_praca
CREATE OR REPLACE FUNCTION public.get_origens_by_praca(p_pracas text[])
 RETURNS SETOF text
 LANGUAGE plpgsql
 SET search_path TO 'public'
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

-- Nome: get_pending_mvs
CREATE OR REPLACE FUNCTION public.get_pending_mvs()
 RETURNS TABLE(mv_name text, priority integer, needs_refresh boolean, last_refresh timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: get_semanas_data_v2
CREATE OR REPLACE FUNCTION public.get_semanas_data_v2(ano_param integer)
 RETURNS TABLE(data_do_periodo date)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT data_do_periodo
  FROM dados_corridas
  WHERE EXTRACT(YEAR FROM data_do_periodo) = ano_param
  ORDER BY data_do_periodo DESC;
$function$
;

-- Nome: get_subpracas_by_praca
CREATE OR REPLACE FUNCTION public.get_subpracas_by_praca(p_pracas text[])
 RETURNS SETOF text
 LANGUAGE plpgsql
 SET search_path TO 'public'
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

-- Nome: get_turnos_by_praca
CREATE OR REPLACE FUNCTION public.get_turnos_by_praca(p_pracas text[])
 RETURNS SETOF text
 LANGUAGE plpgsql
 SET search_path TO 'public'
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

-- Nome: get_user_organization
CREATE OR REPLACE FUNCTION public.get_user_organization()
 RETURNS TABLE(id uuid, name text, slug text, max_users integer, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.max_users,
    o.is_active,
    o.created_at,
    o.updated_at
  FROM public.organizations o
  WHERE o.id = public.get_user_organization_id();
$function$
;

-- Nome: get_user_organization_for_sync
CREATE OR REPLACE FUNCTION public.get_user_organization_for_sync(user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT organization_id
  FROM public.user_profiles
  WHERE id = user_id;
$function$
;

-- Nome: get_user_organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID;
$function$
;

-- Nome: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil: % - %', SQLERRM, SQLSTATE;
    RAISE;
END;
$function$
;

-- Nome: handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

-- Nome: hhmmss_to_seconds
CREATE OR REPLACE FUNCTION public.hhmmss_to_seconds(value text)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  hh int;
  mm int;
  ss int;
BEGIN
  IF value IS NULL OR trim(value) = '' THEN
    RETURN 0;
  END IF;

  BEGIN
    RETURN EXTRACT(EPOCH FROM value::interval);
  EXCEPTION WHEN others THEN
    BEGIN
      SELECT split_part(value, ':', 1)::int,
             split_part(value, ':', 2)::int,
             split_part(value, ':', 3)::int
      INTO hh, mm, ss;
      RETURN hh * 3600 + mm * 60 + ss;
    EXCEPTION WHEN others THEN
      RETURN 0;
    END;
  END;
END $function$
;

-- Nome: historico_atividades_usuario
CREATE OR REPLACE FUNCTION public.historico_atividades_usuario(p_user_id uuid, p_start_date timestamp with time zone DEFAULT (now() - '7 days'::interval), p_end_date timestamp with time zone DEFAULT now())
 RETURNS TABLE(id uuid, action_type text, action_details text, tab_name text, filters_applied jsonb, created_at timestamp with time zone, session_id text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: insert_dados_corridas_batch
CREATE OR REPLACE FUNCTION public.insert_dados_corridas_batch(dados jsonb[])
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    error_count INTEGER := 0;
    errors TEXT[] := '{}';
    item jsonb;
    i INTEGER;
    user_org_id UUID;
BEGIN
    -- Obter organization_id do usuário atual
    user_org_id := public.get_user_organization_id();
    
    -- Se não tiver organization_id e não for admin global, usar organização padrão
    IF user_org_id IS NULL AND NOT public.is_global_admin() THEN
        user_org_id := '00000000-0000-0000-0000-000000000001'::UUID;
    END IF;
    
    -- Inserir cada item do array individualmente
    FOR i IN 1..array_length(dados, 1)
    LOOP
        item := dados[i];
        
        BEGIN
            INSERT INTO public.dados_corridas (
                data_do_periodo,
                periodo,
                duracao_do_periodo,
                numero_minimo_de_entregadores_regulares_na_escala,
                tag,
                id_da_pessoa_entregadora,
                pessoa_entregadora,
                tempo_disponivel_escalado,
                tempo_disponivel_absoluto,
                numero_de_corridas_ofertadas,
                numero_de_corridas_aceitas,
                numero_de_corridas_rejeitadas,
                numero_de_corridas_completadas,
                numero_de_corridas_canceladas_pela_pessoa_entregadora,
                numero_de_pedidos_aceitos_e_concluidos,
                soma_das_taxas_das_corridas_aceitas,
                duracao_segundos,
                origem,
                praca,
                sub_praca,
                organization_id
            )
            VALUES (
                (NULLIF(item->>'data_do_periodo', '')::date),
                NULLIF(item->>'periodo', '')::text,
                NULLIF(item->>'duracao_do_periodo', '')::text,
                (NULLIF(item->>'numero_minimo_de_entregadores_regulares_na_escala', '')::numeric)::integer,
                NULLIF(item->>'tag', '')::text,
                NULLIF(item->>'id_da_pessoa_entregadora', '')::text,
                NULLIF(item->>'pessoa_entregadora', '')::text,
                NULLIF(item->>'tempo_disponivel_escalado', '')::text,
                NULLIF(item->>'tempo_disponivel_absoluto', '')::text,
                (NULLIF(item->>'numero_de_corridas_ofertadas', '')::numeric)::integer,
                (NULLIF(item->>'numero_de_corridas_aceitas', '')::numeric)::integer,
                (NULLIF(item->>'numero_de_corridas_rejeitadas', '')::numeric)::integer,
                (NULLIF(item->>'numero_de_corridas_completadas', '')::numeric)::integer,
                (NULLIF(item->>'numero_de_corridas_canceladas_pela_pessoa_entregadora', '')::numeric)::integer,
                (NULLIF(item->>'numero_de_pedidos_aceitos_e_concluidos', '')::numeric)::integer,
                NULLIF(item->>'soma_das_taxas_das_corridas_aceitas', '')::numeric,
                NULLIF(item->>'duracao_segundos', '')::numeric,
                NULLIF(item->>'origem', '')::text,
                NULLIF(item->>'praca', '')::text,
                NULLIF(item->>'sub_praca', '')::text,
                -- Usar organization_id do item se fornecido, senão usar do usuário
                COALESCE(
                    CASE 
                        WHEN item->>'organization_id' IS NOT NULL AND item->>'organization_id' != '' AND item->>'organization_id' != 'null'
                        THEN (item->>'organization_id')::UUID
                        ELSE NULL
                    END,
                    user_org_id
                )
            );
            
            inserted_count := inserted_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            errors := array_append(errors, format('Item %s: %s', i, SQLERRM));
        END;
    END LOOP;
    
    RETURN json_build_object(
        'success', error_count = 0,
        'inserted', inserted_count,
        'errors', error_count,
        'error_messages', errors
    );
END;
$function$
;

-- Nome: insert_dados_marketing_batch
CREATE OR REPLACE FUNCTION public.insert_dados_marketing_batch(dados jsonb[])
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    error_count INTEGER := 0;
    errors TEXT[] := '{}';
    item jsonb;
    i INTEGER;
    user_org_id UUID;
BEGIN
    -- Obter organization_id do usuário atual
    user_org_id := public.get_user_organization_id();
    
    -- Se não tiver organization_id e não for admin global, usar organização padrão
    IF user_org_id IS NULL AND NOT public.is_global_admin() THEN
        user_org_id := '00000000-0000-0000-0000-000000000001'::UUID;
    END IF;
    
    -- Inserir cada item do array individualmente
    FOR i IN 1..array_length(dados, 1)
    LOOP
        item := dados[i];
        
        BEGIN
            INSERT INTO public.dados_marketing (
                nome,
                status,
                regiao_atuacao,
                sub_praca_abc,
                telefone_trabalho,
                outro_telefone,
                data_envio,
                id_entregador,
                data_liberacao,
                rodando,
                rodou_dia,
                responsavel,
                organization_id
            )
            VALUES (
                NULLIF(item->>'nome', '')::text,
                NULLIF(item->>'status', '')::text,
                NULLIF(item->>'regiao_atuacao', '')::text,
                NULLIF(item->>'sub_praca_abc', '')::text,
                NULLIF(item->>'telefone_trabalho', '')::text,
                NULLIF(item->>'outro_telefone', '')::text,
                CASE 
                    WHEN item->>'data_envio' IS NOT NULL AND item->>'data_envio' != '' AND item->>'data_envio' != 'null' 
                    THEN (item->>'data_envio')::date 
                    ELSE NULL 
                END,
                NULLIF(item->>'id_entregador', '')::text,
                CASE 
                    WHEN item->>'data_liberacao' IS NOT NULL AND item->>'data_liberacao' != '' AND item->>'data_liberacao' != 'null' 
                    THEN (item->>'data_liberacao')::date 
                    ELSE NULL 
                END,
                NULLIF(item->>'rodando', '')::text,
                CASE 
                    WHEN item->>'rodou_dia' IS NOT NULL AND item->>'rodou_dia' != '' AND item->>'rodou_dia' != 'null' 
                    THEN (item->>'rodou_dia')::date 
                    ELSE NULL 
                END,
                NULLIF(item->>'responsavel', '')::text,
                -- Usar organization_id do item se fornecido, senão usar do usuário
                COALESCE(
                    CASE 
                        WHEN item->>'organization_id' IS NOT NULL AND item->>'organization_id' != '' AND item->>'organization_id' != 'null'
                        THEN (item->>'organization_id')::UUID
                        ELSE NULL
                    END,
                    user_org_id
                )
            );
            
            inserted_count := inserted_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            errors := array_append(errors, format('Item %s: %s', i, SQLERRM));
        END;
    END LOOP;
    
    RETURN json_build_object(
        'success', error_count = 0,
        'inserted', inserted_count,
        'errors', error_count,
        'error_messages', errors
    );
END;
$function$
;

-- Nome: is_admin_or_master
CREATE OR REPLACE FUNCTION public.is_admin_or_master()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: is_current_user_admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT COALESCE(
    (SELECT is_admin FROM public.user_profiles WHERE id = (SELECT auth.uid())),
    false
  );
$function$
;

-- Nome: is_global_admin
CREATE OR REPLACE FUNCTION public.is_global_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    );
$function$
;

-- Nome: is_org_admin
CREATE OR REPLACE FUNCTION public.is_org_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_admin = true OR role IN ('admin', 'marketing', 'master')
     FROM public.user_profiles 
     WHERE id = auth.uid()),
    false
  );
$function$
;

-- Nome: is_user_admin
CREATE OR REPLACE FUNCTION public.is_user_admin(p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_is_admin BOOLEAN := FALSE;
  v_user_meta JSONB;
BEGIN
  -- Verificar em auth.users metadata
  SELECT raw_user_meta_data INTO v_user_meta
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_user_meta IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar campos is_admin ou isAdmin no metadata
  v_is_admin := COALESCE(
    (v_user_meta->>'is_admin')::boolean,
    (v_user_meta->>'isAdmin')::boolean,
    FALSE
  );
  
  -- Se não encontrou no metadata, tentar verificar através da função get_current_user_profile
  IF v_is_admin IS FALSE THEN
    BEGIN
      -- Tentar chamar get_current_user_profile se existir
      -- Nota: Esta função pode retornar JSONB ou uma estrutura diferente
      -- Se der erro, apenas retornar FALSE
      SELECT (get_current_user_profile()->>'is_admin')::boolean INTO v_is_admin;
      
      IF v_is_admin IS TRUE THEN
        RETURN TRUE;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Se a função não existir ou der erro, retornar o valor do metadata
      NULL;
    END;
  END IF;
  
  RETURN COALESCE(v_is_admin, FALSE);
END;
$function$
;

-- Nome: limpar_atividades_antigas
CREATE OR REPLACE FUNCTION public.limpar_atividades_antigas(p_dias_manter integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
    v_is_admin BOOLEAN;
    v_deleted_count INTEGER;
BEGIN
    -- Verificar se é admin
    SELECT is_admin INTO v_is_admin
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF v_is_admin IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Apenas admins podem executar esta função');
    END IF;
    
    -- Deletar atividades antigas
    DELETE FROM public.user_activities
    WHERE timestamp < NOW() - (p_dias_manter || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'atividades_removidas', v_deleted_count,
        'data_limite', NOW() - (p_dias_manter || ' days')::INTERVAL
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$
;

-- Nome: list_all_organizations
CREATE OR REPLACE FUNCTION public.list_all_organizations()
 RETURNS TABLE(id uuid, name text, slug text, max_users integer, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, user_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Apenas admin global pode listar todas as organizações
  IF NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'Apenas administradores globais podem listar organizações';
  END IF;
  
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.max_users,
    o.is_active,
    o.created_at,
    o.updated_at,
    COUNT(up.id)::BIGINT as user_count
  FROM public.organizations o
  LEFT JOIN public.user_profiles up ON up.organization_id = o.id
  GROUP BY o.id, o.name, o.slug, o.max_users, o.is_active, o.created_at, o.updated_at
  ORDER BY o.created_at DESC;
END;
$function$
;

-- Nome: list_all_users
CREATE OR REPLACE FUNCTION public.list_all_users()
 RETURNS TABLE(id uuid, full_name text, email text, role text, is_admin boolean, is_approved boolean, created_at timestamp with time zone, approved_at timestamp with time zone, organization_id uuid, assigned_pracas text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: list_all_users_optimized
CREATE OR REPLACE FUNCTION public.list_all_users_optimized()
 RETURNS TABLE(id uuid, full_name text, email text, is_admin boolean, is_approved boolean, assigned_pracas text[], created_at timestamp with time zone, approved_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
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

-- Nome: list_pending_users
CREATE OR REPLACE FUNCTION public.list_pending_users()
 RETURNS TABLE(id uuid, full_name text, email text, role text, is_admin boolean, is_approved boolean, created_at timestamp with time zone, approved_at timestamp with time zone, organization_id uuid, assigned_pracas text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: list_pracas_disponiveis
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
$function$
;

-- Nome: list_pracas_disponiveis_otimizada
CREATE OR REPLACE FUNCTION public.list_pracas_disponiveis_otimizada()
 RETURNS TABLE(praca text)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
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

-- Nome: listar_anos_disponiveis
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
$function$
;

-- Nome: listar_dimensoes_dashboard
CREATE OR REPLACE FUNCTION public.listar_dimensoes_dashboard(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
WITH base AS (
  SELECT DISTINCT
    ano_iso,
    semana_numero,
    praca,
    sub_praca,
    origem
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND (p_ano IS NULL OR ano_iso = p_ano)
    AND (p_semana IS NULL OR semana_numero = p_semana)
    AND (p_praca IS NULL OR praca = p_praca)
    AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
    AND (p_origem IS NULL OR origem = p_origem)
)
SELECT jsonb_build_object(
  'anos', COALESCE((
    SELECT jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC)
    FROM base
    WHERE ano_iso IS NOT NULL
  ), '[]'::jsonb),
  'semanas', COALESCE((
    SELECT jsonb_agg(DISTINCT (ano_iso || '-W' || LPAD(semana_numero::text, 2, '0')) ORDER BY (ano_iso || '-W' || LPAD(semana_numero::text, 2, '0')) DESC)
    FROM base
    WHERE semana_numero IS NOT NULL AND ano_iso IS NOT NULL
  ), '[]'::jsonb),
  'pracas', COALESCE((
    SELECT jsonb_agg(DISTINCT praca ORDER BY praca)
    FROM base
    WHERE praca IS NOT NULL
  ), '[]'::jsonb),
  'sub_pracas', COALESCE((
    SELECT jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca)
    FROM base
    WHERE sub_praca IS NOT NULL
  ), '[]'::jsonb),
  'origens', COALESCE((
    SELECT jsonb_agg(DISTINCT origem ORDER BY origem)
    FROM base
    WHERE origem IS NOT NULL
  ), '[]'::jsonb)
);
$function$
;

-- Nome: listar_entregadores
CREATE OR REPLACE FUNCTION public.listar_entregadores(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: listar_entregadores_v2
CREATE OR REPLACE FUNCTION public.listar_entregadores_v2(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_sql text;
    v_where text := ' WHERE 1=1 ';
    v_result jsonb;
    v_org_filter uuid;
    v_is_admin boolean;
BEGIN
    -- Auth Logic
    BEGIN 
        v_org_filter := NULLIF(p_organization_id, '')::uuid; 
    EXCEPTION WHEN OTHERS THEN 
        v_org_filter := NULL; 
    END;

    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) INTO v_is_admin FROM public.user_profiles WHERE id = auth.uid();
    
    IF v_org_filter IS NULL THEN
        IF v_is_admin IS NOT TRUE THEN
            SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid();
            IF v_org_filter IS NULL THEN
                v_org_filter := '00000000-0000-0000-0000-000000000000'; 
            END IF;
        END IF;
    END IF;

    IF v_org_filter IS NOT NULL THEN
        v_where := v_where || format(' AND organization_id = %L ', v_org_filter);
    END IF;

    -- Date Logic
    IF p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN
        v_where := v_where || format(' AND data_do_periodo >= %L AND data_do_periodo <= %L ', p_data_inicial, p_data_final);
    ELSIF p_ano IS NOT NULL AND p_semana IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L AND semana_numero = %L ', p_ano, p_semana);
    ELSIF p_ano IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L ', p_ano);
    ELSE
        -- Default to last 30 days if no date filter to prevent scanning everything
        v_where := v_where || format(' AND data_do_periodo >= %L ', CURRENT_DATE - 30);
    END IF;

    -- Filters
    IF p_praca IS NOT NULL AND p_praca <> '' AND LOWER(p_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND praca = %L ', p_praca);
    END IF;

    IF p_sub_praca IS NOT NULL AND p_sub_praca <> '' AND LOWER(p_sub_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND sub_praca = %L ', p_sub_praca);
    END IF;

    IF p_origem IS NOT NULL AND p_origem <> '' AND LOWER(p_origem) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND origem = ANY(string_to_array(%L, '','')) ', p_origem);
    END IF;

    v_where := v_where || ' AND pessoa_entregadora IS NOT NULL ';

    -- Main Query (OPTIMIZED: No Window Function)
    v_sql := '
    WITH aggregated_data AS (
        SELECT 
            id_da_pessoa_entregadora as id_entregador,
            pessoa_entregadora as nome_entregador,
            SUM(numero_de_corridas_ofertadas) as corridas_ofertadas,
            SUM(numero_de_corridas_aceitas) as corridas_aceitas,
            SUM(numero_de_corridas_rejeitadas) as corridas_rejeitadas,
            SUM(numero_de_corridas_completadas) as corridas_completadas,
            SUM(tempo_disponivel_absoluto_segundos) as total_segundos,
            CASE WHEN SUM(numero_de_corridas_ofertadas) > 0 
                THEN ROUND((SUM(numero_de_corridas_aceitas)::numeric / NULLIF(SUM(numero_de_corridas_ofertadas), 0)) * 100, 2)
                ELSE 0 END as aderencia_percentual,
            CASE WHEN SUM(numero_de_corridas_ofertadas) > 0 
                THEN ROUND((SUM(numero_de_corridas_rejeitadas)::numeric / NULLIF(SUM(numero_de_corridas_ofertadas), 0)) * 100, 2)
                ELSE 0 END as rejeicao_percentual
        FROM public.dados_corridas
        ' || v_where || '
        GROUP BY id_da_pessoa_entregadora, pessoa_entregadora
    ),
    final_data AS (
        SELECT *
        FROM aggregated_data
        ORDER BY corridas_completadas DESC
    )
    SELECT jsonb_build_object(
        ''entregadores'', COALESCE(jsonb_agg(row_to_json(final_data)), ''[]''::jsonb),
        ''total'', (SELECT COUNT(*) FROM final_data)
    )
    FROM final_data;';

    EXECUTE v_sql INTO v_result;
    RETURN v_result;
END;
$function$
;

-- Nome: listar_evolucao_mensal
CREATE OR REPLACE FUNCTION public.listar_evolucao_mensal(p_ano integer, p_praca text DEFAULT NULL::text)
 RETURNS TABLE(ano integer, mes integer, mes_nome text, corridas_ofertadas bigint, corridas_aceitas bigint, corridas_completadas bigint, corridas_rejeitadas bigint, total_segundos numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
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

-- Nome: listar_evolucao_semanal
CREATE OR REPLACE FUNCTION public.listar_evolucao_semanal(p_ano integer, p_limite_semanas integer DEFAULT 12, p_praca text DEFAULT NULL::text)
 RETURNS TABLE(ano integer, semana integer, semana_label text, corridas_ofertadas bigint, corridas_aceitas bigint, corridas_completadas bigint, corridas_rejeitadas bigint, total_segundos numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
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

-- Nome: listar_evolucao_semanal
CREATE OR REPLACE FUNCTION public.listar_evolucao_semanal(p_ano integer, p_praca text DEFAULT NULL::text, p_limite_semanas integer DEFAULT 53)
 RETURNS TABLE(ano integer, semana integer, semana_label text, corridas_ofertadas bigint, corridas_aceitas bigint, corridas_completadas bigint, corridas_rejeitadas bigint, total_segundos numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
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

-- Nome: listar_todas_semanas
CREATE OR REPLACE FUNCTION public.listar_todas_semanas()
 RETURNS TABLE(semana integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: listar_utr_semanal
CREATE OR REPLACE FUNCTION public.listar_utr_semanal(p_ano integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_limite_semanas integer DEFAULT 53)
 RETURNS TABLE(ano integer, semana integer, semana_label text, tempo_horas numeric, total_corridas bigint, utr numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH filtered_data AS (
    SELECT
      ano_iso,
      semana_numero,
      CASE
        WHEN tempo_disponivel_absoluto_segundos IS NOT NULL THEN
          tempo_disponivel_absoluto_segundos
        WHEN tempo_disponivel_absoluto IS NOT NULL THEN
          COALESCE(hhmmss_to_seconds(tempo_disponivel_absoluto), 0)
        ELSE 0
      END AS tempo_segundos,
      COALESCE(numero_de_corridas_completadas, 0) AS corridas_completadas
    FROM public.dados_corridas
    WHERE data_do_periodo IS NOT NULL
      AND (p_ano IS NULL OR ano_iso = p_ano)
      AND (
        p_praca IS NULL
        OR p_praca = ''
        OR (p_praca NOT LIKE '%,%' AND praca = p_praca)
        OR (p_praca LIKE '%,%' AND praca = ANY(string_to_array(p_praca, ',')))
      )
  ),
  semana_agg AS (
    SELECT
      ano_iso,
      semana_numero,
      COALESCE(SUM(tempo_segundos), 0) AS tempo_total_segundos,
      COALESCE(SUM(corridas_completadas), 0) AS total_corridas
    FROM filtered_data
    WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL
    GROUP BY ano_iso, semana_numero
  ),
  semana_utr AS (
    SELECT
      ano_iso,
      semana_numero,
      tempo_total_segundos,
      total_corridas,
      CASE
        WHEN tempo_total_segundos > 0 THEN
          ROUND((total_corridas::NUMERIC / (tempo_total_segundos / 3600.0)), 2)
        ELSE 0
      END AS utr
    FROM semana_agg
  )
  SELECT
    s.ano_iso AS ano,
    s.semana_numero AS semana,
    'S' || LPAD(s.semana_numero::TEXT, 2, '0') AS semana_label,
    ROUND((s.tempo_total_segundos::NUMERIC / 3600.0), 2) AS tempo_horas,
    s.total_corridas::BIGINT AS total_corridas,
    s.utr
  FROM semana_utr s
  ORDER BY s.ano_iso ASC, s.semana_numero ASC
  LIMIT p_limite_semanas;
END;
$function$
;

-- Nome: listar_valores_entregadores
CREATE OR REPLACE FUNCTION public.listar_valores_entregadores(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_sql text;
    v_where text := ' WHERE 1=1 ';
    v_result jsonb;
    v_org_filter uuid;
    v_is_admin boolean;
BEGIN
    -- Auth Logic
    v_org_filter := NULLIF(p_organization_id, '')::uuid;
    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) INTO v_is_admin FROM public.user_profiles WHERE id = auth.uid();
    
    IF v_is_admin AND v_org_filter IS NULL THEN 
        v_org_filter := NULL;
    ELSIF v_org_filter IS NULL AND NOT v_is_admin THEN 
        SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid(); 
    END IF;

    IF v_org_filter IS NOT NULL THEN
        v_where := v_where || format(' AND organization_id = %L ', v_org_filter);
    END IF;

    -- Date Logic
    IF p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN
        v_where := v_where || format(' AND data_do_periodo >= %L AND data_do_periodo <= %L ', p_data_inicial, p_data_final);
    ELSIF p_ano IS NOT NULL AND p_semana IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L AND semana_numero = %L ', p_ano, p_semana);
    ELSIF p_ano IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L ', p_ano);
    ELSE
        v_where := v_where || format(' AND data_do_periodo >= %L ', CURRENT_DATE - 14);
    END IF;

    -- Filters
    IF p_praca IS NOT NULL AND p_praca <> '' AND LOWER(p_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND praca = ANY(string_to_array(%L, '','')) ', p_praca);
    END IF;

    IF p_sub_praca IS NOT NULL AND p_sub_praca <> '' AND LOWER(p_sub_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND sub_praca = ANY(string_to_array(%L, '','')) ', p_sub_praca);
    END IF;

    IF p_origem IS NOT NULL AND p_origem <> '' AND LOWER(p_origem) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND origem = ANY(string_to_array(%L, '','')) ', p_origem);
    END IF;

    v_where := v_where || ' AND pessoa_entregadora IS NOT NULL ';

    -- Build Main Query (REMOVED LIMIT 100)
    v_sql := '
    WITH aggregated_data AS (
        SELECT 
            pessoa_entregadora as nome_entregador,
            id_da_pessoa_entregadora as id_entregador,
            ROUND((SUM(soma_das_taxas_das_corridas_aceitas)::numeric / 100), 2) as total_taxas,
            SUM(numero_de_corridas_aceitas) as numero_corridas_aceitas,
            CASE 
                WHEN SUM(numero_de_corridas_aceitas) > 0 
                THEN ROUND((SUM(soma_das_taxas_das_corridas_aceitas)::numeric / 100) / SUM(numero_de_corridas_aceitas), 2)
                ELSE 0 
            END as taxa_media,
            COUNT(*) OVER() as total_count
        FROM public.dados_corridas
        ' || v_where || '
        GROUP BY id_da_pessoa_entregadora, pessoa_entregadora
    )
    SELECT jsonb_build_object(
        ''entregadores'', COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb),
        ''total'', COALESCE(MAX(t.total_count), 0)
    )
    FROM (
        SELECT *
        FROM aggregated_data
        ORDER BY total_taxas DESC
    ) t;';

    EXECUTE v_sql INTO v_result;
    RETURN v_result;
END;
$function$
;

-- Nome: listar_valores_entregadores_detalhado
CREATE OR REPLACE FUNCTION public.listar_valores_entregadores_detalhado(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0, detailed boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_sql text;
    v_where text := ' WHERE 1=1 ';
    v_result jsonb;
    v_org_filter uuid;
    v_is_admin boolean;
BEGIN
    -- Auth Logic
    v_org_filter := NULLIF(p_organization_id, '')::uuid;
    
    -- Check admin status properly
    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) 
    INTO v_is_admin 
    FROM public.user_profiles 
    WHERE id = auth.uid();
    
    IF v_is_admin AND v_org_filter IS NULL THEN 
        v_org_filter := NULL;
    ELSIF v_org_filter IS NULL AND NOT v_is_admin THEN 
        SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid(); 
    END IF;

    IF v_org_filter IS NOT NULL THEN
        v_where := v_where || format(' AND organization_id = %L ', v_org_filter);
    END IF;

    -- Date Logic
    IF p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN
        v_where := v_where || format(' AND data_do_periodo >= %L AND data_do_periodo <= %L ', p_data_inicial, p_data_final);
    ELSIF p_ano IS NOT NULL AND p_semana IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L AND semana_numero = %L ', p_ano, p_semana);
    ELSIF p_ano IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L ', p_ano);
    ELSE
         -- Default to last 14 days if no date filter, just to be safe, or allow all?
         -- Existing logic had: v_where := v_where || format(' AND data_do_periodo >= %L ', CURRENT_DATE - 14);
         -- But explicit filters should override. Let's keep it safe.
         IF p_ano IS NULL AND p_semana IS NULL AND p_data_inicial IS NULL THEN
            NULL; -- Allow no date filter? Or default? Let's treat as ALL if null.
         END IF;
    END IF;

    -- Filters
    IF p_praca IS NOT NULL AND p_praca <> '' AND LOWER(p_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND praca = ANY(string_to_array(%L, '','')) ', p_praca);
    END IF;

    IF p_sub_praca IS NOT NULL AND p_sub_praca <> '' AND LOWER(p_sub_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND sub_praca = ANY(string_to_array(%L, '','')) ', p_sub_praca);
    END IF;

    IF p_origem IS NOT NULL AND p_origem <> '' AND LOWER(p_origem) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND origem = ANY(string_to_array(%L, '','')) ', p_origem);
    END IF;

    v_where := v_where || ' AND pessoa_entregadora IS NOT NULL ';

    -- Build Query with Pagination and GROUP BY
    v_sql := '
    WITH aggregated_data AS (
        SELECT 
            pessoa_entregadora as nome_entregador,
            id_da_pessoa_entregadora as id_entregador,
            periodo as turno,
            sub_praca,
            ROUND((SUM(soma_das_taxas_das_corridas_aceitas)::numeric / 100), 2) as total_taxas,
            SUM(numero_de_corridas_aceitas) as numero_corridas_aceitas,
            CASE 
                WHEN SUM(numero_de_corridas_aceitas) > 0 
                THEN ROUND((SUM(soma_das_taxas_das_corridas_aceitas)::numeric / 100) / SUM(numero_de_corridas_aceitas), 2)
                ELSE 0 
            END as taxa_media,
            COUNT(*) OVER() as total_count
        FROM public.dados_corridas
        ' || v_where || '
        GROUP BY id_da_pessoa_entregadora, pessoa_entregadora, periodo, sub_praca
    )
    SELECT jsonb_build_object(
        ''entregadores'', COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb),
        ''total'', COALESCE(MAX(t.total_count), 0)
    )
    FROM (
        SELECT *
        FROM aggregated_data
        ORDER BY total_taxas DESC
        LIMIT ' || p_limit || ' OFFSET ' || p_offset || '
    ) t;';

    EXECUTE v_sql INTO v_result;
    RETURN v_result;
END;
$function$
;

-- Nome: listar_valores_entregadores_detalhado
CREATE OR REPLACE FUNCTION public.listar_valores_entregadores_detalhado(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_sql text;
    v_where text := ' WHERE 1=1 ';
    v_result jsonb;
    v_org_filter uuid;
    v_is_admin boolean;
BEGIN
    -- Auth Logic
    v_org_filter := NULLIF(p_organization_id, '')::uuid;
    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) INTO v_is_admin FROM public.user_profiles WHERE id = auth.uid();
    
    IF v_is_admin AND v_org_filter IS NULL THEN 
        v_org_filter := NULL;
    ELSIF v_org_filter IS NULL AND NOT v_is_admin THEN 
        SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid(); 
    END IF;

    IF v_org_filter IS NOT NULL THEN
        v_where := v_where || format(' AND organization_id = %L ', v_org_filter);
    END IF;

    -- Date Logic
    IF p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN
        v_where := v_where || format(' AND data_do_periodo >= %L AND data_do_periodo <= %L ', p_data_inicial, p_data_final);
    ELSIF p_ano IS NOT NULL AND p_semana IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L AND semana_numero = %L ', p_ano, p_semana);
    ELSIF p_ano IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L ', p_ano);
    END IF;

    -- Other filters
    IF p_praca IS NOT NULL AND p_praca <> '' AND LOWER(p_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND praca = ANY(string_to_array(%L, '','')) ', p_praca);
    END IF;

    IF p_sub_praca IS NOT NULL AND p_sub_praca <> '' AND LOWER(p_sub_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND sub_praca = ANY(string_to_array(%L, '','')) ', p_sub_praca);
    END IF;

    IF p_origem IS NOT NULL AND p_origem <> '' AND LOWER(p_origem) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND origem = ANY(string_to_array(%L, '','')) ', p_origem);
    END IF;

    v_where := v_where || ' AND pessoa_entregadora IS NOT NULL ';

    -- Build Query with Pagination
    v_sql := '
    WITH aggregated_data AS (
        SELECT 
            pessoa_entregadora as nome_entregador,
            id_da_pessoa_entregadora as id_entregador,
            periodo as turno,
            sub_praca,
            ROUND((SUM(soma_das_taxas_das_corridas_aceitas)::numeric / 100), 2) as total_taxas,
            SUM(numero_de_corridas_aceitas) as numero_corridas_aceitas,
            CASE 
                WHEN SUM(numero_de_corridas_aceitas) > 0 
                THEN ROUND((SUM(soma_das_taxas_das_corridas_aceitas)::numeric / 100) / SUM(numero_de_corridas_aceitas), 2)
                ELSE 0 
            END as taxa_media,
            COUNT(*) OVER() as total_count
        FROM public.dados_corridas
        ' || v_where || '
        GROUP BY id_da_pessoa_entregadora, pessoa_entregadora, periodo, sub_praca
    )
    SELECT jsonb_build_object(
        ''entregadores'', COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb),
        ''total'', COALESCE(MAX(t.total_count), 0)
    )
    FROM (
        SELECT *
        FROM aggregated_data
        ORDER BY total_taxas DESC
        LIMIT ' || p_limit || ' OFFSET ' || p_offset || '
    ) t;';

    EXECUTE v_sql INTO v_result;
    RETURN v_result;
END;
$function$
;

-- Nome: mark_mv_marketing_refresh_needed
CREATE OR REPLACE FUNCTION public.mark_mv_marketing_refresh_needed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  UPDATE public.mv_refresh_control
  SET 
    needs_refresh = true,
    updated_at = NOW()
  WHERE mv_name IN (
    'mv_entregadores_marketing',
    'mv_entregadores_summary' -- Added this line
  );
  
  RETURN NEW;
END;
$function$
;

-- Nome: mark_mv_refresh_needed
CREATE OR REPLACE FUNCTION public.mark_mv_refresh_needed()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Marcar APENAS MVs ATIVAS para refresh
  UPDATE public.mv_refresh_control
  SET 
    needs_refresh = true,
    updated_at = NOW()
  WHERE mv_name IN (
    'mv_dashboard_resumo',
    'mv_aderencia_agregada',
    'mv_aderencia_dia',
    'mv_aderencia_semana',
    'mv_dashboard_aderencia_metricas',
    'mv_dashboard_admin',
    'mv_dashboard_lite',
    'mv_dashboard_micro',
    'mv_entregadores_marketing',
    'mv_entregadores_summary',
    'mv_corridas_agregadas' -- Added upstream MV
  );
  
  RETURN NEW;
END;
$function$
;

-- Nome: mark_mv_valores_refresh_needed
CREATE OR REPLACE FUNCTION public.mark_mv_valores_refresh_needed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  UPDATE public.mv_refresh_control
  SET 
    needs_refresh = true,
    updated_at = NOW()
  WHERE mv_name IN (
    'mv_entregadores_agregados',
    'mv_valores_entregadores_agregados'
  );
  
  RETURN NEW;
END;
$function$
;

-- Nome: migrate_dados_corridas_batch
CREATE OR REPLACE FUNCTION public.migrate_dados_corridas_batch()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    default_org_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
    batch_size INTEGER := 50000;
    updated_count INTEGER;
BEGIN
    -- Atualizar um batch de dados_corridas
    WITH batch AS (
        SELECT id
        FROM public.dados_corridas
        WHERE organization_id IS NULL
        LIMIT batch_size
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.dados_corridas dc
    SET organization_id = default_org_id
    FROM batch b
    WHERE dc.id = b.id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END $function$
;

-- Nome: migrate_dados_corridas_batch
CREATE OR REPLACE FUNCTION public.migrate_dados_corridas_batch(batch_limit integer DEFAULT 50000)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    default_org_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
    updated_count INTEGER;
BEGIN
    -- Atualizar um batch usando CTE para evitar locks longos
    WITH batch AS (
        SELECT id
        FROM public.dados_corridas
        WHERE organization_id IS NULL
        LIMIT batch_limit
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.dados_corridas dc
    SET organization_id = default_org_id
    FROM batch b
    WHERE dc.id = b.id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END $function$
;

-- Nome: migrate_data_to_default_org
CREATE OR REPLACE FUNCTION public.migrate_data_to_default_org()
 RETURNS TABLE(table_name text, rows_updated bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    default_org_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
    batch_size INTEGER := 10000;
    updated_count BIGINT;
    total_updated BIGINT := 0;
BEGIN
    -- 1. Migrar user_profiles (pequeno, pode fazer direto)
    UPDATE public.user_profiles
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN QUERY SELECT 'user_profiles'::TEXT, updated_count;
    total_updated := total_updated + updated_count;
    
    -- 2. Migrar dados_marketing (pequeno, pode fazer direto)
    UPDATE public.dados_marketing
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN QUERY SELECT 'dados_marketing'::TEXT, updated_count;
    total_updated := total_updated + updated_count;
    
    -- 3. Migrar dados_valores_cidade (pequeno, pode fazer direto)
    UPDATE public.dados_valores_cidade
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN QUERY SELECT 'dados_valores_cidade'::TEXT, updated_count;
    total_updated := total_updated + updated_count;
    
    -- 4. Migrar dados_corridas em batches (tabela grande)
    -- Esta parte será executada manualmente ou via script separado
    -- devido ao tamanho da tabela (1.6M+ linhas)
    RETURN QUERY SELECT 'dados_corridas'::TEXT, 0::BIGINT;
    
    RAISE NOTICE 'Migração inicial concluída. dados_corridas precisa ser migrado separadamente devido ao tamanho.';
END $function$
;

-- Nome: migrate_small_tables_to_default_org
CREATE OR REPLACE FUNCTION public.migrate_small_tables_to_default_org()
 RETURNS TABLE(table_name text, rows_updated bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    default_org_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
    updated_count BIGINT;
BEGIN
    -- 1. Migrar user_profiles
    UPDATE public.user_profiles
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN QUERY SELECT 'user_profiles'::TEXT, updated_count;
    
    -- 2. Migrar dados_marketing
    UPDATE public.dados_marketing
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN QUERY SELECT 'dados_marketing'::TEXT, updated_count;
    
    -- 3. Migrar dados_valores_cidade
    UPDATE public.dados_valores_cidade
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN QUERY SELECT 'dados_valores_cidade'::TEXT, updated_count;
END $function$
;

-- Nome: normalize_time_columns
CREATE OR REPLACE FUNCTION public.normalize_time_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  NEW.duracao_do_periodo := public.to_hhmmss(NEW.duracao_do_periodo);
  NEW.tempo_disponivel_escalado := public.to_hhmmss(NEW.tempo_disponivel_escalado);
  NEW.tempo_disponivel_absoluto := public.to_hhmmss(NEW.tempo_disponivel_absoluto);
  RETURN NEW;
END $function$
;

-- Nome: normalize_time_columns_trigger
CREATE OR REPLACE FUNCTION public.normalize_time_columns_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  duracao_norm text;
  escalado_norm text;
  absoluto_norm text;
BEGIN
  duracao_norm := public.normalize_time_to_hhmmss(NEW.duracao_do_periodo);
  escalado_norm := public.normalize_time_to_hhmmss(NEW.tempo_disponivel_escalado);
  absoluto_norm := public.normalize_time_to_hhmmss(NEW.tempo_disponivel_absoluto);

  NEW.duracao_do_periodo := duracao_norm;
  NEW.tempo_disponivel_escalado := escalado_norm;
  NEW.tempo_disponivel_absoluto := absoluto_norm;

  NEW.duracao_segundos := public.hhmmss_to_seconds(duracao_norm);
  NEW.tempo_disponivel_escalado_segundos := public.hhmmss_to_seconds(escalado_norm);
  NEW.tempo_disponivel_absoluto_segundos := public.hhmmss_to_seconds(absoluto_norm);

  RETURN NEW;
END $function$
;

-- Nome: normalize_time_to_hhmmss
CREATE OR REPLACE FUNCTION public.normalize_time_to_hhmmss(input_value text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  result text := '00:00:00';
BEGIN
  IF input_value IS NULL OR trim(input_value) = '' THEN
    RETURN result;
  END IF;

  input_value := trim(input_value);

  IF input_value LIKE '%T%:%:%Z' THEN
    result := split_part(split_part(input_value, 'T', 2), '.', 1);

  ELSIF input_value ~ '^[0-9]+\.[0-9]+$' THEN
    DECLARE
      total_seconds int := round((input_value::numeric * 86400)::numeric);
      hours int := floor(total_seconds / 3600);
      minutes int := floor((total_seconds % 3600) / 60);
      seconds int := total_seconds % 60;
    BEGIN
      result := lpad(hours::text, 2, '0') || ':' ||
                lpad(minutes::text, 2, '0') || ':' ||
                lpad(seconds::text, 2, '0');
    END;

  ELSIF input_value ~ '^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$' THEN
    result := input_value;
  ELSE
    result := input_value;
  END IF;

  RETURN result;
END $function$
;

-- Nome: obter_resumo_valores_breakdown
CREATE OR REPLACE FUNCTION public.obter_resumo_valores_breakdown(p_ano integer DEFAULT NULL::integer, p_semana integer DEFAULT NULL::integer, p_praca text DEFAULT NULL::text, p_sub_praca text DEFAULT NULL::text, p_origem text DEFAULT NULL::text, p_data_inicial date DEFAULT NULL::date, p_data_final date DEFAULT NULL::date, p_organization_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_sql text;
    v_where text := ' WHERE 1=1 ';
    v_result jsonb;
    v_org_filter uuid;
    v_is_admin boolean;
BEGIN
    -- Auth Logic
    v_org_filter := NULLIF(p_organization_id, '')::uuid;
    SELECT (role IN ('admin', 'marketing', 'master') OR is_admin = true) INTO v_is_admin FROM public.user_profiles WHERE id = auth.uid();
    
    IF v_is_admin AND v_org_filter IS NULL THEN 
        v_org_filter := NULL;
    ELSIF v_org_filter IS NULL AND NOT v_is_admin THEN 
        SELECT organization_id INTO v_org_filter FROM public.user_profiles WHERE id = auth.uid(); 
    END IF;

    IF v_org_filter IS NOT NULL THEN
        v_where := v_where || format(' AND organization_id = %L ', v_org_filter);
    END IF;

    -- Date Logic
    IF p_data_inicial IS NOT NULL AND p_data_final IS NOT NULL THEN
        v_where := v_where || format(' AND data_do_periodo >= %L AND data_do_periodo <= %L ', p_data_inicial, p_data_final);
    ELSIF p_ano IS NOT NULL AND p_semana IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L AND semana_iso = %L ', p_ano, p_semana);
    ELSIF p_ano IS NOT NULL THEN
        v_where := v_where || format(' AND ano_iso = %L ', p_ano);
    END IF;

    -- Filters
    IF p_praca IS NOT NULL AND p_praca <> '' AND LOWER(p_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND praca = ANY(string_to_array(%L, '','')) ', p_praca);
    END IF;
    IF p_sub_praca IS NOT NULL AND p_sub_praca <> '' AND LOWER(p_sub_praca) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND sub_praca = ANY(string_to_array(%L, '','')) ', p_sub_praca);
    END IF;
    IF p_origem IS NOT NULL AND p_origem <> '' AND LOWER(p_origem) NOT IN ('todas', 'todos', 'all') THEN
        v_where := v_where || format(' AND origem = ANY(string_to_array(%L, '','')) ', p_origem);
    END IF;

    -- Query MV directly
    v_sql := '
    WITH filtered_mv AS (
        SELECT 
            turno,
            sub_praca,
            total_valor_bruto_centavos,
            total_aceitas
        FROM public.mv_dashboard_resumo_v2
        ' || v_where || '
    ),
    turno_agg AS (
        SELECT 
            turno,
            ROUND(SUM(total_valor_bruto_centavos)::numeric / 100, 2) as total_valor,
            SUM(total_aceitas) as total_corridas
        FROM filtered_mv
        WHERE turno IS NOT NULL
        GROUP BY turno
        ORDER BY total_valor DESC
    ),
    sub_praca_agg AS (
        SELECT 
            sub_praca,
            ROUND(SUM(total_valor_bruto_centavos)::numeric / 100, 2) as total_valor,
            SUM(total_aceitas) as total_corridas
        FROM filtered_mv
        WHERE sub_praca IS NOT NULL
        GROUP BY sub_praca
        ORDER BY total_valor DESC
    )
    SELECT jsonb_build_object(
        ''by_turno'', (SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM turno_agg t),
        ''by_sub_praca'', (SELECT COALESCE(jsonb_agg(row_to_json(s)), ''[]''::jsonb) FROM sub_praca_agg s)
    );';

    EXECUTE v_sql INTO v_result;
    RETURN v_result;
END;
$function$
;

-- Nome: pesquisar_entregadores
CREATE OR REPLACE FUNCTION public.pesquisar_entregadores(termo_busca text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
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

-- Nome: pesquisar_valores_entregadores
CREATE OR REPLACE FUNCTION public.pesquisar_valores_entregadores(termo_busca text)
 RETURNS TABLE(id_entregador text, nome_entregador text, total_taxas numeric, numero_corridas_aceitas bigint, taxa_media numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
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

-- Nome: ping
CREATE OR REPLACE FUNCTION public.ping()
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT '{"message": "pong"}'::json;
$function$
;

-- Nome: refresh_all_materialized_views
CREATE OR REPLACE FUNCTION public.refresh_all_materialized_views()
 RETURNS TABLE(view_name text, status text, message text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    views_to_refresh TEXT[] := ARRAY[
        'mv_aderencia_agregada',
        'mv_aderencia_dia',
        'mv_aderencia_semana',
        -- MVs removidas/backup:
        -- 'mv_corridas_detalhe',
        'mv_dashboard_admin',
        'mv_dashboard_lite',
        'mv_dashboard_micro'
        -- 'mv_entregadores_agregados',
        -- 'mv_entregue_detalhe',
        -- 'mv_planejado_detalhe',
        -- 'mv_valores_entregadores_agregados'
    ];
    view_name TEXT;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    FOREACH view_name IN ARRAY views_to_refresh
    LOOP
        start_time := clock_timestamp();
        
        BEGIN
            EXECUTE format('REFRESH MATERIALIZED VIEW %I', view_name);
            end_time := clock_timestamp();
            
            RETURN QUERY SELECT 
                view_name::TEXT,
                'SUCCESS'::TEXT,
                format('Atualizada com sucesso em %s segundos', 
                    EXTRACT(EPOCH FROM (end_time - start_time))::NUMERIC(10,2)
                )::TEXT;
        EXCEPTION WHEN OTHERS THEN
            end_time := clock_timestamp();
            RETURN QUERY SELECT 
                view_name::TEXT,
                'ERROR'::TEXT,
                format('Erro: %s', SQLERRM)::TEXT;
        END;
    END LOOP;
END;
$function$
;

-- Nome: refresh_all_mvs_button
CREATE OR REPLACE FUNCTION public.refresh_all_mvs_button()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '0'
AS $function$
DECLARE
    result json;
BEGIN
    -- Usar a função prioritária que já implementamos
    -- refresh_critical_only=false atualiza todas as MVs
    result := public.refresh_mvs_prioritized(false);
    
    RETURN result;
END;
$function$
;

-- Nome: refresh_all_mvs_manual
CREATE OR REPLACE FUNCTION public.refresh_all_mvs_manual()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '0'
AS $function$
DECLARE
  result json;
BEGIN
  -- Usar a função prioritária que já implementamos
  -- refresh_critical_only=false atualiza todas as MVs
  result := public.refresh_mvs_prioritized(false);
  
  RETURN result;
END;
$function$
;

-- Nome: refresh_all_mvs_optimized
CREATE OR REPLACE FUNCTION public.refresh_all_mvs_optimized()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result json;
    results json[] := '{}';
    start_time TIMESTAMP;
    total_start TIMESTAMP;
BEGIN
    total_start := clock_timestamp();
    
    -- Refresh sequencial (evita sobrecarga simultânea)
    -- 1. mv_dashboard_aderencia_metricas (mais importante)
    BEGIN
        start_time := clock_timestamp();
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_dashboard_aderencia_metricas;
        results := array_append(results, json_build_object(
            'view', 'mv_dashboard_aderencia_metricas',
            'success', true,
            'duration_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time))
        ));
    EXCEPTION
        WHEN OTHERS THEN
            results := array_append(results, json_build_object(
                'view', 'mv_dashboard_aderencia_metricas',
                'success', false,
                'error', SQLERRM
            ));
    END;
    
    -- 2. mv_corridas_detalhe
    BEGIN
        start_time := clock_timestamp();
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_corridas_detalhe;
        results := array_append(results, json_build_object(
            'view', 'mv_corridas_detalhe',
            'success', true,
            'duration_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time))
        ));
    EXCEPTION
        WHEN OTHERS THEN
            results := array_append(results, json_build_object(
                'view', 'mv_corridas_detalhe',
                'success', false,
                'error', SQLERRM
            ));
    END;
    
    -- 3. mv_entregue_detalhe
    BEGIN
        start_time := clock_timestamp();
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_entregue_detalhe;
        results := array_append(results, json_build_object(
            'view', 'mv_entregue_detalhe',
            'success', true,
            'duration_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time))
        ));
    EXCEPTION
        WHEN OTHERS THEN
            results := array_append(results, json_build_object(
                'view', 'mv_entregue_detalhe',
                'success', false,
                'error', SQLERRM
            ));
    END;
    
    -- 4. mv_planejado_detalhe
    BEGIN
        start_time := clock_timestamp();
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_planejado_detalhe;
        results := array_append(results, json_build_object(
            'view', 'mv_planejado_detalhe',
            'success', true,
            'duration_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time))
        ));
    EXCEPTION
        WHEN OTHERS THEN
            results := array_append(results, json_build_object(
                'view', 'mv_planejado_detalhe',
                'success', false,
                'error', SQLERRM
            ));
    END;
    
    RETURN json_build_object(
        'success', true,
        'total_duration_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - total_start)),
        'views_refreshed', array_length(results, 1),
        'results', results
    );
END;
$function$
;

-- Nome: refresh_critical_mvs_now
CREATE OR REPLACE FUNCTION public.refresh_critical_mvs_now()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '0'
AS $function$
BEGIN
    -- Atualizar apenas MVs críticas (prioridade 1)
    -- Isso é rápido (2-4 minutos) e atualiza o dashboard principal
    RETURN public.refresh_mvs_prioritized(true);
END;
$function$
;

-- Nome: refresh_dashboard_mvs
CREATE OR REPLACE FUNCTION public.refresh_dashboard_mvs()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result RECORD;
  success_count INT := 0;
  error_count INT := 0;
BEGIN
  -- Mark ACTIVE views including dashboard_resumo
  UPDATE public.mv_refresh_control
  SET needs_refresh = true
  WHERE mv_name IN (
    'mv_dashboard_resumo',
    'mv_aderencia_agregada',
    'mv_aderencia_dia',
    'mv_aderencia_semana',
    'mv_dashboard_admin',
    'mv_dashboard_lite',
    'mv_dashboard_micro',
    'mv_dashboard_aderencia_metricas'
  );
  
  FOR result IN SELECT * FROM public.refresh_pending_mvs() LOOP
    IF result.success THEN
      success_count := success_count + 1;
    ELSE
      error_count := error_count + 1;
    END IF;
  END LOOP;
  
  RETURN format('Atualização concluída: %s sucesso(s), %s erro(s)', success_count, error_count);
END;
$function$
;

-- Nome: refresh_entregadores_marketing
CREATE OR REPLACE FUNCTION public.refresh_entregadores_marketing()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_entregadores_marketing;
END;
$function$
;

-- Nome: refresh_mv_aderencia
CREATE OR REPLACE FUNCTION public.refresh_mv_aderencia()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
EXCEPTION WHEN OTHERS THEN
  REFRESH MATERIALIZED VIEW public.mv_aderencia_agregada;
END;
$function$
;

-- Nome: refresh_mv_aderencia_async
CREATE OR REPLACE FUNCTION public.refresh_mv_aderencia_async()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration INTERVAL;
BEGIN
    start_time := clock_timestamp();
    
    -- Usar REFRESH CONCURRENTLY (requer índice único)
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_dashboard_aderencia_metricas;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    RETURN json_build_object(
        'success', true,
        'view', 'mv_dashboard_aderencia_metricas',
        'duration_seconds', EXTRACT(EPOCH FROM duration),
        'message', 'Refresh CONCURRENTLY concluído com sucesso'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Se CONCURRENTLY falhar, tentar refresh normal
        BEGIN
            REFRESH MATERIALIZED VIEW public.mv_dashboard_aderencia_metricas;
            RETURN json_build_object(
                'success', true,
                'view', 'mv_dashboard_aderencia_metricas',
                'method', 'normal (fallback)',
                'message', 'Refresh concluído (fallback para método normal)'
            );
        EXCEPTION
            WHEN OTHERS THEN
                RETURN json_build_object(
                    'success', false,
                    'error', SQLERRM,
                    'message', 'Erro ao fazer refresh da materialized view'
                );
        END;
END;
$function$
;

-- Nome: refresh_mv_dashboard_aderencia_metricas_async
CREATE OR REPLACE FUNCTION public.refresh_mv_dashboard_aderencia_metricas_async()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Atualizar a MV em background usando pg_background ou simplesmente executar
    -- Se a MV for muito grande, pode ser necessário fazer em partes
    REFRESH MATERIALIZED VIEW public.mv_dashboard_aderencia_metricas;
EXCEPTION WHEN OTHERS THEN
    -- Log do erro mas não falhar
    RAISE WARNING 'Erro ao atualizar mv_dashboard_aderencia_metricas: %', SQLERRM;
END;
$function$
;

-- Nome: refresh_mv_entregadores_marketing
CREATE OR REPLACE FUNCTION public.refresh_mv_entregadores_marketing()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '0'
AS $function$
BEGIN
    -- Usar refresh_single_mv para atualizar mv_entregadores_marketing
    RETURN public.refresh_single_mv('mv_entregadores_marketing', false);
END;
$function$
;

-- Nome: refresh_mvs_after_bulk_insert
CREATE OR REPLACE FUNCTION public.refresh_mvs_after_bulk_insert(delay_seconds integer DEFAULT 300)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  mv_count INTEGER;
BEGIN
  -- Marcar todas as MVs relacionadas a dados_corridas para refresh
  UPDATE public.mv_refresh_control
  SET 
    needs_refresh = true,
    updated_at = NOW()
  WHERE mv_name IN (
    'mv_aderencia_agregada',
    'mv_aderencia_dia',
    'mv_aderencia_semana',
    'mv_corridas_detalhe',
    'mv_dashboard_aderencia_metricas',
    'mv_dashboard_admin',
    'mv_dashboard_lite',
    'mv_dashboard_micro',
    'mv_dashboard_resumo',
    'mv_entregue_detalhe',
    'mv_planejado_detalhe',
    'mv_entregadores_agregados',
    'mv_valores_entregadores_agregados'
  );
  
  SELECT COUNT(*) INTO mv_count
  FROM public.mv_refresh_control
  WHERE needs_refresh = true;
  
  RETURN format('Marcadas %s MVs para refresh. O refresh será processado automaticamente em até %s minutos.', 
    mv_count, 
    CASE 
      WHEN delay_seconds < 60 THEN '1'
      ELSE (delay_seconds / 60)::text
    END
  );
END;
$function$
;

-- Nome: refresh_mvs_prioritized
CREATE OR REPLACE FUNCTION public.refresh_mvs_prioritized(refresh_critical_only boolean DEFAULT false)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '0'
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

-- Nome: refresh_pending_mvs
CREATE OR REPLACE FUNCTION public.refresh_pending_mvs()
 RETURNS TABLE(mv_name text, success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
 SET statement_timeout TO '0'
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

-- Nome: refresh_pending_mvs_if_needed
CREATE OR REPLACE FUNCTION public.refresh_pending_mvs_if_needed()
 RETURNS TABLE(executado boolean, mvs_processadas integer, mensagem text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
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

-- Nome: refresh_single_mv
CREATE OR REPLACE FUNCTION public.refresh_single_mv(mv_name_param text, force_normal boolean DEFAULT false)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    refresh_sql TEXT;
    can_use_concurrently BOOLEAN;
    mv_size_bytes BIGINT;
    estimated_timeout_seconds INTEGER;
    start_time TIMESTAMP;
    duration_seconds NUMERIC;
BEGIN
    -- Verificar se MV existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_matviews 
        WHERE schemaname = 'public' 
        AND matviewname = mv_name_param
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', format('Materialized view %s não existe', mv_name_param),
            'skipped', true
        );
    END IF;

    -- Verificar se tem índice único (pode usar CONCURRENTLY)
    SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND tablename = mv_name_param -- Fixed: Added AND
        AND indexdef LIKE '%UNIQUE%'
    ) INTO can_use_concurrently;
    
    -- Se force_normal = true, não usar CONCURRENTLY
    IF force_normal THEN
        can_use_concurrently := false;
    END IF;
    
    -- Calcular tamanho da MV para estimar timeout
    SELECT pg_total_relation_size('public.' || mv_name_param) INTO mv_size_bytes;
    
    -- Timeout progressivo baseado no tamanho
    estimated_timeout_seconds := CASE
        WHEN mv_size_bytes < 1048576 THEN 30  -- < 1MB
        WHEN mv_size_bytes < 10485760 THEN 120  -- < 10MB
        WHEN mv_size_bytes < 52428800 THEN 300  -- < 50MB
        ELSE 600  -- >= 50MB
    END;

    -- Atualizar flag de refresh em progresso
    UPDATE public.mv_refresh_control
    SET refresh_in_progress = true,
        updated_at = NOW()
    WHERE mv_name = mv_name_param;

    start_time := clock_timestamp();

    BEGIN
        -- Constuir comando SQL seguro
        IF can_use_concurrently THEN
            refresh_sql := format('REFRESH MATERIALIZED VIEW CONCURRENTLY public.%I', mv_name_param);
        ELSE
            refresh_sql := format('REFRESH MATERIALIZED VIEW public.%I', mv_name_param);
        END IF;

        EXECUTE refresh_sql;

        duration_seconds := EXTRACT(EPOCH FROM (clock_timestamp() - start_time));

        -- Atualizar status
        UPDATE public.mv_refresh_control
        SET 
            needs_refresh = false,
            refresh_in_progress = false,
            last_refresh = NOW(),
            updated_at = NOW()
        WHERE mv_name = mv_name_param;
        
        RETURN json_build_object(
            'success', true,
            'view', mv_name_param,
            'duration_seconds', duration_seconds,
            'method', CASE WHEN can_use_concurrently THEN 'CONCURRENTLY' ELSE 'NORMAL' END
        );

    EXCEPTION WHEN OTHERS THEN
        -- Se CONCURRENTLY falhar ou timeout, tentar limpar flag
        UPDATE public.mv_refresh_control
        SET refresh_in_progress = false
        WHERE mv_name = mv_name_param;
        
        -- Se erro foi forçado, tentar normal
        IF can_use_concurrently AND NOT force_normal THEN
            BEGIN
                refresh_sql := format('REFRESH MATERIALIZED VIEW public.%I', mv_name_param);
                EXECUTE refresh_sql;
                
                UPDATE public.mv_refresh_control
                SET 
                    needs_refresh = false,
                    refresh_in_progress = false,
                    last_refresh = NOW(),
                    updated_at = NOW()
                WHERE mv_name = mv_name_param;
                
                RETURN json_build_object(
                    'success', true,
                    'view', mv_name_param,
                    'duration_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time)),
                    'method', 'NORMAL (fallback)',
                    'warning', 'CONCURRENTLY falhou, usado método normal',
                    'original_error', SQLERRM
                );
            EXCEPTION WHEN OTHERS THEN
                RETURN json_build_object(
                    'success', false,
                    'view', mv_name_param,
                    'error', SQLERRM,
                    'duration_seconds', duration_seconds,
                    'method', 'FAILED'
                );
            END;
        ELSE
            RETURN json_build_object(
                'success', false,
                'view', mv_name_param,
                'error', SQLERRM,
                'duration_seconds', duration_seconds,
                'method', CASE WHEN can_use_concurrently THEN 'CONCURRENTLY' ELSE 'NORMAL' END
            );
        END IF;
    END;
END;
$function$
;

-- Nome: refresh_single_mv_with_progress
CREATE OR REPLACE FUNCTION public.refresh_single_mv_with_progress(mv_name_param text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '0'
AS $function$
DECLARE
    result json;
BEGIN
    -- Usar a função existente que já tem fallback
    result := public.refresh_single_mv(mv_name_param, false);
    
    RETURN result;
END;
$function$
;

-- Nome: register_interaction
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
$function$
;

-- Nome: registrar_atividade
CREATE OR REPLACE FUNCTION public.registrar_atividade(p_session_id text, p_action_type text, p_action_details text DEFAULT NULL::text, p_tab_name text DEFAULT NULL::text, p_filters_applied jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.user_activity (
    user_id,
    session_id,
    action_type,
    action_details,
    tab_name,
    filters_applied
  ) VALUES (
    auth.uid(),
    p_session_id,
    p_action_type,
    p_action_details,
    p_tab_name,
    COALESCE(p_filters_applied, '{}'::jsonb)
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
EXCEPTION WHEN OTHERS THEN
  -- Log error silently or return NULL, but don't fail the transaction if it's just logging
  -- However, returning NULL might confuse the caller if they expect UUID.
  -- Better to re-raise or handle gracefully.
  -- For now, let's just return NULL if it fails, assuming the caller handles it.
  RETURN NULL;
END;
$function$
;

-- Nome: registrar_atividade
CREATE OR REPLACE FUNCTION public.registrar_atividade(p_tipo text, p_descricao text, p_metadados jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
    v_atividade_id uuid;
BEGIN
    v_user_id := auth.uid();
    v_org_id := public.get_user_organization_id();
    
    -- Se não tiver usuário logado, não registra (ou registra como sistema se necessário)
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.atividades_sistema (
        organization_id,
        user_id,
        tipo,
        descricao,
        metadados,
        created_at
    ) VALUES (
        v_org_id,
        v_user_id,
        p_tipo,
        p_descricao,
        p_metadados,
        NOW()
    )
    RETURNING id INTO v_atividade_id;

    RETURN v_atividade_id;
EXCEPTION WHEN OTHERS THEN
    -- Não falhar se der erro no log
    RETURN NULL;
END;
$function$
;

-- Nome: resumo_semanal_drivers
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
$function$
;

-- Nome: resumo_semanal_pedidos
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
$function$
;

-- Nome: retry_failed_mvs
CREATE OR REPLACE FUNCTION public.retry_failed_mvs(mv_names text[])
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '0'
AS $function$
DECLARE
    result json;
    results json[] := '{}';
    mv_name_item text;
    single_result json;
    success_count INTEGER := 0;
    fail_count INTEGER := 0;
    start_time TIMESTAMP;
BEGIN
    start_time := clock_timestamp();
    
    -- Processar cada MV da lista
    FOREACH mv_name_item IN ARRAY mv_names
    LOOP
        BEGIN
            -- Tentar atualizar a MV
            single_result := public.refresh_single_mv(mv_name_item, false);
            
            -- Adicionar ao array de resultados
            results := array_append(results, single_result);
            
            -- Contar sucessos e falhas
            IF (single_result->>'success')::boolean THEN
                success_count := success_count + 1;
            ELSE
                fail_count := fail_count + 1;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Em caso de erro na chamada, adicionar resultado de erro
            results := array_append(results, json_build_object(
                'success', false,
                'view', mv_name_item,
                'error', SQLERRM
            ));
            fail_count := fail_count + 1;
        END;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'total_duration_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time)),
        'views_processed', array_length(mv_names, 1),
        'success_count', success_count,
        'fail_count', fail_count,
        'results', results
    );
END;
$function$
;

-- Nome: revoke_user_access
CREATE OR REPLACE FUNCTION public.revoke_user_access(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.user_profiles
    SET 
        is_approved = false,
        status = 'pending',
        role = 'user',
        assigned_pracas = '{}'
    WHERE id = user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    RETURN TRUE;
END;
$function$
;

-- Nome: segundos_to_interval_text
CREATE OR REPLACE FUNCTION public.segundos_to_interval_text(segundos numeric)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  horas numeric;
  minutos numeric;
  segs numeric;
  horas_text text;
BEGIN
  IF segundos IS NULL THEN
    RETURN '00:00:00';
  END IF;
  
  horas := FLOOR(segundos / 3600);
  minutos := FLOOR((segundos % 3600) / 60);
  segs := FLOOR(segundos % 60);
  
  -- Formatar horas: garantir pelo menos 2 dígitos, mas não truncar se for maior
  IF horas < 10 THEN
    horas_text := '0' || horas::text;
  ELSE
    horas_text := horas::text;
  END IF;

  RETURN horas_text || ':' || 
         LPAD(minutos::text, 2, '0') || ':' ||
         LPAD(segs::text, 2, '0');
END;
$function$
;

-- Nome: set_user_admin
CREATE OR REPLACE FUNCTION public.set_user_admin(user_id uuid, make_admin boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND (up.is_admin = TRUE OR up.role = 'master' OR up.role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Não pode remover o próprio admin
  IF user_id = auth.uid() AND make_admin = FALSE THEN
    RAISE EXCEPTION 'Você não pode remover seu próprio status de admin';
  END IF;

  -- Verificar se o usuário existe
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id
  ) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Atualizar o status de admin E o role
  UPDATE public.user_profiles
  SET 
    is_admin = make_admin,
    role = CASE WHEN make_admin THEN 'admin' ELSE 'user' END,
    updated_at = NOW()
  WHERE id = user_id;

  RETURN TRUE;
END;
$function$
;

-- Nome: split_text
CREATE OR REPLACE FUNCTION public.split_text(text)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT string_to_array($1, ',');
$function$
;

-- Nome: sync_user_organization_to_metadata
CREATE OR REPLACE FUNCTION public.sync_user_organization_to_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Nome: to_hhmmss
CREATE OR REPLACE FUNCTION public.to_hhmmss(t text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  secs integer;
  m text;
BEGIN
  IF t IS NULL OR btrim(t) = '' THEN
    RETURN NULL;
  END IF;

  -- fração de dia (número em texto)
  IF t ~ '^[0-9]+(\.[0-9]+)?$' THEN
    secs := round(cast(t as numeric) * 86400);
    RETURN to_char((timestamp '1970-01-01' + make_interval(secs => secs))::time, 'HH24:MI:SS');
  END IF;

  -- ISO ...THH:MM:SS...
  m := (regexp_match(t, 'T([0-9]{2}:[0-9]{2}:[0-9]{2})'))[1];
  IF m IS NOT NULL THEN
    RETURN m;
  END IF;

  -- HH:MM:SS
  m := (regexp_match(t, '^([0-9]{1,2}:[0-9]{2}:[0-9]{2})$'))[1];
  IF m IS NOT NULL THEN
    RETURN lpad(split_part(m, ':', 1), 2, '0') || ':' ||
           split_part(m, ':', 2) || ':' ||
           split_part(m, ':', 3);
  END IF;

  -- HH:MM
  m := (regexp_match(t, '^([0-9]{1,2}:[0-9]{2})$'))[1];
  IF m IS NOT NULL THEN
    RETURN lpad(split_part(m, ':', 1), 2, '0') || ':' ||
           split_part(m, ':', 2) || ':00';
  END IF;

  RETURN t;
END $function$
;

-- Nome: toggle_chat_reaction
CREATE OR REPLACE FUNCTION public.toggle_chat_reaction(message_id uuid, emoji text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_id TEXT;
BEGIN
  user_id := auth.uid()::text;
  UPDATE public.chat_messages
  SET reactions = jsonb_set(COALESCE(reactions, '{}'::jsonb), ARRAY[user_id], to_jsonb(emoji))
  WHERE id = message_id;
END;
$function$
;

-- Nome: top_usuarios_ativos
CREATE OR REPLACE FUNCTION public.top_usuarios_ativos(p_limite integer DEFAULT 10, p_data_inicio timestamp with time zone DEFAULT (now() - '24:00:00'::interval), p_data_fim timestamp with time zone DEFAULT now())
 RETURNS TABLE(user_id uuid, user_name text, user_email text, total_acoes bigint, abas_diferentes bigint, ultima_atividade timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
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

-- Nome: trigger_clear_admin_cache
CREATE OR REPLACE FUNCTION public.trigger_clear_admin_cache()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
    PERFORM clear_admin_cache();
    RETURN COALESCE(NEW, OLD);
END;
$function$
;

-- Nome: update_dados_marketing_updated_at
CREATE OR REPLACE FUNCTION public.update_dados_marketing_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

-- Nome: update_dados_valores_cidade_updated_at
CREATE OR REPLACE FUNCTION public.update_dados_valores_cidade_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

-- Nome: update_dashboard_resumo_incremental
CREATE OR REPLACE FUNCTION public.update_dashboard_resumo_incremental(p_start_date date, p_end_date date, p_organization_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- 1. Delete existing records for the affected period
    DELETE FROM public.tb_dashboard_resumo
    WHERE data_do_periodo BETWEEN p_start_date AND p_end_date
    AND (p_organization_id IS NULL OR organization_id = p_organization_id);

    -- 2. Insert recalculated data for the affected period
    INSERT INTO public.tb_dashboard_resumo (
        data_do_periodo,
        ano_iso,
        semana_iso,
        praca,
        sub_praca,
        origem,
        turno,
        organization_id,
        total_ofertadas,
        total_aceitas,
        total_rejeitadas,
        total_completadas,
        segundos_planejados,
        segundos_realizados
    )
    WITH dados_base AS (
         SELECT dados_corridas.id,
            dados_corridas.data_do_periodo,
            (EXTRACT(isoyear FROM dados_corridas.data_do_periodo))::integer AS ano_iso,
            (EXTRACT(week FROM dados_corridas.data_do_periodo))::integer AS semana_iso,
            dados_corridas.praca,
            dados_corridas.sub_praca,
            dados_corridas.origem,
            dados_corridas.periodo AS turno,
            dados_corridas.organization_id,
            COALESCE(dados_corridas.numero_de_corridas_ofertadas, 0) AS corridas_ofertadas,
            COALESCE(dados_corridas.numero_de_corridas_aceitas, 0) AS corridas_aceitas,
            COALESCE(dados_corridas.numero_de_corridas_rejeitadas, 0) AS corridas_rejeitadas,
            COALESCE(dados_corridas.numero_de_corridas_completadas, 0) AS corridas_completadas,
            dados_corridas.numero_minimo_de_entregadores_regulares_na_escala,
            dados_corridas.duracao_do_periodo,
            dados_corridas.tempo_disponivel_absoluto
           FROM dados_corridas
          WHERE dados_corridas.data_do_periodo BETWEEN p_start_date AND p_end_date
          AND (p_organization_id IS NULL OR dados_corridas.organization_id = p_organization_id)
        ), horas_planejadas AS (
         SELECT unicos.data_do_periodo,
            unicos.praca,
            unicos.sub_praca,
            unicos.origem,
            unicos.turno,
            unicos.organization_id,
            sum(((unicos.numero_minimo_de_entregadores_regulares_na_escala)::numeric * EXTRACT(epoch FROM (unicos.duracao_do_periodo)::interval))) AS segundos_planejados
           FROM ( SELECT DISTINCT dados_base.data_do_periodo,
                    dados_base.praca,
                    dados_base.sub_praca,
                    dados_base.origem,
                    dados_base.turno,
                    dados_base.organization_id,
                    dados_base.numero_minimo_de_entregadores_regulares_na_escala,
                    dados_base.duracao_do_periodo
                   FROM dados_base) unicos
          GROUP BY unicos.data_do_periodo, unicos.praca, unicos.sub_praca, unicos.origem, unicos.turno, unicos.organization_id
        ), horas_realizadas AS (
         SELECT dados_base.data_do_periodo,
            dados_base.praca,
            dados_base.sub_praca,
            dados_base.origem,
            dados_base.turno,
            dados_base.organization_id,
            sum(EXTRACT(epoch FROM (dados_base.tempo_disponivel_absoluto)::interval)) AS segundos_realizados,
            sum(dados_base.corridas_ofertadas) AS total_ofertadas,
            sum(dados_base.corridas_aceitas) AS total_aceitas,
            sum(dados_base.corridas_rejeitadas) AS total_rejeitadas,
            sum(dados_base.corridas_completadas) AS total_completadas
           FROM dados_base
          GROUP BY dados_base.data_do_periodo, dados_base.praca, dados_base.sub_praca, dados_base.origem, dados_base.turno, dados_base.organization_id
        )
    SELECT hr.data_do_periodo,
        (EXTRACT(isoyear FROM hr.data_do_periodo))::integer AS ano_iso,
        (EXTRACT(week FROM hr.data_do_periodo))::integer AS semana_iso,
        hr.praca,
        hr.sub_praca,
        hr.origem,
        hr.turno,
        hr.organization_id,
        hr.total_ofertadas,
        hr.total_aceitas,
        hr.total_rejeitadas,
        hr.total_completadas,
        COALESCE(hp.segundos_planejados, (0)::numeric) AS segundos_planejados,
        COALESCE(hr.segundos_realizados, (0)::numeric) AS segundos_realizados
    FROM horas_realizadas hr
    LEFT JOIN horas_planejadas hp ON 
        hr.data_do_periodo = hp.data_do_periodo 
        AND (hr.praca = hp.praca OR (hr.praca IS NULL AND hp.praca IS NULL))
        AND (hr.sub_praca = hp.sub_praca OR (hr.sub_praca IS NULL AND hp.sub_praca IS NULL))
        AND (hr.origem = hp.origem OR (hr.origem IS NULL AND hp.origem IS NULL))
        AND (hr.turno = hp.turno OR (hr.turno IS NULL AND hp.turno IS NULL))
        AND (hr.organization_id = hp.organization_id OR (hr.organization_id IS NULL AND hp.organization_id IS NULL));
END;
$function$
;

-- Nome: update_organization
CREATE OR REPLACE FUNCTION public.update_organization(p_id uuid, p_name text DEFAULT NULL::text, p_slug text DEFAULT NULL::text, p_max_users integer DEFAULT NULL::integer, p_is_active boolean DEFAULT NULL::boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Apenas admin global pode atualizar organizações
  IF NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'Apenas administradores globais podem atualizar organizações';
  END IF;
  
  -- Validar slug se fornecido
  IF p_slug IS NOT NULL AND p_slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Slug inválido. Use apenas letras minúsculas, números e hífens';
  END IF;
  
  -- Verificar se slug já existe (em outra organização)
  IF p_slug IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE slug = p_slug AND id != p_id
  ) THEN
    RAISE EXCEPTION 'Slug já existe. Escolha outro.';
  END IF;
  
  -- Atualizar organização
  UPDATE public.organizations
  SET 
    name = COALESCE(p_name, name),
    slug = COALESCE(p_slug, slug),
    max_users = COALESCE(p_max_users, max_users),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = NOW()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$function$
;

-- Nome: update_user_avatar
CREATE OR REPLACE FUNCTION public.update_user_avatar(p_user_id uuid, p_avatar_url text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Verificar se o usuário está tentando atualizar seu próprio perfil
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Você só pode atualizar seu próprio perfil';
  END IF;

  -- Verificar se o usuário existe em auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Upsert (insert ou update) do perfil
  -- IMPORTANTE: Não incluir colunas que não existem ou que têm constraints
  INSERT INTO public.user_profiles (id, avatar_url, updated_at)
  VALUES (p_user_id, p_avatar_url, NOW())
  ON CONFLICT (id)
  DO UPDATE SET
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
END;
$function$
;

-- Nome: update_user_full_name
CREATE OR REPLACE FUNCTION public.update_user_full_name(p_user_id uuid, p_full_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Atualizar user_metadata no auth.users
  UPDATE auth.users
  SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', p_full_name),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Atualizar na tabela user_profiles se existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    INSERT INTO public.user_profiles (id, full_name, updated_at)
    VALUES (p_user_id, p_full_name, NOW())
    ON CONFLICT (id) 
    DO UPDATE SET 
      full_name = p_full_name,
      updated_at = NOW();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Nome atualizado com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$
;

-- Nome: update_user_organization
CREATE OR REPLACE FUNCTION public.update_user_organization(p_user_id uuid, p_organization_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_org_id UUID;
  target_user_org_id UUID;
BEGIN
  -- Verificar se é admin global
  IF public.is_global_admin() THEN
    -- Admin global pode mover qualquer usuário para qualquer organização
    UPDATE public.user_profiles
    SET organization_id = p_organization_id
    WHERE id = p_user_id;
    
    RETURN FOUND;
  END IF;
  
  -- Verificar se é admin da organização
  current_user_org_id := public.get_user_organization_id();
  
  IF current_user_org_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não tem organização associada';
  END IF;
  
  -- Obter organização do usuário alvo
  SELECT organization_id INTO target_user_org_id
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- Admin da organização só pode mover usuários dentro da mesma organização
  IF target_user_org_id != current_user_org_id THEN
    RAISE EXCEPTION 'Você só pode gerenciar usuários da sua organização';
  END IF;
  
  -- Verificar se organização destino existe e está ativa
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = p_organization_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Organização não encontrada ou inativa';
  END IF;
  
  -- Atualizar organization_id
  UPDATE public.user_profiles
  SET organization_id = p_organization_id
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$function$
;

-- Nome: update_user_pracas
CREATE OR REPLACE FUNCTION public.update_user_pracas(user_id uuid, pracas text[], p_role text DEFAULT NULL::text, p_organization_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Se role foi fornecido, validar e atualizar
  IF p_role IS NOT NULL THEN
    IF p_role NOT IN ('admin', 'marketing', 'user') THEN
      RAISE EXCEPTION 'Role inválido. Valores permitidos: admin, marketing, user';
    END IF;

    -- Atualizar com role e organization_id se fornecido
    UPDATE public.user_profiles
    SET 
      assigned_pracas = CASE 
        WHEN p_role = 'marketing' THEN ARRAY[]::TEXT[]
        ELSE pracas
      END,
      role = p_role,
      is_admin = (p_role = 'admin'),
      organization_id = COALESCE(p_organization_id, organization_id)
    WHERE id = user_id;
  ELSE
    -- Se role não foi fornecido, apenas atualizar praças e organization_id se fornecido
    UPDATE public.user_profiles
    SET 
      assigned_pracas = pracas,
      organization_id = COALESCE(p_organization_id, organization_id)
    WHERE id = user_id;
  END IF;

  RETURN TRUE;
END;
$function$
;

-- Nome: update_user_pracas
CREATE OR REPLACE FUNCTION public.update_user_pracas(user_id uuid, pracas text[], p_role text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Se role foi fornecido, validar e atualizar
  IF p_role IS NOT NULL THEN
    IF p_role NOT IN ('admin', 'marketing', 'user') THEN
      RAISE EXCEPTION 'Role inválido. Valores permitidos: admin, marketing, user';
    END IF;

    -- Se role for admin, garantir que is_admin seja true
    -- Se role for marketing ou user, garantir que is_admin seja false
    UPDATE public.user_profiles
    SET 
      assigned_pracas = pracas,
      role = p_role,
      is_admin = (p_role = 'admin')
    WHERE id = user_id;
  ELSE
    -- Se role não foi fornecido, apenas atualizar praças
    UPDATE public.user_profiles
    SET assigned_pracas = pracas
    WHERE id = user_id;
  END IF;

  RETURN TRUE;
END;
$function$
;

-- Nome: update_user_profiles_updated_at
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

-- Nome: update_user_role
CREATE OR REPLACE FUNCTION public.update_user_role(user_id uuid, p_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Validar role
  IF p_role NOT IN ('admin', 'marketing', 'user') THEN
    RAISE EXCEPTION 'Role inválido. Valores permitidos: admin, marketing, user';
  END IF;

  -- Atualizar role e is_admin
  -- Se role for admin, garantir que is_admin seja true
  -- Se role for marketing ou user, garantir que is_admin seja false
  UPDATE public.user_profiles
  SET 
    role = p_role,
    is_admin = (p_role = 'admin')
  WHERE id = user_id;

  RETURN TRUE;
END;
$function$
;

