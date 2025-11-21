/**
 * Rate Limiter para prevenir DDoS e abuso de requisições
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (() => string) | string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// Armazenamento em memória (para cliente)
// Em produção, considere usar Redis ou similar
const requestStore = new Map<string, RequestRecord>();

/**
 * Limpa registros expirados periodicamente
 */
function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (now > record.resetTime) {
      requestStore.delete(key);
    }
  }
}

// Limpar registros expirados a cada minuto
// Armazenar referência do interval para poder limpar se necessário
let cleanupInterval: NodeJS.Timeout | null = null;
let beforeUnloadHandler: (() => void) | null = null;
let visibilityChangeHandler: (() => void) | null = null;

/**
 * Inicializa o cleanup periódico de registros expirados
 * Deve ser chamado apenas uma vez quando o módulo é carregado
 */
function initializeCleanup() {
  if (typeof window === 'undefined' || cleanupInterval !== null) {
    return; // Já inicializado ou não está no cliente
  }

  cleanupInterval = setInterval(cleanupExpiredRecords, 60000);
  
  // Limpar interval quando a página for descarregada (prevenção de memory leak)
  beforeUnloadHandler = () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  };

  window.addEventListener('beforeunload', beforeUnloadHandler);
  
  // Também limpar quando a página ficar oculta (Page Visibility API)
  visibilityChangeHandler = () => {
    if (document.hidden && cleanupInterval) {
      // Não limpar completamente, apenas pausar temporariamente
      // O interval continuará quando a página voltar a ficar visível
    }
  };
  
  document.addEventListener('visibilitychange', visibilityChangeHandler);
}

/**
 * Limpa todos os listeners e intervals (para testes ou cleanup manual)
 */
export function cleanupRateLimiter() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  if (beforeUnloadHandler && typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    beforeUnloadHandler = null;
  }
  if (visibilityChangeHandler && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', visibilityChangeHandler);
    visibilityChangeHandler = null;
  }
}

// Inicializar cleanup apenas no cliente
if (typeof window !== 'undefined') {
  initializeCleanup();
}

/**
 * Verifica se uma requisição está dentro do limite de taxa
 */
export function checkRateLimit(config: RateLimitConfig): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const key = typeof config.keyGenerator === 'function'
    ? config.keyGenerator()
    : config.keyGenerator || 'default';

  const now = Date.now();
  const record = requestStore.get(key);

  // Se não existe registro ou expirou, criar novo
  if (!record || now > record.resetTime) {
    const newRecord: RequestRecord = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    requestStore.set(key, newRecord);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newRecord.resetTime,
    };
  }

  // Verificar se excedeu o limite
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  // Incrementar contador
  record.count++;
  requestStore.set(key, record);

  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Rate limiter para requisições RPC
 * Aumentado para permitir mudanças rápidas de tab sem bloquear
 */
export function rpcRateLimiter() {
  return checkRateLimit({
    maxRequests: 60, // 60 requisições (aumentado de 30)
    windowMs: 60000, // por minuto
    keyGenerator: 'rpc-requests',
  });
}

/**
 * Rate limiter para uploads
 */
export function uploadRateLimiter() {
  return checkRateLimit({
    maxRequests: 5, // 5 uploads
    windowMs: 300000, // por 5 minutos
    keyGenerator: 'upload-requests',
  });
}

/**
 * Rate limiter para login
 */
export function loginRateLimiter(identifier: string) {
  return checkRateLimit({
    maxRequests: 5, // 5 tentativas
    windowMs: 900000, // por 15 minutos
    keyGenerator: `login-${identifier}`,
  });
}

/**
 * Rate limiter genérico por IP (simulado no cliente)
 */
export function ipRateLimiter() {
  // No cliente, não temos acesso real ao IP
  // Usamos um identificador baseado no navegador
  const browserId = typeof window !== 'undefined'
    ? localStorage.getItem('browser-id') || `browser-${Date.now()}`
    : 'server';

  if (typeof window !== 'undefined' && !localStorage.getItem('browser-id')) {
    localStorage.setItem('browser-id', browserId);
  }

  return checkRateLimit({
    maxRequests: 100, // 100 requisições
    windowMs: 60000, // por minuto
    keyGenerator: `ip-${browserId}`,
  });
}

