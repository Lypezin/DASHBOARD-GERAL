'use client';

import { IS_DEV } from '@/constants/environment';
import { safeLog } from './errorHandler';

let xlsxCache: typeof import('xlsx-js-style') | null = null;

export async function loadXLSX(): Promise<typeof import('xlsx-js-style')> {
  if (typeof window === 'undefined') {
    throw new Error('xlsx so pode ser usado no cliente');
  }

  if (xlsxCache) {
    return xlsxCache;
  }

  try {
    if (IS_DEV) {
      safeLog.info('Importando xlsx...');
    }

    const xlsxModule = await import('xlsx-js-style');
    xlsxCache = xlsxModule;

    if (IS_DEV) {
      safeLog.info('xlsx carregado');
    }

    return xlsxModule;
  } catch (error) {
    safeLog.error('Erro ao carregar xlsx:', error);
    throw error;
  }
}
