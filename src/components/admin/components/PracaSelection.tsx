
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface PracaSelectionProps {
    pracasDisponiveis: string[];
    selectedPracas: string[];
    onPracaToggle: (praca: string) => void;
}

export const PracaSelection: React.FC<PracaSelectionProps> = ({
    pracasDisponiveis,
    selectedPracas,
    onPracaToggle,
}) => {
    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between">
                <Label>Selecione as praças de acesso</Label>
                <span className="text-xs text-muted-foreground">
                    {selectedPracas.length} de {pracasDisponiveis.length} selecionadas
                </span>
            </div>

            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                {pracasDisponiveis.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <span className="text-2xl mb-2">⚠️</span>
                        <p className="text-sm">Nenhuma praça disponível</p>
                        <p className="text-xs mt-1">O usuário não poderá ser aprovado sem praças</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pracasDisponiveis.map((praca) => (
                            <div key={praca} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`praca-${praca}`}
                                    checked={selectedPracas.includes(praca)}
                                    onCheckedChange={() => onPracaToggle(praca)}
                                />
                                <label
                                    htmlFor={`praca-${praca}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    {praca}
                                </label>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};
