import { useState, useRef, RefObject } from 'react';
import { safeLog } from '@/lib/errorHandler';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '../constants';

const A4_WIDTH_MM = 297;
const A4_HEIGHT_MM = 210;
const SCALE_FACTOR = 1.15;

interface UsePresentationPDFProps {
    slides: Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    numeroSemana1: string;
    numeroSemana2: string;
    contentRef: RefObject<HTMLDivElement>;
    captureContainerRef: RefObject<HTMLDivElement>;
}

export const usePresentationPDF = ({
    slides,
    numeroSemana1,
    numeroSemana2,
    contentRef,
    captureContainerRef
}: UsePresentationPDFProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingProgress, setGeneratingProgress] = useState({ current: 0, total: 0 });
    const [capturingIndex, setCapturingIndex] = useState<number | null>(null);

    const generatePDF = async () => {
        if (slides.length === 0) return;

        setIsGenerating(true);
        setGeneratingProgress({ current: 0, total: slides.length });

        try {
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            // Hide the preview container during capture to avoid interference
            if (contentRef.current) {
                contentRef.current.style.visibility = 'hidden';
            }

            for (let i = 0; i < slides.length; i++) {
                setGeneratingProgress({ current: i + 1, total: slides.length });
                setCapturingIndex(i);

                // Wait for React to render the slide
                await new Promise(resolve => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => resolve(undefined));
                    });
                });

                const captureElement = captureContainerRef.current;
                if (!captureElement) continue;

                const slideElement = captureElement.firstElementChild as HTMLElement;

                if (slideElement) {
                    const canvas = await html2canvas(slideElement, {
                        scale: SCALE_FACTOR,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        width: SLIDE_WIDTH,
                        height: SLIDE_HEIGHT,
                        logging: false,
                        imageTimeout: 0,
                        windowWidth: SLIDE_WIDTH,
                        windowHeight: SLIDE_HEIGHT,
                        onclone: (clonedDoc: Document) => {
                            const hiddenElements = clonedDoc.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"]');
                            hiddenElements.forEach((el: Element) => el.remove());
                        },
                    });

                    if (i > 0) {
                        pdf.addPage();
                    }

                    const imgData = canvas.toDataURL('image/jpeg', 0.8);
                    pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
                }
            }

            const filename = `Comparativo_Semana${numeroSemana1}_vs_Semana${numeroSemana2}.pdf`;
            pdf.save(filename);
        } catch (error) {
            safeLog.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Tente novamente.');
        } finally {
            if (contentRef.current) {
                contentRef.current.style.visibility = 'visible';
            }
            setIsGenerating(false);
            setGeneratingProgress({ current: 0, total: 0 });
            setCapturingIndex(null);
        }
    };

    return {
        isGenerating,
        generatingProgress,
        capturingIndex,
        generatePDF
    };
};
