
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
