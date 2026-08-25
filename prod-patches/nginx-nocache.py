from pathlib import Path
p = Path("/etc/nginx/conf.d/default.conf")
c = p.read_text()
block = '''  location = /_next/static/chunks/986-e26f954945182cc3.js {
    add_header Cache-Control "no-store, must-revalidate";
  }
  location = /_next/static/chunks/app/e/[slug]/agent/page-f4876645d55044b3.js {
    add_header Cache-Control "no-store, must-revalidate";
  }
'''
if "986-e26f954945182cc3.js" not in c:
    c = c.replace("  location /_next/ {", block + "  location /_next/ {", 1)
    p.write_text(c)
    print("inserted")
else:
    print("exists")
