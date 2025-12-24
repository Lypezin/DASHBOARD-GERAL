
/**
 * Ajusta opacidade de uma cor (suporta rgba, rgb e hex)
 */
export function adjustColorOpacity(color: string, newOpacity: number): string {
    if (color.startsWith('rgba(')) {
        return color.replace(/,\s*[\d.]+\)$/, `, ${newOpacity})`);
    }
    if (color.startsWith('rgb(')) {
        return color.replace('rgb(', 'rgba(').replace(')', `, ${newOpacity})`);
    }
    if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${newOpacity})`;
    }
    return color;
}
