export const processMonthlyData = (data: any[]) => {
    const monthlyData = new Map<string, {
        date: Date;
        entradas: number;
        saidas: number;
        saldo: number;
        label: string;
    }>();

    data.forEach(item => {
        const [yearStr, weekStr] = item.semana.split('-');
        const year = parseInt(yearStr);
        const week = parseInt(weekStr.replace('W', ''));

        // Get approximate date (Thursday of the week to pin it to correct month)
        // ISO Week 1 is entered on Jan 4th approx or has Jan 4th.
        // Simple logic: Jan 1 + (week-1)*7 + 3 days.
        const simpleDate = new Date(year, 0, 1 + (week - 1) * 7 + 3);

        // Key: YYYY-MM for sorting
        const key = `${simpleDate.getFullYear()}-${String(simpleDate.getMonth() + 1).padStart(2, '0')}`;

        // Label: MMM/YY
        const label = simpleDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

        const current = monthlyData.get(key) || {
            date: simpleDate, // Store first date found for sorting
            entradas: 0,
            saidas: 0,
            saldo: 0,
            label: label.charAt(0).toUpperCase() + label.slice(1) // Capitalize
        };

        current.entradas += Number(item.entradas_total || 0);
        current.saidas += Number(item.saidas_total || 0);
        current.saldo += Number(item.saldo || 0);

        monthlyData.set(key, current);
    });

    // Convert Map to Array and Sort
    const sortedData = Array.from(monthlyData.entries())
        .map(([key, value]) => ({ key, ...value }))
        .sort((a, b) => a.key.localeCompare(b.key));

    return sortedData;
};
