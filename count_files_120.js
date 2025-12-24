const fs = require('fs');
const path = require('path');

const MIN_LINES = 120;
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
    let filesOver120 = 0;
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
                        filesOver120++;
                    }
                }
            }
        }
    }

    traverse(dir);
    return { filesOver120, totalFiles };
}

console.log(`Contando arquivos com mais de ${MIN_LINES} linhas...`);
const { filesOver120, totalFiles } = analyzeDirectory(SRC_DIR);

console.log('\n=================================');
console.log(`Total de arquivos analisados: ${totalFiles}`);
console.log(`Arquivos com mais de ${MIN_LINES} linhas: ${filesOver120}`);
console.log(`Arquivos com ${MIN_LINES} linhas ou menos: ${totalFiles - filesOver120}`);
console.log(`Percentual acima de ${MIN_LINES} linhas: ${((filesOver120 / totalFiles) * 100).toFixed(2)}%`);
console.log('=================================\n');
