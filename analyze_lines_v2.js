const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');
const ignoreDirs = ['node_modules', '.git', '.next', 'out', 'dist', 'build', '.cursor'];
const extensions = ['.ts', '.tsx', '.js', '.jsx']; // Focused on code files

function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.split('\n').length;
    } catch (e) {
        return 0;
    }
}

function scanDirectory(directory, fileList = []) {
    if (!fs.existsSync(directory)) return fileList;
    
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!ignoreDirs.includes(file)) {
                scanDirectory(fullPath, fileList);
            }
        } else {
            const ext = path.extname(file);
            if (extensions.includes(ext)) {
                const lines = countLines(fullPath);
                if (lines > 150) {
                    fileList.push({ path: fullPath, lines });
                }
            }
        }
    }

    return fileList;
}

try {
    console.log('Scanning src directory for files > 150 lines...');
    const largeFiles = scanDirectory(srcDir);
    
    // Sort by line count descending
    largeFiles.sort((a, b) => b.lines - a.lines);

    console.log('\nFiles > 150 lines:');
    console.log('-------------------');
    largeFiles.forEach(f => {
        const relPath = path.relative(rootDir, f.path);
        console.log(`${f.lines} lines: ${relPath}`);
    });

    console.log(`\nTotal files found: ${largeFiles.length}`);
    
    // Write detailed report
    const outputContent = largeFiles.map(f => `${f.lines} | ${path.relative(rootDir, f.path)}`).join('\n');
    fs.writeFileSync('analysis_results_150.txt', outputContent);
    console.log('Results saved to analysis_results_150.txt');

} catch (error) {
    console.error('Error scanning:', error);
}
