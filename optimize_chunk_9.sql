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

