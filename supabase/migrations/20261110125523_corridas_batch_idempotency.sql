-- A batch and its receipt commit together. Replaying the same request returns
-- the receipt; reusing the key for different rows is rejected.
create table public.corridas_import_batches (
  organization_id uuid not null,
  import_id uuid not null,
  batch_number integer not null check (batch_number > 0),
  payload_hash text not null,
  inserted integer not null check (inserted >= 0),
  created_at timestamptz not null default now(),
  primary key (organization_id, import_id, batch_number)
);

alter table public.corridas_import_batches enable row level security;
revoke all on public.corridas_import_batches from public, anon, authenticated;

create function public.insert_dados_corridas_batch_once(
  p_organization_id uuid,
  p_import_id uuid,
  p_batch_number integer,
  p_rows jsonb[]
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_prior public.corridas_import_batches%rowtype;
  v_result json;
  v_inserted integer;
begin
  if p_organization_id is null or p_import_id is null or p_batch_number is null
    or p_batch_number < 1 or coalesce(array_length(p_rows, 1), 0) = 0 then
    raise exception 'Dados de identificação do lote inválidos';
  end if;
  if exists (select 1 from unnest(p_rows) row_data
    where row_data->>'organization_id' is distinct from p_organization_id::text) then
    raise exception 'Organização inválida nos dados do lote';
  end if;
  v_hash := encode(sha256(convert_to(to_jsonb(p_rows)::text, 'UTF8')), 'hex');
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    p_organization_id::text || ':' || p_import_id::text || ':' || p_batch_number::text, 0));
  select * into v_prior from public.corridas_import_batches
    where organization_id = p_organization_id and import_id = p_import_id and batch_number = p_batch_number;
  if found then
    if v_prior.payload_hash <> v_hash then
      raise exception 'Lote já registrado com conteúdo diferente';
    end if;
    return json_build_object('success', true, 'inserted', v_prior.inserted, 'errors', 0, 'replayed', true);
  end if;

  v_result := public.insert_dados_corridas_batch(p_rows);
  if coalesce((v_result->>'success')::boolean, false) is not true then
    return v_result;
  end if;
  v_inserted := (v_result->>'inserted')::integer;
  if v_inserted is distinct from array_length(p_rows, 1) then
    raise exception 'Quantidade gravada não corresponde ao lote';
  end if;
  insert into public.corridas_import_batches (organization_id, import_id, batch_number, payload_hash, inserted)
    values (p_organization_id, p_import_id, p_batch_number, v_hash, v_inserted);
  return json_build_object('success', true, 'inserted', v_inserted, 'errors', 0, 'replayed', false);
end;
$$;

revoke all on function public.insert_dados_corridas_batch_once(uuid, uuid, integer, jsonb[]) from public, anon, authenticated;
grant execute on function public.insert_dados_corridas_batch_once(uuid, uuid, integer, jsonb[]) to service_role;
