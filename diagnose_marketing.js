const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually since require('dotenv').config() might not be available or find it
let url, key;
try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const env = fs.readFileSync(envPath, 'utf8');
        url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
        key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
    }
} catch (e) {
    console.error('Error reading .env.local:', e);
}

if (!url || !key) {
    console.error('Supabase URL or Key not found in .env.local');
    process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
    try {
        console.log('Fetching unique regiao_atuacao and their counts...');
        const { data: regions, error: rError } = await supabase.from('dados_marketing').select('regiao_atuacao');
        if (rError) throw rError;
        
        const counts = regions.reduce((acc, r) => {
            const name = r.regiao_atuacao || 'NULL';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});
        
        // Filter regions that look like São Paulo
        const spVariants = Object.keys(counts).filter(name => 
            name.toLowerCase().includes('paulo') || name.toLowerCase().includes('sp')
        );
        
        console.log('SP Variants found:', spVariants);
        spVariants.forEach(v => console.log(`${v}: ${counts[v]} records total`));

        // Check for "Enviados" in these variants for Feb 2026 (or current)
        const firstDay = '2026-02-01';
        const lastDay = '2026-02-28';
        const EXCLUDED_ENVIADOS = ['Confirmar', 'Cancelado', 'Abrindo MEI'];

        console.log(`\nChecking "Enviados" for Feb 2026 (Regra: Exclude ${EXCLUDED_ENVIADOS.join(', ')})`);
        
        for (const variant of spVariants) {
            const { count, error } = await supabase.from('dados_marketing')
                .select('*', { count: 'exact', head: true })
                .eq('regiao_atuacao', variant)
                .not('data_envio', 'is', null)
                .gte('data_envio', firstDay)
                .lte('data_envio', lastDay)
                .not('status', 'in', `(${EXCLUDED_ENVIADOS.map(s => `"${s}"`).join(',')})`);
            
            console.log(`Enviados in "${variant}": ${count}`);
        }

    } catch (e) {
        console.error(e);
    }
}
run();
