const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) results.push(file);
        }
    });
    return results;
}
const files = walk('src');
const mediumFiles = [];
files.forEach(f => {
    const lines = fs.readFileSync(f, 'utf-8').split('\n').length;
    if (lines > 150) {
        mediumFiles.push({ f, lines });
    }
});
mediumFiles.sort((a, b) => b.lines - a.lines);
const output = mediumFiles.map(x => `${x.f.replace('src\\\\', 'src/').replace(/\\\\/g, '/')}: ${x.lines} linhas`).join('\n');
console.log(`Encontrados ${mediumFiles.length} arquivos com mais de 150 linhas:\n`);
console.log(output);
fs.writeFileSync('files_to_refactor.txt', output);
