#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -d node_modules ]]; then
  echo "未找到 node_modules，正在安装依赖..."
  npm install
fi

echo "启动 ai-novel-assistant 开发服务器..."
echo "访问: http://127.0.0.1:5173/ai-novel-assistant/"
echo "（若端口被占用，请以终端提示为准）"

exec npm run dev -- --host 127.0.0.1
