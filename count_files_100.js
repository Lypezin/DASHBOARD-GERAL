const fs = require('fs');
const path = require('path');

const MIN_LINES = 100;
const SRC_DIR = path.join(__dirname, 'src');

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
    let filesOver100 = 0;
    let totalFiles = 0;

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
                    totalFiles++;
                    const lines = countLines(fullPath);
                    if (lines > MIN_LINES) {
                        filesOver100++;
                    }
                }
            }
        }
    }

    traverse(dir);
    return { filesOver100, totalFiles };
}

console.log(`Contando arquivos com mais de ${MIN_LINES} linhas...`);
const { filesOver100, totalFiles } = analyzeDirectory(SRC_DIR);

console.log('\n=================================');
console.log(`Total de arquivos analisados: ${totalFiles}`);
console.log(`Arquivos com mais de ${MIN_LINES} linhas: ${filesOver100}`);
console.log(`Arquivos com ${MIN_LINES} linhas ou menos: ${totalFiles - filesOver100}`);
console.log(`Percentual acima de ${MIN_LINES} linhas: ${((filesOver100 / totalFiles) * 100).toFixed(2)}%`);
console.log('=================================\n');
