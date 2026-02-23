-- =========================================================
-- BACKUP ORIGINAL DOS ÍNDICES DE TABELA (Supabase)
-- Contém as definições de todos os índices estruturais originais
-- =========================================================

-- Tabela: chat_messages | Índice: chat_messages_participants_idx
CREATE INDEX chat_messages_participants_idx ON public.chat_messages USING btree (from_user, to_user);

-- Tabela: chat_messages | Índice: chat_messages_pkey
CREATE UNIQUE INDEX chat_messages_pkey ON public.chat_messages USING btree (id);

-- Tabela: dados_corridas | Índice: dados_corridas_pkey
CREATE UNIQUE INDEX dados_corridas_pkey ON public.dados_corridas USING btree (id);

-- Tabela: dados_corridas | Índice: idx_dados_ano_iso_simples
CREATE INDEX idx_dados_ano_iso_simples ON public.dados_corridas USING btree (ano_iso) WHERE (ano_iso IS NOT NULL);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_admin_completo
CREATE INDEX idx_dados_corridas_admin_completo ON public.dados_corridas USING btree (data_do_periodo, ano_iso, semana_numero, praca) WHERE (data_do_periodo IS NOT NULL);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_admin_optimized
CREATE INDEX idx_dados_corridas_admin_optimized ON public.dados_corridas USING btree (praca, ano_iso, semana_numero) INCLUDE (tempo_disponivel_absoluto_segundos, numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_rejeitadas, numero_de_corridas_completadas);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_agg_v3
CREATE INDEX idx_dados_corridas_agg_v3 ON public.dados_corridas USING btree (id_da_pessoa_entregadora, data_do_periodo) INCLUDE (numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_completadas, numero_de_corridas_rejeitadas, tempo_disponivel_escalado_segundos);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_ano_semana_otimizado
CREATE INDEX idx_dados_corridas_ano_semana_otimizado ON public.dados_corridas USING btree (ano_iso, semana_numero) WHERE ((data_do_periodo IS NOT NULL) AND (ano_iso IS NOT NULL) AND (semana_numero IS NOT NULL));

-- Tabela: dados_corridas | Índice: idx_dados_corridas_ano_semana_praca_otimizado
CREATE INDEX idx_dados_corridas_ano_semana_praca_otimizado ON public.dados_corridas USING btree (ano_iso, semana_numero, praca) WHERE ((data_do_periodo IS NOT NULL) AND (ano_iso IS NOT NULL) AND (semana_numero IS NOT NULL));

-- Tabela: dados_corridas | Índice: idx_dados_corridas_dashboard_perf
CREATE INDEX idx_dados_corridas_dashboard_perf ON public.dados_corridas USING btree (organization_id, data_do_periodo) INCLUDE (praca, sub_praca, origem, periodo, tempo_disponivel_absoluto_segundos, numero_de_corridas_completadas, numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_rejeitadas, id_da_pessoa_entregadora, pessoa_entregadora);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_data_filtros_otimizado_v2
CREATE INDEX idx_dados_corridas_data_filtros_otimizado_v2 ON public.dados_corridas USING btree (data_do_periodo, ano_iso, semana_numero, praca, sub_praca, origem, periodo) WHERE (data_do_periodo IS NOT NULL);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_data_periodo
CREATE INDEX idx_dados_corridas_data_periodo ON public.dados_corridas USING btree (data_do_periodo) WHERE (data_do_periodo IS NOT NULL);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_data_periodo_otimizado
CREATE INDEX idx_dados_corridas_data_periodo_otimizado ON public.dados_corridas USING btree (data_do_periodo, praca, sub_praca, origem) WHERE (data_do_periodo IS NOT NULL);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_distinct_periodo
CREATE INDEX idx_dados_corridas_distinct_periodo ON public.dados_corridas USING btree (data_do_periodo, periodo, praca, sub_praca, origem, numero_minimo_de_entregadores_regulares_na_escala DESC) WHERE (data_do_periodo IS NOT NULL);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_entregador_filtros
CREATE INDEX idx_dados_corridas_entregador_filtros ON public.dados_corridas USING btree (id_da_pessoa_entregadora, praca, sub_praca, origem, data_do_periodo);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_filtros
CREATE INDEX idx_dados_corridas_filtros ON public.dados_corridas USING btree (praca, sub_praca, origem, data_do_periodo);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_filtros_comuns
CREATE INDEX idx_dados_corridas_filtros_comuns ON public.dados_corridas USING btree (ano_iso, semana_numero, praca, sub_praca, origem) WHERE (data_do_periodo IS NOT NULL);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_filtros_otimizado
CREATE INDEX idx_dados_corridas_filtros_otimizado ON public.dados_corridas USING btree (praca, sub_praca, origem) WHERE ((praca IS NOT NULL) OR (sub_praca IS NOT NULL) OR (origem IS NOT NULL));

