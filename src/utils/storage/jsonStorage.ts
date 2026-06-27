type WebStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function getStorage(storage: WebStorage | undefined): WebStorage | null {
  return typeof window === 'undefined' ? null : storage ?? null;
}

export function readStorage(storage: WebStorage | undefined, key: string): string | null {
  const target = getStorage(storage);
  if (!target) return null;

  try {
    return target.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(storage: WebStorage | undefined, key: string, value: string): boolean {
  const target = getStorage(storage);
  if (!target) return false;

  try {
    target.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function readJsonStorage<T>(storage: WebStorage | undefined, key: string, fallback: T): T {
  const target = getStorage(storage);
  if (!target) return fallback;

  try {
    const raw = target.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    target.removeItem(key);
    return fallback;
  }
}

export function writeJsonStorage<T>(storage: WebStorage | undefined, key: string, value: T): boolean {
  const target = getStorage(storage);
  if (!target) return false;

  try {
    target.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeJsonStorage(storage: WebStorage | undefined, key: string): void {
  const target = getStorage(storage);
  if (!target) return;

  try {
    target.removeItem(key);
  } catch {
    // Storage is optional; quota/privacy errors should not block the app.
  }
}
