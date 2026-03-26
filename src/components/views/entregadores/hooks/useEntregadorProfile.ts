import { useState, useCallback } from 'react';
import { Entregador } from '@/types';

export function useEntregadorProfile() {
    const [selectedEntregador, setSelectedEntregador] = useState<Entregador | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);

    const handleRowClick = useCallback((entregador: Entregador) => {
        setSelectedEntregador(entregador);
        setProfileOpen(true);
    }, []);

    return {
        selectedEntregador,
        profileOpen,
        setProfileOpen,
        handleRowClick
    };
}
