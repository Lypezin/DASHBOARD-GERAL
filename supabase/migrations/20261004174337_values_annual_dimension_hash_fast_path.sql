-- Accelerate the unfiltered annual Values source by hashing its nullable
-- dimensions for candidate lookup, while retaining exact NULL-safe checks.
-- Guard the rewrite so an unexpected function body fails without changing it.
DO $migration$
DECLARE
  v_function_oid oid := 'public._listar_valores_entregadores_source_20260719(integer, integer, text, text, text, date, date, text)'::regprocedure;
  v_definition text;
  v_annual_start integer;
  v_next_branch_relative integer;
  v_next_branch_start integer;
  v_annual_section text;
  v_rewritten_section text;
  v_rewritten_definition text;
  v_annual_marker text := concat(
    '  if v_org_filter is not null', chr(10),
    '     and p_ano is not null', chr(10),
    '     and p_semana is null', chr(10)
  );
  v_next_branch_marker text := concat(
    '  if v_org_filter is not null', chr(10),
    '     and p_ano is not null', chr(10),
    '     and p_semana is not null', chr(10)
  );
  v_old_scope text := concat(
    '    with incremental_scopes as materialized (', chr(10),
    '      select distinct inc.organization_id, inc.data_do_periodo, inc.praca, inc.sub_praca, inc.origem', chr(10),
    '      from public.tb_entregadores_agregado_incremental inc', chr(10),
    '      where inc.organization_id = v_org_filter', chr(10),
    '        and inc.ano_iso = p_ano', chr(10),
    '    ),'
  );
  v_new_scope text := concat(
    '    with incremental_scopes as materialized (', chr(10),
    '      select', chr(10),
    '        inc.organization_id,', chr(10),
    '        inc.data_do_periodo,', chr(10),
    '        inc.praca,', chr(10),
    '        inc.sub_praca,', chr(10),
    '        inc.origem,', chr(10),
    '        pg_catalog.hash_record_extended(row(inc.praca, inc.sub_praca, inc.origem), 0) as dimension_hash', chr(10),
    '      from public.tb_entregadores_agregado_incremental inc', chr(10),
    '      where inc.organization_id = v_org_filter', chr(10),
    '        and inc.ano_iso = p_ano', chr(10),
    '      group by inc.organization_id, inc.data_do_periodo, inc.praca, inc.sub_praca, inc.origem', chr(10),
    '    ),'
  );
  v_old_join text := concat(
    '            and s.data_do_periodo = mv.data_do_periodo', chr(10),
    '            and s.praca is not distinct from mv.praca', chr(10)
  );
  v_new_join text := concat(
    '            and s.data_do_periodo = mv.data_do_periodo', chr(10),
    '            and s.dimension_hash = pg_catalog.hash_record_extended(row(mv.praca, mv.sub_praca, mv.origem), 0)', chr(10),
    '            -- Exact NULL-safe dimensions remain authoritative if hashes collide.', chr(10),
    '            and s.praca is not distinct from mv.praca', chr(10)
  );
  v_scope_count integer;
  v_join_count integer;
BEGIN
  SELECT pg_get_functiondef(v_function_oid)
  INTO v_definition;

  v_annual_start := position(v_annual_marker in v_definition);
  IF v_annual_start = 0 THEN
    RAISE EXCEPTION 'Values source annual branch marker was not found';
  END IF;

  v_next_branch_relative := position(
    v_next_branch_marker in substring(v_definition from v_annual_start + 1)
  );
  IF v_next_branch_relative = 0 THEN
    RAISE EXCEPTION 'Values source weekly branch marker was not found after annual branch';
  END IF;
  v_next_branch_start := v_annual_start + v_next_branch_relative;
  v_annual_section := substring(v_definition from v_annual_start for v_next_branch_start - v_annual_start);

  v_scope_count := (
    length(v_annual_section) - length(replace(v_annual_section, v_old_scope, ''))
  ) / length(v_old_scope);
  v_join_count := (
    length(v_annual_section) - length(replace(v_annual_section, v_old_join, ''))
  ) / length(v_old_join);
  IF v_scope_count <> 1 OR v_join_count <> 1 THEN
    RAISE EXCEPTION 'Expected one annual Values scope and join to rewrite; found %, %', v_scope_count, v_join_count;
  END IF;

  v_rewritten_section := replace(v_annual_section, v_old_scope, v_new_scope);
  v_rewritten_section := replace(v_rewritten_section, v_old_join, v_new_join);
  IF v_rewritten_section = v_annual_section THEN
    RAISE EXCEPTION 'Values source annual branch was not rewritten';
  END IF;

  v_rewritten_definition := substring(v_definition from 1 for v_annual_start - 1)
    || v_rewritten_section
    || substring(v_definition from v_next_branch_start);
  EXECUTE v_rewritten_definition;
END;
$migration$;
