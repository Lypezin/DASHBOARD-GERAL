
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PresentationSectionToggleProps {
    visibleSections: Record<string, boolean>;
    onToggleSection: (section: string) => void;
}

const SECTION_LABELS: Record<string, string> = {
    capa: 'Capa',
    'aderencia-geral': 'Aderência Geral',
    'sub-pracas': 'Sub-praças',
    'aderencia-diaria': 'Detalhamento Diário',
    turnos: 'Turnos',
    origens: 'Origens',
    demanda: 'Demanda e Rejeições',
};

export const PresentationSectionToggle: React.FC<PresentationSectionToggleProps> = ({
    visibleSections,
    onToggleSection,
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <Settings className="mr-2 h-4 w-4" />
                    Personalizar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[100001]">
                <DropdownMenuLabel>Seções do PDF</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.keys(visibleSections).map((key) => (
                    <DropdownMenuCheckboxItem
                        key={key}
                        checked={visibleSections[key]}
                        onCheckedChange={() => onToggleSection(key)}
                        onSelect={(e) => e.preventDefault()}
                    >
                        {SECTION_LABELS[key] || key}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
