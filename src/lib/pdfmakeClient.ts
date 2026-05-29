'use client';

import { safeLog } from './errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

// Helper para carregar pdfmake apenas no cliente
export const loadPdfMake = async () => {
  if (typeof window === 'undefined') {
    throw new Error('pdfmake só pode ser usado no cliente');
  }

  try {
    if (IS_DEV) {
      safeLog.info('📦 Importando pdfmake...');
    }
    // Importar pdfmake usando strings literais para evitar avisos de dependência crítica
    // @ts-ignore - pdfmake types não disponíveis
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    if (IS_DEV) {
      safeLog.info('📦 pdfmakeModule:', { loaded: !!pdfMakeModule });
    }
    
    // @ts-ignore - pdfmake fonts types não disponíveis
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    if (IS_DEV) {
      safeLog.info('📦 pdfFontsModule:', { loaded: !!pdfFontsModule });
    }
    
    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const pdfFonts = pdfFontsModule.default || pdfFontsModule;
    
    if (IS_DEV) {
      safeLog.info('📦 pdfMake:', { loaded: !!pdfMake, type: typeof pdfMake });
      safeLog.info('📦 pdfFonts:', { loaded: !!pdfFonts, type: typeof pdfFonts });
    }
    
    // Configurar fontes do pdfmake
    if (pdfMake && pdfFonts) {
      // O vfs_fonts já inclui as fontes Roboto pré-configuradas
      pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.pdfMake || pdfFonts;
      if (IS_DEV) {
        safeLog.info('✅ VFS configurado');
        safeLog.info('✅ Fontes Roboto disponíveis via vfs_fonts');
      }
    } else {
      safeLog.warn('⚠️ pdfMake ou pdfFonts não encontrados');
    }

    if (!pdfMake || typeof pdfMake.createPdf !== 'function') {
      throw new Error('pdfMake não tem a função createPdf');
    }

    return pdfMake;
  } catch (error) {
    safeLog.error('❌ Erro ao carregar pdfmake:', error);
    throw error;
  }
};

