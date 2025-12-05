/**
 * PDF Generator using html2canvas + jspdf
 * 
 * This captures the actual React slides as rendered in the browser,
 * ensuring the PDF matches the preview exactly.
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/components/apresentacao/constants';

// A4 Landscape dimensions in mm
const A4_WIDTH_MM = 297;
const A4_HEIGHT_MM = 210;

// Scale factor for high quality (2x for retina-like quality)
const SCALE_FACTOR = 1.5;

interface SlideForCapture {
    key: string;
    render: (visible: boolean) => React.ReactNode;
}

/**
 * Renders a slide to a hidden container and captures it as an image
 */
async function captureSlide(
    slideElement: HTMLElement,
    slideIndex: number,
    totalSlides: number,
    onProgress?: (current: number, total: number) => void
): Promise<HTMLCanvasElement> {
    if (onProgress) {
        onProgress(slideIndex + 1, totalSlides);
    }

    // Use html2canvas to capture the slide
    const canvas = await html2canvas(slideElement, {
        scale: SCALE_FACTOR,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        logging: false,
        // Ensure fonts are loaded
        onclone: (clonedDoc) => {
            // Force font loading in cloned document
            const elements = clonedDoc.querySelectorAll('*');
            elements.forEach((el) => {
                if (el instanceof HTMLElement) {
                    el.style.fontFamily = 'Inter, Arial, sans-serif';
                }
            });
        },
    });

    return canvas;
}

/**
 * Creates a PDF from captured slide canvases
 */
function createPDFFromCanvases(canvases: HTMLCanvasElement[]): jsPDF {
    // Create PDF in landscape A4
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    });

    canvases.forEach((canvas, index) => {
        if (index > 0) {
            pdf.addPage();
        }

        // Convert canvas to image data
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Add image to PDF, fitting to A4 page
        pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
    });

    return pdf;
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
