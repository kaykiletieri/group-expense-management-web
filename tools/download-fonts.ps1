param()
$ErrorActionPreference = 'Stop'

$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
$headers = @{ "User-Agent" = $ua }

# Baixa o CSS das fontes de texto e dos símbolos e substitui as URLs do CDN por caminhos locais.
$cssTextUrl = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
$iconsUrl = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0&display=block"

function Fetch-Css([string]$url) {
  $response = Invoke-WebRequest -Uri $url -Headers $headers -UseBasicParsing
  return $response.Content
}

$fontsCss = Fetch-Css $cssTextUrl
$iconsCss = Fetch-Css $iconsUrl

# Extrai todos os URLs de fonts.gstatic.com dos dois CSS.
$allCss = $fontsCss + "`n" + $iconsCss
$matchesFound = [regex]::Matches($allCss, 'https://fonts\.gstatic\.com/[^)\s]+')
$urlSet = @{}
foreach ($m in $matchesFound) { $urlSet[$m.Value] = $true }

$destination = Join-Path (Get-Location) "public\fonts"
New-Item -ItemType Directory -Path $destination -Force | Out-Null

$urlMap = @{}
$digestAlgorithm = [System.Security.Cryptography.MD5]::Create()
foreach ($url in $urlSet.Keys) {
  $hash = $digestAlgorithm.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($url))
  $name = ($hash | ForEach-Object { $_.ToString('x2') }) -join ''
  $fileName = "font-$($name.Substring(0, 10)).woff2"
  $urlMap[$url] = $fileName
  $filePath = Join-Path $destination $fileName
  Invoke-WebRequest -Uri $url -Headers $headers -OutFile $filePath -UseBasicParsing
  Write-Host "Baixado $fileName de $(($url -split '/')[-1])"
}

# Reescreve os CSS para usar caminhos locais.
function Rewrite-Css([string]$css, $map) {
  $out = $css
  foreach ($key in $map.Keys) {
    $out = $out.Replace($key, "/fonts/$($map[$key])")
  }
  return $out
}

$rewrittenText = Rewrite-Css $fontsCss $urlMap
$rewrittenIcons = Rewrite-Css $iconsCss $urlMap

# O CSS das fontes entra no bundle global (src/styles/fonts.css); os .woff2 ficam em public/fonts.
$cssOut = Join-Path (Get-Location) "src\styles\fonts.css"
Set-Content -Path $cssOut -Value ($rewrittenText + "`n" + $rewrittenIcons) -Encoding utf8
Write-Host "CSS gerado em src\styles\fonts.css com $($urlSet.Count) fontes (woff2 em public\fonts)."
