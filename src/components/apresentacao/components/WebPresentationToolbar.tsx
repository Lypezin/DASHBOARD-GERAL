
import React from 'react';
import { Pen, Eraser } from 'lucide-react';
import { ToolType } from './PresentationInteractionLayer';

interface WebPresentationToolbarProps {
    tool: ToolType;
    setTool: React.Dispatch<React.SetStateAction<ToolType>>;
    onClose: () => void;
}

export const WebPresentationToolbar: React.FC<WebPresentationToolbarProps> = ({
    tool,
    setTool,
    onClose,
}) => {
    return (
        <>
            <div className={`fixed top-0 left-0 right-0 z-[100006] p-4 flex justify-between items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 transition-all duration-300 hover:opacity-100 opacity-0 hover:translate-y-0 -translate-y-2 pointer-events-none hover:pointer-events-auto group-hover:opacity-100 group presentation-toolbar`}>
                <div className="flex items-center gap-4">
                    <div className="absolute top-0 left-0 right-0 h-6 -translate-y-full group-hover:translate-y-0 pointer-events-auto" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Modo Apresentação</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border pointer-events-auto">
                    <button
                        onClick={() => setTool(current => current === 'pen' ? 'laser' : 'pen')}
                        className={`p-2 rounded-md transition-colors ${tool === 'pen' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-white/50'}`}
                        title="Caneta"
                    >
                        <Pen size={18} />
                    </button>
                    <button
                        onClick={() => setTool(current => current === 'eraser' ? 'laser' : 'eraser')}
                        className={`p-2 rounded-md transition-colors ${tool === 'eraser' ? 'bg-white shadow text-slate-600' : 'text-slate-500 hover:bg-white/50'}`}
                        title="Limpar Tela"
                    >
                        <Eraser size={18} />
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm uppercase tracking-wide pointer-events-auto"
                >
                    Sair (Esc)
                </button>
            </div>

            <div className="fixed top-0 left-0 right-0 h-3 z-[100005] hover:opacity-100 group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-200/50 hover:bg-slate-200 backdrop-blur-sm rounded-b-lg px-6 py-1 cursor-pointer transition-all duration-300 opacity-50 hover:opacity-100 group-hover:opacity-0 animate-pulse hover:animate-none">
                    <div className="w-8 h-1 bg-slate-400 rounded-full" />
                </div>
            </div>
        </>
    );
};
