export interface SlideElement {
    id: string;
    type: 'image' | 'text';
    content: string; // URL for image, Text content for text
    position: { x: number; y: number };
    scale?: number; // For images
    width?: number; // Optional constraint
    style?: {
        color?: string;
        fontSize?: string;
        bg?: string;
        fontWeight?: 'bold' | 'normal';
        fontStyle?: 'italic' | 'normal';
    };
}

export interface MediaSlideData {
    id: string;
    elements: SlideElement[];
    // Deprecated fields kept for temporary compatibility if needed, but we will migrate away
    url?: string;
    text?: string;
    title?: string;
}
