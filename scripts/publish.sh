#!/usr/bin/env bash
# 在 WSL 中执行：推送 master、同步 main、发布 gh-pages
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> 检查 GitHub 连通性..."
if ! git ls-remote --heads origin >/dev/null 2>&1; then
  echo "错误: 无法访问 GitHub（常见原因：Windows hosts 中 GitHub520 证书不匹配）"
  echo "请先在 Windows 管理员 PowerShell 执行："
  echo '  powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.cursor\skills\refresh-cdn-windows\scripts\refresh-cdn.ps1"'
  echo "或暂时注释 hosts 里 github.com / api.github.com 的 GitHub520 行，然后 ipconfig /flushdns"
  exit 1
fi

echo "==> 当前分支与状态"
git status -sb
git log -1 --oneline

echo "==> fetch + push master"
git fetch origin
git push origin master

echo "==> 同步 main（与 master 一致）"
git push origin master:main

echo "==> 构建并发布 gh-pages"
npm run deploy:gh-pages

echo "==> 远端分支"
git ls-remote --heads origin

echo "完成。"
