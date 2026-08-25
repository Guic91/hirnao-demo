#!/usr/bin/env python3
from pathlib import Path
from urllib.request import urlretrieve

ROOT = Path("/usr/share/nginx/html")
VOICE_URL = "https://raw.githubusercontent.com/Guic91/hirnao-demo/main/prod-patches/hirnao-voice.js"
urlretrieve(VOICE_URL, ROOT / "hirnao-voice.js")
print("wrote voice js")

OLD_ES = 'async function es(){let e=await ea();v("call"),T(0),et.current=e.index,clearInterval(ee.current),ee.current=setInterval(()=>T(e=>e+1),1e3)}'
NEW_ES = 'async function es(){let e=await ea();v("call"),T(0),et.current=e.index,clearInterval(ee.current),ee.current=setInterval(()=>T(e=>e+1),1e3);try{window.__hirnaoVoice&&window.__hirnaoVoice.start(e.question)}catch(x){console.warn(x)}}'
OLD_ER = 'async function er(){var e;if(F||et.current>=C)return;let t=et.current;et.current=t+1,await ei(null!=(e=l.bA[n][t])?e:"…").catch(console.error)}'
NEW_ER = 'async function er(){if(F)return;Y(!0);try{window.__hirnaoVoice&&window.__hirnaoVoice.cut();let t=window.__hirnaoVoice?await window.__hirnaoVoice.next():"";if(!t.trim()){Y(!1);return}let e=await ei(t);if(e.next_question&&window.__hirnaoVoice)window.__hirnaoVoice.speak(e.next_question);if(e.complete)et.current=C}catch(x){console.error(x)}finally{Y(!1)}}'
OLD_EL = "async function el(){clearInterval(ee.current),Y(!0);try{"
NEW_EL = "async function el(){try{window.__hirnaoVoice&&window.__hirnaoVoice.cut()}catch(x){}clearInterval(ee.current),Y(!0);try{"
OLD_AUTO = 'if("call"===y&&!F&&b&&Math.floor((W+2)/5)>et.current&&et.current<C)'
NEW_AUTO = 'if("call"===y&&!F&&!1&&Math.floor((W+2)/5)>et.current&&et.current<C)'
OLD_BTN = '(0,i.jsx)("button",{onClick:er,className:"btn btn-secondary",style:{flex:1,height:52,padding:0,fontSize:14,fontWeight:400},disabled:F,children:(0,c.t)(n,"nextQuestion")}),(0,i.jsx)("button",{onClick:el,className:"btn btn-primary",style:{width:112,flexShrink:0,height:52,padding:0,fontSize:14},disabled:Q,children:Q?"…":(0,c.t)(n,"endCall")})'
NEW_BTN = '(0,i.jsx)("button",{onClick:er,className:"btn btn-primary",style:{flex:1,height:52,padding:0,fontSize:15,fontWeight:600},disabled:F||Q,children:Q?"…":(0,c.t)(n,"nextQuestion")}),(0,i.jsx)("button",{onClick:el,className:"btn btn-secondary",style:{width:112,flexShrink:0,height:52,padding:0,fontSize:14},disabled:Q,children:Q?"…":(0,c.t)(n,"endCall")})'

page = ROOT / "_next/static/chunks/app/e/[slug]/agent/page-f4876645d55044b3.js"
text = page.read_text(encoding="utf-8", errors="ignore")
n = 0
for old, new in [(OLD_ES, NEW_ES), (OLD_ER, NEW_ER), (OLD_EL, NEW_EL), (OLD_AUTO, NEW_AUTO), (OLD_BTN, NEW_BTN)]:
    if old in text:
        text = text.replace(old, new)
        n += 1
    else:
        print("skip", old[:60])
page.write_text(text, encoding="utf-8")
print("page replacements", n)

chunks = ROOT / "_next/static/chunks"
for p in chunks.glob("986-*.js"):
    t = p.read_text(encoding="utf-8", errors="ignore")
    t2 = t.replace('nextQuestion:"Question suivante"', 'nextQuestion:"Suivant"').replace(
        'nextQuestion:"Next question"', 'nextQuestion:"Next"'
    )
    if t2 != t:
        p.write_text(t2, encoding="utf-8")
        print("i18n", p.name)

tag = '<script src="/hirnao-voice.js"></script>'
for html in ROOT.glob("e/*/agent/index.html"):
    h = html.read_text(encoding="utf-8", errors="ignore")
    if tag not in h and "</body>" in h:
        html.write_text(h.replace("</body>", tag + "</body>", 1), encoding="utf-8")
        print("injected", html)

conf = Path("/etc/nginx/conf.d/default.conf")
c = conf.read_text()
if "hirnao-voice.js" not in c:
    snippet = '  location = /hirnao-voice.js { add_header Cache-Control "no-store, must-revalidate"; }\n'
    if "  location / {\n" in c:
        c = c.replace("  location / {\n", snippet + "  location / {\n", 1)
    else:
        c = c.replace("}\n", snippet + "}\n", 1)
    conf.write_text(c)
    print("nginx patched")
print("WEB voice patch applied")
