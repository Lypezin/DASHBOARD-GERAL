
/**
 * Alinha dados de um dataset com os labels base
 */
export function alignDatasetData(
    data: (number | null)[],
    dataLabels: string[],
    baseLabels: string[]
): (number | null)[] {
    if (dataLabels.length === baseLabels.length &&
        dataLabels.every((label, i) => label === baseLabels[i])) {
        return data;
    }

    const labelMap = new Map<string, number | null>();
    dataLabels.forEach((label, idx) => {
        const value = data[idx];
        labelMap.set(label, value != null && !isNaN(value) && isFinite(value) ? Number(value) : null);
    });

    return baseLabels.map(label => {
        const value = labelMap.get(label);
        return value != null ? value : null;
    });
}

/**
 * Garante que o array de dados tem o mesmo tamanho dos labels
 */
export function padDatasetToMatchLabels(
    data: (number | null)[],
    targetLength: number
): (number | null)[] {
    if (data.length === targetLength) return data;

    if (data.length < targetLength) {
        return [...data, ...Array(targetLength - data.length).fill(null)];
    }

    return data.slice(0, targetLength);
}

/**
 * Normaliza valores do dataset (garante que são números válidos ou null)
 */
export function normalizeDatasetValues(data: (number | null)[]): (number | null)[] {
    return data.map((value: unknown) => {
        if (value == null || value === undefined) {
            return null;
        }
        const numValue = Number(value);
        if (isNaN(numValue) || !isFinite(numValue)) {
            return null;
        }
        return numValue;
    });
}
