import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('mv_aderencia_agregada')
        .select('*')
        .limit(1);
    
    console.log("Error:", error);
    console.log("Data:", data);

    const { data: rpc1, error: rpc1Err } = await supabase.rpc('get_subpracas_by_praca', { p_pracas: ['SÃO PAULO'] });
    console.log("\nrpc get_subpracas_by_praca:", rpc1Err || rpc1);

}

check();
