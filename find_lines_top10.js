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
const largeFiles = [];
files.forEach(f => {
    const lines = fs.readFileSync(f, 'utf-8').split('\n').length;
    largeFiles.push({ f, lines });
});
largeFiles.sort((a, b) => b.lines - a.lines);
console.log(largeFiles.slice(0, 10).map(x => `${x.f}: ${x.lines} linhas`).join('\n'));
