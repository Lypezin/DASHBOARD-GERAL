const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadIdentity(storage) {
  const source = fs.readFileSync(path.join(__dirname, '../src/utils/upload/corridasImportId.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  let nextId = 1;
  vm.runInNewContext(code, { exports, localStorage: storage, crypto: { randomUUID: () => `00000000-0000-0000-0000-${String(nextId++).padStart(12, '0')}` } });
  return exports;
}

function createStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test('mesmo arquivo conserva identidade até concluir', () => {
  const identity = loadIdentity(createStorage());
  const file = { name: 'corridas.xlsx', size: 42, lastModified: 10 };
  const id = identity.getCorridasImportId(file, 'org-a', 'hash-a');
  assert.equal(identity.getCorridasImportId(file, 'org-a', 'hash-a'), id);
  assert.throws(() => identity.getCorridasImportId(file, 'org-a', 'hash-b'), /arquivo é diferente/i);
  assert.notEqual(identity.getCorridasImportId(file, 'org-b', 'hash-a'), id);
  identity.clearCorridasImportId(file, 'org-a', id);
  assert.notEqual(identity.getCorridasImportId(file, 'org-a', 'hash-a'), id);
});

test('impede iniciar quando não consegue persistir a identidade', () => {
  const identity = loadIdentity({ getItem: () => null, setItem: () => { throw new Error('blocked'); } });
  assert.throws(() => identity.getCorridasImportId({ name: 'a', size: 1, lastModified: 1 }, 'org-a', 'hash'), /armazenamento local/i);
});
