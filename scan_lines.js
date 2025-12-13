const fs = require('fs');
const path = require('path');

function walkDir(dir, files = []) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            walkDir(filePath, files);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                files.push(filePath);
            }
        }
    });
    return files;
}

const srcDir = path.join(__dirname, 'src');
const files = walkDir(srcDir);
const largeFiles = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').length;
    if (lines >= 150) {
        largeFiles.push({ path: file, lines: lines });
    }
});

// Sort by lines descending
largeFiles.sort((a, b) => b.lines - a.lines);

// Format output
let output = '--- SCAN RESULTS START ---\n';
largeFiles.forEach(f => {
    const relPath = path.relative(__dirname, f.path);
    output += `${relPath}: ${f.lines}\n`;
});
output += '--- SCAN RESULTS END ---\n';

// Write to file directly
fs.writeFileSync(path.join(__dirname, 'scan_results.txt'), output, 'utf-8');
console.log('Results written to scan_results.txt');
