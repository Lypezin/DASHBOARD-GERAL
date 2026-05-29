/**
 * Tipos relacionados a chamadas RPC do Supabase
 * Centralizados para melhor type safety e reutilização
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Estrutura de erro retornada pelo Supabase RPC
 */
export interface RpcError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  resetTime?: number;
}

/**
 * Parâmetros genéricos para funções RPC
 * Permite flexibilidade mantendo type safety
 */
export type RpcParams = Record<string, unknown>;

/**
 * Resultado de uma chamada RPC
 */
export interface RpcResult<T = unknown> {
  data: T | null;
  error: RpcError | null;
}

/**
 * Opções para chamadas RPC
 */
export interface RpcOptions {
  timeout?: number;
  validateParams?: boolean;
  client?: SupabaseClient;
}


/**
 * Tipo para parâmetros sanitizados de RPC
 * Limita arrays e strings para prevenir problemas
 */
export interface SanitizedRpcParams extends RpcParams {
  p_sub_praca?: string;
  p_origem?: string;
  p_turno?: string;
  [key: string]: unknown;
}

