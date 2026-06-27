
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
        <div className="fixed top-0 left-0 right-0 z-[100006] group pointer-events-none">
            {/* Transparent hover zone at the top of the viewport to trigger group hover */}
            <div className="absolute top-0 left-0 right-0 h-4 pointer-events-auto" />

            {/* The toolbar content */}
            <div className="p-4 flex justify-between items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 transition-all duration-300 transform opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-auto hover:opacity-100 hover:translate-y-0">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Modo Apresentação</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border dark:border-slate-700">
                    <button
                        onClick={() => setTool(current => current === 'pen' ? 'laser' : 'pen')}
                        className={`p-2 rounded-md transition-colors ${tool === 'pen' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                        title="Caneta"
                    >
                        <Pen size={18} />
                    </button>
                    <button
                        onClick={() => setTool(current => current === 'eraser' ? 'laser' : 'eraser')}
                        className={`p-2 rounded-md transition-colors ${tool === 'eraser' ? 'bg-white dark:bg-slate-700 shadow text-slate-600 dark:text-slate-300' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                        title="Limpar Tela"
                    >
                        <Eraser size={18} />
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-slate-300 text-white dark:text-slate-900 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm uppercase tracking-wide"
                >
                    Sair (Esc)
                </button>
            </div>

            {/* Visual handle at the top indicating a hoverable toolbar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700 backdrop-blur-sm rounded-b-lg px-6 py-1 cursor-pointer transition-all duration-300 opacity-50 hover:opacity-100 group-hover:opacity-0 animate-pulse hover:animate-none pointer-events-auto">
                <div className="w-8 h-1 bg-slate-400 dark:bg-slate-500 rounded-full" />
            </div>
        </div>
    );
};
