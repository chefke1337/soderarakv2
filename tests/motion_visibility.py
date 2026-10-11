"""Mozgás BEKAPCSOLVA (nincs reduced-motion): minden belépő elem a végén látható-e."""
import sys
from playwright.sync_api import sync_playwright
B=sys.argv[1]
with sync_playwright() as p:
    b=p.chromium.launch(); bad=[]
    for w in (1440,390):
        pg=b.new_page(viewport={"width":w,"height":900}); pg.goto(B,wait_until="networkidle"); pg.wait_for_timeout(2000)
        res=pg.evaluate("""[...document.querySelectorAll('.rise,.strata-in,.print-row,h1,[data-call-region=hero] a')].map(e=>[e.tagName+'.'+String(e.className).slice(0,30),getComputedStyle(e).opacity,e.getBoundingClientRect().height])""")
        for name,op,h in res:
            if float(op)<0.99 or h==0: bad.append((w,name,op,h))
        print(w,"checked",len(res))
    print("INVISIBLE:",bad if bad else "none"); b.close()
    sys.exit(1 if bad else 0)
