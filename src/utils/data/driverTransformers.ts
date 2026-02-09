export interface DriversData {
    ano: number;
    semana: number;
    total_drivers: number;
    total_slots: number;
}

export interface PedidosData {
    ano: number;
    semana: number;
    total_pedidos: number;
    total_sh: number;
    aderencia_media: number;
    utr: number;
    aderencia: number;
    rejeite: number;
}

export interface ResumoLocalData {
    ano: number;
    semana: number;
    drivers: number;
    slots: number;
    pedidos: number;
    sh: number;
    aderenciaMedia: number;
    utr: number;
    aderencia: number;
    rejeite: number;
}

export function mergeDriversAndPedidosData(
    driversData: DriversData[],
    pedidosData: PedidosData[]
): Map<string, ResumoLocalData> {
    const map = new Map<string, ResumoLocalData>();

    // First add drivers data
    driversData.forEach(d => {
        const key = `${d.ano}-${d.semana}`;
        map.set(key, {
            ano: d.ano,
            semana: d.semana,
            drivers: d.total_drivers,
            slots: d.total_slots,
            pedidos: 0,
            sh: 0,
            aderenciaMedia: 0,
            utr: 0,
            aderencia: 0,
            rejeite: 0
        });
    });

    // Then merge pedidos data
    pedidosData.forEach(p => {
        const key = `${p.ano}-${p.semana}`;
        const existing = map.get(key);
        if (existing) {
            existing.pedidos = p.total_pedidos;
            existing.sh = p.total_sh;
            existing.aderenciaMedia = p.aderencia_media || 0;
            existing.utr = p.utr || 0;
            existing.aderencia = p.aderencia || 0;
            existing.rejeite = p.rejeite || 0;
        } else {
            map.set(key, {
                ano: p.ano,
                semana: p.semana,
                drivers: 0,
                slots: 0,
                pedidos: p.total_pedidos,
                sh: p.total_sh,
                aderenciaMedia: p.aderencia_media || 0,
                utr: p.utr || 0,
                aderencia: p.aderencia || 0,
                rejeite: p.rejeite || 0
            });
        }
    });

    return map;
}
