
const fs = require('fs');
const path = require('path');

function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.split('\n').length;
    } catch (e) {
        return 0;
    }
}

function traverseDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                traverseDir(filePath, fileList);
            }
        } else {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
                const lines = countLines(filePath);
                if (lines > 150) {
                    fileList.push({ path: filePath, lines: lines });
                }
            }
        }
    });

    return fileList;
}

const srcDir = path.join(__dirname, 'src');
const largeFiles = traverseDir(srcDir);

largeFiles.sort((a, b) => b.lines - a.lines);

console.log('Files with more than 150 lines:');
console.log('---------------------------------');
let reportContent = 'Files with more than 150 lines:\n---------------------------------\n';
largeFiles.forEach(file => {
    const line = `${file.lines} lines: ${file.path}`;
    console.log(line);
    reportContent += line + '\n';
});
console.log('---------------------------------');
console.log(`Total: ${largeFiles.length} files`);
reportContent += '---------------------------------\n';
reportContent += `Total: ${largeFiles.length} files`;
fs.writeFileSync('large_files_report.txt', reportContent);
