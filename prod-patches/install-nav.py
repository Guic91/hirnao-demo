#!/usr/bin/env python3
from pathlib import Path
from urllib.request import urlretrieve

ROOT = Path("/usr/share/nginx/html")
TAG = '<script src="/hirnao-nav.js" defer></script>'

urlretrieve(
    "https://raw.githubusercontent.com/Guic91/hirnao-demo/main/prod-patches/hirnao-nav.js",
    ROOT / "hirnao-nav.js",
)
print("wrote hirnao-nav.js")

n = 0
for html in ROOT.rglob("index.html"):
    h = html.read_text(encoding="utf-8", errors="ignore")
    if "hirnao-nav.js" in h:
        continue
    if "</body>" in h:
        html.write_text(h.replace("</body>", TAG + "</body>", 1), encoding="utf-8")
        n += 1
        print("injected", html.relative_to(ROOT))
print("html patched", n)

conf = Path("/etc/nginx/conf.d/default.conf")
c = conf.read_text()
if "location = /hirnao-nav.js" not in c:
    snippet = '  location = /hirnao-nav.js { add_header Cache-Control "no-store, must-revalidate"; }\n'
    if "location = /hirnao-voice.js" in c:
        c = c.replace(
            "location = /hirnao-voice.js",
            snippet + "  location = /hirnao-voice.js",
            1,
        )
    elif "  location / {\n" in c:
        c = c.replace("  location / {\n", snippet + "  location / {\n", 1)
    else:
        c = c.replace("}\n", snippet + "}\n", 1)
    conf.write_text(c)
    print("nginx patched")
else:
    print("nginx already has hirnao-nav")
print("NAV install done")
