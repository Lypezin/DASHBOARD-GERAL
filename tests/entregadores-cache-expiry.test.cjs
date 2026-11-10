const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/dashboard/entregadoresCacheExpiry.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsForTest = {};
vm.runInNewContext(code, { exports: exportsForTest });
const cutoff = exportsForTest.getEntregadoresCacheEarliestExpiry;
const now = Date.parse('2026-11-10T12:00:00.000Z');

test('período atual preserva os 30 minutos de tolerância', () => {
  assert.equal(cutoff(['2026-11-10'], now), '2026-11-10T11:30:00.000Z');
});

test('períodos históricos preservam 24 horas de tolerância', () => {
  assert.equal(cutoff(['2026-11-09'], now), '2026-11-09T12:00:00.000Z');
});

test('consulta mista mantém a tolerância maior para períodos antigos', () => {
  assert.equal(cutoff(['2026-11-09', '2026-11-10'], now), '2026-11-09T12:00:00.000Z');
});
