import { DashboardResumoData } from '@/types';
import { SubPracaMetric } from '../components/ComparacaoSubPracaRow';
import { formatarHorasParaHMS } from '@/utils/formatters';

export function processSubPracaData(dadosComparacao: DashboardResumoData[]) {
    const todasSubPracas = new Set<string>();
    dadosComparacao.forEach((d) => {
        if (d.aderencia_sub_praca && Array.isArray(d.aderencia_sub_praca)) {
            d.aderencia_sub_praca.forEach((asp) => {
                todasSubPracas.add(asp.sub_praca);
            });
        }
    });
    const subPracasOrdenadas = Array.from(todasSubPracas).sort();

    const dadosPorSubPraca: Record<string, Record<number, SubPracaMetric>> = {};
    subPracasOrdenadas.forEach((sp) => {
        dadosPorSubPraca[sp] = {};
        dadosComparacao.forEach((dado, idx) => {
            const spData = dado.aderencia_sub_praca?.find((x) => x.sub_praca === sp);

            let entregueStr = spData?.horas_entregues || '-';
            let metaStr = spData?.horas_a_entregar || '-';

            if ((!spData?.horas_entregues || spData?.horas_entregues === '00:00:00') && spData?.segundos_realizados !== undefined) {
                entregueStr = formatarHorasParaHMS(spData.segundos_realizados / 3600);
            }

            if ((!spData?.horas_a_entregar || spData?.horas_a_entregar === '00:00:00') && spData?.segundos_planejados !== undefined) {
                metaStr = formatarHorasParaHMS(spData.segundos_planejados / 3600);
            }

            dadosPorSubPraca[sp][idx] = {
                aderencia: spData ? spData.aderencia_percentual : 0,
                entregue: entregueStr,
                meta: metaStr
            };
        });
    });

    return { subPracasOrdenadas, dadosPorSubPraca };
}
