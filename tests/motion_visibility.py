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
        # görgetés közben: minden szekció tartalma látható-e, amikor a nézetbe ér
        for sel in ["#anyagok-arak","#rendeles ol > li","#terulet","#miert-hivjon","#gyik","[data-call-region=zaro_cta]","footer"]:
            for el in pg.locator(sel).all():
                el.evaluate("e=>e.scrollIntoView({block:'center'})"); pg.wait_for_timeout(200)
                op=el.evaluate("e=>{let o=1,n=e;while(n&&n!==document.body){o*=+getComputedStyle(n).opacity;n=n.parentElement}return o}")
                if op<0.99: bad.append((w,sel,op,0))
    print("INVISIBLE:",bad if bad else "none"); b.close()
    sys.exit(1 if bad else 0)
