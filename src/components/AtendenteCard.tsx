'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, CheckCircle2 } from 'lucide-react';

interface AtendenteCardProps {
    nome: string;
    enviado: number;
    liberado: number;
    fotoUrl?: string | null;
}

function getIniciais(nome: string): string {
    const p = nome.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : nome.substring(0, 2).toUpperCase();
}

function getAvatarColor(nome: string): string {
    const cores = [
        'from-sky-500 to-blue-500',
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
        'from-orange-500 to-amber-500',
        'from-cyan-500 to-sky-600',
    ];
    return cores[nome.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % cores.length];
}

const AtendenteCard: React.FC<AtendenteCardProps> = ({ nome, enviado, liberado, fotoUrl }) => {
    const iniciais = getIniciais(nome);
    const avatarColor = getAvatarColor(nome);

    return (
        <div className="space-y-4">
            <Card className="border-slate-200/70 bg-white/90 shadow-sm transition-[border-color,box-shadow] hover:border-slate-300/80 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/85">
                <CardContent className="flex items-center gap-4 p-4">
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br text-lg font-bold text-white shadow-sm ${avatarColor}`}>
                        {fotoUrl ? (
                            <Image
                                src={fotoUrl}
                                alt={nome}
                                width={64}
                                height={64}
                                quality={95}
                                priority
                                className="h-full w-full object-cover"
                                unoptimized={fotoUrl.includes('supabase.co')}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    if (target.parentElement) target.parentElement.innerHTML = iniciais;
                                }}
                            />
                        ) : (
                            iniciais
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white" title={nome}>
                            {nome}
                        </h3>
                        <p className="text-sm text-muted-foreground">Atendente</p>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Enviado</CardTitle>
                        <Send className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="font-mono text-xl font-bold text-slate-900 dark:text-white">{enviado}</div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Liberado</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-sky-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="font-mono text-xl font-bold text-slate-900 dark:text-white">{liberado}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AtendenteCard;
