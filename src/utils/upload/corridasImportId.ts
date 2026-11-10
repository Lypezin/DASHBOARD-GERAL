const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function storageKey(file: File, organizationId: string) {
  return `dashboard:corridas-import:${JSON.stringify([organizationId, file.name, file.size, file.lastModified])}`;
}

export function getCorridasImportId(file: File, organizationId: string, fileHash: string) {
  const key = storageKey(file, organizationId);
  let stored: string | null;
  try {
    stored = localStorage.getItem(key);
  } catch {
    throw new Error('Não foi possível guardar a identificação da importação neste navegador. Verifique o armazenamento local e tente novamente.');
  }
  if (stored) {
    let existing: { id?: unknown; fileHash?: unknown };
    try { existing = JSON.parse(stored); } catch { throw new Error('Não foi possível validar a importação anterior. Confira os dados antes de continuar.'); }
    if (!existing || typeof existing !== 'object' || typeof existing.id !== 'string' || !UUID_RE.test(existing.id) || existing.fileHash !== fileHash) {
      throw new Error('O arquivo é diferente da importação interrompida. Confira os dados gravados antes de continuar.');
    }
    return existing.id;
  }
  try {
    const id = crypto.randomUUID();
    const value = JSON.stringify({ id, fileHash });
    localStorage.setItem(key, value);
    if (localStorage.getItem(key) !== value) throw new Error('Armazenamento indisponível');
    return id;
  } catch {
    throw new Error('Não foi possível guardar a identificação da importação neste navegador. Verifique o armazenamento local e tente novamente.');
  }
}

export function clearCorridasImportId(file: File, organizationId: string, importId: string) {
  const key = storageKey(file, organizationId);
  const value = localStorage.getItem(key);
  if (!value) return;
  const stored = JSON.parse(value) as { id?: unknown };
  if (stored.id === importId) localStorage.removeItem(key);
}
