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
    'resumo-ia': 'Resumo IA',
    'aderencia-geral': 'Aderencia Geral',
    ranking: 'Ranking',
    'resumo-sub-pracas': 'Resumo de Sub-pracas (Tabela)',
    'sub-pracas': 'Sub-pracas',
    'aderencia-diaria': 'Detalhamento Diario',
    utr: 'UTR',
    entregadores: 'Entregadores',
    'resumo-turnos': 'Resumo de Turnos (Tabela)',
    turnos: 'Turnos',
    'media-origens': 'Media das Origens',
    'resumo-origens': 'Resumo de Origens (Tabela)',
    origens: 'Origens',
    'resumo-demanda-origem': 'Resumo de Demanda por Origem (Tabela)',
    'demanda-origem': 'Demanda por Origem',
    demanda: 'Demanda e Rejeicoes',
    'capa-final': 'Capa Final',
};

export const PresentationSectionToggle: React.FC<PresentationSectionToggleProps> = React.memo(({
    visibleSections,
    onToggleSection,
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <Settings className="mr-2 h-4 w-4" />
                    Personalizar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[100001] w-56">
                <DropdownMenuLabel>Secoes do PDF</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.keys(visibleSections).map((key) => (
                    <DropdownMenuCheckboxItem
                        key={key}
                        checked={visibleSections[key]}
                        onCheckedChange={() => onToggleSection(key)}
                        onSelect={(event) => {
                            event.preventDefault();
                            onToggleSection(key);
                        }}
                    >
                        {SECTION_LABELS[key] || key}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

PresentationSectionToggle.displayName = 'PresentationSectionToggle';
