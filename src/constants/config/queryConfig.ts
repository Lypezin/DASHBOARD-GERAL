
/**
 * Limites de queries para otimização de performance
 * 
 * ⚠️ IMPORTANTE: Limites reduzidos para evitar consumo excessivo de Disk IO
 * - AGGREGATION_MAX reduzido de 50.000 para 10.000 (tabela dados_corridas tem 1.6M linhas)
 * - FALLBACK_MAX reduzido de 10.000 para 5.000
 * 
 * Para queries maiores, usar Materialized Views ou paginação real.
 */
export const QUERY_LIMITS = {
    /** Limite máximo para queries de fallback (evita sobrecarga) */
    FALLBACK_MAX: 5000, // Reduzido de 10000 para reduzir Disk IO
    /** Limite para queries de agregação - CRÍTICO: reduzido para evitar scans completos */
    AGGREGATION_MAX: 100000, // Aumentado para permitir mais dados na guia de Entregadores
    /** Limite padrão para listagens */
    DEFAULT_LIST: 1000,
    /** Limite para queries de busca */
    SEARCH_MAX: 500,
} as const;

/**
 * Tamanhos de lotes para operações em batch
 */
export const BATCH_SIZES = {
    /** Tamanho padrão de lote para inserção no banco */
    INSERT: 500,
    /** Tamanho de lote para deleção */
    DELETE: 500,
} as const;

/**
 * Timeouts para requisições RPC (em milissegundos)
 */
export const RPC_TIMEOUTS = {
    /** Timeout padrão para requisições RPC */
    DEFAULT: 30000, // 30 segundos
    /** Timeout para requisições rápidas (queries simples) */
    FAST: 10000, // 10 segundos
    /** Timeout para requisições médias (queries moderadas) */
    MEDIUM: 20000, // 20 segundos
    /** Timeout para requisições longas (processamento pesado) */
    LONG: 120000, // 120 segundos
} as const;
