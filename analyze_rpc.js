const fs = require('fs');

try {
    const rpcTextRaw = fs.readFileSync('C:/Users/Luiz/.gemini/antigravity/brain/bd24e38e-9ae8-449e-b79d-aacad3180db4/.system_generated/steps/183/output.txt', 'utf8');
    // First, decode the outer JSON string
    const rpcText = JSON.parse(rpcTextRaw);
    const rpcMatch = rpcText.match(/<untrusted-data-[^>]+>\n(.*)\n<\/untrusted-data/s);
    const rpcs = JSON.parse(rpcMatch[1]);

    const idxTextRaw = fs.readFileSync('C:/Users/Luiz/.gemini/antigravity/brain/bd24e38e-9ae8-449e-b79d-aacad3180db4/.system_generated/steps/184/output.txt', 'utf8');
    const idxText = JSON.parse(idxTextRaw);
    const idxMatch = idxText.match(/<untrusted-data-[^>]+>\n(.*)\n<\/untrusted-data/s);
    const idxs = JSON.parse(idxMatch[1]);

    let md = '# Supabase Audit Analysis\n\n## RPCs\n';
    md += `Total RPCs evaluated: ${rpcs.length}\n\n`;

    // Check for issues in RPCs
    rpcs.forEach(r => {
        let issues = [];
        if (!r.definition) return;

        const def = r.definition;

        if (def.includes('EXECUTE ')) issues.push('Uses Dynamic SQL (`EXECUTE`). Dynamic SQL bypasses query plan caching and can be slower or present SQL injection risks if not well parsed.');
        if (def.match(/SELECT\s+\*\s+FROM/si)) issues.push('Uses `SELECT *`. Selecting all columns is bad for performance due to heavy I/O and memory usage, especially on larger tables.');
        if (r.volatility === 'v' && def.match(/SELECT\s/is) && !def.match(/(UPDATE|INSERT|DELETE|TRUNCATE|EXECUTE|REFRESH MATERIALIZED) /is)) {
            issues.push('Function is `VOLATILE` but only appears to perform `SELECT`s. Setting it to `STABLE` can significantly improve performance as Postgres can reuse its result within a single query structure.');
        }
        if (r.language === 'plpgsql' && !def.match(/SET search_path/i)) {
            if (r.security_definer) issues.push('`SECURITY DEFINER` function without `SET search_path`. Security Risk.');
        }

        // Analyze loop constructs
        if (def.match(/LOOP.*SELECT.*END LOOP/is) || def.match(/LOOP.*UPDATE.*END LOOP/is)) {
            issues.push('Contains operations in a `LOOP` (N+1 query problem). Batch operations are usually much faster.');
        }

        // Check for unoptimized grouping or frequent aggregations
        if (def.match(/GROUP BY GROUPING SETS/i)) {
            issues.push('Uses complex grouping sets. Might cause performance issues if datasets are very large or missing explicit indexes.');
        }

        if (issues.length > 0) {
            md += `### ${r.function_name}\n`;
            md += `- Volatility: ${r.volatility === 'i' ? 'IMMUTABLE' : r.volatility === 's' ? 'STABLE' : 'VOLATILE'}\n`;
            md += `- Language: ${r.language}\n`;
            md += `- Security Definer: ${r.security_definer}\n`;
            md += `- **Issues Found**:\n  - ${issues.join('\n  - ')}\n\n`;
        }
    });

    md += '---\n## Indexes by Table\n\n';
    const tableIdx = {};
    idxs.forEach(i => {
        if (!tableIdx[i.tablename]) tableIdx[i.tablename] = [];
        tableIdx[i.tablename].push(i.indexdef);
    });
    for (const [table, indices] of Object.entries(tableIdx)) {
        md += `### Table: \`${table}\`\n`;
        indices.forEach(idx => md += `- \`${idx}\`\n`);
        md += '\n';
    }

    fs.writeFileSync('C:/Users/Luiz/.gemini/antigravity/brain/bd24e38e-9ae8-449e-b79d-aacad3180db4/analysis_temp.md', md);
    console.log("Analysis generated successfully in analysis_temp.md.");
} catch (e) {
    fs.writeFileSync('err.txt', e.stack);
}
