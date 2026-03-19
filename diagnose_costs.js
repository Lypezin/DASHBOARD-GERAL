const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
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
    // Try .env if .env.local fails
    try {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const env = fs.readFileSync(envPath, 'utf8');
            url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
            key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
        }
    } catch (e) {}
}

if (!url || !key) {
    console.error('Supabase URL or Key not found');
    process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
    try {
        const sISO = '2026-02-02';
        const eISO = '2026-02-08';
        console.log(`Checking costs from ${sISO} to ${eISO}...`);

        const { data, error } = await supabase
            .from('dados_valores_cidade')
            .select('*')
            .gte('data', sISO)
            .lte('data', eISO);

        if (error) throw error;

        console.log(`Total records found: ${data.length}`);
        
        let total = 0;
        const byCity = {};
        const byAtendente = {};
        const byOrg = {};

        data.forEach(row => {
            const v = Number(row.valor) || 0;
            total += v;
            
            const city = row.cidade || 'NULL';
            byCity[city] = (byCity[city] || 0) + v;
            
            const at = row.id_atendente || 'NULL';
            byAtendente[at] = (byAtendente[at] || 0) + v;
            
            const org = row.organization_id || 'NULL';
            byOrg[org] = (byOrg[org] || 0) + v;
        });

        console.log('\n--- TOTAL ---');
        console.log(`Sum: ${total.toFixed(2)}`);

        console.log('\n--- BY CITY ---');
        Object.entries(byCity).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
            console.log(`${k}: ${v.toFixed(2)}`);
        });

        console.log('\n--- BY ATENDENTE ---');
        Object.entries(byAtendente).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
            console.log(`${k}: ${v.toFixed(2)}`);
        });

        console.log('\n--- BY ORGANIZATION ---');
        Object.entries(byOrg).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
            console.log(`${k}: ${v.toFixed(2)}`);
        });

    } catch (e) {
        console.error(e);
    }
}
run();
