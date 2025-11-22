import { loadPdfMake } from '@/lib/pdfmakeClient';
import { safeLog } from '@/lib/errorHandler';
import {
  criarSlideCapa,
  criarSlideAderenciaGeral,
  criarSlideAderenciaDiaria,
  criarSlideTurnos,
  criarSlideSubPracas,
  criarSlideDemandaRejeicoes,
  criarSlideOrigens,
} from '@/components/apresentacao/pdf';
import { chunkArray } from './dataProcessor';
import { DadosProcessados } from './dataProcessor';

const IS_DEV = process.env.NODE_ENV === 'development';

const SUB_PRACAS_PER_PAGE = 2;
const TURNOS_PER_PAGE = 2;
const ORIGENS_PER_PAGE = 4;

export const prepararSlidesPDF = (
  dadosProcessados: DadosProcessados,
  numeroSemana1: string,
  numeroSemana2: string,
  periodoSemana1: string,
  periodoSemana2: string,
  pracaSelecionada: string | null
): any[] => {
  const pdfSlides: any[] = [];
  const { resumoSemana1, resumoSemana2, variacaoResumo, subPracasComparativo, semana1Dias, semana2Dias, turnosComparativo, origensComparativo, demandaItens } = dadosProcessados;

  // Slide Capa
  pdfSlides.push(
    criarSlideCapa(pracaSelecionada, numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2)
  );

  // Slide Aderência Geral
  pdfSlides.push(criarSlideAderenciaGeral(resumoSemana1, resumoSemana2, variacaoResumo));

  // Slides Sub-Praças
  const subPracasPaginas = chunkArray(subPracasComparativo, SUB_PRACAS_PER_PAGE);
  subPracasPaginas.forEach((pagina, indice) => {
    pdfSlides.push(
      criarSlideSubPracas(
        numeroSemana1,
        numeroSemana2,
        indice + 1,
        subPracasPaginas.length,
        pagina
      )
    );
  });

  // Slide Aderência Diária
  pdfSlides.push(criarSlideAderenciaDiaria(numeroSemana1, numeroSemana2, semana1Dias, semana2Dias));

  // Slides Turnos
  const turnosPaginas = chunkArray(turnosComparativo, TURNOS_PER_PAGE);
  turnosPaginas.forEach((pagina, indice) => {
    pdfSlides.push(
      criarSlideTurnos(
        numeroSemana1,
        numeroSemana2,
        indice + 1,
        turnosPaginas.length,
        pagina
      )
    );
  });

  // Slides Origens
  const origensPaginas = chunkArray(origensComparativo, ORIGENS_PER_PAGE);
  origensPaginas.forEach((pagina, indice) => {
    pdfSlides.push(
      criarSlideOrigens(
        numeroSemana1,
        numeroSemana2,
        indice + 1,
        origensPaginas.length,
        pagina
      )
    );
  });

  // Slide Demanda e Rejeições
  pdfSlides.push(criarSlideDemandaRejeicoes(numeroSemana1, numeroSemana2, demandaItens));

  return pdfSlides;
};

export const gerarPDF = async (
  slidesPDFData: any[],
  numeroSemana1: string,
  numeroSemana2: string
): Promise<void> => {
  if (IS_DEV) {
    safeLog.info('🔵 gerarPDF chamado');
    safeLog.info('📊 slidesPDFData.length:', { length: slidesPDFData.length });
  }
  
  if (slidesPDFData.length === 0) {
    alert('Não há dados suficientes para gerar o PDF.');
    return;
  }

  // Verificar se está no cliente
  if (typeof window === 'undefined') {
    alert('A geração de PDF só está disponível no navegador.');
    return;
  }

  if (IS_DEV) {
    safeLog.info('⏳ Iniciando geração de PDF...');
  }

  try {
    // Carregar pdfmake apenas no cliente
    if (IS_DEV) {
      safeLog.info('📦 Carregando pdfmake...');
    }
    const pdfMake = await loadPdfMake();
    if (IS_DEV) {
      safeLog.info('✅ pdfmake carregado:', { loaded: !!pdfMake });
    }

    if (!pdfMake) {
      throw new Error('pdfmake não foi carregado corretamente');
    }

    // Criar conteúdo com quebras de página entre slides
    // Cada slide já tem o background incorporado
    const content: any[] = slidesPDFData.map((slide, index) => {
      if (index === 0) {
        // Primeiro slide sem quebra de página
        return slide;
      }
      // Slides subsequentes com quebra de página
      return {
        ...slide,
        pageBreak: 'before',
      };
    });

    if (IS_DEV) {
      safeLog.info('📄 Total de slides no conteúdo:', { length: content.length });
    }

    const docDefinition = {
      pageSize: {
        width: 842, // A4 landscape width em pontos
        height: 595, // A4 landscape height em pontos
      },
      pageOrientation: 'landscape' as const,
      pageMargins: [30, 30, 30, 30], // Margens reduzidas para maximizar espaço
      background: '#2563eb', // Background padrão azul
      content: content,
      defaultStyle: {
        // Não definir font aqui - usar padrão do pdfmake
        color: '#ffffff', // Texto branco por padrão
      },
    };

    if (IS_DEV) {
      safeLog.info('📝 Criando PDF...');
    }
    const pdfDoc = pdfMake.createPdf(docDefinition);
    if (IS_DEV) {
      safeLog.info('💾 PDF criado, iniciando download...');
    }
    
    const fileName = `Relatorio_Semanas_${numeroSemana1}_${numeroSemana2}.pdf`;
    
    // Usar getBlob para garantir que o download funcione
    pdfDoc.getBlob((blob: Blob) => {
      if (IS_DEV) {
        safeLog.info('📦 Blob criado:', { size: blob.size });
      }
      
      if (!blob || blob.size === 0) {
        throw new Error('PDF gerado está vazio');
      }
      
      // Criar URL do blob
      const url = URL.createObjectURL(blob);
      if (IS_DEV) {
        safeLog.info('🔗 URL criada:', { url });
      }
      
      // Criar link de download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      if (IS_DEV) {
        safeLog.info('🖱️ Clicando no link de download...');
      }
      link.click();
      
      // Limpar após um pequeno delay
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        if (IS_DEV) {
          safeLog.info('✅ Download iniciado e recursos limpos!');
        }
      }, 100);
    });
  } catch (error) {
    safeLog.error('❌ Erro ao gerar PDF:', error);
    alert(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    throw error;
  }
};

