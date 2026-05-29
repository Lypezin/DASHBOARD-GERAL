'use client';

import React from 'react';
import { useAnimatedFavicon } from '@/hooks/ui/useAnimatedFavicon';

interface FaviconManagerProps {
  percentual: number;
}

export function FaviconManager({ percentual }: FaviconManagerProps) {
  // Inicializa o hook dinâmico de favicon com o valor fornecido
  useAnimatedFavicon({ percentual });

  // Este componente serve apenas como um gatilho de efeitos colaterais
  return null;
}
