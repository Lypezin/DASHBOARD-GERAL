-- Values rows are normalized and sorted by dashboardService before the UI
-- consumes this service-role-only source RPC. The public wrapper also applies
-- its own grouping and ordering. Remove only the three duplicate source sorts.
-- Guard the rewrite so an unexpected function body fails without changing it.
DO $migration$
DECLARE
  v_function_oid oid := 'public._listar_valores_entregadores_source_20260719(integer, integer, text, text, text, date, date, text)'::regprocedure;
  v_definition text;
  v_rewritten text;
  v_sort_count integer;
BEGIN
  SELECT pg_get_functiondef(v_function_oid)
  INTO v_definition;

  v_sort_count := (
    length(lower(v_definition))
    - length(replace(lower(v_definition), 'order by total_taxas desc', ''))
  ) / length('order by total_taxas desc');

  IF v_sort_count <> 3 THEN
    RAISE EXCEPTION 'Expected exactly 3 redundant Values source sorts, found %', v_sort_count;
  END IF;

  v_rewritten := replace(v_definition, 'order by total_taxas desc', '');

  IF v_rewritten = v_definition THEN
    RAISE EXCEPTION 'Values source function definition was not rewritten';
  END IF;

  EXECUTE v_rewritten;
END;
$migration$;
