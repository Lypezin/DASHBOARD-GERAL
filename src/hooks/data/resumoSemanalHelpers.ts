export function sortWeeksByYearAndWeek(weeks: string[]): string[] {
    return weeks.sort((a, b) => {
        const strA = String(a);
        const strB = String(b);

        const splitA = strA.split('-');
        const splitB = strB.split('-');

        if (splitA.length === 2 && splitB.length === 2) {
            const yearA = parseInt(splitA[0]);
            const weekA = parseInt(splitA[1]);
            const yearB = parseInt(splitB[0]);
            const weekB = parseInt(splitB[1]);

            if (!isNaN(yearA) && !isNaN(yearB) && !isNaN(weekA) && !isNaN(weekB)) {
                if (yearA !== yearB) return yearB - yearA;
                return weekB - weekA;
            }
        }

        const numA = parseInt(strA);
        const numB = parseInt(strB);

        if (!isNaN(numA) && !isNaN(numB)) {
            return numB - numA;
        }

        return strB.localeCompare(strA, undefined, { numeric: true });
    });
}

export function extractYearAndWeek(weekKey: string, defaultYear: number) {
    let weekNum = 0;
    let yearNum = defaultYear;
    const strKey = String(weekKey);

    if (strKey.includes('-')) {
        const parts = strKey.split('-');
        yearNum = parseInt(parts[0]);
        weekNum = parseInt(parts[1]);
    } else {
        weekNum = parseInt(strKey);
    }

    return { yearNum, weekNum, strKey };
}
