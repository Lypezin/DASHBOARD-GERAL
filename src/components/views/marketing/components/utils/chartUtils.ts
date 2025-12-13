
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

export const createChartData = (sortedData: any[]) => {
    return {
        labels: sortedData.map(d => d.label),
        datasets: [
            {
                type: 'line' as const,
                label: 'Saldo',
                data: sortedData.map(d => d.saldo),
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: 'rgb(99, 102, 241)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7,
                tension: 0.4,
                fill: true,
                order: 0,
                yAxisID: 'y',
            },
            {
                type: 'bar' as const,
                label: 'Entradas',
                data: sortedData.map(d => d.entradas),
                backgroundColor: 'rgba(16, 185, 129, 0.85)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 0,
                borderRadius: 6,
                borderSkipped: false,
                order: 1,
                yAxisID: 'y',
            },
            {
                type: 'bar' as const,
                label: 'Saídas',
                data: sortedData.map(d => -d.saidas),
                backgroundColor: 'rgba(244, 63, 94, 0.85)',
                borderColor: 'rgb(244, 63, 94)',
                borderWidth: 0,
                borderRadius: 6,
                borderSkipped: false,
                order: 1,
                yAxisID: 'y',
            },
        ],
    };
};

export const getChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index' as const,
        intersect: false,
    },
    plugins: {
        legend: {
            position: 'top' as const,
            align: 'end' as const,
            labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                boxWidth: 8,
                padding: 20,
                font: {
                    size: 12,
                    weight: 500,
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleFont: { size: 13, weight: 600 },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
                label: function (context: any) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        if (context.dataset.label === 'Saídas') {
                            label += Math.abs(context.parsed.y);
                        } else {
                            label += context.parsed.y;
                        }
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        y: {
            grid: {
                color: 'rgba(148, 163, 184, 0.1)',
                drawBorder: false,
            },
            border: {
                display: false,
            },
            ticks: {
                font: { size: 11 },
                color: 'rgb(148, 163, 184)',
                padding: 8,
                callback: function (value: any) {
                    return Math.abs(value);
                }
            }
        },
        x: {
            grid: {
                display: false,
                drawBorder: false,
            },
            border: {
                display: false,
            },
            ticks: {
                font: { size: 11 },
                color: 'rgb(148, 163, 184)',
                padding: 8,
            }
        }
    }
});
