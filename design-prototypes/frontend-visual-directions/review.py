"""Build comparison boards, review gallery and deterministic design checks.
This validates artwork/fixtures, never production application behavior.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from fontTools.ttLib import TTFont
import json,hashlib,xml.etree.ElementTree as ET
P=Path(__file__).resolve().parent;B=P/'boards';B.mkdir(exist_ok=True)
T=json.loads((P/'tokens.json').read_text());D=[(t['id'],str(i+1).zfill(2)+' / '+t['name']) for i,t in enumerate(T)]
f=ImageFont.truetype(str(P/'assets/fonts/geist.ttf'),24);small=ImageFont.truetype(str(P/'assets/fonts/geist.ttf'),16)
for screen in ['home','inbox']:
 im=Image.new('RGB',(1440,2908),'#E6E7E5');dr=ImageDraw.Draw(im);dr.text((24,16),'AVENLYO / '+screen.upper()+' COMPARISON · FICTIONAL DESIGN FIXTURES',font=small,fill='#343A40')
 for i,(key,label) in enumerate(D):
  yy=50+i*950;dr.text((24,yy),label,font=f,fill='#343A40');im.paste(Image.open(P/'mockups'/(key+'-'+screen+'-desktop.png')),(0,yy+40))
 im.save(B/('comparison-'+screen+'.png'))
im=Image.new('RGB',(1242,1824),'#E6E7E5');dr=ImageDraw.Draw(im)
for i,(key,label) in enumerate(D):
 xx=18+i*408;dr.text((xx,12),label,font=small,fill='#343A40')
 for j,screen in enumerate(['inbox','widget']):im.paste(Image.open(P/'mockups'/(key+'-'+screen+'-mobile.png')),(xx,52+j*884))
im.save(B/'comparison-mobile.png')
im=Image.new('RGB',(1440,1320),'#DADCD9');dr=ImageDraw.Draw(im)
for row,screen in enumerate(['home','inbox','agent','widget']):
 for col,(key,label) in enumerate(D):
  dr.text((col*480+10,row*330+7),label+' / '+screen,font=small,fill='#343A40');im.paste(Image.open(P/'mockups'/(key+'-'+screen+'-desktop.png')).resize((480,300)),(col*480,row*330+30))
im.save(B/'desktop-overview.png')
im.crop((0,0,1440,330)).save(B/'comparison-home-horizontal.png')
# Reference images are third-party official product imagery; clearly separate from Avenlyo artwork.
im=Image.new('RGB',(1440,1140),'#F2F2F0');dr=ImageDraw.Draw(im)
refs=json.loads((P/'references/sources.json').read_text())
for i,r in enumerate(refs):
 x=24+(i%3)*472;y=24+(i//3)*550;dr.text((x,y),r['id']+' · official imagery',font=small,fill='#343A40');a=Image.open(P/'references'/r['saved']);a.thumbnail((448,475));im.paste(a,(x,y+34))
im.save(B/'visual-references.png')
# Exact critical-pair calculations, not an assertion of complete WCAG conformance.
def lum(c):
 rgb=[int(c[i:i+2],16)/255 for i in (1,3,5)];v=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in rgb];return sum(a*b for a,b in zip(v,[.2126,.7152,.0722]))
def ratio(a,b):
 x,y=sorted([lum(a),lum(b)]);return round((y+.05)/(x+.05),2)
contrasts={}
for t in T:
 contrasts[t['id']]={k:ratio(a,b) for k,a,b in [('body / surface',t['text'],t['surface']),('muted / canvas',t['muted'],t['canvas']),('white / primary','#FFFFFF',t['accent']),('white / primary hover','#FFFFFF',t['hover']),('focus / canvas',t['focus'],t['canvas']),('body / selection',t['text'],t['selection']),('success / success-fill',t['success'],t['successfill']),('attention / attention-fill',t['attention'],t['attentionfill']),('danger / surface',t['danger'],t['surface'])]}
(P/'contrast-ratios.json').write_text(json.dumps(contrasts,indent=2))
# Full glyph coverage rather than relying on fallback in English-only samples.
glyphs='İıŞşĞğÇçÖöÜü';coverage={}
for ff in sorted((P/'assets/fonts').glob('*.ttf')):
 cmap=TTFont(ff).getBestCmap();coverage[ff.stem]={'missing':[x for x in glyphs if ord(x) not in cmap]};assert not coverage[ff.stem]['missing']
checks=[]
for t in T:
 for screen in ['home','inbox','agent','widget']:
  n=t['id']+'-'+screen+'-desktop';im=Image.open(P/'mockups'/(n+'.png'));assert im.size==(1440,900);checks.append(n)
 for screen in ['inbox','widget']:
  n=t['id']+'-'+screen+'-mobile';im=Image.open(P/'mockups'/(n+'.png'));assert im.size==(390,844);checks.append(n)
 for screen in ['inbox-desktop','inbox-mobile']:
  root=ET.parse(P/'mockups'/(t['id']+'-'+screen+'.svg')).getroot();labels=' '.join(g.get('aria-label','') for g in root.iter())
  for value in ['Alex Morgan','Website Chat','Needs human · AI paused','Unclaimed','Claim conversation','alex@example.test.','Your human reply']:
   assert value in labels,(t['id'],screen,value)
for t in T:
 assert min(contrasts[t['id']].values())>=4.5
report={'date':'2026-10-17','base_commit':'570ef1c2cfde754f975a10d63d5ce0ec47539545','desktop_compositions':12,'mobile_compositions':6,'dimensions':'pass','turkish_glyphs':coverage,'critical_color_pairs':contrasts,'fixture_state_checks':'pass','rendering':'font-outline SVG → sharp PNG; no browser or backend needed','limits':['Static artwork does not validate real focus, keyboard, scrolling, transitions or auth behavior.','Operating system SF rendering was not available; the actual Linux system font is labeled.','No production code or runtime tests run for this isolated design change.']}
(P/'validation.json').write_text(json.dumps(report,indent=2))
# Portable review gallery: local links only, no frameworks, backend, network or imports.
style='''*{box-sizing:border-box}body{margin:0;background:#f1f2f0;color:#20262c;font:15px/1.5 system-ui,sans-serif}header,main{max-width:1360px;margin:auto;padding:32px}header{padding-bottom:0}h1{font-size:38px;letter-spacing:-.04em;margin:0 0 10px}h2{font-size:24px;margin:36px 0 12px}p{color:#57626d;max-width:900px}nav{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}a{color:#184ca5;text-decoration:none}nav a{background:white;padding:10px 14px;border-radius:6px}section{scroll-margin-top:20px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}figure{margin:0;background:white;border-radius:10px;overflow:hidden}figure img{display:block;width:100%;height:auto}figcaption{padding:12px 16px;font-size:13px}.mobile img{max-width:390px;margin:auto}.board{width:100%;max-height:950px;object-fit:contain;object-position:top;background:#e5e7e4;border-radius:10px}details{margin:20px 0;background:white;padding:16px;border-radius:8px}summary{cursor:pointer;font-weight:600}footer{padding:40px 0}button{font:inherit;background:#245bd1;color:white;border:0;border-radius:5px;padding:10px 16px;cursor:pointer}button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #245bd1;outline-offset:3px}.demo{padding:22px;background:#f4f5f7;margin-top:14px;overflow:hidden}.preview{width:270px;padding:20px;background:white;border-left:3px solid var(--color);opacity:0;transform:translateX(12px);transition:transform var(--duration) var(--ease),opacity var(--duration) var(--ease)}.show .preview{opacity:1;transform:translateX(0)}@media(max-width:800px){.grid{grid-template-columns:1fr}header,main{padding:20px}h1{font-size:30px}}@media(prefers-reduced-motion:reduce){.preview{transition:none;transform:none}}'''
parts=['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Avenlyo / Visual direction review</title><style>'+style+'</style><header><h1>Three ways to run a front office.</h1><p>Visual direction validation · 17 October 2026. Every screen uses the same fictional Northstar Studio fixture. These are design compositions, not an implemented application.</p><nav><a href="#compare">Compare</a><a href="#desktop">12 desktop screens</a><a href="#mobile">6 mobile screens</a><a href="#type">Typography</a><a href="#motion">Motion</a><a href="#research">References</a><a href="../../docs/frontend-visual-directions-v1.md">Full report</a></nav></header><main>']
parts+=['<section id="compare"><h2>Compare the work</h2><p>Open a board for its native resolution. The Inbox is the primary decision surface.</p><div class="grid">']
for key,label in [('comparison-home','Home'),('comparison-inbox','Inbox'),('comparison-mobile','Mobile')]:parts.append(f'<figure><a href="boards/{key}.png"><img class="board" src="boards/{key}.png" alt="{label} comparison board"></a><figcaption>{label} / all three directions</figcaption></figure>')
parts.append('</div></section><section id="desktop"><h2>Desktop / 1440 × 900</h2>')
for screen in ['home','inbox','agent','widget']:
 parts.append('<h3>'+screen.title()+'</h3><div class="grid">')
 for key,label in D:
  n=key+'-'+screen+'-desktop';parts.append(f'<figure><a href="mockups/{n}.png"><img src="mockups/{n}.png" alt="{label}: {screen}, fictional fixture"></a><figcaption>{label} · <a href="mockups/{n}.svg">Vector SVG</a></figcaption></figure>')
 parts.append('</div>')
parts.append('</section><section id="mobile"><h2>Mobile / 390 × 844</h2>')
for screen in ['inbox','widget']:
 parts.append('<h3>'+screen.title()+'</h3><div class="grid mobile">')
 for key,label in D:
  n=key+'-'+screen+'-mobile';parts.append(f'<figure><a href="mockups/{n}.png"><img src="mockups/{n}.png" alt="{label}: mobile {screen}, fictional fixture"></a><figcaption>{label} · <a href="mockups/{n}.svg">Vector SVG</a></figcaption></figure>')
 parts.append('</div>')
parts.append('</section><section id="type"><h2>Typography, actually rendered</h2><a href="mockups/typography-comparison.png"><img class="board" src="mockups/typography-comparison.png" alt="Nine actual typeface comparisons with Turkish glyphs"></a></section>')
parts.append('<section id="motion"><h2>Motion character</h2><p>Use the controls to compare context-reveal timing. These local CSS demonstrations show a design proposal; no conversation or permission state changes.</p>')
for i,t in enumerate(T):
 dur=[220,160,200][i];ease=['cubic-bezier(.22,.61,.36,1)','cubic-bezier(.2,0,.2,1)','cubic-bezier(.16,1,.3,1)'][i]
 parts.append(f'<details><summary>{t["name"]} / {dur}ms context reveal</summary><p>Opacity 0→1, horizontal distance 12px. Reduced-motion preference removes movement.</p><button type="button" aria-expanded="false" onclick="const p=this.nextElementSibling; p.classList.toggle(\'show\'); this.setAttribute(\'aria-expanded\',p.classList.contains(\'show\'))">Toggle context sample</button><div class="demo" style="--duration:{dur}ms;--ease:{ease};--color:{t["accent"]}"><div class="preview"><strong>Alex Morgan</strong><p>Qualified · linked lead</p><p>Human ownership: Unclaimed</p></div></div><p><a href="mockups/{t["id"]}-motion-board.png">Full motion board</a></p></details>')
parts.append('</section><section id="research"><h2>Targeted visual references</h2><p>Official third-party product imagery, captured for comparison and attributed in the report. It is not Avenlyo artwork.</p><div class="grid">')
for r in refs:parts.append(f'<figure><a href="references/{r["saved"]}"><img src="references/{r["saved"]}" alt="Official {r["id"]} reference"></a><figcaption><a href="{r["page"]}">{r["id"]} / original source</a></figcaption></figure>')
parts.append('</div></section><footer><a href="../../docs/frontend-visual-directions-v1.md">Read the specifications, scores and recommendation →</a><p>Static visual study. No backend calls. No production imports. No deployment.</p></footer></main></html>')
(P/'index.html').write_text(''.join(parts))
# CSS values are a design handoff artifact; production does not import this file.
css=[]
for i,t in enumerate(T):
 css.append('.'+t['id']+' {')
 for k,src in {'canvas':'canvas','surface':'surface','navigation':'nav','text-primary':'text','text-secondary':'muted','border':'border','accent':'accent','accent-hover':'hover','selection':'selection','success':'success','success-fill':'successfill','attention':'attention','attention-fill':'attentionfill','danger':'danger','focus':'focus'}.items():css.append('  --'+k+': '+str(t[src])+';')
 css+=[f'  --surface-raised: {t["surface"]};',f'  --surface-subtle: {t["subtle"]};','  --danger-fill: #FCECEE;','  --control-border: #858D96;',f'  --font-ui: "{["IBM Plex Sans","Geist","Manrope"][i]}", system-ui, sans-serif;',f'  --font-display: "{["Newsreader","Geist","Manrope"][i]}", {"serif" if i==0 else "sans-serif"};',f'  --sidebar-width: {t["side"]}px;',f'  --list-width: {t["master"]}px;',f'  --context-width: {t["context"]}px;',f'  --control-radius: {t["radius"]}px;',f'  --overlay-shadow: {t["shadow"]};','}']
(P/'tokens.css').write_text('\n'.join(css)+'\n')
print(json.dumps({'checks':len(checks),'glyph_coverage':'9 fonts passed','contrasts':contrasts},indent=2))