-- Tabela: dados_corridas | Índice: idx_dados_corridas_org_ano_semana_agg
CREATE INDEX idx_dados_corridas_org_ano_semana_agg ON public.dados_corridas USING btree (organization_id, ano_iso, semana_numero) INCLUDE (id_da_pessoa_entregadora, numero_minimo_de_entregadores_regulares_na_escala) WHERE (data_do_periodo IS NOT NULL);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_origem
CREATE INDEX idx_dados_corridas_origem ON public.dados_corridas USING btree (origem) WHERE (origem IS NOT NULL);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_origem_data
CREATE INDEX idx_dados_corridas_origem_data ON public.dados_corridas USING btree (origem, data_do_periodo) WHERE (data_do_periodo IS NOT NULL);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_periodo
CREATE INDEX idx_dados_corridas_periodo ON public.dados_corridas USING btree (periodo) WHERE (periodo IS NOT NULL);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_sub_praca
CREATE INDEX idx_dados_corridas_sub_praca ON public.dados_corridas USING btree (sub_praca) WHERE (sub_praca IS NOT NULL);

-- Tabela: dados_corridas | Índice: idx_dados_corridas_valores_otimizado
CREATE INDEX idx_dados_corridas_valores_otimizado ON public.dados_corridas USING btree (ano_iso, semana_numero, id_da_pessoa_entregadora) INCLUDE (pessoa_entregadora, numero_de_corridas_aceitas, soma_das_taxas_das_corridas_aceitas) WHERE ((data_do_periodo IS NOT NULL) AND (id_da_pessoa_entregadora IS NOT NULL) AND (id_da_pessoa_entregadora <> ''::text) AND (pessoa_entregadora IS NOT NULL) AND (numero_de_corridas_aceitas > 0));

-- Tabela: dados_corridas | Índice: idx_dados_evolucao_mensal
CREATE INDEX idx_dados_evolucao_mensal ON public.dados_corridas USING btree (EXTRACT(year FROM data_do_periodo), EXTRACT(month FROM data_do_periodo), praca) INCLUDE (numero_de_corridas_completadas, tempo_disponivel_absoluto_segundos) WHERE (data_do_periodo IS NOT NULL);

-- Tabela: dados_corridas | Índice: idx_dados_evolucao_semanal
CREATE INDEX idx_dados_evolucao_semanal ON public.dados_corridas USING btree (ano_iso, semana_numero, praca) INCLUDE (numero_de_corridas_completadas, tempo_disponivel_absoluto_segundos) WHERE ((semana_numero IS NOT NULL) AND (ano_iso IS NOT NULL));

-- Tabela: dados_corridas | Índice: idx_mv_corridas_opt
CREATE INDEX idx_mv_corridas_opt ON public.dados_corridas USING btree (id_da_pessoa_entregadora, data_do_periodo) INCLUDE (numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_completadas, numero_de_corridas_rejeitadas, tempo_disponivel_absoluto_segundos) WHERE ((id_da_pessoa_entregadora IS NOT NULL) AND (data_do_periodo IS NOT NULL));

