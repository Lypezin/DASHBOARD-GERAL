-- The API now lets approved users open Entrada/Saida within their assigned
-- cities. Both RPC overloads must accept the CSV city scope used elsewhere in
-- the dashboard; a single city keeps its existing behavior.
do $migration$
declare
  target record;
  definition text;
begin
  for target in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'get_fluxo_semanal'
      and p.pronargs in (4, 5)
  loop
    definition := pg_get_functiondef(target.oid);
    if position('mca.praca = p_praca' in definition) = 0 then
      raise exception 'get_fluxo_semanal no longer has the expected city predicate';
    end if;
    execute replace(
      definition,
      'mca.praca = p_praca',
      'mca.praca = any(string_to_array(p_praca, '',''))'
    );
  end loop;
end
$migration$;
