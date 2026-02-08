Get-ChildItem -Path "src" -Recurse -Include *.tsx, *.ts | 
Select-Object @{Name = "Path"; Expression = { $_.FullName.Substring($pwd.Path.Length + 1) } }, Length | 
Sort-Object Length -Descending | 
Select-Object -First 20 | 
ForEach-Object { "$($_.Path),$($_.Length)" } | 
Out-File -FilePath "large_files_v2.txt" -Encoding UTF8
