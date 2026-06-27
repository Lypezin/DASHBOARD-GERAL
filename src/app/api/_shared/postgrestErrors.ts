export function isMissingRpcSignatureError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === 'PGRST116' ||
    maybeError.code === 'PGRST202' ||
    maybeError.message?.toLowerCase().includes('could not find the function') === true
  );
}
