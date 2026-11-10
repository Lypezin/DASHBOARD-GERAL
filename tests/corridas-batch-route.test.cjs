const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadRoute(rpc) {
  const source = fs.readFileSync(path.join(__dirname, '../src/app/api/upload/corridas-batch/route.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const modules = {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    '@/utils/supabase/admin': { createServiceRoleClient: () => ({ rpc }), isServiceRoleConfigError: () => false },
    '@/app/api/_shared/currentUserProfile': {
      loadCurrentUserProfile: async () => ({ profile: {} }),
      resolveAuthorizedOrganizationId: () => ({ organizationId: '00000000-0000-0000-0000-000000000001' }),
    },
    '@/app/api/_shared/requestBody': { readJsonBody: async (request) => request.body },
  };
  vm.runInNewContext(code, { exports, require: (name) => {
    if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
    return modules[name];
  } });
  return exports;
}

test('rejeita lote sem identificação antes de gravar', async () => {
  let calls = 0;
  const route = loadRoute(async () => { calls++; });
  const response = await route.POST({ body: { dados: [{ value: 1 }] } });
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test('lote usa RPC idempotente e força organização autorizada', async () => {
  let called;
  const route = loadRoute(async (name, params) => {
    called = { name, params };
    return { data: { success: true, inserted: 1, errors: 0 }, error: null };
  });
  const response = await route.POST({ body: {
    dados: [{ organization_id: 'outra-organizacao', value: 1 }],
    importId: '00000000-0000-0000-0000-000000000002', batchNumber: 3,
  } });
  assert.equal(response.status, 200);
  assert.equal(called.name, 'insert_dados_corridas_batch_once');
  assert.equal(called.params.p_batch_number, 3);
  assert.equal(called.params.p_rows[0].organization_id, '00000000-0000-0000-0000-000000000001');
});
