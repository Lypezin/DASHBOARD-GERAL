/**
 * Tipos relacionados a upload de arquivos e refresh de Materialized Views
 */

/**
 * Estado de refresh de Materialized Views
 */
export interface RefreshMVState {
  refreshing: boolean;
  message: string;
  progress: number;
  progressLabel: string;
  total: number;
  completed: number;
  failedMVs: string[];
}

/**
 * Resultado de refresh de uma MV individual
 */
export interface RefreshMVResult {
  success: boolean;
  view: string;
  duration_seconds?: number;
  method?: string;
  error?: string;
  warning?: string;
}

/**
 * Resultado de refresh prioritário de MVs
 */
export interface RefreshPrioritizedResult {
  success: boolean;
  total_duration_seconds?: number;
  views_refreshed?: number;
  results?: RefreshMVResult[];
}

/**
 * MV pendente de refresh
 */
export interface PendingMV {
  mv_name: string;
  priority: number;
  needs_refresh: boolean;
  last_refresh: string | null;
}

/**
 * Resultado de retry de MVs falhadas
 */
export interface RetryFailedMVsResult {
  success: boolean;
  total_duration_seconds?: number;
  views_processed?: number;
  success_count?: number;
  fail_count?: number;
  results?: RefreshMVResult[];
}

