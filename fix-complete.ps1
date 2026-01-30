# Script COMPLETO - Troca any + ajusta err.message
# Para garantir type safety completo

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Correcao Completa: any -> unknown + ajustes" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Users\Luiz\Desktop\DASHBOARD-GERAL"
Set-Location $projectPath

# Backup
Write-Host "[1/3] Backup..." -ForegroundColor Yellow
git add -A 2>$null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
git stash push -m "backup-complete-$timestamp" 2>$null
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Lista de arquivos específicos (sabemos que têm catch blocks)
Write-Host "[2/3] Processando arquivos..." -ForegroundColor Yellow

$targetFiles = @(
    "src\components\views\entregadores\EntregadoresFallbackFetcher.ts",
    "src\components\views\entregadores\EntregadoresDataFetcher.ts",
    "src\components\views\entregadores\useEntregadoresData.ts",
    "src\components\views\entregadores\useEntregadoresViewController.ts",
    "src\components\views\marketing\useEntradaSaidaData.ts",
    "src\components\views\marketing\useMarketingComparacao.ts",
    "src\components\views\marketing\useMarketingData.ts",
    "src\components\views\marketing\useMarketingDriverDetails.ts",
    "src\components\views\prioridade\PrioridadeExcelExport.ts",
    "src\components\views\prioridade\PrioridadeHeader.tsx",
    "src\components\views\resultados\useResultadosData.ts",
    "src\contexts\hooks\useOrganizationFetcher.ts",
    "src\hooks\admin\useAdminApproval.ts",
    "src\hooks\admin\useAdminEdit.ts",
    "src\hooks\admin\useAdminStatus.ts",
    "src\hooks\auth\useAdminData.ts",
    "src\hooks\auth\useForgotPassword.ts",
    "src\hooks\auth\useResetPassword.ts",
    "src\hooks\dashboard\use DashboardEvolucao.ts",
    "src\hooks\data\useAtendentesData.ts",
    "src\hooks\data\useComparacaoData.ts",
    "src\hooks\data\useCustoPorLiberado.ts",
    "src\hooks\data\useFileUpload.ts",
    "src\hooks\data\useResumoDrivers.ts",
    "src\hooks\data\useResumoSemanalData.ts",
    "src\hooks\login\useLogin.ts",
    "src\hooks\perfil\usePerfilUpdate.ts",
    "src\hooks\registro\useRegistro.ts",
    "src\hooks\useManualRefresh.ts",
    "src\hooks\valoresCidade\useValoresCidadeData.ts",
    "src\lib\rpc\requestHandler.ts"
)

$modifiedCount = 0

foreach ($filePath in $targetFiles) {
    $fullPath = Join-Path $projectPath $filePath
    
    if (-not (Test-Path $fullPath)) {
        continue
    }
    
    $content = Get-Content $fullPath -Raw -Encoding UTF8
    $originalContent = $content
    
    # Passo 1: Trocar catch (err: any) -> catch (err: unknown)
    $content = $content -replace '\}\s*catch\s*\(\s*err\s*:\s*any\s*\)\s*\{', '} catch (err: unknown) {'
    $content = $content -replace '\}\s*catch\s*\(\s*error\s*:\s*any\s*\)\s*\{', '} catch (error: unknown) {'
    $content = $content -replace '\}\s*catch\s*\(\s*e\s*:\s*any\s*\)\s*\{', '} catch (e: unknown) {'
    
    # Passo 2: Ajustar safeLog com err
    # Padrão: safeLog('error', `msg ${err.message}`)
    $content = $content -creplace '(`[^`]*)\$\{err\.message\}', '$1${err instanceof Error ? err.message : String(err)}'
    $content = $content -creplace '(`[^`]*)\$\{error\.message\}', '$1${error instanceof Error ? error.message : String(error)}'
    
    # Padrão: safeLog.error('msg', err)
    $content = $content -replace "safeLog\.(error|warn|info)\s*\(\s*'([^']+)',\s*err\s*\)", 'safeLog.$1(''$2'', err instanceof Error ? err : new Error(String(err)))'
    $content = $content -replace "safeLog\.(error|warn|info)\s*\(\s*'([^']+)',\s*error\s*\)", 'safeLog.$1(''$2'', error instanceof Error ? error : new Error(String(error)))'
    
    # Padrão: console.error(err)  
    $content = $content -replace 'console\.error\(err\)', 'console.error(err instanceof Error ? err.message : String(err))'
    $content = $content -replace 'console\.error\(error\)', 'console.error(error instanceof Error ? error.message : String(error))'
    
    if ($content -ne $originalContent) {
        Set-Content $fullPath -Value $content -Encoding UTF8 -NoNewline
        $modifiedCount++
        $fileName = Split-Path $filePath -Leaf
        Write-Host "  OK: $fileName" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Arquivos modificados: $modifiedCount" -ForegroundColor Yellow
Write-Host ""

# Build
Write-Host "[3/3] Validando build..." -ForegroundColor Yellow
Write-Host ""

$buildOutput = & npm run build 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FALHOU - Revertendo" -ForegroundColor Red
    Write-Host ""
    
    git restore src/ 2>$null
    git stash pop 2>$null
    
    Write-Host "Revertido" -ForegroundColor Green
    Write-Host ""
    
    # Mostra últimas linhas do erro
    $errorLines = $buildOutput | Select-Object -Last 30
    Write-Host "Erro:" -ForegroundColor Red
    $errorLines | ForEach-Object { Write-Host $_ }
    
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  SUCESSO!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Arquivos: $modifiedCount" -ForegroundColor Yellow
Write-Host "Build: PASSING" -ForegroundColor Green
Write-Host ""

git stash drop 2>$null

Write-Host "Commit:" -ForegroundColor Cyan
Write-Host "  git add src/" -ForegroundColor Gray
Write-Host "  git commit -m 'refactor: replace any with unknown in error handlers (34 files)'" -ForegroundColor Gray
Write-Host ""