-- Tabela: dados_marketing | Índice: dados_marketing_pkey
CREATE UNIQUE INDEX dados_marketing_pkey ON public.dados_marketing USING btree (id);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_data_envio
CREATE INDEX idx_dados_marketing_data_envio ON public.dados_marketing USING btree (data_envio) WHERE (data_envio IS NOT NULL);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_data_liberacao
CREATE INDEX idx_dados_marketing_data_liberacao ON public.dados_marketing USING btree (data_liberacao);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_id_entregador
CREATE INDEX idx_dados_marketing_id_entregador ON public.dados_marketing USING btree (id_entregador);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_id_rodou_dia
CREATE INDEX idx_dados_marketing_id_rodou_dia ON public.dados_marketing USING btree (id_entregador, rodou_dia);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_org_data
CREATE INDEX idx_dados_marketing_org_data ON public.dados_marketing USING btree (organization_id, rodou_dia DESC);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_org_id_rodou_dia
CREATE INDEX idx_dados_marketing_org_id_rodou_dia ON public.dados_marketing USING btree (organization_id, id_entregador, rodou_dia);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_org_regiao
CREATE INDEX idx_dados_marketing_org_regiao ON public.dados_marketing USING btree (organization_id, regiao_atuacao);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_organization_id
CREATE INDEX idx_dados_marketing_organization_id ON public.dados_marketing USING btree (organization_id);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_regiao_atuacao
CREATE INDEX idx_dados_marketing_regiao_atuacao ON public.dados_marketing USING btree (regiao_atuacao) WHERE (regiao_atuacao IS NOT NULL);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_regiao_sub_praca
CREATE INDEX idx_dados_marketing_regiao_sub_praca ON public.dados_marketing USING btree (regiao_atuacao, sub_praca_abc) WHERE (regiao_atuacao IS NOT NULL);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_responsavel
CREATE INDEX idx_dados_marketing_responsavel ON public.dados_marketing USING btree (responsavel) WHERE (responsavel IS NOT NULL);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_responsavel_data_envio
CREATE INDEX idx_dados_marketing_responsavel_data_envio ON public.dados_marketing USING btree (responsavel, data_envio) WHERE ((responsavel IS NOT NULL) AND (data_envio IS NOT NULL));

-- Tabela: dados_marketing | Índice: idx_dados_marketing_responsavel_data_liberacao
CREATE INDEX idx_dados_marketing_responsavel_data_liberacao ON public.dados_marketing USING btree (responsavel, data_liberacao) WHERE ((responsavel IS NOT NULL) AND (data_liberacao IS NOT NULL));

-- Tabela: dados_marketing | Índice: idx_dados_marketing_rodou_dia
CREATE INDEX idx_dados_marketing_rodou_dia ON public.dados_marketing USING btree (rodou_dia) WHERE (rodou_dia IS NOT NULL);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_status
CREATE INDEX idx_dados_marketing_status ON public.dados_marketing USING btree (status);

-- Tabela: dados_marketing | Índice: idx_dados_marketing_sub_praca_abc
CREATE INDEX idx_dados_marketing_sub_praca_abc ON public.dados_marketing USING btree (sub_praca_abc) WHERE (sub_praca_abc IS NOT NULL);

-- Tabela: dados_marketing | Índice: idx_mv_mkt_opt
CREATE INDEX idx_mv_mkt_opt ON public.dados_marketing USING btree (id_entregador, data_liberacao DESC, data_envio DESC NULLS LAST, created_at DESC) WHERE ((id_entregador IS NOT NULL) AND (data_liberacao IS NOT NULL));

-- Tabela: dados_valores_cidade | Índice: dados_valores_cidade_pkey
CREATE UNIQUE INDEX dados_valores_cidade_pkey ON public.dados_valores_cidade USING btree (id);

-- Tabela: dados_valores_cidade | Índice: idx_dados_valores_cidade_data
CREATE INDEX idx_dados_valores_cidade_data ON public.dados_valores_cidade USING btree (data);

-- Tabela: dados_valores_cidade | Índice: idx_dados_valores_cidade_organization_id
CREATE INDEX idx_dados_valores_cidade_organization_id ON public.dados_valores_cidade USING btree (organization_id);

-- Tabela: gamification_badges | Índice: gamification_badges_pkey
CREATE UNIQUE INDEX gamification_badges_pkey ON public.gamification_badges USING btree (slug);

-- Tabela: gamification_user_badges | Índice: gamification_user_badges_pkey
CREATE UNIQUE INDEX gamification_user_badges_pkey ON public.gamification_user_badges USING btree (user_id, badge_slug);

-- Tabela: gamification_user_stats | Índice: gamification_user_stats_pkey
CREATE UNIQUE INDEX gamification_user_stats_pkey ON public.gamification_user_stats USING btree (user_id);

-- Tabela: mv_aderencia_agregada | Índice: idx_mv_aderencia_agregada_unique
CREATE UNIQUE INDEX idx_mv_aderencia_agregada_unique ON public.mv_aderencia_agregada USING btree (ano_iso, semana_numero, dia_iso, turno, praca, sub_praca, origem);

-- Tabela: mv_aderencia_agregada | Índice: idx_mv_aderencia_praca_not_null
CREATE INDEX idx_mv_aderencia_praca_not_null ON public.mv_aderencia_agregada USING btree (praca) WHERE ((praca IS NOT NULL) AND (praca <> ''::text));

