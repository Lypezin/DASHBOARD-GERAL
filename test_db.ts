import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    try {
        const { data: dimensoes, error } = await supabase.rpc('dashboard_resumo', {
            p_ano: 2026,
            p_mes: null,
            p_semana: null,
            p_data_inicio: null,
            p_data_fim: null,
            p_praca: 'GUARULHOS',
            p_sub_praca: null,
            p_turno: null,
            p_origem: null,
            p_granulariade: 'semana'
        });

        console.log('dimensoes by dashboard_resumo:', JSON.stringify(dimensoes, null, 2));

        const { data: globalDims } = await supabase.rpc('dashboard_resumo', {
            p_ano: 2026,
            p_mes: null,
            p_semana: null,
            p_data_inicio: null,
            p_data_fim: null,
            p_praca: null,
            p_sub_praca: null,
            p_turno: null,
            p_origem: null,
            p_granulariade: 'semana'
        });

        console.log('global sub_pracas:', JSON.stringify(globalDims?.dimensoes?.sub_pracas));
        console.log('guarulhos sub_pracas:', JSON.stringify(dimensoes?.dimensoes?.sub_pracas));

        const rpcDirect = await supabase.rpc('get_subpracas_by_praca', { p_pracas: ['GUARULHOS'] });
        console.log('rpcDirect get_subpracas_by_praca GUARULHOS error:', rpcDirect.error);
        console.log('rpcDirect get_subpracas_by_praca GUARULHOS data:', JSON.stringify(rpcDirect.data));
    } catch (e) {
        console.error(e);
    }
}
run();
