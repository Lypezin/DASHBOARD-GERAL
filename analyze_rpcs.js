const fs = require('fs');
const text = fs.readFileSync('C:\\Users\\Luiz\\.gemini\\antigravity\\brain\\20237ce1-599d-4a3c-a9c5-af01b4f38470\\.system_generated\\steps\\17\\output.txt', 'utf-8');

const regex = /CREATE OR REPLACE FUNCTION.*?(?=\$function\$)\$function\$/gs;
const matches = text.match(regex);
console.log(`Encontradas ${matches ? matches.length : 0} funções no arquivo bruto.`);

if (matches) {
    for (const defRaw of matches) {
        const def = defRaw.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
        const upDef = def.toUpperCase();

        let name = "Desconhecido";
        const nameMatch = def.match(/FUNCTION public\.([^\(]+)/i);
        if (nameMatch) name = nameMatch[1];

        const smells = [];

        if (upDef.includes('SELECT *') && !upDef.includes('LIMIT')) {
            smells.push('SELECT * sem LIMIT');
        }
        if (upDef.includes(' NOT IN (SELECT')) {
            smells.push('Subquery com NOT IN (preferir NOT EXISTS)');
        }
        if (upDef.includes('LOOP') && upDef.match(/INSERT INTO/g)) {
            smells.push('Loops com INSERT (potencial risco de N+1, usar bulk/UNNEST)');
        }
        if (upDef.includes('COUNT(*)') && !upDef.includes('LIMIT') && !upDef.includes('WHERE') && !upDef.includes('GROUP BY')) {
            smells.push('COUNT(*) em tabela inteira sem WHERE (pode ser lento em tabelas grandes)');
        }

        if (smells.length > 0) {
            console.log(`[Aviso de Performance] ${name}: ${smells.join(' | ')}`);
        }
    }
}
