
const numberFormatter = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

export const formatSignedInteger = (value: number): string => {
    if (!Number.isFinite(value) || value === 0) {
        return '0';
    }
    const sign = value > 0 ? '+' : '−';
    return `${sign}${numberFormatter.format(Math.abs(Math.round(value)))}`;
};

export const formatSignedPercent = (value: number): string => {
    if (!Number.isFinite(value) || value === 0) {
        return '±0,0%';
    }
    const sign = value > 0 ? '+' : '−';
    return `${sign}${percentFormatter.format(Math.abs(value))}%`;
};

const numberFormatterCache = new Map<number, Intl.NumberFormat>([[0, numberFormatter]]);
const percentFormatterCache = new Map<number, Intl.NumberFormat>([[1, percentFormatter]]);

export const formatNumber = (value: number | undefined | null, fractionDigits: number = 0): string => {
    if (value === undefined || value === null || !Number.isFinite(value)) return '0';
    let formatter = numberFormatterCache.get(fractionDigits);
    if (!formatter) {
        formatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: fractionDigits });
        numberFormatterCache.set(fractionDigits, formatter);
    }
    return formatter.format(value);
};

export const formatPercent = (value: number | undefined | null, fractionDigits: number = 1): string => {
    if (value === undefined || value === null || !Number.isFinite(value)) return '0,0%';
    let formatter = percentFormatterCache.get(fractionDigits);
    if (!formatter) {
        formatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits });
        percentFormatterCache.set(fractionDigits, formatter);
    }
    return formatter.format(value) + '%';
};