-- Tabela: mv_aderencia_agregada | Índice: idx_mv_aderencia_principal
CREATE INDEX idx_mv_aderencia_principal ON public.mv_aderencia_agregada USING btree (ano_iso, semana_numero, praca, sub_praca, origem);

-- Tabela: mv_aderencia_dia | Índice: idx_mv_aderencia_dia_unique
CREATE UNIQUE INDEX idx_mv_aderencia_dia_unique ON public.mv_aderencia_dia USING btree (data_ref, dia_iso);

-- Tabela: mv_aderencia_semana | Índice: idx_mv_aderencia_semana_unique
CREATE UNIQUE INDEX idx_mv_aderencia_semana_unique ON public.mv_aderencia_semana USING btree (ano_iso, semana_numero);

-- Tabela: mv_corridas_agregadas | Índice: idx_mv_corridas_agregadas_entregador
CREATE INDEX idx_mv_corridas_agregadas_entregador ON public.mv_corridas_agregadas USING btree (id_entregador);

-- Tabela: mv_corridas_agregadas | Índice: idx_mv_corridas_agregadas_org
CREATE INDEX idx_mv_corridas_agregadas_org ON public.mv_corridas_agregadas USING btree (organization_id);

-- Tabela: mv_corridas_agregadas | Índice: idx_mv_corridas_agregadas_org_id
CREATE INDEX idx_mv_corridas_agregadas_org_id ON public.mv_corridas_agregadas USING btree (organization_id, id_entregador);

-- Tabela: mv_corridas_agregadas | Índice: idx_mv_corridas_agregadas_semana
CREATE INDEX idx_mv_corridas_agregadas_semana ON public.mv_corridas_agregadas USING btree (ano_iso, semana_numero);

-- Tabela: mv_dashboard_aderencia_metricas | Índice: idx_mv_aderencia_filtros_principais
CREATE INDEX idx_mv_aderencia_filtros_principais ON public.mv_dashboard_aderencia_metricas USING btree (ano_iso, semana_numero, praca);

-- Tabela: mv_dashboard_aderencia_metricas | Índice: idx_mv_aderencia_filtros_secundarios
CREATE INDEX idx_mv_aderencia_filtros_secundarios ON public.mv_dashboard_aderencia_metricas USING btree (sub_praca, origem, periodo);

-- Tabela: mv_dashboard_aderencia_metricas | Índice: idx_mv_aderencia_metricas_unique
CREATE UNIQUE INDEX idx_mv_aderencia_metricas_unique ON public.mv_dashboard_aderencia_metricas USING btree (ano_iso, semana_numero, praca, sub_praca, origem);

-- Tabela: mv_dashboard_admin | Índice: idx_mv_dashboard_admin_lookup
CREATE INDEX idx_mv_dashboard_admin_lookup ON public.mv_dashboard_admin USING btree (ano_iso, semana_numero, praca);

-- Tabela: mv_dashboard_admin | Índice: idx_mv_dashboard_admin_unique
CREATE UNIQUE INDEX idx_mv_dashboard_admin_unique ON public.mv_dashboard_admin USING btree (ano_iso, semana_numero, praca, sub_praca, origem);

-- Tabela: mv_dashboard_lite | Índice: idx_mv_dashboard_lite_unique
CREATE UNIQUE INDEX idx_mv_dashboard_lite_unique ON public.mv_dashboard_lite USING btree (ano_iso, semana_numero, praca);

-- Tabela: mv_dashboard_micro | Índice: idx_mv_dashboard_micro_unique
CREATE UNIQUE INDEX idx_mv_dashboard_micro_unique ON public.mv_dashboard_micro USING btree (ano_iso, semana_numero);

-- Tabela: mv_dashboard_resumo | Índice: idx_mv_dashboard_ano_iso
CREATE INDEX idx_mv_dashboard_ano_iso ON public.mv_dashboard_resumo USING btree (ano_iso);

-- Tabela: mv_dashboard_resumo | Índice: idx_mv_dashboard_data
CREATE INDEX idx_mv_dashboard_data ON public.mv_dashboard_resumo USING btree (data_do_periodo);

-- Tabela: mv_dashboard_resumo | Índice: idx_mv_dashboard_filtros
CREATE INDEX idx_mv_dashboard_filtros ON public.mv_dashboard_resumo USING btree (ano_iso, semana_iso, praca, sub_praca, origem, turno);

-- Tabela: mv_dashboard_resumo | Índice: idx_mv_dashboard_org
CREATE INDEX idx_mv_dashboard_org ON public.mv_dashboard_resumo USING btree (organization_id);

