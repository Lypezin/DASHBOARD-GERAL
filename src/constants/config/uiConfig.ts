
/**
 * Limites de arrays e strings e configurações de validação
 */
export const LIMITS = {
    /** Tamanho máximo de arrays em filtros */
    MAX_ARRAY_SIZE: 50,
    /** Tamanho máximo de strings */
    MAX_STRING_LENGTH: 100,
    /** Tamanho máximo de praça */
    MAX_PRACA_LENGTH: 100,
    /** Limite de caracteres para preview de dados */
    PREVIEW_LENGTH: 500,
} as const;

/**
 * Configurações de validação
 */
export const VALIDATION = {
    /** Ano mínimo válido */
    MIN_YEAR: 2000,
    /** Ano máximo válido */
    MAX_YEAR: 2100,
    /** Semana mínima válida */
    MIN_WEEK: 1,
    /** Semana máxima válida */
    MAX_WEEK: 53,
    /** Data mínima permitida */
    MIN_DATE: '2020-01-01',
} as const;
