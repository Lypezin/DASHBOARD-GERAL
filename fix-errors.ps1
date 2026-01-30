# Script SEGURO para corrigir tipos any em error handlers
# Inclui backup, validação e rollback

Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "  Correcao Segura de Error Handlers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Users\Luiz\Desktop\DASHBOARD-GERAL"
Set-Location $projectPath

# ETAPA 1: Criar backup com git
Write-Host "[1/5] Criando backup..." -ForegroundColor Yellow
git add -A
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupName = "backup-error-handlers-$timestamp"
git stash push -m $backupName
Write-Host "Backup criado: $backupName" -ForegroundColor Green
Write-Host ""

# ETAPA 2: Arquivos a processar
Write-Host "[2/5] Identificando arquivos..." -ForegroundColor Yellow

$files = @(
    "src\hooks\useManualRefresh.ts",
    "src\hooks\valoresCidade\useValoresCidadeData.ts",
    "src\hooks\data\useCustoPorLiberado.ts",
    "src\hooks\data\useFileUpload.ts",
    "src\hooks\data\useResumoSemanalData.ts",
    "src\hooks\data\useResumoDrivers.ts",
    "src\hooks\data\useAtendentesData.ts",
    "src\hooks\dashboard\useDashboardEvolucao.ts",
    "src\hooks\auth\useAdminData.ts",
    "src\hooks\auth\useForgotPassword.ts",
    "src\hooks\auth\useResetPassword.ts",
    "src\hooks\perfil\usePerfilUpdate.ts",
    "src\hooks\registro\useRegistro.ts",
    "src\hooks\login\useLogin.ts",
    "src\hooks\admin\useAdminApproval.ts",
    "src\hooks\admin\useAdminEdit.ts",
    "src\hooks\admin\useAdminStatus.ts",
    "src\contexts\hooks\useOrganizationFetcher.ts",
    "src\components\views\marketing\useEntradaSaidaData.ts",
    "src\components\views\marketing\useMarketingComparacao.ts",
    "src\components\views\marketing\useMarketingData.ts",
    "src\components\views\marketing\useMarketingDriverDetails.ts",
    "src\components\views\resultados\useResultadosData.ts",
    "src\components\views\prioridade\PrioridadeHeader.tsx",
    "src\components\views\prioridade\PrioridadeExcelExport.ts",
    "src\components\views\entregadores\useEntregadoresViewController.ts",
    "src\components\views\entregadores\useEntregadoresData.ts",
    "src\components\views\entregadores\EntregadoresFallbackFetcher.ts",
    "src\components\views\entregadores\EntregadoresDataFetcher.ts"
)

Write-Host "Arquivos identificados: $($files.Count)" -ForegroundColor Green
Write-Host ""

# ETAPA 3: Aplicar substituições
Write-Host "[3/5] Aplicando correcoes..." -ForegroundColor Yellow

$modifiedCount = 0

foreach ($filePath in $files) {
    $fullPath = Join-Path $projectPath $filePath
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "  Arquivo nao encontrado: $filePath" -ForegroundColor DarkYellow
        continue
    }
    
    $content = Get-Content $fullPath -Raw -Encoding UTF8
    $originalContent = $content
   
    # Substituicao 1: catch (err: any) -> catch (err: unknown)
    $content = $content -replace '\} catch \(err: any\) \{', '} catch (err: unknown) {'
    $content = $content -replace '\}\s*catch\s*\(\s*err:\s*any\s*\)\s*\{', '} catch (err: unknown) {'
    
    # Substituicao  2: safeLog com err.message
    $content = $content -replace "safeLog\((.*?),\s*err\.message,", 'safeLog($1, err instanceof Error ? err.message : String(err),'
    $content = $content -replace "safeLog\.(error|warn|info)\((.*?),\s*err\.message,", 'safeLog.$1($2, err instanceof Error ? err.message : String(err),'
    
    # Substituicao 3: console.error(err.message)
    $content = $content -replace 'console\.error\(err\.message\)', 'console.error(err instanceof Error ? err.message : err)'
    
    if ($content -ne $originalContent) {
        Set-Content $fullPath -Value $content -Encoding UTF8 -NoNewline
        $modifiedCount++
        $shortPath = $filePath.Replace('src\', '')
        Write-Host "  OK: $shortPath" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Arquivos modificados: $modifiedCount" -ForegroundColor Green
Write-Host ""

# ETAPA 4: Validar com build
Write-Host "[4/5] Validando com build..." -ForegroundColor Yellow
Write-Host ""

$buildOutput = & npm run build 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FALHOU! Revertendo mudancas..." -ForegroundColor Red
    Write-Host ""
    
    # Desfazer mudanças
    git restore src/
    
    # Restaurar backup
    git stash pop
    
    Write-Host "Mudancas revertidas com sucesso" -ForegroundColor Green
    Write-Host ""
    Write-Host "Erro no build:" -ForegroundColor Red
    Write-Host $buildOutput
    
    exit 1
}

Write-Host ""
Write-Host "Build passou com sucesso!" -ForegroundColor Green
Write-Host ""

# ETAPA 5: Finalizar
Write-Host "[5/5] Finalizando..." -ForegroundColor Yellow
git stash drop 2>$null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Arquivos modificados: $modifiedCount" -ForegroundColor Yellow
Write-Host "Build: PASSING" -ForegroundColor Green
Write-Host ""
Write-Host "Proximo passo: Commit" -ForegroundColor Cyan
Write-Host "  git add -A" -ForegroundColor Gray
Write-Host "  git commit -m refactor_error_handlers" -ForegroundColor Gray
Write-Host ""