-- Tabela: mv_dashboard_resumo | Índice: idx_mv_dashboard_org_ano_semana
CREATE INDEX idx_mv_dashboard_org_ano_semana ON public.mv_dashboard_resumo USING btree (organization_id, ano_iso, semana_iso);

-- Tabela: mv_dashboard_resumo | Índice: idx_mv_dashboard_resumo_unique
CREATE UNIQUE INDEX idx_mv_dashboard_resumo_unique ON public.mv_dashboard_resumo USING btree (data_do_periodo, praca, sub_praca, origem, turno, organization_id) NULLS NOT DISTINCT;

-- Tabela: mv_dashboard_resumo_v2 | Índice: idx_mv_dashboard_resumo_v2_filters
CREATE INDEX idx_mv_dashboard_resumo_v2_filters ON public.mv_dashboard_resumo_v2 USING btree (praca, sub_praca, origem, turno);

-- Tabela: mv_dashboard_resumo_v2 | Índice: idx_mv_dashboard_resumo_v2_org_date
CREATE INDEX idx_mv_dashboard_resumo_v2_org_date ON public.mv_dashboard_resumo_v2 USING btree (organization_id, data_do_periodo);

-- Tabela: mv_dashboard_resumo_v2 | Índice: idx_mv_dashboard_v2_praca
CREATE INDEX idx_mv_dashboard_v2_praca ON public.mv_dashboard_resumo_v2 USING btree (praca);

-- Tabela: mv_entregadores_ativacao | Índice: idx_mv_ativacao_composite
CREATE UNIQUE INDEX idx_mv_ativacao_composite ON public.mv_entregadores_ativacao USING btree (organization_id, id_entregador);

-- Tabela: mv_entregadores_ativacao | Índice: idx_mv_ativacao_org_week
CREATE INDEX idx_mv_ativacao_org_week ON public.mv_entregadores_ativacao USING btree (organization_id, activation_week);

-- Tabela: mv_entregadores_marketing | Índice: idx_mv_entregadores_marketing_id_unique
CREATE UNIQUE INDEX idx_mv_entregadores_marketing_id_unique ON public.mv_entregadores_marketing USING btree (id_entregador);

-- Tabela: mv_entregadores_marketing | Índice: idx_mv_entregadores_marketing_nome
CREATE INDEX idx_mv_entregadores_marketing_nome ON public.mv_entregadores_marketing USING btree (nome);

-- Tabela: mv_entregadores_marketing | Índice: idx_mv_entregadores_marketing_organization_id
CREATE INDEX idx_mv_entregadores_marketing_organization_id ON public.mv_entregadores_marketing USING btree (organization_id);

-- Tabela: mv_entregadores_marketing | Índice: idx_mv_entregadores_marketing_regiao_atuacao
CREATE INDEX idx_mv_entregadores_marketing_regiao_atuacao ON public.mv_entregadores_marketing USING btree (regiao_atuacao);

-- Tabela: mv_entregadores_summary | Índice: idx_mv_entregadores_summary_activation
CREATE INDEX idx_mv_entregadores_summary_activation ON public.mv_entregadores_summary USING btree (activation_week);

-- Tabela: mv_entregadores_summary | Índice: idx_mv_entregadores_summary_last_active
CREATE INDEX idx_mv_entregadores_summary_last_active ON public.mv_entregadores_summary USING btree (last_active_week);

-- Tabela: mv_entregadores_summary | Índice: idx_mv_entregadores_summary_marketing
CREATE INDEX idx_mv_entregadores_summary_marketing ON public.mv_entregadores_summary USING btree (is_marketing);

-- Tabela: mv_entregadores_summary | Índice: idx_mv_entregadores_summary_org
CREATE INDEX idx_mv_entregadores_summary_org ON public.mv_entregadores_summary USING btree (organization_id);

-- Tabela: mv_refresh_control | Índice: idx_mv_refresh_control_needs_refresh
CREATE INDEX idx_mv_refresh_control_needs_refresh ON public.mv_refresh_control USING btree (needs_refresh, mv_name) WHERE (needs_refresh = true);

-- Tabela: mv_refresh_control | Índice: mv_refresh_control_mv_name_unique
CREATE UNIQUE INDEX mv_refresh_control_mv_name_unique ON public.mv_refresh_control USING btree (mv_name);

-- Tabela: mv_refresh_control | Índice: mv_refresh_control_pkey
CREATE UNIQUE INDEX mv_refresh_control_pkey ON public.mv_refresh_control USING btree (id);

