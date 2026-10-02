import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    text?: string;
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 text-center">
            <span className="relative flex items-center justify-center">
                <span className={cn('absolute rounded-full bg-blue-500/10 blur-md', sizeClasses[size])} />
                <Loader2 className={cn('relative animate-spin text-blue-600 dark:text-blue-300', sizeClasses[size], className)} />
            </span>
            {text && <p className="max-w-xs text-sm font-medium text-slate-500 dark:text-slate-400">{text}</p>}
        </div>
    );
}

interface PageLoadingProps {
    text?: string;
}

export function PageLoading({ text = 'Carregando...' }: PageLoadingProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_36%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
            <div className="w-full max-w-sm rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 text-center shadow-[0_28px_80px_-44px_rgba(15,23,42,0.7)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/90 dark:shadow-black/40">
                <LoadingSpinner size="xl" text={text} />
                <div className="mx-auto mt-6 h-2 w-44 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                    <div className="h-full w-1/2 animate-[loading-bar_1.2s_ease-in-out_infinite] rounded-full bg-blue-600 dark:bg-blue-400" />
                </div>
            </div>
        </div>
    );
}
