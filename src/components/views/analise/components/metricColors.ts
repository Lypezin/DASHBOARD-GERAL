export const metricColors = {
    orange: { iconBg: 'bg-orange-500/10 dark:bg-orange-500/10', iconText: 'text-orange-500 dark:text-orange-400', barFrom: 'from-orange-500', barTo: 'to-orange-400', glowBorder: 'group-hover:shadow-orange-500/20', rateText: 'text-orange-500 dark:text-orange-400', borderAccent: 'border-orange-500/20' },
    blue: { iconBg: 'bg-blue-500/10 dark:bg-blue-500/10', iconText: 'text-blue-500 dark:text-blue-400', barFrom: 'from-blue-500', barTo: 'to-blue-400', glowBorder: 'group-hover:shadow-blue-500/20', rateText: 'text-blue-500 dark:text-blue-400', borderAccent: 'border-blue-500/20' },
    emerald: { iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/10', iconText: 'text-emerald-600 dark:text-emerald-400', barFrom: 'from-emerald-500', barTo: 'to-emerald-400', glowBorder: 'group-hover:shadow-emerald-500/20', rateText: 'text-emerald-600 dark:text-emerald-400', borderAccent: 'border-emerald-500/20' },
    rose: { iconBg: 'bg-rose-500/10 dark:bg-rose-500/10', iconText: 'text-rose-500 dark:text-rose-400', barFrom: 'from-rose-500', barTo: 'to-rose-400', glowBorder: 'group-hover:shadow-rose-500/20', rateText: 'text-rose-500 dark:text-rose-400', borderAccent: 'border-rose-500/20' },
    sky: { iconBg: 'bg-sky-500/10 dark:bg-sky-500/10', iconText: 'text-sky-500 dark:text-sky-300', barFrom: 'from-sky-500', barTo: 'to-sky-400', glowBorder: 'group-hover:shadow-sky-500/20', rateText: 'text-sky-500 dark:text-sky-300', borderAccent: 'border-sky-500/20' },
};
export type MetricAccentColor = keyof typeof metricColors;
