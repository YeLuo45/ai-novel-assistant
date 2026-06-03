param(
  [string]$Distro = "Ubuntu",
  [string]$ProjectPath = "/home/hermes/projects/ai-novel-assistant",
  [string]$WslUser = "hermes"
)

$ErrorActionPreference = "Stop"

Write-Host "检查 GitHub API..." -ForegroundColor Cyan
try {
  $r = curl.exe -sI --connect-timeout 12 https://api.github.com 2>&1 | Select-Object -First 1
  Write-Host $r
} catch {
  Write-Host "curl 检查失败，继续尝试 WSL 推送..." -ForegroundColor Yellow
}

$wslCmd = @"
export PATH="/home/$WslUser/.n/bin:/home/$WslUser/.npm-global/bin:/usr/bin:/bin"
cd '$ProjectPath' && bash scripts/publish.sh
"@

Write-Host "在 WSL 中推送 master / main 并发布 gh-pages..." -ForegroundColor Cyan
wsl -d $Distro -- env "HOME=/home/$WslUser" bash --noprofile --norc -c $wslCmd
