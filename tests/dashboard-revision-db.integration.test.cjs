const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const pgliteModule = process.env.PGLITE_MODULE;

test('revisão é transacional e restrita à organização', { skip: !pgliteModule }, async () => {
  const { PGlite } = require(pgliteModule);
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE TABLE public.dados_corridas (organization_id uuid, value integer); CREATE TABLE public.mv_refresh_impacts (organization_id uuid, value integer); CREATE TABLE public.mv_refresh_control (id integer, needs_refresh boolean, last_refresh timestamptz);');
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261110125516_dashboard_cache_revision.sql'), 'utf8'));
    const a = '00000000-0000-0000-0000-000000000001';
    const b = '00000000-0000-0000-0000-000000000002';
    const versions = async () => {
      const row = (await db.query('select public.get_dashboard_cache_revision($1) a, public.get_dashboard_cache_revision($2) b', [a, b])).rows[0];
      assert.equal(row.a.split(':')[0], row.b.split(':')[0]);
      return { a: row.a.split(':')[1], b: row.b.split(':')[1] };
    };

    await db.query('insert into public.dados_corridas values ($1,1),($1,2)', [a]);
    assert.deepEqual(await versions(), { a: '1', b: '0' });
    await db.query('update public.dados_corridas set organization_id=$1 where value=1', [b]);
    assert.deepEqual(await versions(), { a: '2', b: '1' });
    await db.exec('begin');
    await db.query('insert into public.mv_refresh_impacts values ($1,1)', [a]);
    await db.exec('rollback');
    assert.deepEqual(await versions(), { a: '2', b: '1' });
    await db.query('insert into public.mv_refresh_impacts values ($1,1)', [a]);
    await db.query('update public.mv_refresh_impacts set value=2 where organization_id=$1', [a]);
    await db.query('delete from public.mv_refresh_impacts where organization_id=$1', [a]);
    assert.deepEqual(await versions(), { a: '5', b: '1' });
    const grants = await db.query("select has_function_privilege('anon', 'public.get_dashboard_cache_revision(uuid)', 'EXECUTE') anon, has_function_privilege('service_role', 'public.get_dashboard_cache_revision(uuid)', 'EXECUTE') service");
    assert.equal(grants.rows[0].anon, false);
    assert.equal(grants.rows[0].service, true);

    await db.exec('insert into public.mv_refresh_control values (1,false,null)');
    const fullVersion = async () => (await db.query('select public.get_dashboard_cache_revision($1) v', [a])).rows[0].v;
    const beforeFlag = await fullVersion();
    await db.exec('update public.mv_refresh_control set needs_refresh=true where id=1');
    assert.equal(await fullVersion(), beforeFlag);
    await db.exec('update public.mv_refresh_control set needs_refresh=false,last_refresh=now() where id=1');
    assert.notEqual(await fullVersion(), beforeFlag);

    await db.exec("create function public.insert_dados_corridas_batch(dados jsonb[]) returns json language plpgsql as $$ begin insert into public.dados_corridas select (x->>'organization_id')::uuid, (x->>'value')::integer from unnest(dados) x; return json_build_object('success', true, 'inserted', array_length(dados,1)); end $$;");
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261110125523_corridas_batch_idempotency.sql'), 'utf8'));
    const importId = '00000000-0000-0000-0000-000000000003';
    const insertSql = "select public.insert_dados_corridas_batch_once($1::uuid,$2::uuid,1,array[jsonb_build_object('organization_id',($1::uuid)::text,'value',3)]) value";
    const before = await versions();
    const first = await db.query(insertSql, [a, importId]);
    const after = await versions();
    const repeat = await db.query(insertSql, [a, importId]);
    assert.equal(first.rows[0].value.replayed, false);
    assert.equal(repeat.rows[0].value.replayed, true);
    assert.equal(after.a, String(Number(before.a) + 1));
    assert.deepEqual(await versions(), after);
    await assert.rejects(() => db.query("select public.insert_dados_corridas_batch_once($1::uuid,$2::uuid,1,array[jsonb_build_object('organization_id',($1::uuid)::text,'value',4)])", [a, importId]), /conteúdo diferente/);
    const rollbackId = '00000000-0000-0000-0000-000000000004';
    await db.exec('begin');
    await db.query(insertSql, [a, rollbackId]);
    await db.exec('rollback');
    const afterRollback = await db.query('select count(*)::int total from public.corridas_import_batches where import_id=$1', [rollbackId]);
    assert.equal(afterRollback.rows[0].total, 0);
    const retry = await db.query(insertSql, [a, rollbackId]);
    assert.equal(retry.rows[0].value.replayed, false);
    const concurrentId = '00000000-0000-0000-0000-000000000005';
    const concurrent = await Promise.all([db.query(insertSql, [a, concurrentId]), db.query(insertSql, [a, concurrentId])]);
    assert.deepEqual(concurrent.map((entry) => entry.rows[0].value.replayed).sort(), [false, true]);
    const wrongOrg = "select public.insert_dados_corridas_batch_once($1::uuid,$2::uuid,1,array[jsonb_build_object('organization_id',($3::uuid)::text,'value',3)])";
    await assert.rejects(() => db.query(wrongOrg, [a, concurrentId, b]), /Organização inválida/);
    const receiptPrivileges = await db.query("select has_function_privilege('anon', 'public.insert_dados_corridas_batch_once(uuid,uuid,integer,jsonb[])', 'EXECUTE') anon");
    assert.equal(receiptPrivileges.rows[0].anon, false);
  } finally {
    await db.close();
  }
});
