import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeSettingsCard: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
            <CardHeader>
                <CardTitle className="text-lg">Aparência</CardTitle>
                <CardDescription>Personalize sua experiência</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-orange-500/10 text-orange-500'}`}>
                            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium">Modo Escuro</p>
                            <p className="text-xs text-slate-500 capitalize">
                                {theme === 'dark' ? 'Ativado' : 'Desativado'}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleTheme}
                        className="ml-auto"
                    >
                        Alternar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
