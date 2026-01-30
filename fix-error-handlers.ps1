# Script para substituir catch (err: any) por catch (err: unknown)
# E adicionar tratamento adequado

$files = Get-ChildItem -Path "C:\Users\Luiz\Desktop\DASHBOARD-GERAL\src" -Include *.ts,*.tsx -Recurse -File

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Padrão 1: catch (err: any) { ... err.message ... }
    $pattern1 = '} catch \(err: any\) \{'
    $replacement1 = '} catch (err: unknown) {'
    
    if ($content -match $pattern1) {
        $content = $content -replace $pattern1, $replacement1
        
        # Substituir err.message por tratamento seguro
        # Padrão: err.message ou 'Algo'
        $content = $content -replace '(err\.message \|\| [''"]([^''"]+)[''"])', 'err instanceof Error ? err.message : ''$2'''
        
        # Padrão: err.message direto (sem fallback)
        $content = $content -replace '([^?])err\.message([^:])', '$1(err instanceof Error ? err.message : String(err))$2'
    }
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $totalFiles++
        $replacements = ([regex]::Matches($originalContent, $pattern1)).Count
        $totalReplacements += $replacements
        Write-Host "✓ $($file.Name) - $replacements substituições" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total de arquivos modificados: $totalFiles" -ForegroundColor Yellow
Write-Host "Total de substituições: $totalReplacements" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
