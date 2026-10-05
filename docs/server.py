#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = int(os.environ.get('PORT', 8080))

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 静态资源长期缓存
        if self.path.startswith('/models/') or self.path.startswith('/js/') or self.path.startswith('/css/'):
            self.send_header('Cache-Control', 'public, max-age=3600')
        super().end_headers()

os.chdir('/workspace' if os.path.exists('/workspace') else '.')

with ThreadingHTTPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Serving at http://0.0.0.0:{PORT}")
    httpd.serve_forever()
