
export function getAderenciaColor(value: number): string {
    if (value >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (value >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
}

export function getAderenciaBgColor(value: number): string {
    if (value >= 90) return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
    if (value >= 70) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    return 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800';
}

// Retorna a cor hexadecimal para uso em style={{ backgroundColor: ... }}
// Verde para bom (>= 90), Vermelho para ruim (< 70), Azul para médio (70-90)
export function getAderenciaColorHex(value: number, isDark: boolean = false): string {
    if (value >= 90) return isDark ? '#10b981' : '#059669'; // emerald-400 : emerald-600 (VERDE - BOM)
    if (value >= 70) return isDark ? '#3b82f6' : '#2563eb'; // blue-500 : blue-600 (AZUL - MÉDIO)
    return isDark ? '#ef4444' : '#dc2626'; // red-500 : red-600 (VERMELHO - RUIM)
}
