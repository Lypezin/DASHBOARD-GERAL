'use client';

// Helper para carregar pdfmake apenas no cliente
export const loadPdfMake = async () => {
  if (typeof window === 'undefined') {
    throw new Error('pdfmake só pode ser usado no cliente');
  }

  try {
    console.log('📦 Importando pdfmake...');
    // Importar pdfmake usando strings literais para evitar avisos de dependência crítica
    // @ts-ignore - pdfmake types não disponíveis
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    console.log('📦 pdfmakeModule:', !!pdfMakeModule);
    
    // @ts-ignore - pdfmake fonts types não disponíveis
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    console.log('📦 pdfFontsModule:', !!pdfFontsModule);
    
    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const pdfFonts = pdfFontsModule.default || pdfFontsModule;
    
    console.log('📦 pdfMake:', !!pdfMake, typeof pdfMake);
    console.log('📦 pdfFonts:', !!pdfFonts, typeof pdfFonts);
    
    // Configurar fontes do pdfmake
    if (pdfMake && pdfFonts) {
      pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.pdfMake || pdfFonts;
      console.log('✅ Fontes configuradas');
    } else {
      console.warn('⚠️ pdfMake ou pdfFonts não encontrados');
    }

    if (!pdfMake || typeof pdfMake.createPdf !== 'function') {
      throw new Error('pdfMake não tem a função createPdf');
    }

    return pdfMake;
  } catch (error) {
    console.error('❌ Erro ao carregar pdfmake:', error);
    throw error;
  }
};

