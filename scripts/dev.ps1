param(
  [string]$Distro = "Ubuntu",
  [string]$ProjectPath = "/home/hermes/projects/ai-novel-assistant",
  [string]$WslUser = "hermes"
)

$ErrorActionPreference = "Stop"

$wslCommand = @"
export PATH="/home/$WslUser/.n/bin:/home/$WslUser/.npm-global/bin:/usr/bin:/bin"
cd '$ProjectPath' && bash scripts/dev.sh
"@

Write-Host "启动 ai-novel-assistant 开发环境 (WSL/$Distro)..." -ForegroundColor Cyan
Write-Host "访问: http://127.0.0.1:5173/ai-novel-assistant/" -ForegroundColor Green
Write-Host "（若 5173 被占用，请以终端提示的端口为准）" -ForegroundColor DarkGray

wsl -d $Distro -- env "HOME=/home/$WslUser" bash --noprofile --norc -c $wslCommand
