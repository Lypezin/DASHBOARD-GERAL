const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadUpload(insertInBatches) {
  const source = fs.readFileSync(path.join(__dirname, '../src/hooks/upload/useUploadProcessor.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const modules = {
    react: { useState: (initial) => [initial, () => {}], useCallback: (fn) => fn },
    '@/lib/errorHandler': { safeLog: { info() {}, warn() {}, error() {} } },
    '@/lib/rateLimiter': { uploadRateLimiter: () => ({ allowed: true }) },
    '@/utils/processors/corridasProcessor': { processCorridasFile: async () => ({ rows: [{ id: 1 }], fileHash: 'hash' }) },
    '@/utils/dbHelpers': { insertInBatches, isNonRetryableBatchInsertError: () => false },
    '@/constants/upload': { CORRIDAS_BATCH_SIZE: 500 },
    '@/utils/upload/corridasImportId': { getCorridasImportId: () => '00000000-0000-0000-0000-000000000002', clearCorridasImportId() {} },
  };
  vm.runInNewContext(code, { exports, require: (name) => {
    if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
    return modules[name];
  } });
  return exports.useUploadProcessor('00000000-0000-0000-0000-000000000001');
}

test('erro após tentativa de gravação inicia acompanhamento sem declarar sucesso', async () => {
  const upload = loadUpload(async () => { throw new Error('falha no lote'); });
  let success = 0;
  let partial = 0;
  const result = await upload.processUpload([{ name: 'corridas.xlsx' }], () => { success++; }, () => { partial++; });
  assert.equal(result, false);
  assert.equal(success, 0);
  assert.equal(partial, 1);
});

test('importação completa usa o fluxo de sucesso', async () => {
  const upload = loadUpload(async () => ({ inserted: 1, errors: [] }));
  let success = 0;
  let partial = 0;
  const result = await upload.processUpload([{ name: 'corridas.xlsx' }], () => { success++; }, () => { partial++; });
  assert.equal(result, true);
  assert.equal(success, 1);
  assert.equal(partial, 0);
});

test('falha de um arquivo impede enviar os arquivos seguintes', async () => {
  let calls = 0;
  const upload = loadUpload(async () => { calls++; throw new Error('falha no lote'); });
  const result = await upload.processUpload([{ name: 'primeiro.xlsx' }, { name: 'segundo.xlsx' }], () => {}, () => {});
  assert.equal(result, false);
  assert.equal(calls, 1);
});
