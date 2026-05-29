import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeSettingsCard = React.memo(function ThemeSettingsCard() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Card className="border-slate-200/70 bg-white/90 shadow-md dark:border-slate-800/70 dark:bg-slate-900/85">
            <CardHeader>
                <CardTitle className="text-lg">Aparencia</CardTitle>
                <CardDescription>Personalize sua experiencia</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-lg bg-slate-100 p-3 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${theme === 'dark' ? 'bg-sky-500/10 text-sky-500' : 'bg-orange-500/10 text-orange-500'}`}>
                            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium">Modo Escuro</p>
                            <p className="text-xs capitalize text-slate-500">
                                {theme === 'dark' ? 'Ativado' : 'Desativado'}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={toggleTheme} className="ml-auto">
                        Alternar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
});
