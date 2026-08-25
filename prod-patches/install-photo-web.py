#!/usr/bin/env python3
from pathlib import Path
from urllib.request import urlretrieve
ROOT = Path("/usr/share/nginx/html")
TAG = '<script src="/hirnao-photo.js" defer></script>'
urlretrieve("https://raw.githubusercontent.com/Guic91/hirnao-demo/main/prod-patches/hirnao-photo.js", ROOT / "hirnao-photo.js")
print("wrote hirnao-photo.js")
n = 0
for html in list(ROOT.glob("e/*/profile/index.html")) + list(ROOT.glob("e/*/card/index.html")):
    h = html.read_text(encoding="utf-8", errors="ignore")
    if "hirnao-photo.js" in h: continue
    if "</body>" in h:
        html.write_text(h.replace("</body>", TAG + "</body>", 1), encoding="utf-8")
        n += 1
        print("injected", html)
print("html patched", n)
conf = Path("/etc/nginx/conf.d/default.conf")
c = conf.read_text()
if "location = /hirnao-photo.js" not in c:
    snippet = '  location = /hirnao-photo.js { add_header Cache-Control "no-store, must-revalidate"; }\n'
    if "location = /hirnao-nav.js" in c:
        c = c.replace("location = /hirnao-nav.js", snippet + "  location = /hirnao-nav.js", 1)
    else:
        c = c.replace("  location / {\n", snippet + "  location / {\n", 1)
    conf.write_text(c)
    print("nginx patched")
print("PHOTO web install done")
