'use client';

import React from 'react';

interface CapaTitleProps {
    titulo: string;
    subtitulo?: string;
    periodo?: string;
    isDark: boolean;
}

export const CapaTitle: React.FC<CapaTitleProps> = ({ 
    titulo, 
    subtitulo, 
    periodo, 
    isDark 
}) => {
    return (
        <div className="z-10 max-w-5xl text-center">
            <div className="mb-12 flex flex-col items-center">
                <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">
                    GO Itaim · Marketing
                </span>
                <div className="mt-4 h-px w-32 bg-border" />
            </div>

            <h1 className={`mb-8 text-[104px] font-semibold leading-[0.92] tracking-tight transition-colors duration-300 ${
                isDark ? 'text-foreground' : 'text-primary'
            }`}>
                {titulo.split(' ').map((word, i) => (
                    <span key={i} className="block">{word}</span>
                ))}
            </h1>
            
            <h2 className={`mb-12 text-4xl font-normal tracking-tight transition-colors duration-300 ${
                isDark ? 'text-muted-foreground' : 'text-foreground'
            }`}>
                {periodo}
            </h2>
            
            {subtitulo && (
                <div className="relative flex flex-col items-center">
                    <div className="mb-8 h-px w-24 bg-primary" />
                    <p className={`text-sm font-medium uppercase tracking-[0.28em] transition-colors duration-300 ${
                        isDark ? 'text-muted-foreground' : 'text-muted-foreground'
                    }`}>
                        {subtitulo}
                    </p>
                </div>
            )}
        </div>
    );
};
