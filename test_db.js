const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    try {
        const { data: dimensoes, error } = await supabase.rpc('dashboard_resumo', {
            p_ano: 2024,
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

        console.log('dashboard_resumo Guarulhos ->', dimensoes);
    } catch (e) {
        console.error(e);
    }
}
run();
