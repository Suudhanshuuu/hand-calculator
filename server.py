#!/usr/bin/env python3
"""
Simple HTTP server for the Hand Number Counter app
Works both in development and when bundled with PyInstaller
Auto-kills any existing process on port 8000 before starting
"""

import http.server
import socketserver
import webbrowser
import sys
import subprocess
import os
from pathlib import Path

PORT = 8000

# Get the correct directory whether running as script or bundled exe
if getattr(sys, 'frozen', False):
    # Running as PyInstaller bundle
    DIRECTORY = Path(sys._MEIPASS)
else:
    # Running as normal Python script
    DIRECTORY = Path(__file__).parent

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

def kill_port(port):
    """Kill any process listening on the given port (Windows)"""
    try:
        result = subprocess.run(
            ['netstat', '-ano'],
            capture_output=True, text=True, check=True
        )
        for line in result.stdout.splitlines():
            if f':{port} ' in line and 'LISTENING' in line:
                parts = line.split()
                pid = parts[-1]
                if pid.isdigit():
                    subprocess.run(['taskkill', '/F', '/PID', pid],
                                 capture_output=True, check=False)
                    print(f"🔄 Killed existing process on port {port} (PID: {pid})")
    except Exception:
        pass  # Ignore errors

def main():
    # Kill any existing server on this port
    kill_port(PORT)

    print("🚀 Starting Hand Number Counter server...")
    print(f"📁 Serving from: {DIRECTORY}")
    print(f"🌐 Open your browser to: http://localhost:{PORT}")
    print("✋ Press Ctrl+C to stop the server")

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        # Allow address reuse
        httpd.allow_reuse_address = True
        # Open browser automatically
        webbrowser.open(f"http://localhost:{PORT}")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")

if __name__ == "__main__":
    main()