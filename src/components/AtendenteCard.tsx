'use client';

import React from 'react';
import Image from 'next/image';
import MarketingCard from './MarketingCard';

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
      <div className="group relative overflow-hidden rounded-xl border border-slate-200/50 bg-white/90 backdrop-blur-sm p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-purple-300 dark:border-slate-700/50 dark:bg-slate-900/90">
        <div className={`absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br ${avatarColor} opacity-10 blur-2xl transition-opacity group-hover:opacity-25`}></div>
        
        <div className="relative flex items-center gap-4">
          {/* Avatar com foto ou iniciais */}
          <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor} text-xl font-bold text-white shadow-lg ring-2 ring-white/20 overflow-hidden`}>
            {fotoUrl ? (
              <Image
                src={fotoUrl}
                alt={nome}
                width={80}
                height={80}
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight break-words" title={nome}>
              {nome}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Atendente
            </p>
          </div>
        </div>
      </div>

      {/* Cartões de Métricas */}
      <div className="space-y-3">
        <MarketingCard
          title="Enviado"
          value={enviado}
          icon="📤"
          color="green"
        />
        <MarketingCard
          title="Liberado"
          value={liberado}
          icon="✅"
          color="purple"
        />
      </div>
    </div>
  );
};

export default AtendenteCard;

