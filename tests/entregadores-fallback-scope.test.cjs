const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadFetcher(onFallback) {
  const source = fs.readFileSync(path.join(__dirname, '../src/utils/tabData/fetchers/entregadoresFetcher.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const modules = {
    '@/lib/errorHandler': { safeLog: { warn() {}, error() {} } },
    '@/lib/rpcErrorHandler': { is500Error: () => false, isRateLimitError: () => false, isTimeoutError: () => false },
    '../fallbacks': { fetchEntregadoresFallback: onFallback },
    './fetcherUtils': { buildFilterPayload: (payload) => ({ ...payload }) },
    '@/utils/dedicado/fetchDedicadoApi': {},
    '@/utils/dashboard/fetchDashboardDataApi': { fetchDashboardDataApi: async () => ({ error: { code: '42883', message: 'function does not exist' } }) },
  };
  vm.runInNewContext(code, { exports, require: (name) => {
    if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
    return modules[name];
  } });
  return exports.fetchEntregadoresData;
}

test('função ausente não ativa leitura ampla de corridas', async () => {
  let calls = 0;
  const fetcher = loadFetcher(async () => { calls++; return { entregadores: [], total: 0 }; });
  const result = await fetcher({ filterPayload: { p_ano: 2026 } });
  assert.equal(calls, 0);
  assert.equal(result.error.code, '42883');
});

test('função ausente mantém fallback para período limitado', async () => {
  let calls = 0;
  const fetcher = loadFetcher(async () => { calls++; return { entregadores: [], total: 0 }; });
  const result = await fetcher({ filterPayload: { p_ano: 2026, p_semana: 12 } });
  assert.equal(calls, 1);
  assert.equal(result.error, null);
});
