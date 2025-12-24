const fs = require('fs');
const path = require('path');

const MIN_LINES = 100;
const SRC_DIR = path.join(__dirname, 'src');
const OUTPUT_FILE = path.join(__dirname, 'large_files_100.txt');

// Extensions to analyze
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Directories to ignore
const IGNORE_DIRS = ['node_modules', '.next', 'dist', 'build', '.git'];

function shouldIgnore(filePath) {
    return IGNORE_DIRS.some(dir => filePath.includes(dir));
}

function countLines(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
}

function analyzeDirectory(dir) {
    const results = [];

    function traverse(currentPath) {
        if (shouldIgnore(currentPath)) return;

        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);

            if (entry.isDirectory()) {
                traverse(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name);
                if (EXTENSIONS.includes(ext)) {
                    const lines = countLines(fullPath);
                    if (lines > MIN_LINES) {
                        results.push({ path: fullPath, lines });
                    }
                }
            }
        }
    }

    traverse(dir);
    return results.sort((a, b) => b.lines - a.lines);
}

console.log(`Analyzing files with more than ${MIN_LINES} lines...`);
const largeFiles = analyzeDirectory(SRC_DIR);

// Generate report
let report = `Files with more than ${MIN_LINES} lines:\n`;
report += '-'.repeat(50) + '\n';

largeFiles.forEach(file => {
    report += `${file.lines} lines: ${file.path}\n`;
});

report += '-'.repeat(50) + '\n';
report += `Total: ${largeFiles.length} files\n`;

// Save to file
fs.writeFileSync(OUTPUT_FILE, report, 'utf-8');
console.log(`Found ${largeFiles.length} files. Report saved to ${OUTPUT_FILE}`);

// Also print count summary
const totalFiles = largeFiles.length;
console.log('\n=================================');
console.log(`Total files with more than ${MIN_LINES} lines: ${totalFiles}`);
console.log('=================================\n');