-- Tabela: mv_utr_stats | Índice: idx_mv_utr_stats_dims
CREATE INDEX idx_mv_utr_stats_dims ON public.mv_utr_stats USING btree (praca, sub_praca, origem, periodo);

-- Tabela: mv_utr_stats | Índice: idx_mv_utr_stats_filter
CREATE INDEX idx_mv_utr_stats_filter ON public.mv_utr_stats USING btree (organization_id, data_do_periodo, ano_iso, semana_numero);

-- Tabela: organizations | Índice: idx_organizations_active
CREATE INDEX idx_organizations_active ON public.organizations USING btree (is_active) WHERE (is_active = true);

-- Tabela: organizations | Índice: idx_organizations_slug
CREATE INDEX idx_organizations_slug ON public.organizations USING btree (slug);

-- Tabela: organizations | Índice: organizations_pkey
CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

-- Tabela: organizations | Índice: organizations_slug_key
CREATE UNIQUE INDEX organizations_slug_key ON public.organizations USING btree (slug);

-- Tabela: presentations | Índice: presentations_pkey
CREATE UNIQUE INDEX presentations_pkey ON public.presentations USING btree (id);

-- Tabela: tb_dashboard_resumo | Índice: idx_tb_dashboard_data
CREATE INDEX idx_tb_dashboard_data ON public.tb_dashboard_resumo USING btree (data_do_periodo);

-- Tabela: tb_dashboard_resumo | Índice: idx_tb_dashboard_filtros
CREATE INDEX idx_tb_dashboard_filtros ON public.tb_dashboard_resumo USING btree (ano_iso, semana_iso, praca, sub_praca, origem, turno);

-- Tabela: tb_dashboard_resumo | Índice: idx_tb_dashboard_org
CREATE INDEX idx_tb_dashboard_org ON public.tb_dashboard_resumo USING btree (organization_id);

-- Tabela: tb_dashboard_resumo | Índice: idx_tb_dashboard_resumo_unique
CREATE UNIQUE INDEX idx_tb_dashboard_resumo_unique ON public.tb_dashboard_resumo USING btree (data_do_periodo, praca, sub_praca, origem, turno, organization_id) NULLS NOT DISTINCT;

-- Tabela: user_activity_logs | Índice: idx_user_activity_created_at
CREATE INDEX idx_user_activity_created_at ON public.user_activity_logs USING btree (entered_at);

-- Tabela: user_activity_logs | Índice: idx_user_activity_path
CREATE INDEX idx_user_activity_path ON public.user_activity_logs USING btree (path);

-- Tabela: user_activity_logs | Índice: idx_user_activity_user_id
CREATE INDEX idx_user_activity_user_id ON public.user_activity_logs USING btree (user_id);

-- Tabela: user_activity_logs | Índice: user_activity_logs_pkey
CREATE UNIQUE INDEX user_activity_logs_pkey ON public.user_activity_logs USING btree (id);

-- Tabela: user_profiles | Índice: idx_user_profiles_admin
CREATE INDEX idx_user_profiles_admin ON public.user_profiles USING btree (is_admin);

-- Tabela: user_profiles | Índice: idx_user_profiles_approved
CREATE INDEX idx_user_profiles_approved ON public.user_profiles USING btree (is_approved);

-- Tabela: user_profiles | Índice: idx_user_profiles_approved_by
CREATE INDEX idx_user_profiles_approved_by ON public.user_profiles USING btree (approved_by) WHERE (approved_by IS NOT NULL);

-- Tabela: user_profiles | Índice: idx_user_profiles_email
CREATE INDEX idx_user_profiles_email ON public.user_profiles USING btree (email);

-- Tabela: user_profiles | Índice: idx_user_profiles_id
CREATE INDEX idx_user_profiles_id ON public.user_profiles USING btree (id);

-- Tabela: user_profiles | Índice: idx_user_profiles_is_approved
CREATE INDEX idx_user_profiles_is_approved ON public.user_profiles USING btree (is_approved) WHERE (is_approved = false);

-- Tabela: user_profiles | Índice: idx_user_profiles_organization_id
CREATE INDEX idx_user_profiles_organization_id ON public.user_profiles USING btree (organization_id);

-- Tabela: user_profiles | Índice: idx_user_profiles_role
CREATE INDEX idx_user_profiles_role ON public.user_profiles USING btree (role) WHERE (role IS NOT NULL);

-- Tabela: user_profiles | Índice: user_profiles_pkey
CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

