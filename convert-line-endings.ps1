# PowerShell script to convert CRLF to LF
# Convert all text files from CRLF to LF line endings

Write-Host "Starting conversion (CRLF -> LF)..." -ForegroundColor Green

$extensions = @('.vue', '.ts', '.js', '.json', '.html', '.css', '.md', '.txt', '.d.ts', '.config.ts', '.example')
$excludeDirs = @('node_modules', '.git', 'dist', 'build', '.next')

$convertedCount = 0
$totalFiles = 0
$checkedFiles = @()

Get-ChildItem -Path . -Recurse -File | Where-Object {
    $file = $_
    $shouldProcess = $true
    
    # Check if in excluded directory
    foreach ($excludeDir in $excludeDirs) {
        if ($file.FullName -match [regex]::Escape($excludeDir)) {
            $shouldProcess = $false
            break
        }
    }
    
    # Check file extension
    if ($shouldProcess) {
        $ext = $file.Extension
        $shouldProcess = $extensions -contains $ext -or $file.Name -match '\.(config|example)$'
    }
    
    return $shouldProcess
} | ForEach-Object {
    $filePath = $_.FullName
    $totalFiles++
    
    try {
        # Read file as bytes to detect CRLF accurately
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $hasCRLF = $false
        
        # Check for CRLF (0x0D 0x0A)
        for ($i = 0; $i -lt $bytes.Length - 1; $i++) {
            if ($bytes[$i] -eq 13 -and $bytes[$i+1] -eq 10) {
                $hasCRLF = $true
                break
            }
        }
        
        if ($hasCRLF) {
            # Read as text and convert
            $content = Get-Content $filePath -Raw -Encoding UTF8
            $newContent = $content -replace "`r`n", "`n"
            # Also handle standalone CR
            $newContent = $newContent -replace "`r", "`n"
            
            # Write back with LF only
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($filePath, $newContent, $utf8NoBom)
            Write-Host "[OK] Converted: $filePath" -ForegroundColor Yellow
            $convertedCount++
            $checkedFiles += $filePath
        }
    } catch {
        Write-Host "[ERROR] $filePath - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Conversion completed!" -ForegroundColor Green
Write-Host "Total files checked: $totalFiles" -ForegroundColor Cyan
Write-Host "Files converted: $convertedCount" -ForegroundColor Cyan

if ($convertedCount -gt 0) {
    Write-Host ""
    Write-Host "Converted files:" -ForegroundColor Yellow
    $checkedFiles | ForEach-Object { Write-Host "  - $_" }
}
