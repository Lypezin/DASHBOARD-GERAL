-- 1. Tune autovacuum on dados_corridas so Visibility Map stays clean for Index Only Scans
ALTER TABLE public.dados_corridas SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_vacuum_insert_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_cost_limit = 1000
);

-- 2. Add compact covering indexes without dropping any existing indexes
CREATE INDEX IF NOT EXISTS idx_mv_dashboard_resumo_org_ano_cover_v1
  ON public.mv_dashboard_resumo (organization_id, ano_iso)
  INCLUDE (
    semana_iso, data_do_periodo, praca, sub_praca, origem, turno,
    total_ofertadas, total_aceitas, total_rejeitadas, total_completadas,
    total_pedidos_aceitos_e_concluidos, segundos_planejados, segundos_realizados
  );

CREATE INDEX IF NOT EXISTS idx_dados_corridas_org_driver_date_praca_v1
  ON public.dados_corridas (organization_id, id_da_pessoa_entregadora, data_do_periodo)
  INCLUDE (praca)
  WHERE (id_da_pessoa_entregadora IS NOT NULL AND data_do_periodo IS NOT NULL);

-- 3. Trigger optimizations
CREATE OR REPLACE FUNCTION public.mark_mv_marketing_refresh_needed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  update public.mv_refresh_control
  set
    needs_refresh = true,
    updated_at = now()
  where mv_name in (
    'mv_comparison_weekly',
    'mv_entregadores_marketing',
    'mv_entregadores_summary'
  )
    and needs_refresh = false;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_time_columns_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  duracao_norm text;
  escalado_norm text;
  absoluto_norm text;
BEGIN
  duracao_norm := coalesce(nullif(btrim(NEW.duracao_do_periodo), ''), '00:00:00');
  IF duracao_norm ~ '^\d{1,3}:\d{2}:\d{2}$' THEN
    IF length(split_part(duracao_norm, ':', 1)) = 1 THEN
      duracao_norm := '0' || duracao_norm;
    END IF;
    NEW.duracao_do_periodo := duracao_norm;
    NEW.duracao_segundos := split_part(duracao_norm, ':', 1)::int * 3600
                          + split_part(duracao_norm, ':', 2)::int * 60
                          + split_part(duracao_norm, ':', 3)::int;
  ELSE
    duracao_norm := public.normalize_time_to_hhmmss(NEW.duracao_do_periodo);
    NEW.duracao_do_periodo := duracao_norm;
    NEW.duracao_segundos := public.hhmmss_to_seconds(duracao_norm);
  END IF;

  escalado_norm := coalesce(nullif(btrim(NEW.tempo_disponivel_escalado), ''), '00:00:00');
  IF escalado_norm ~ '^\d{1,3}:\d{2}:\d{2}$' THEN
    IF length(split_part(escalado_norm, ':', 1)) = 1 THEN
      escalado_norm := '0' || escalado_norm;
    END IF;
    NEW.tempo_disponivel_escalado := escalado_norm;
    NEW.tempo_disponivel_escalado_segundos := split_part(escalado_norm, ':', 1)::int * 3600
                                            + split_part(escalado_norm, ':', 2)::int * 60
                                            + split_part(escalado_norm, ':', 3)::int;
  ELSE
    escalado_norm := public.normalize_time_to_hhmmss(NEW.tempo_disponivel_escalado);
    NEW.tempo_disponivel_escalado := escalado_norm;
    NEW.tempo_disponivel_escalado_segundos := public.hhmmss_to_seconds(escalado_norm);
  END IF;

  absoluto_norm := coalesce(nullif(btrim(NEW.tempo_disponivel_absoluto), ''), '00:00:00');
  IF absoluto_norm ~ '^\d{1,3}:\d{2}:\d{2}$' THEN
    IF length(split_part(absoluto_norm, ':', 1)) = 1 THEN
      absoluto_norm := '0' || absoluto_norm;
    END IF;
    NEW.tempo_disponivel_absoluto := absoluto_norm;
    NEW.tempo_disponivel_absoluto_segundos := split_part(absoluto_norm, ':', 1)::int * 3600
                                            + split_part(absoluto_norm, ':', 2)::int * 60
                                            + split_part(absoluto_norm, ':', 3)::int;
  ELSE
    absoluto_norm := public.normalize_time_to_hhmmss(NEW.tempo_disponivel_absoluto);
    NEW.tempo_disponivel_absoluto := absoluto_norm;
    NEW.tempo_disponivel_absoluto_segundos := public.hhmmss_to_seconds(absoluto_norm);
  END IF;

  RETURN NEW;
