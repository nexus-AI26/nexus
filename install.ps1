Write-Host "✦ Installing nexus CLI..." -ForegroundColor Cyan

if (!(Get-Command "git" -ErrorAction SilentlyContinue)) {
    Write-Error "git is not installed. Please install Git first."
    exit 1
}

if (!(Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Error "npm/Node.js is not installed. Please install Node.js first."
    exit 1
}

$DestDir = Join-Path $HOME ".nexus-src"

Write-Host "[1/4] Cloning repository..."
if (Test-Path $DestDir) {
    Remove-Item -Recurse -Force $DestDir
}
git clone https://github.com/nexus-AI26/nexus.git $DestDir

Write-Host "[2/4] Installing dependencies..."
Set-Location $DestDir
npm install

Write-Host "[3/4] Building TypeScript..."
npm run build

Write-Host "[4/4] Linking globally..."
npm link

Write-Host "`n✦ nexus installed successfully!" -ForegroundColor Green
Write-Host "Type 'nexus' in your terminal to get started."
