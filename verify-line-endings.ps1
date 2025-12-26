# Verify line endings in all text files
Write-Host "Verifying line endings..." -ForegroundColor Green

$extensions = @('.vue', '.ts', '.js', '.json', '.html', '.css', '.md', '.txt', '.d.ts', '.config.ts', '.example')
$excludeDirs = @('node_modules', '.git', 'dist', 'build', '.next')

$lfCount = 0
$crlfCount = 0
$crCount = 0
$totalFiles = 0
$crlfFiles = @()
$crFiles = @()

Get-ChildItem -Path . -Recurse -File | Where-Object {
    $file = $_
    $shouldProcess = $true
    
    foreach ($excludeDir in $excludeDirs) {
        if ($file.FullName -match [regex]::Escape($excludeDir)) {
            $shouldProcess = $false
            break
        }
    }
    
    if ($shouldProcess) {
        $ext = $file.Extension
        $shouldProcess = $extensions -contains $ext -or $file.Name -match '\.(config|example)$'
    }
    
    return $shouldProcess
} | ForEach-Object {
    $filePath = $_.FullName
    $totalFiles++
    
    try {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $hasCRLF = $false
        $hasCR = $false
        $hasLF = $false
        
        for ($i = 0; $i -lt $bytes.Length - 1; $i++) {
            if ($bytes[$i] -eq 13 -and $bytes[$i+1] -eq 10) {
                $hasCRLF = $true
                break
            }
            if ($bytes[$i] -eq 13 -and ($i -eq $bytes.Length - 1 -or $bytes[$i+1] -ne 10)) {
                $hasCR = $true
            }
            if ($bytes[$i] -eq 10) {
                $hasLF = $true
            }
        }
        
        if ($hasCRLF) {
            $crlfCount++
            $crlfFiles += $filePath
        } elseif ($hasCR) {
            $crCount++
            $crFiles += $filePath
        } elseif ($hasLF) {
            $lfCount++
        }
    } catch {
        # Skip binary or unreadable files
    }
}

Write-Host ""
Write-Host "Line Ending Summary:" -ForegroundColor Cyan
Write-Host "  Total files checked: $totalFiles" -ForegroundColor White
Write-Host "  LF files: $lfCount" -ForegroundColor Green
Write-Host "  CRLF files: $crlfCount" -ForegroundColor $(if ($crlfCount -gt 0) { "Red" } else { "Green" })
Write-Host "  CR files: $crCount" -ForegroundColor $(if ($crCount -gt 0) { "Red" } else { "Green" })

if ($crlfFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "Files with CRLF:" -ForegroundColor Red
    $crlfFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

if ($crFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "Files with CR:" -ForegroundColor Red
    $crFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

if ($crlfCount -eq 0 -and $crCount -eq 0) {
    Write-Host ""
    Write-Host "All files use LF line endings!" -ForegroundColor Green
}






