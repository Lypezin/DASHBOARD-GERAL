# Script ULTRA-CONSERVADOR - Processamento individual com validação
# Processa 1 arquivo por vez e valida TypeScript

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Correcao ULTRA-SEGURA de Error Handlers" -ForegroundColor Cyan
Write-Host "  (Processamento individual + validacao)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Users\Luiz\Desktop\DASHBOARD-GERAL"
Set-Location $projectPath

# ETAPA 1: Backup
Write-Host "[1/4] Criando backup..." -ForegroundColor Yellow
git add -A 2>$null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupName = "backup-ultra-safe-$timestamp"
git stash push -m $backupName 2>$null
Write-Host "Backup: $backupName" -ForegroundColor Green
Write-Host ""

# ETAPA 2: Lista de arquivos (ordenados por simplicidade)
Write-Host "[2/4] Preparando lista de arquivos..." -ForegroundColor Yellow

$files = @(
    # Comecando pelos mais simples (menos complexidade)
    "src\hooks\data\useCustoPorLiberado.ts",
    "src\hooks\data\useAtendentesData.ts",
    "src\hooks\dashboard\useDashboardEvolucao.ts",
    "src\hooks\auth\useAdminData.ts",
    "src\hooks\auth\useForgotPassword.ts",
    "src\hooks\auth\useResetPassword.ts",
    "src\hooks\registro\useRegistro.ts",
    "src\contexts\hooks\useOrganizationFetcher.ts",
    "src\components\views\marketing\useMarketingData.ts",
    "src\components\views\resultados\useResultadosData.ts",
    "src\components\views\prioridade\PrioridadeHeader.tsx",
    
    # Arquivos com multiplos catch blocks (mais cuidado)
    "src\hooks\perfil\usePerfilUpdate.ts",
    "src\hooks\data\useFileUpload.ts",
    "src\hooks\admin\useAdminStatus.ts",
    
    # Arquivos complexos (fazer por ultimo)
    "src\hooks\login\useLogin.ts",
    "src\hooks\useManualRefresh.ts",
    "src\hooks\valoresCidade\useValoresCidadeData.ts",
    "src\hooks\data\useResumoSemanalData.ts",
    "src\hooks\data\ useResumoDrivers.ts",
    "src\hooks\admin\useAdminApproval.ts",
    "src\hooks\admin\useAdminEdit.ts",
    "src\components\views\marketing\useEntradaSaidaData.ts",
    "src\components\views\marketing\useMarketingComparacao.ts",
    "src\components\views\marketing\useMarketingDriverDetails.ts",
    "src\components\views\prioridade\PrioridadeExcelExport.ts",
    "src\components\views\entregadores\useEntregadoresViewController.ts",
    "src\components\views\entregadores\useEntregadoresData.ts",
    "src\components\views\entregadores\EntregadoresFallbackFetcher.ts",
    "src\components\views\entregadores\EntregadoresDataFetcher.ts"
)

Write-Host "Total: $($files.Count) arquivos" -ForegroundColor Green
Write-Host ""

# ETAPA 3: Processar arquivo por arquivo
Write-Host "[3/4] Processando arquivos..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$skipCount = 0
$errorFile = $null

foreach ($filePath in $files) {
    $fullPath = Join-Path $projectPath $filePath
    $fileName = Split-Path $filePath -Leaf
    
    # Verificar se arquivo existe
    if (-not (Test-Path $fullPath)) {
        Write-Host "  SKIP: $fileName (nao encontrado)" -ForegroundColor DarkYellow
        $skipCount++
        continue
    }
    
    # Ler conteudo
    $content = Get-Content $fullPath -Raw -Encoding UTF8
    $originalContent = $content
    
    # SUBSTITUICAO ULTRA-CONSERVADORA
    # Apenas substituir "} catch (err: any) {" literalmente
    # SEM mexer em err.message ainda
    $content = $content -replace '} catch \(err: any\) \{', '} catch (err: unknown) {'
    
    # Se houve mudanca
    if ($content -ne $originalContent) {
        # Salvar mudanca
        Set-Content $fullPath -Value $content -Encoding UTF8 -NoNewline
        
        # Validar TypeScript neste arquivo especifico
        Write-Host "  Processando: $fileName" -ForegroundColor Cyan -NoNewline
        
        $tscOutput = & npx tsc --noEmit $fullPath 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host " - ERRO!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Erro TypeScript em: $fileName" -ForegroundColor Red
            Write-Host $tscOutput -ForegroundColor DarkRed
            
            # Reverter este arquivo
            Set-Content $fullPath -Value $originalContent -Encoding UTF8 -NoNewline
            
            $errorFile = $fileName
            break
        }
        
        Write-Host " - OK" -ForegroundColor Green
        $successCount++
    }
    else {
        Write-Host "  SKIP: $fileName (sem catch any)" -ForegroundColor DarkGray
        $skipCount++
    }
}

Write-Host ""

# ETAPA 4: Resultado final
if ($errorFile) {
    Write-Host "===============================================" -ForegroundColor Red
    Write-Host "  ERRO DETECTADO - Revertendo tudo" -ForegroundColor Red
    Write-Host "===============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Arquivo problematico: $errorFile" -ForegroundColor Yellow
    Write-Host ""
    
    # Reverter TUDO
    git restore src/ 2>$null
    git stash pop 2>$null
    
    Write-Host "Todas mudancas revertidas" -ForegroundColor Green
    Write-Host ""
    Write-Host "Arquivos processados antes do erro: $successCount" -ForegroundColor Yellow
    
    exit 1
}

Write-Host "[4/4] Build final..." -ForegroundColor Yellow
Write-Host ""

# Build completo para garantir
$buildOutput = & npm run build 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FINAL FALHOU - Revertendo" -ForegroundColor Red
    Write-Host ""
    
    git restore src/ 2>$null
    git stash pop 2>$null
    
    Write-Host "Mudancas revertidas" -ForegroundColor Green
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  SUCESSO TOTAL!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Arquivos modificados: $successCount" -ForegroundColor Yellow
Write-Host "Arquivos ignorados: $skipCount" -ForegroundColor Gray
Write-Host "Build: PASSING" -ForegroundColor Green
Write-Host ""

# Remover backup (mudancas sao seguras)
git stash drop 2>$null

Write-Host "Proximo: Commit as mudancas" -ForegroundColor Cyan
Write-Host "  git add src/" -ForegroundColor Gray
Write-Host "  git commit -m 'refactor: replace any with unknown in error handlers'" -ForegroundColor Gray
Write-Host ""
