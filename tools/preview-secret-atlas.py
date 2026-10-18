#!/usr/bin/env python3
"""Local editorial preview only. Not a deployment server. Uses isolated localhost browser storage."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
class Preview(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0] in ('/', '/index.html'):
            html = (ROOT / 'index.html').read_text()
            html = html.replace("const badProtocol = location.protocol === 'http:';", 'const badProtocol = false;')
            html = html.replace('<head>', '<head><script>window.__SANSA_ATLAS_REVIEW__=true;window.addEventListener("DOMContentLoaded",()=>{if(typeof startLocalMode==="function")startLocalMode();});</script>', 1)
            data = html.encode()
            self.send_response(200)
            self.send_header('Content-Type','text/html; charset=utf-8')
            self.send_header('Cache-Control','no-store')
            self.send_header('Content-Length',str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            super().do_GET()
if __name__ == '__main__':
    print('Editorial preview: http://127.0.0.1:4173 — historical sources are NOT verified', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 4173), Preview).serve_forever()
