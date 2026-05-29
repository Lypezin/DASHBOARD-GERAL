import { loadPdfMake } from '@/lib/pdfmakeClient';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

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

    if (typeof window === 'undefined') {
        alert('A geração de PDF só está disponível no navegador.');
        return;
    }

    if (IS_DEV) safeLog.info('⏳ Iniciando geração de PDF...');

    try {
        if (IS_DEV) safeLog.info('📦 Carregando pdfmake...');
        const pdfMake = await loadPdfMake();
        if (IS_DEV) safeLog.info('✅ pdfmake carregado:', { loaded: !!pdfMake });

        if (!pdfMake) throw new Error('pdfmake não foi carregado corretamente');

        const content: any[] = slidesPDFData.map((slide, index) => {
            if (index === 0) return slide;
            return { ...slide, pageBreak: 'before' };
        });

        if (IS_DEV) safeLog.info('📄 Total de slides no conteúdo:', { length: content.length });

        const docDefinition = {
            pageSize: { width: 842, height: 595 },
            pageOrientation: 'landscape' as const,
            pageMargins: [30, 30, 30, 30],
            background: '#2563eb',
            content: content,
            defaultStyle: { color: '#ffffff' },
        };

        if (IS_DEV) safeLog.info('📝 Criando PDF...');
        const pdfDoc = pdfMake.createPdf(docDefinition);
        if (IS_DEV) safeLog.info('💾 PDF criado, iniciando download...');

        const fileName = `Relatorio_Semanas_${numeroSemana1}_${numeroSemana2}.pdf`;

        pdfDoc.getBlob((blob: Blob) => {
            if (IS_DEV) safeLog.info('📦 Blob criado:', { size: blob.size });

            if (!blob || blob.size === 0) throw new Error('PDF gerado está vazio');

            const url = URL.createObjectURL(blob);
            if (IS_DEV) safeLog.info('🔗 URL criada:', { url });

            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';

            document.body.appendChild(link);
            if (IS_DEV) safeLog.info('🖱️ Clicando no link de download...');
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                if (IS_DEV) safeLog.info('✅ Download iniciado e recursos limpos!');
            }, 100);
        });
    } catch (error) {
        safeLog.error('❌ Erro ao gerar PDF:', error);
        alert(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        throw error;
    }
};
