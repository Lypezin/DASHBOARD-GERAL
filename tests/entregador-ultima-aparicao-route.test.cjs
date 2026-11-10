const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadRoute(profile, results) {
  const source = fs.readFileSync(path.join(__dirname, '../src/app/api/app/entregador-ultima-aparicao/route.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
  const exports = {};
  const queries = [];
  const modules = {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200, headers: options.headers }) } },
    '@/app/api/_shared/currentUserProfile': {
      loadCurrentUserProfile: async () => ({ profile }),
      hasElevatedRole: (p) => p.role === 'admin',
      resolveAuthorizedOrganizationId: (p, requested) => requested && requested !== p.organization_id
        ? { failure: { status: 403, message: 'Organização não permitida' } }
        : { organizationId: p.organization_id },
    },
    '@/utils/supabase/admin': { createServiceRoleClient: () => ({
      from: () => ({ select: (_fields, options) => {
        const query = { filters: [], options };
        queries.push(query);
        const chain = {};
        for (const method of ['eq', 'in', 'not', 'order']) {
          chain[method] = (...args) => { query.filters.push([method, ...args]); return chain; };
        }
        chain.limit = async () => results.shift();
        return chain;
      } }),
    }) },
  };
  vm.runInNewContext(code, { exports, require: (name) => {
    if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
    return modules[name];
  } });
  return { route: exports, queries };
}

const profile = { role: 'operador', organization_id: 'org-a', assigned_pracas: ['Manaus'] };
const request = (body) => ({ json: async () => body });

test('última data e cidades respeitam organização e praças autorizadas', async () => {
  const { route, queries } = loadRoute(profile, [
    { data: [{ data_do_periodo: '2026-11-08', praca: 'Manaus' }], error: null },
    { data: [{ praca: 'Manaus' }, { praca: 'MANAUS' }, { praca: 'Manaus' }], count: 3, error: null },
  ]);
  const response = await route.POST(request({ entregadorId: 'driver-1', organizationId: 'org-a' }));
  assert.equal(response.status, 200);
  assert.equal(response.body.data.ultima_data_aparicao, '2026-11-08');
  assert.deepEqual(Array.from(response.body.data.cidades), ['Manaus']);
  assert.equal(response.body.data.cidades_incompletas, false);
  assert.equal(response.headers['Cache-Control'], 'private, no-store, max-age=0');
  assert.equal(queries.length, 2);
  for (const query of queries) {
    assert.ok(query.filters.some(([method, field, value]) => method === 'eq' && field === 'organization_id' && value === 'org-a'));
    assert.ok(query.filters.some(([method, field, value]) => method === 'in' && field === 'praca' && value[0] === 'Manaus'));
  }
});

test('bloqueia organização diferente antes de consultar o banco', async () => {
  const { route, queries } = loadRoute(profile, []);
  const response = await route.POST(request({ entregadorId: 'driver-1', organizationId: 'org-b' }));
  assert.equal(response.status, 403);
  assert.equal(queries.length, 0);
});

test('sem praça atribuída não consulta registros', async () => {
  const { route, queries } = loadRoute({ ...profile, assigned_pracas: [] }, []);
  const response = await route.POST(request({ entregadorId: 'driver-1' }));
  assert.equal(response.status, 200);
  assert.equal(response.body.data.ultima_data_aparicao, null);
  assert.equal(queries.length, 0);
});

test('não informa lista de cidades como completa se a leitura foi limitada', async () => {
  const { route } = loadRoute(profile, [
    { data: [{ data_do_periodo: '2026-11-08' }], error: null },
    { data: [{ praca: 'Manaus' }], count: 1001, error: null },
  ]);
  const response = await route.POST(request({ entregadorId: 'driver-1' }));
  assert.equal(response.body.data.cidades_incompletas, true);
});

test('preserva cidades diferentes quando aparecem no mesmo dia', async () => {
  const { route } = loadRoute({ ...profile, role: 'admin' }, [
    { data: [{ data_do_periodo: '2026-11-08' }], error: null },
    { data: [{ praca: 'Santo André' }, { praca: 'Guarulhos' }], count: 2, error: null },
  ]);
  const response = await route.POST(request({ entregadorId: 'driver-1' }));
  assert.deepEqual(Array.from(response.body.data.cidades), ['Guarulhos', 'Santo André']);
});

test('retorna erro quando a consulta do banco falha', async () => {
  const { route } = loadRoute(profile, [{ data: null, error: { message: 'Banco indisponível' } }]);
  const response = await route.POST(request({ entregadorId: 'driver-1' }));
  assert.equal(response.status, 500);
  assert.equal(response.body.data, null);
});
