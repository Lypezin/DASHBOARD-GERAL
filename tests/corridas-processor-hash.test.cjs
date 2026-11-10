const assert = require('node:assert/strict');
const { File } = require('node:buffer');
const nodeCrypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const XLSX = require('xlsx-js-style');

test('processa planilha e calcula impressão do mesmo arquivo', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/utils/processors/corridasProcessor.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  const modules = {
    'xlsx-js-style': XLSX,
    '@/lib/validate': { validateString: (value) => value },
    '@/constants/upload': { COLUMN_MAP: { Praca: 'praca', 'Sub Praca': 'sub_praca' } },
    '@/utils/formatters/dateUtils': {},
    '@/utils/formatters/timeUtils': {},
  };
  vm.runInNewContext(code, { exports, crypto: nodeCrypto.webcrypto, Uint8Array, require: (name) => {
    if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
    return modules[name];
  } });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Praca', 'Sub Praca'], ['Cidade', 'Centro']]), 'Dados');
  const bytes = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const file = new File([bytes], 'corridas.xlsx');
  const result = await exports.processCorridasFile(file);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].praca, 'Cidade');
  assert.equal(result.rows[0].sub_praca, 'Centro');
  assert.equal(result.fileHash, nodeCrypto.createHash('sha256').update(bytes).digest('hex'));
});
