export function isMissingRpcFunctionError(error: unknown) {
    const value = error as { code?: unknown; message?: unknown } | null;
    const code = typeof value?.code === 'string' ? value.code : '';
    const message = typeof value?.message === 'string' ? value.message.toLowerCase() : String(error || '').toLowerCase();

    return code === '42883' || code === 'PGRST202' ||
        /could not find the function|function .* (does not exist|not found)|schema cache/.test(message);
}
