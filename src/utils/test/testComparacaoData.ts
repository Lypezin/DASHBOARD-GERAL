/**
 * Teste para diagnosticar o problema de dados zerados na comparação
 * 
 * Para usar:
 * 1. Abra o console do navegador
 * 2. Execute: testComparacaoData(35, 2025)
 * 3. Verifique os logs
 */

import { supabase } from '@/lib/supabaseClient';

export async function testComparacaoData(semana: number, ano: number) {
    console.log(`%c[TEST] 🧪 Testando dados para SEMANA ${semana} ANO ${ano}`, 'color: #9333ea; font-weight: bold; font-size: 14px');

    try {
        // Teste 1: Verificar dados brutos na base_corridas
        const { data: corridasData, error: corridasError } = await supabase
            .rpc('dashboard_resumo', {
                p_ano: ano,
                p_semana: semana,
                p_cidade: null,
                p_praca: null,
                p_sub_praca: null,
                p_origem: null,
                p_turno: null,
                p_semanas: null,
                p_sub_pracas: null,
                p_origens: null,
                p_turnos: null,
                p_data_inicial: null,
                p_data_final: null
            });

        if (corridasError) {
            console.error('%c[TEST] ❌ Erro ao buscar dados:', 'color: #ef4444; font-weight: bold', corridasError);
            return;
        }

        console.log('%c[TEST] ✅ Dados recebidos com sucesso!', 'color: #10b981; font-weight: bold');

        console.table({
            'Total de Dados Retornados': corridasData ? 1 : 0,
            'Tem Totais?': !!corridasData?.totais,
            'Corridas Ofertadas': corridasData?.totais?.corridas_ofertadas || 0,
            'Corridas Aceitas': corridasData?.totais?.corridas_aceitas || 0,
            'Dados por Dia?': !!corridasData?.dia,
            'Quantidade de Dias': corridasData?.dia?.length || 0
        });

        if (corridasData?.dia && corridasData.dia.length > 0) {
            console.log('%c[TEST] 📅 Dados por Dia:', 'color: #3b82f6; font-weight: bold');
            console.table(corridasData.dia.map((d: any) => ({
                dia_da_semana: d.dia_da_semana,
                dia_iso: d.dia_iso,
                ofertadas: d.corridas_ofertadas,
                aceitas: d.corridas_aceitas
            })));
        } else {
            console.warn('%c[TEST] ⚠️ NENHUM DADO POR DIA RETORNADO!', 'color: #f59e0b; font-weight: bold');
        }

        console.log('%c[TEST] 📦 Objeto completo:', 'color: #64748b');
        console.log(corridasData);

        return corridasData;
    } catch (err) {
        console.error('%c[TEST] 💥 Exceção capturada:', 'color: #dc2626; font-weight: bold', err);
    }
}

// Tornar função globalmente acessível
if (typeof window !== 'undefined') {
    (window as any).testComparacaoData = testComparacaoData;
    console.log('%c[TEST] 🚀 Teste pronto! Execute: testComparacaoData(35, 2025)', 'color: #8b5cf6; font-weight: bold; font-size: 12px');
}
