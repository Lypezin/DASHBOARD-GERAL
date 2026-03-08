import React from 'react';

interface VariacaoAderenciaBoxProps {
    variacaoAderencia: { label: string; valor: string; positivo: boolean };
}

export const VariacaoAderenciaBox: React.FC<VariacaoAderenciaBoxProps> = ({ variacaoAderencia }) => {
    if (!variacaoAderencia) return null;
    
    return (
        <div className="flex flex-col items-center justify-center z-10 mx-6">
            <div className={`rounded-3xl border-2 px-10 py-8 text-center flex flex-col items-center gap-4 shadow-xl ${variacaoAderencia.positivo
                ? 'bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 border-emerald-300'
                : 'bg-gradient-to-br from-rose-50 via-rose-100 to-rose-50 border-rose-300'
                }`}>

                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                    Variação de Aderência
                </p>

                <div className={`flex items-center gap-3 px-6 py-2.5 rounded-full ${variacaoAderencia.positivo ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                    }`}>
                    {variacaoAderencia.positivo ? (
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4l-8 8h5v8h6v-8h5z" />
                        </svg>
                    ) : (
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 20l8-8h-5V4H9v8H4z" />
                        </svg>
                    )}
                    <span className="text-3xl font-black">
                        {variacaoAderencia.valor}
                    </span>
                </div>
            </div>
        </div>
    );
};
