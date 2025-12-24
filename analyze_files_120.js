
const fs = require('fs');
const path = require('path');

const projectRoot = 'c:/Users/Luiz/Desktop/DASHBOARD-GERAL';
const srcDir = path.join(projectRoot, 'src');
const outputFile = path.join(projectRoot, 'large_files_report_120.txt');

function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.split('\n').length;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return 0;
    }
}

function traverseDirectory(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            traverseDirectory(filePath, fileList);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const lines = countLines(filePath);
            if (lines > 120) {
                fileList.push({ path: filePath, lines });
            }
        }
    });

    return fileList;
}

console.log('Analyzing files with more than 120 lines...');
const largeFiles = traverseDirectory(srcDir);

// Sort by line count descending
largeFiles.sort((a, b) => b.lines - a.lines);

const reportContent = `Files with more than 120 lines:
---------------------------------
${largeFiles.map(f => `${f.lines} lines: ${f.path}`).join('\n')}
---------------------------------
Total: ${largeFiles.length} files
`;

fs.writeFileSync(outputFile, reportContent);
console.log(`Found ${largeFiles.length} files. Report saved to ${outputFile}`);
