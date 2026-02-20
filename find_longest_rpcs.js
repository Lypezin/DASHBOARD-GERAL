const fs = require('fs');
const text = fs.readFileSync('C:\\Users\\Luiz\\.gemini\\antigravity\\brain\\20237ce1-599d-4a3c-a9c5-af01b4f38470\\.system_generated\\steps\\17\\output.txt', 'utf-8');
const regex = /CREATE OR REPLACE FUNCTION.*?(?=\$function\$)\$function\$/gs;
const matches = text.match(regex);
if (matches) {
    const list = matches.map(def => {
        const nameMatch = def.match(/FUNCTION public\.([^\(]+)/i);
        return {
            name: nameMatch ? nameMatch[1] : 'Desconhecido',
            lines: def.split(/\\n|\\r|\\n/g).length
        };
    }).sort((a, b) => b.lines - a.lines).slice(0, 5);
    console.log("Top 5 Maiores RPCs:");
    console.log(list.map(f => `${f.name}: ${f.lines} linhas`).join('\n'));

    // Dump a definition of the largest function for manual review
    if (list.length > 0) {
        const topDef = matches.find(d => d.includes(`FUNCTION public.${list[0].name}`));
        fs.writeFileSync('C:\\Users\\Luiz\\Desktop\\DASHBOARD-GERAL\\top1_rpc.txt', topDef.replace(/\\n/g, '\n').replace(/\\r/g, '\r'));
        console.log(`Função ${list[0].name} exportada para top1_rpc.txt`);
    }
}
