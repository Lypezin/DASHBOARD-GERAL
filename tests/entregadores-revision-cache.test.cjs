const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const version = (value) => `00000000-0000-0000-0000-000000000099:${value}`;

function loadService(rpc) {
  const source = fs.readFileSync(path.join(__dirname, '../src/services/dashboardService.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const modules = {
    'node:crypto': require('node:crypto'),
    '@/utils/supabase/admin': { createServiceRoleClient: () => ({
      rpc,
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { enabled: false }, error: null }) }) }) }),
    }) },
    '@/utils/request/createRequestKey': { createRequestKey: JSON.stringify },
    '@/utils/valores/normalizeValoresEntregadores': {},
    '@/utils/valores/filterAndSortValores': {},
    '@/utils/dashboard/entregadoresCacheExpiry': {},
  };
  vm.runInNewContext(code, { exports, Buffer, performance, console: { info() {}, warn() {} }, require: (name) => {
    if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
    return modules[name];
  } });
  return exports.fetchDashboardData;
}

test('nova revisão impede reutilizar resposta anterior', async () => {
  let revision = version(1);
  let reads = 0;
  const fetchDashboardData = loadService(async (name) => {
    if (name === 'get_dashboard_cache_revision') return { data: revision, error: null };
    reads++;
    return { data: { entregadores: [], total: reads }, error: null };
  });
  const first = await fetchDashboardData('entregadores', {}, 'org-a');
  const second = await fetchDashboardData('entregadores', {}, 'org-a');
  revision = version(2);
  const third = await fetchDashboardData('entregadores', {}, 'org-a');
  assert.equal(first.data.total, 1);
  assert.equal(second.data.total, 1);
  assert.equal(second.cached, true);
  assert.equal(third.data.total, 2);
  assert.equal(reads, 2);
});

test('versão indisponível impede reutilizar cache', async () => {
  let reads = 0;
  const fetchDashboardData = loadService(async (name) => {
    if (name === 'get_dashboard_cache_revision') return { data: null, error: { message: 'indisponível' } };
    reads++;
    return { data: { entregadores: [], total: reads }, error: null };
  });
  const first = await fetchDashboardData('entregadores', {}, 'org-a');
  const second = await fetchDashboardData('entregadores', {}, 'org-a');
  assert.equal(first.data.total, 1);
  assert.equal(second.data.total, 2);
  assert.equal(first.cached, false);
  assert.equal(second.cached, false);
});

test('consulta antiga em andamento não sobrescreve a revisão nova', async () => {
  let revision = version(1);
  let finishOld;
  let reads = 0;
  const fetchDashboardData = loadService(async (name) => {
    if (name === 'get_dashboard_cache_revision') return { data: revision, error: null };
    reads++;
    if (reads === 1) return new Promise((resolve) => { finishOld = resolve; });
    return { data: { entregadores: [], total: 2 }, error: null };
  });
  const oldRequest = fetchDashboardData('entregadores', {}, 'org-a');
  while (!finishOld) await new Promise((resolve) => setImmediate(resolve));
  revision = version(2);
  const newResult = await fetchDashboardData('entregadores', {}, 'org-a');
  finishOld({ data: { entregadores: [], total: 1 }, error: null });
  await oldRequest;
  const cached = await fetchDashboardData('entregadores', {}, 'org-a');
  assert.equal(newResult.data.total, 2);
  assert.equal(cached.data.total, 2);
  assert.equal(cached.cached, true);
});

test('organizações com mesma revisão não compartilham dados', async () => {
  let reads = 0;
  const fetchDashboardData = loadService(async (name) => {
    if (name === 'get_dashboard_cache_revision') return { data: version(1), error: null };
    reads++;
    return { data: { entregadores: [], total: reads }, error: null };
  });
  const first = await fetchDashboardData('entregadores', {}, 'org-a');
  const second = await fetchDashboardData('entregadores', {}, 'org-b');
  assert.equal(first.data.total, 1);
  assert.equal(second.data.total, 2);
  assert.equal(reads, 2);
});

test('paginação herda a revisão ao consultar a lista de origem', async () => {
  let revision = version(1);
  let versionReads = 0;
  let sourceReads = 0;
  const fetchDashboardData = loadService(async (name) => {
    if (name === 'get_dashboard_cache_revision') {
      versionReads++;
      return { data: revision, error: null };
    }
    sourceReads++;
    return { data: { entregadores: [], total: 0 }, error: null };
  });
  const org = '00000000-0000-0000-0000-000000000001';
  const payload = { p_ano: 2026, p_limit: 25 };
  await fetchDashboardData('entregadores_page', payload, org);
  assert.equal(versionReads, 1);
  await fetchDashboardData('entregadores_page', payload, org);
  assert.equal(sourceReads, 1);
  revision = version(2);
  await fetchDashboardData('entregadores_page', payload, org);
  assert.equal(sourceReads, 2);
  assert.equal(versionReads, 3);
});
