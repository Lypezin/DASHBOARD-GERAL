import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/components/apresentacao/constants';

// A4 Landscape dimensions in mm
const A4_WIDTH_MM = 297;
const A4_HEIGHT_MM = 210;

// Scale factor for high quality (2x for retina-like quality)
const SCALE_FACTOR = 1.5;

/**
 * Renders a slide to a hidden container and captures it as an image
 */
export async function captureSlide(
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
export function createPDFFromCanvases(canvases: HTMLCanvasElement[]): jsPDF {
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
