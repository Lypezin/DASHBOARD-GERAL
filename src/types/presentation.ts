export interface MediaSlideData {
    id: string;
    url: string;
    scale: number; // 0.5 to 3.0
    text: string;
    textPosition: 'bottom' | 'top' | 'center';
    imagePosition?: { x: number; y: number };
    textPositionCoords?: { x: number; y: number };
}
