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

// Função para obter iniciais do nome
function getIniciais(nome: string): string {
  const partes = nome.trim().split(' ');
  if (partes.length >= 2) {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }
  return nome.substring(0, 2).toUpperCase();
}

// Função para obter cor baseada no nome (para avatar)
function getAvatarColor(nome: string): string {
  const cores = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-indigo-500 to-purple-500',
  ];
  const hash = nome.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return cores[hash % cores.length];
}

const AtendenteCard: React.FC<AtendenteCardProps> = ({
  nome,
  enviado,
  liberado,
  fotoUrl,
}) => {
  const iniciais = getIniciais(nome);
  const avatarColor = getAvatarColor(nome);

  return (
    <div className="space-y-4">
      {/* Card do Atendente */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center gap-4">
          {/* Avatar com foto ou iniciais */}
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor} text-lg font-bold text-white shadow-sm overflow-hidden`}>
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
                  // Fallback para iniciais se a imagem falhar
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = iniciais;
                  }
                }}
              />
            ) : (
              iniciais
            )}
          </div>

          {/* Nome */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate" title={nome}>
              {nome}
            </h3>
            <p className="text-sm text-muted-foreground">
              Atendente
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cartões de Métricas */}
      <div className="space-y-3">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enviado</CardTitle>
            <Send className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {enviado}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Liberado</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {liberado}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AtendenteCard;

