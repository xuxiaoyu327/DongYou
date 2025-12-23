# Check line endings in files
$files = @(
    'project\src\App.vue',
    'project\src\main.ts',
    'project\package.json',
    'project\src\router\index.ts'
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $hasCRLF = $false
        $hasCR = $false
        $hasLF = $false
        
        for ($i = 0; $i -lt $bytes.Length - 1; $i++) {
            if ($bytes[$i] -eq 13 -and $bytes[$i+1] -eq 10) {
                $hasCRLF = $true
                break
            }
            if ($bytes[$i] -eq 13 -and $bytes[$i+1] -ne 10) {
                $hasCR = $true
            }
            if ($bytes[$i] -eq 10) {
                $hasLF = $true
            }
        }
        
        if ($hasCRLF) {
            Write-Host "$file : CRLF"
        } elseif ($hasCR) {
            Write-Host "$file : CR"
        } elseif ($hasLF) {
            Write-Host "$file : LF"
        } else {
            Write-Host "$file : No line breaks detected"
        }
    }
}



