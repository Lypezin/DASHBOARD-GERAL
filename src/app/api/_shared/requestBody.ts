export async function readJsonBody<T = unknown>(request: Request, fallback: T | null = null): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return fallback;
  }
}
