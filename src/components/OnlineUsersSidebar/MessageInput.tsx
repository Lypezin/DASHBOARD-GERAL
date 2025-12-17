import { ChatMessage } from '@/hooks/useOnlineUsers';
import { Image, ChevronRight, Reply, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface MessageInputProps {
    chatInput: string;
    setChatInput: (v: string) => void;
    handleSendMessage: () => void;
    replyingTo: ChatMessage | null;
    setReplyingTo: (msg: ChatMessage | null) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    setTypingTo: (id: string) => void;
    activeUserId: string;
}

export function MessageInput({
    chatInput, setChatInput, handleSendMessage, replyingTo,
    setReplyingTo, fileInputRef, setTypingTo, activeUserId
}: MessageInputProps) {
    return (
        <div className="p-3 border-t border-slate-100 bg-white">
            {replyingTo && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 border-b-0 rounded-t-lg p-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Reply size={12} className="shrink-0 text-blue-500" />
                        <span className="truncate max-w-[200px] border-l-2 border-blue-300 pl-2 italic">
                            {replyingTo.content}
                        </span>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="hover:bg-slate-200 rounded p-0.5"><X size={12} /></button>
                </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className={cn("flex gap-2 items-end", replyingTo && "bg-slate-50 p-2 rounded-b-lg border border-slate-200 border-t-0")}>
                <button
                    type="button"
                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    title="Enviar Imagem/Arquivo"
                >
                    <Image size={18} />
                </button>
                <div className="flex-1 relative">
                    <textarea
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 pr-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none max-h-24 scrollbar-hide bg-slate-50/50"
                        placeholder="Digite uma mensagem..."
                        rows={1}
                        value={chatInput}
                        onChange={e => {
                            setChatInput(e.target.value);
                            setTypingTo(activeUserId);
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    <ChevronRight size={18} />
                </button>
            </form>
        </div>
    );
}
