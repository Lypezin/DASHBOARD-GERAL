/**
 * PDF Generator using html2canvas + jspdf
 * 
 * This captures the actual React slides as rendered in the browser,
 * ensuring the PDF matches the preview exactly.
 */

import { captureSlide, createPDFFromCanvases } from './pdfCanvasUtils';

interface SlideForCapture {
    key: string;
    render: (visible: boolean) => React.ReactNode;
}

/**
 * Main function to generate PDF from slides
 * 
 * @param containerElement - The container element that holds all slides
 * @param slides - Array of slide objects with key and render function
 * @param filename - Name of the output PDF file
 * @param onProgress - Optional callback for progress updates
 */
export async function gerarPDFFromSlides(
    containerElement: HTMLElement,
    slides: SlideForCapture[],
    filename: string = 'apresentacao.pdf',
    onProgress?: (current: number, total: number) => void
): Promise<void> {
    if (slides.length === 0) {
        throw new Error('Não há slides para gerar o PDF');
    }

    const canvases: HTMLCanvasElement[] = [];

    // Find all slide elements within the container
    const slideElements = containerElement.querySelectorAll('.slide-capture');

    if (slideElements.length === 0) {
        throw new Error('Nenhum elemento de slide encontrado para captura');
    }

    // Capture each slide
    for (let i = 0; i < slideElements.length; i++) {
        const slideElement = slideElements[i] as HTMLElement;
        const canvas = await captureSlide(
            slideElement,
            i,
            slideElements.length,
            onProgress
        );
        canvases.push(canvas);
    }

    // Create PDF from captured canvases
    const pdf = createPDFFromCanvases(canvases);

    // Download the PDF
    pdf.save(filename);
}

/**
 * Alternative: Capture slides by rendering them one at a time
 * This is more reliable but slower
 */
export async function gerarPDFSequential(
    renderSlide: (index: number) => HTMLElement | null,
    totalSlides: number,
    filename: string = 'apresentacao.pdf',
    onProgress?: (current: number, total: number) => void
): Promise<void> {
    if (totalSlides === 0) {
        throw new Error('Não há slides para gerar o PDF');
    }

    const canvases: HTMLCanvasElement[] = [];

    for (let i = 0; i < totalSlides; i++) {
        const slideElement = renderSlide(i);
        if (!slideElement) {
            console.warn(`Slide ${i} não encontrado`);
            continue;
        }

        const canvas = await captureSlide(slideElement, i, totalSlides, onProgress);
        canvases.push(canvas);

        // Small delay to allow UI updates
        await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const pdf = createPDFFromCanvases(canvases);
    pdf.save(filename);
}
