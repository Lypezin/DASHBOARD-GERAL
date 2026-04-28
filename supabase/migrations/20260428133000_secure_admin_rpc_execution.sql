do $$
declare
    fn record;
    target_names text[] := array[
        'approve_user',
        'create_organization',
        'list_all_organizations',
        'list_all_users',
        'list_pending_users',
        'revoke_user_access',
        'set_user_admin',
        'update_organization',
        'update_user_organization',
        'update_user_pracas',
        'update_user_role',
        'get_pending_mvs',
        '_listar_valores_entregadores_detalhado_core',
        'check_mv_refresh_status',
        'check_mv_refresh_system_status',
        'check_mv_status',
        'count_unmigrated_records',
        'force_refresh_mv_dashboard_aderencia_metricas',
        'get_user_organization_for_sync',
        'limpar_atividades_antigas',
        'mark_mv_marketing_refresh_needed',
        'mark_mv_valores_refresh_needed',
        'migrate_dados_corridas_batch',
        'migrate_data_to_default_org',
        'migrate_small_tables_to_default_org',
        'refresh_entregadores_marketing',
        'refresh_mv_aderencia',
        'refresh_mv_aderencia_async',
        'refresh_mv_dashboard_aderencia_metricas_async',
        'sync_user_organization_to_metadata',
        'update_dashboard_resumo_incremental'
    ];
begin
    for fn in
        select format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) as signature
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = any(target_names)
    loop
        execute format('revoke execute on function %s from authenticated', fn.signature);
        execute format('revoke execute on function %s from anon', fn.signature);
        execute format('revoke execute on function %s from public', fn.signature);
        execute format('grant execute on function %s to service_role', fn.signature);
    end loop;
end $$;