END
$function$;

-- 4. RLS Performance (initplan SELECT wrappers) & store_settings admin restriction
ALTER POLICY "Admin delete Configurações" ON public.store_settings
  USING (((SELECT public.is_global_admin()) OR (SELECT public.is_org_admin())));
ALTER POLICY "Admin insert Configurações" ON public.store_settings
  WITH CHECK (((SELECT public.is_global_admin()) OR (SELECT public.is_org_admin())));
ALTER POLICY "Admin update Configurações" ON public.store_settings
  USING (((SELECT public.is_global_admin()) OR (SELECT public.is_org_admin())))
  WITH CHECK (((SELECT public.is_global_admin()) OR (SELECT public.is_org_admin())));

ALTER POLICY "Authenticated users can insert" ON public.dados_corridas
  WITH CHECK (((organization_id = (SELECT public.get_my_organization_id())) OR (SELECT public.is_org_admin())));

ALTER POLICY "Users can delete marketing in their organization" ON public.dados_marketing
  USING (((SELECT public.is_global_admin()) OR (organization_id = (SELECT public.get_user_organization_id()))));
ALTER POLICY "Users can insert marketing in their organization" ON public.dados_marketing
  WITH CHECK (((SELECT public.is_global_admin()) OR (organization_id = (SELECT public.get_user_organization_id()))));
ALTER POLICY "Users can update marketing in their organization" ON public.dados_marketing
  USING (((SELECT public.is_global_admin()) OR (organization_id = (SELECT public.get_user_organization_id()))))
  WITH CHECK (((SELECT public.is_global_admin()) OR (organization_id = (SELECT public.get_user_organization_id()))));

ALTER POLICY "Users can delete valores_cidade in their organization" ON public.dados_valores_cidade
  USING (((SELECT public.is_global_admin()) OR (organization_id = (SELECT public.get_user_organization_id()))));
ALTER POLICY "Users can insert valores_cidade in their organization" ON public.dados_valores_cidade
  WITH CHECK (((SELECT public.is_global_admin()) OR (organization_id = (SELECT public.get_user_organization_id()))));
ALTER POLICY "Users can update valores_cidade in their organization" ON public.dados_valores_cidade
  USING (((SELECT public.is_global_admin()) OR (organization_id = (SELECT public.get_user_organization_id()))))
  WITH CHECK (((SELECT public.is_global_admin()) OR (organization_id = (SELECT public.get_user_organization_id()))));
ALTER POLICY "Users can view valores_cidade in their organization" ON public.dados_valores_cidade
  USING (((SELECT public.is_global_admin()) OR (organization_id = (SELECT public.get_my_organization_id())) OR (organization_id = (SELECT public.get_user_organization_id()))));

ALTER POLICY "Tags delete within organization" ON public.entregador_tags
  USING (((SELECT public.is_admin_or_master()) OR (organization_id = (SELECT public.get_my_organization_id()))));
ALTER POLICY "Tags insert within organization" ON public.entregador_tags
  WITH CHECK (((SELECT public.is_admin_or_master()) OR (organization_id = (SELECT public.get_my_organization_id()))));
ALTER POLICY "Tags update within organization" ON public.entregador_tags
  USING (((SELECT public.is_admin_or_master()) OR (organization_id = (SELECT public.get_my_organization_id())) OR (organization_id IS NULL)))
  WITH CHECK (((SELECT public.is_admin_or_master()) OR (organization_id = (SELECT public.get_my_organization_id()))));
ALTER POLICY "Tags view by organization or legacy global" ON public.entregador_tags
  USING (((SELECT public.is_admin_or_master()) OR (organization_id = (SELECT public.get_my_organization_id())) OR (organization_id IS NULL)));

ALTER POLICY "Tag assignments delete by tag organization" ON public.entregador_tag_assignments
  USING ((EXISTS (SELECT 1 FROM public.entregador_tags t WHERE t.id = entregador_tag_assignments.tag_id AND ((SELECT public.is_admin_or_master()) OR (t.organization_id = (SELECT public.get_my_organization_id())) OR (t.organization_id IS NULL)))));
ALTER POLICY "Tag assignments insert by tag organization" ON public.entregador_tag_assignments
  WITH CHECK ((EXISTS (SELECT 1 FROM public.entregador_tags t WHERE t.id = entregador_tag_assignments.tag_id AND ((SELECT public.is_admin_or_master()) OR (t.organization_id = (SELECT public.get_my_organization_id())) OR (t.organization_id IS NULL)))));
