'use client';

// Helper para carregar pdfmake apenas no cliente
export const loadPdfMake = async () => {
  if (typeof window === 'undefined') {
    throw new Error('pdfmake só pode ser usado no cliente');
  }

  try {
    // Importar pdfmake usando strings literais para evitar avisos de dependência crítica
    // @ts-ignore - pdfmake types não disponíveis
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    // @ts-ignore - pdfmake fonts types não disponíveis
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    
    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const pdfFonts = pdfFontsModule.default || pdfFontsModule;
    
    // Configurar fontes do pdfmake
    if (pdfMake && pdfFonts) {
      pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.pdfMake || pdfFonts;
    }

    return pdfMake;
  } catch (error) {
    console.error('Erro ao carregar pdfmake:', error);
    throw error;
  }
};

