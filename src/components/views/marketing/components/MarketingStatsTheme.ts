
export const THEME_STYLES = {
    emerald: {
        bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
        shadow: 'shadow-emerald-500/20',
        innerBg: 'bg-gradient-to-br from-emerald-500/90 to-emerald-600/90',
        subtitle: 'text-emerald-100'
    },
    rose: {
        bg: 'bg-gradient-to-br from-rose-500 to-rose-600',
        shadow: 'shadow-rose-500/20',
        innerBg: 'bg-gradient-to-br from-rose-500/90 to-rose-600/90',
        subtitle: 'text-rose-100'
    },
    indigo: {
        bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
        shadow: 'shadow-indigo-500/20',
        innerBg: 'bg-transparent', // Often handled by parent or simple gradient
        subtitle: 'text-white/70'
    },
    amber: {
        bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
        shadow: 'shadow-amber-500/20',
        innerBg: 'bg-transparent',
        subtitle: 'text-white/70'
    },
    orange: {
        bg: 'bg-gradient-to-br from-orange-400 to-orange-500',
        shadow: 'shadow-orange-500/20',
        innerBg: 'bg-gradient-to-br from-orange-400/90 to-orange-500/90',
        subtitle: 'text-orange-100'
    }
};

export const getPremiumStyles = (themeName: string) => {
    switch (themeName) {
        case 'emerald': return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' };
        case 'rose': return { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-900', iconBg: 'bg-rose-100 dark:bg-rose-900/40' };
        case 'amber': return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900', iconBg: 'bg-amber-100 dark:bg-amber-900/40' };
        case 'orange': return { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900', iconBg: 'bg-orange-100 dark:bg-orange-900/40' };
        case 'indigo': return { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900', iconBg: 'bg-indigo-100 dark:bg-indigo-900/40' };
        case 'blue': return { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900', iconBg: 'bg-blue-100 dark:bg-blue-900/40' };
        default: return { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900', iconBg: 'bg-indigo-100 dark:bg-indigo-900/40' };
    }
};
