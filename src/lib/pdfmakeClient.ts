'use client';

// Helper para carregar pdfmake apenas no cliente
// Usar função para retornar o caminho dinamicamente e evitar resolução estática
const getPdfMakePath = () => 'pdfmake/build/pdfmake';
const getPdfFontsPath = () => 'pdfmake/build/vfs_fonts';

export const loadPdfMake = async () => {
  if (typeof window === 'undefined') {
    throw new Error('pdfmake só pode ser usado no cliente');
  }

  try {
    // Usar função para obter o caminho dinamicamente
    const pdfMakePath = getPdfMakePath();
    const pdfFontsPath = getPdfFontsPath();
    
    // @ts-ignore - pdfmake types não disponíveis
    const pdfMakeModule = await import(pdfMakePath);
    // @ts-ignore - pdfmake fonts types não disponíveis
    const pdfFontsModule = await import(pdfFontsPath);
    
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

