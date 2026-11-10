const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadBatch(postUploadApi) {
  const source = fs.readFileSync(path.join(__dirname, '../src/utils/database/batchInsert.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const modules = {
    '@/lib/supabaseClient': { supabase: {} },
    '@/lib/errorHandler': { safeLog: { info() {}, warn() {}, error() {} } },
    '@/constants/upload': { BATCH_SIZE: 2 },
    '@/utils/upload/fetchUploadApi': { postUploadApi },
  };
  vm.runInNewContext(code, { exports, require: (name) => {
    if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
    return modules[name];
  } });
  return exports.insertInBatches;
}

test('resposta sem confirmação interrompe lotes seguintes', async () => {
  let calls = 0;
  const insert = loadBatch(async () => { calls++; return { ok: true, status: 200, payload: null }; });
  const result = await insert('dados_corridas', [{ id: 1 }, { id: 2 }, { id: 3 }], { batchSize: 2 });
  assert.equal(calls, 1);
  assert.equal(result.inserted, 0);
  assert.equal(result.errors.length, 1);
});

test('quantidade divergente não é contada como sucesso', async () => {
  const insert = loadBatch(async () => ({ ok: true, status: 200, payload: { success: true, inserted: 1, errors: 0 } }));
  const result = await insert('dados_corridas', [{ id: 1 }, { id: 2 }], { batchSize: 2 });
  assert.equal(result.inserted, 0);
  assert.equal(result.errors.length, 1);
});

test('lotes confirmados mantêm o total correto', async () => {
  const insert = loadBatch(async (_path, body) => ({ ok: true, status: 200, payload: { success: true, inserted: body.dados.length, errors: 0 } }));
  const result = await insert('dados_corridas', [{ id: 1 }, { id: 2 }, { id: 3 }], { batchSize: 2 });
  assert.equal(result.inserted, 3);
  assert.equal(result.errors.length, 0);
});
