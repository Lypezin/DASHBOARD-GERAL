const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadRoute(rpc) {
  const source = fs.readFileSync(path.join(__dirname, '../src/app/api/mvs/refresh/route.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const modules = {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    '@/utils/supabase/admin': {
      createServiceRoleClient: () => ({ rpc }),
      isServiceRoleConfigError: () => false,
      getServiceRoleConfigErrorPayload: () => ({}),
    },
    '@/app/api/_shared/currentUserProfile': {
      loadCurrentUserProfile: async () => ({ profile: { role: 'admin' } }),
      hasElevatedRole: () => true,
    },
  };
  vm.runInNewContext(code, { exports, URL, require: (name) => {
    if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
    return modules[name];
  } });
  return exports;
}

const state = { full_pending_count: 11, incremental_pending_count: 0, incremental_worker_scheduled: false };
const request = { json: async () => ({ reason: 'upload' }) };

test('falha ao consultar a fila não é informada como sucesso', async () => {
  const route = loadRoute(async (name) => name === 'get_mv_refresh_queue_state'
    ? { data: null, error: { message: 'fila indisponível' } }
    : { data: {}, error: null });
  const response = await route.POST(request);
  assert.equal(response.status, 500);
  assert.equal(response.body.success, false);
});

test('fila incompleta não é interpretada como vazia', async () => {
  const route = loadRoute(async (name) => name === 'get_mv_refresh_queue_state'
    ? { data: {}, error: null }
    : { data: {}, error: null });
  const response = await route.POST(request);
  assert.equal(response.status, 500);
});

test('upload preserva marcações de MVs e consulta fila uma vez', async () => {
  const calls = [];
  const route = loadRoute(async (name) => {
    calls.push(name);
    return { data: name === 'get_mv_refresh_queue_state' ? state : {}, error: null };
  });
  const response = await route.POST(request);
  assert.equal(response.status, 200);
  assert.equal(response.body.incremental_succeeded, true);
  assert.equal(calls.filter((name) => name === 'get_mv_refresh_queue_state').length, 1);
  assert.equal(calls.includes('clear_stale_full_mv_refresh_flags'), false);
});

test('falha ao reagendar fila pendente é informada', async () => {
  const route = loadRoute(async (name) => name === 'get_mv_refresh_queue_state'
    ? { data: { ...state, incremental_pending_count: 2 }, error: null }
    : { data: null, error: { message: 'não foi possível agendar' } });
  const response = await route.GET({ url: 'http://localhost/api/mvs/refresh' });
  assert.equal(response.status, 500);
  assert.equal(response.body.success, false);
});

test('acompanhamento incremental não consulta a lista de MVs completas', async () => {
  const calls = [];
  const route = loadRoute(async (name) => {
    calls.push(name);
    return { data: state, error: null };
  });
  const response = await route.GET({ url: 'http://localhost/api/mvs/refresh?incremental=1' });
  assert.equal(response.status, 200);
  assert.equal(calls.includes('get_pending_mvs'), false);
  assert.equal(calls.includes('get_mv_refresh_queue_state'), true);
});
