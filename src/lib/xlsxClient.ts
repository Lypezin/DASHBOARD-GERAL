'use client';

import { safeLog } from './errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

// Cache para evitar múltiplos imports
let xlsxCache: typeof import('xlsx') | null = null;

/**
 * Carrega xlsx dinamicamente apenas quando necessário
 * Usa cache para evitar múltiplos imports
 */
export async function loadXLSX(): Promise<typeof import('xlsx')> {
  if (typeof window === 'undefined') {
    throw new Error('xlsx só pode ser usado no cliente');
  }

  if (xlsxCache) {
    return xlsxCache;
  }

  try {
    if (IS_DEV) {
      safeLog.info('📦 Importando xlsx...');
    }
    
    const xlsxModule = await import('xlsx');
    xlsxCache = xlsxModule;
    
    if (IS_DEV) {
      safeLog.info('✅ xlsx carregado');
    }
    
    return xlsxModule;
  } catch (error) {
    safeLog.error('❌ Erro ao carregar xlsx:', error);
    throw error;
  }
}

