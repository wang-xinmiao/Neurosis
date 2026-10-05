#!/usr/bin/env python3
"""NeuroViz 本地开发服务器"""
import http.server
import os

PORT = 8765

os.chdir(os.path.dirname(os.path.abspath(__file__)))

server = http.server.HTTPServer(
    ("", PORT),
    http.server.SimpleHTTPRequestHandler
)

print(f"NeuroViz 服务器已启动 → http://localhost:{PORT}/")
server.serve_forever()
