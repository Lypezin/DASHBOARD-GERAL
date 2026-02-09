const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..'); // Assuming script is in /scripts
const OUTPUT_FILE = path.join(ROOT_DIR, 'large_files_report.md');

const THRESHOLD = 200;
const IGNORE_DIRS = ['node_modules', '.next', '.git', '.gemini', 'dist', 'build', 'coverage', '.vscode', '.idea'];
const INCLUDE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.html', '.sql', '.py', '.json', '.md'];
const IGNORE_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'large_files_report.md'];

function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.split('\n').length;
    } catch (error) {
        console.error(`Error reading ${filePath}: ${error.message}`);
        return 0;
    }
}

function scanDirectory(dir, fileList = []) {
    if (!fs.existsSync(dir)) {
        return fileList;
    }

    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        try {
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                if (!IGNORE_DIRS.includes(file)) {
                    scanDirectory(filePath, fileList);
                }
            } else {
                const ext = path.extname(file);
                if (INCLUDE_EXTS.includes(ext) && !IGNORE_FILES.includes(file)) {
                    const lines = countLines(filePath);
                    if (lines > THRESHOLD) {
                        fileList.push({ path: filePath, lines });
                    }
                }
            }
        } catch (e) {
            // Ignore permission errors etc
        }
    });

    return fileList;
}

console.log('Scanning entire system for files with more than ' + THRESHOLD + ' lines...');
const largeFiles = scanDirectory(ROOT_DIR);

// Sort by lines descending
largeFiles.sort((a, b) => b.lines - a.lines);

// Generate Report
let reportContent = `# System-Wide File Analysis (> ${THRESHOLD} lines)\n\n`;
reportContent += `**Date**: ${new Date().toLocaleDateString()}\n`;
reportContent += `**Total files found**: ${largeFiles.length}\n\n`;
reportContent += `| Lines | File Path (Relative) |\n`;
reportContent += `|-------|----------------------|\n`;

largeFiles.forEach(file => {
    const relativePath = path.relative(ROOT_DIR, file.path).replace(/\\/g, '/');
    reportContent += `| ${file.lines} | \`${relativePath}\` |\n`;
});

fs.writeFileSync(OUTPUT_FILE, reportContent);
console.log(`Report generated at: ${OUTPUT_FILE}`);
console.log(`Found ${largeFiles.length} files.`);
