param(
  [Parameter(Mandatory = $true)][string]$Dist,
  [Parameter(Mandatory = $true)][string]$Out
)
# Build a Chrome Web Store-compatible zip with forward-slash entry names
# (Compress-Archive uses backslashes, which the store can reject).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem | Out-Null

if (Test-Path $Out) { Remove-Item $Out -Force }
$base = (Resolve-Path $Dist).Path.TrimEnd('\')
$zip = [System.IO.Compression.ZipFile]::Open($Out, 'Create')
try {
  Get-ChildItem -Path $base -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($base.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel) | Out-Null
  }
}
finally {
  $zip.Dispose()
}
Write-Host "Created $Out"
