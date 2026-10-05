#!/bin/bash
cd "$(dirname "$0")"
echo "启动NeuroViz开发服务器..."
echo "访问地址: http://localhost:8086"
echo "按 Ctrl+C 停止服务器"
DEV=1 python3 server.py
