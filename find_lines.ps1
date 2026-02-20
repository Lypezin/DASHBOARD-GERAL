Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts | 
Where-Object { -not $_.PSIsContainer } |
ForEach-Object { 
  $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
  [PSCustomObject]@{
    File = $_.FullName.Replace((Get-Location).Path + "\", "")
    Lines = $lines
  }
} | 
Where-Object { $_.Lines -gt 500 } |
Sort-Object Lines -Descending |
Out-File -FilePath "large_files_lines.txt" -Encoding UTF8