ALTER POLICY "Tag assignments update by tag organization" ON public.entregador_tag_assignments
  USING ((EXISTS (SELECT 1 FROM public.entregador_tags t WHERE t.id = entregador_tag_assignments.tag_id AND ((SELECT public.is_admin_or_master()) OR (t.organization_id = (SELECT public.get_my_organization_id())) OR (t.organization_id IS NULL)))))
  WITH CHECK ((EXISTS (SELECT 1 FROM public.entregador_tags t WHERE t.id = entregador_tag_assignments.tag_id AND ((SELECT public.is_admin_or_master()) OR (t.organization_id = (SELECT public.get_my_organization_id())) OR (t.organization_id IS NULL)))));
ALTER POLICY "Tag assignments view by tag organization" ON public.entregador_tag_assignments
  USING ((EXISTS (SELECT 1 FROM public.entregador_tags t WHERE t.id = entregador_tag_assignments.tag_id AND ((SELECT public.is_admin_or_master()) OR (t.organization_id = (SELECT public.get_my_organization_id())) OR (t.organization_id IS NULL)))));

ALTER POLICY "Enable insert for users" ON public.presentations
  WITH CHECK (((organization_id = (SELECT public.get_my_organization_id())) OR ((SELECT public.is_org_admin()) AND (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = presentations.organization_id AND o.is_active = true)))));

ALTER POLICY "Users can view their organization data" ON public.tb_dashboard_resumo
  USING (((organization_id IN (SELECT user_profiles.organization_id FROM public.user_profiles WHERE user_profiles.id = (SELECT auth.uid()))) OR (SELECT public.is_global_admin())));

-- 5. Enforce organization isolation in listar_evolucao_mensal
CREATE OR REPLACE FUNCTION public.listar_evolucao_mensal(p_ano integer, p_praca text DEFAULT NULL::text)
 RETURNS TABLE(ano integer, mes integer, mes_nome text, corridas_ofertadas bigint, corridas_aceitas bigint, corridas_completadas bigint, corridas_rejeitadas bigint, total_segundos numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_admin boolean := false;
  v_org_filter uuid;
  v_pracas text[];
BEGIN
  IF p_ano IS NULL THEN
    RAISE EXCEPTION 'Filtro de ano (p_ano) é obrigatório para evitar timeout';
  END IF;

  IF v_user_id IS NULL AND auth.role() = 'service_role' THEN
    v_is_admin := true;
  ELSIF v_user_id IS NOT NULL THEN
    SELECT
      coalesce((role IN ('admin', 'marketing', 'master') OR is_admin = true), false),
      organization_id
    INTO v_is_admin, v_org_filter
    FROM public.user_profiles
    WHERE id = v_user_id;

    IF NOT v_is_admin AND v_org_filter IS NULL THEN
      v_org_filter := '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;
  ELSE
    v_org_filter := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  IF p_praca IS NOT NULL AND btrim(p_praca) <> '' AND lower(btrim(p_praca)) NOT IN ('todas', 'todos', 'all') THEN
    SELECT array_agg(btrim(val))
    INTO v_pracas
    FROM unnest(string_to_array(p_praca, ',')) AS val
    WHERE btrim(val) <> '';
  END IF;

  RETURN QUERY
  WITH filtered_data AS (
    SELECT
      v.ano_iso,
      EXTRACT(MONTH FROM v.data_do_periodo)::integer AS mes_numero,
      v.total_ofertadas,
      v.total_aceitas,
      v.total_completadas,
      v.total_rejeitadas,
      v.segundos_realizados AS tempo_segundos
    FROM public.vw_dashboard_resumo_current v
    WHERE v.ano_iso = p_ano
      AND (v_is_admin OR v.organization_id = v_org_filter)
      AND (v_pracas IS NULL OR v.praca = ANY(v_pracas))
  ),
  mes_agg AS (
    SELECT
      fd.ano_iso,
      fd.mes_numero,
      SUM(fd.total_ofertadas) AS total_ofertadas,
      SUM(fd.total_aceitas) AS total_aceitas,
      SUM(fd.total_completadas) AS total_completadas,
      SUM(fd.total_rejeitadas) AS total_rejeitadas,
      SUM(fd.tempo_segundos) AS total_segundos
    FROM filtered_data fd
    GROUP BY fd.ano_iso, fd.mes_numero
    HAVING SUM(fd.total_ofertadas) > 0 OR SUM(fd.total_aceitas) > 0 OR SUM(fd.total_completadas) > 0
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
$function$;

ANALYZE public.mv_dashboard_resumo;
ANALYZE public.tb_dashboard_resumo_incremental;
