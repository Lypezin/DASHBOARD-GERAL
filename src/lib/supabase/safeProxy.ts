import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, recreateSupabaseClient } from './clientFactory';

function createSafeRpcStub() {
    const stub = function safeRpcStub(functionName: string, params?: any) {
        return Promise.resolve({
            data: null,
            error: { message: 'Cliente Supabase não está disponível. Aguarde o carregamento completo da página.', code: 'CLIENT_NOT_READY' }
        });
    };
    stub.call = stub.bind(stub);
    return stub;
}

export const supabaseProxy = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        if (prop === '_recreate') return () => recreateSupabaseClient();

        try {
            const client = getSupabaseClient();
            if (!client) {
                if (prop === 'rpc') return createSafeRpcStub();
                if (prop === 'auth') return {};
                return undefined;
            }

            const value = (client as any)[prop];
            if (value === undefined) {
                if (prop === 'rpc') return createSafeRpcStub();
                return undefined;
            }

            if (typeof value === 'function') {
                if (prop === 'rpc') {
                    try {
                        const testCall = value.bind(client);
                        if (typeof testCall === 'function') return testCall;
                    } catch (e) { return createSafeRpcStub(); }
                }
                return value.bind(client);
            }
            return value;
        } catch (error) {
            if (prop === 'rpc') return createSafeRpcStub();
            if (prop === 'auth') return {};
            return undefined;
        }
    }
});
