'use client';

import { createContext, useContext } from 'react';

interface PresentationContextType {
    isWebMode: boolean;
}

export const PresentationContext = createContext<PresentationContextType>({
    isWebMode: false,
});

export const usePresentationContext = () => useContext(PresentationContext);
