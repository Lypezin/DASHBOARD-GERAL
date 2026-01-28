
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function handleRpcError(
    rpcError: any,
    params: any,
    fetchEntregadoresFallbackFn: () => Promise<any[]>
) {
    // Se a função RPC não existir ou der timeout, fazer fallback para query direta
    const errorCode = (rpcError as any)?.code || '';
    const errorMessage = String((rpcError as any)?.message || '');

    // Detectar erros de função não encontrada - inclui códigos originais E sanitizados
    // rpcWrapper.ts sanitiza erros 400/404 para códigos genéricos ('400', '404')
    const is404 = errorCode === 'PGRST116' || errorCode === '42883' ||
        errorCode === 'PGRST204' || errorCode === 'PGRST203' ||
        errorCode === '400' || errorCode === '404' ||
        errorMessage.includes('404') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('Requisição inválida') ||
        (errorMessage.includes('function') && errorMessage.includes('does not exist'));
    const isTimeout = errorCode === 'TIMEOUT' || errorMessage.includes('timeout') || errorMessage.includes('demorou muito');

    if (is404 || isTimeout) {
        // Função RPC não existe ou deu timeout, usar fallback
        if (IS_DEV) {
            safeLog.warn(`Função RPC get_entregadores_marketing ${isTimeout ? 'deu timeout' : 'não encontrada/erro'}, usando fallback. Erro: ${errorMessage}`);
        }
        return await fetchEntregadoresFallbackFn();
    }

    // Log detalhado do erro APENAS se não for tratado pelo fallback
    safeLog.error('❌ ERRO CRÍTICO get_entregadores_marketing:', {
        erro: rpcError,
        params: params,
        mensagem: (rpcError as any)?.message,
        codigo: (rpcError as any)?.code,
        detalhes: (rpcError as any)?.details
    });

    safeLog.error('Erro RPC get_entregadores_marketing:', rpcError);
    throw rpcError;
}
