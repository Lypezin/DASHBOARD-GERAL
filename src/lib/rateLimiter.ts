/**
 * Rate Limiter para prevenir DDoS e abuso de requisições
 */

export { checkRateLimit, cleanupRateLimiter } from './rate-limiter/core';
export type { RateLimitConfig } from './rate-limiter/core';

export {
  rpcRateLimiter,
  uploadRateLimiter,
  loginRateLimiter,
  ipRateLimiter
} from './rate-limiter/definitions';
