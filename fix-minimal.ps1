# Script MINIMALISTA - Apenas troca any por unknown
# Nao mexe em err.message - deixa TypeScript inferir

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Substituicao Minimalista: any -> unknown" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Users\Luiz\Desktop\DASHBOARD-GERAL"
Set-Location $projectPath

# Backup
Write-Host "[1/3] Backup..." -ForegroundColor Yellow
git add -A 2>$null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
git stash push -m "backup-minimal-$timestamp" 2>$null
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Processar todos os arquivos .ts e .tsx
Write-Host "[2/3] Aplicando substituicao..." -ForegroundColor Yellow

$allFiles = Get-ChildItem -Path "src" -Include *.ts, *.tsx -Recurse -File
$modifiedCount = 0

foreach ($file in $allFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # UNICA substituicao: catch (err: any) -> catch (err: unknown)
    # Variações de espaçamento
    $content = $content -replace '\}\s*catch\s*\(\s*err\s*:\s*any\s*\)\s*\{', '} catch (err: unknown) {'
    $content = $content -replace '\}\s*catch\s*\(\s*error\s*:\s*any\s*\)\s*\{', '} catch (error: unknown) {'
    $content = $content -replace '\}\s*catch\s*\(\s*e\s*:\s*any\s*\)\s*\{', '} catch (e: unknown) {'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $modifiedCount++
        $relativePath = $file.FullName.Replace("$projectPath\src\", "")
        Write-Host "  OK: $relativePath" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Arquivos modificados: $modifiedCount" -ForegroundColor Yellow
Write-Host ""

# Build final
Write-Host "[3/3] Validando build..." -ForegroundColor Yellow
Write-Host ""

$buildOutput = & npm run build 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FALHOU - Revertendo" -ForegroundColor Red
    Write-Host ""
    
    git restore src/ 2>$null
    git stash pop 2>$null
    
    Write-Host "Revertido com sucesso" -ForegroundColor Green
    Write-Host ""
    Write-Host "Erro:" -ForegroundColor Red
    $buildOutput | Select-Object -Last 50
    
    exit 1
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  SUCESSO!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Arquivos modificados: $modifiedCount" -ForegroundColor Yellow
Write-Host "Build: PASSING" -ForegroundColor Green
Write-Host ""

git stash drop 2>$null

Write-Host "Commit sugerido:" -ForegroundColor Cyan
Write-Host "  git add src/" -ForegroundColor Gray
Write-Host "  git commit -m 'refactor: replace any with unknown in catch blocks'" -ForegroundColor Gray
Write-Host ""
