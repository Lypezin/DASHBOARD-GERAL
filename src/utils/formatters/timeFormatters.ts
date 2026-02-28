/** Converte formato HH:MM:SS ou número para horas decimais */
export function converterHorasParaDecimal(valor: string | number): number {
    if (typeof valor === 'number') return valor;
    if (!valor || valor === '0' || valor === '00:00:00') return 0;

    // Se já for um número decimal (string)
    if (!valor.includes(':')) {
        const num = parseFloat(valor);
        return isNaN(num) ? 0 : num;
    }

    // Se for formato HH:MM:SS ou HH:MM
    const parts = valor.split(':');
    if (parts.length === 3) {
        const horas = parseInt(parts[0]) || 0;
        const minutos = parseInt(parts[1]) || 0;
        const segundos = parseInt(parts[2]) || 0;
        return horas + minutos / 60 + segundos / 3600;
    }

    if (parts.length === 2) {
        const horas = parseInt(parts[0]) || 0;
        const minutos = parseInt(parts[1]) || 0;
        return horas + minutos / 60;
    }

    return 0;
}

export function formatarHorasParaHMS(horasDecimais: string | number): string {
    if (typeof horasDecimais === 'string' && horasDecimais.includes(':')) return horasDecimais;

    const horas = typeof horasDecimais === 'string' ? parseFloat(horasDecimais) : horasDecimais;

    if (isNaN(horas) || horas === 0) return '00:00:00';

    const horasInteiras = Math.floor(horas);
    const minutosDecimais = (horas - horasInteiras) * 60;
    const minutosInteiros = Math.floor(minutosDecimais);
    const segundos = Math.round((minutosDecimais - minutosInteiros) * 60);

    return `${String(horasInteiras).padStart(2, '0')}:${String(minutosInteiros).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

// Formata horas grandes para exibição compacta (ex: 890.5k)
export function formatarHorasCompacta(horasDecimais: string | number): string {
    // Se já for string HH:MM:SS, converter primeiro
    let horas: number;
    if (typeof horasDecimais === 'string' && horasDecimais.includes(':')) {
        const parts = horasDecimais.split(':');
        if (parts.length === 3) {
            const h = parseInt(parts[0]) || 0;
            const m = parseInt(parts[1]) || 0;
            const s = parseInt(parts[2]) || 0;
            horas = h + m / 60 + s / 3600;
        } else {
            horas = parseFloat(horasDecimais) || 0;
        }
    } else {
        horas = typeof horasDecimais === 'string' ? parseFloat(horasDecimais) : horasDecimais;
    }

    if (isNaN(horas) || horas === 0) return '0';

    // Se for muito grande, usar notação compacta
    if (horas >= 1000) {
        const milhares = horas / 1000;
        return `${milhares.toFixed(1)}k`;
    }

    return horas.toFixed(1);
}

/** Formata strings de tempo longas para exibição compacta (ex: "20199:55:12" -> "20.199h") */
export const formatCompactTime = (timeString: string): string => {
    if (!timeString || typeof timeString !== 'string') return '0h';

    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isNaN(hours)) return timeString;

    // Se as horas são muito grandes (> 9999), use notação compacta com separador de milhar
    if (hours > 9999) {
        const hoursFormatted = new Intl.NumberFormat('pt-BR').format(hours);
        return `${hoursFormatted}h`;
    }

    // Se as horas são grandes (> 999), mostre apenas horas
    if (hours > 999) {
        return `${hours}h`;
    }

    // Valores normais: horas e minutos se relevante
    if (minutes > 0 && hours < 100) {
        return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }

    return `${hours}h`;
};
