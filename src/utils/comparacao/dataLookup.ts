import { AderenciaDia } from '@/types';

function normalizeString(str: string): string {
    if (!str) return '';
    return String(str)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * Encontra os dados de aderência para um dia específico da semana
 */
export function findDayData(
    diaRef: string,
    aderenciaDia: AderenciaDia[] | undefined
): AderenciaDia | undefined {
    if (!aderenciaDia || aderenciaDia.length === 0) return undefined;

    const diaRefNorm = normalizeString(diaRef);

    return aderenciaDia.find(d => {
        // Tentativa 1: Match por dia_da_semana (string) ou dia_semana (backend)
        const diaApi = d.dia_da_semana || d.dia_semana;
        if (diaApi) {
            const diaApiNorm = normalizeString(diaApi);
            if (diaApiNorm === diaRefNorm) return true;
            if (diaApiNorm.includes(diaRefNorm) || diaRefNorm.includes(diaApiNorm)) return true;

            const mapDias: Record<string, string> = {
                'monday': 'segunda', 'segunda': 'segunda', 'seg': 'segunda',
                'tuesday': 'terca', 'terca': 'terca', 'ter': 'terca',
                'wednesday': 'quarta', 'quarta': 'quarta', 'qua': 'quarta',
                'thursday': 'quinta', 'quinta': 'quinta', 'qui': 'quinta',
                'friday': 'sexta', 'sexta': 'sexta', 'sex': 'sexta',
                'saturday': 'sabado', 'sabado': 'sabado', 'sab': 'sabado',
                'sunday': 'domingo', 'domingo': 'domingo', 'dom': 'domingo'
            };

            const keyApi = mapDias[diaApiNorm] || diaApiNorm;
            const keyRef = mapDias[diaRefNorm] || diaRefNorm;

            if (keyApi === keyRef) return true;
        }

        // Tentativa 2: Match por dia_iso
        if (d.dia_iso) {
            const mapIso: Record<number, string> = {
                1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sabado', 7: 'domingo'
            };
            const keyIso = mapIso[d.dia_iso];
            const mapDiasRef: Record<string, string> = {
                'segunda': 'segunda', 'terça': 'terca', 'terca': 'terca',
                'quarta': 'quarta', 'quinta': 'quinta', 'sexta': 'sexta',
                'sábado': 'sabado', 'sabado': 'sabado', 'domingo': 'domingo'
            };
            const keyRefNorm = mapDiasRef[diaRefNorm] || diaRefNorm;
            if (keyIso && keyIso === keyRefNorm) return true;
        }

        // Tentativa 3: Se tiver campo 'data'
        if (d.data) {
            try {
                const date = new Date(d.data + 'T00:00:00');
                const dayOfWeek = date.getDay();
                const mapDayNumber: Record<number, string> = {
                    0: 'domingo', 1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sabado'
                };
                const diaFromDate = mapDayNumber[dayOfWeek];
                const mapDiasRef: Record<string, string> = {
                    'segunda': 'segunda', 'terça': 'terca', 'terca': 'terca',
                    'quarta': 'quarta', 'quinta': 'quinta', 'sexta': 'sexta',
                    'sábado': 'sabado', 'sabado': 'sabado', 'domingo': 'domingo'
                };
                const keyRefNorm = mapDiasRef[diaRefNorm] || diaRefNorm;

                if (diaFromDate && diaFromDate === keyRefNorm) return true;
            } catch (e) { /* ignore */ }
        }

        const propDia = (d as any).dia || (d as any).day_name;
        if (propDia) {
            const diaApiNorm = normalizeString(String(propDia));
            const mapDias: Record<string, string> = {
                'monday': 'segunda', 'segunda': 'segunda',
                'tuesday': 'terca', 'terca': 'terca', 'terça': 'terca',
                'wednesday': 'quarta', 'quarta': 'quarta',
                'thursday': 'quinta', 'quinta': 'quinta',
                'friday': 'sexta', 'sexta': 'sexta',
                'saturday': 'sabado', 'sabado': 'sabado', 'sábado': 'sabado',
                'sunday': 'domingo', 'domingo': 'domingo'
            };
            const keyApi = mapDias[diaApiNorm] || diaApiNorm;
            const mapDiasRef: Record<string, string> = {
                'segunda': 'segunda', 'terça': 'terca', 'terca': 'terca',
                'quarta': 'quarta', 'quinta': 'quinta', 'sexta': 'sexta',
                'sábado': 'sabado', 'sabado': 'sabado', 'domingo': 'domingo'
            };
            const keyRef = mapDiasRef[diaRefNorm] || diaRefNorm;
            if (keyApi === keyRef) return true;
        }

        return false;
    });
}
