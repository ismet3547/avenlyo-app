"""Compare only original/refined Direction 3 artwork; no production behavior tests."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,hashlib,xml.etree.ElementTree as ET
HERE=Path(__file__).resolve().parent;BASE=HERE.parent
j=json.loads((HERE/'tokens-refined.json').read_text());T=j['tokens'];screens=['home-desktop','inbox-desktop','agent-desktop','widget-desktop','inbox-mobile','widget-mobile']
def fnt(n):
 f=ImageFont.truetype(str(BASE/'assets/fonts/manrope.ttf'),n);f.set_variation_by_axes([600]);return f
def old(s):return BASE/'mockups'/('03-ai-product-'+s+'.png')
def new(s):return HERE/'mockups'/('03-ai-product-refined-'+s+'.png')
# Native-size matched desktop panels; mobile panels remain 390x844.
board=Image.new('RGB',(2952,4028),'#E6E4E0');d=ImageDraw.Draw(board);d.text((24,20),'AVENLYO / DIRECTION 3 REFINEMENT',font=fnt(32),fill='#2B2725');d.text((24,70),'BEFORE / approved identity',font=fnt(24),fill='#69615C');d.text((1488,70),'AFTER / neutral content, tighter geometry, denser Inbox',font=fnt(24),fill='#2B2725')
for row,(s,label) in enumerate([('home-desktop','HOME / 1440 × 900'),('inbox-desktop','INBOX / 1440 × 900'),('widget-desktop','WIDGET / 1440 × 900')]):
 y=124+row*968;d.text((24,y),label,font=fnt(20),fill='#69615C')
 for x,fn in [(24,old),(1488,new)]:board.paste(Image.open(fn(s)).convert('RGB'),(x,y+36))
y=3040;d.text((24,y),'MOBILE / Inbox + widget / 390 × 844 each',font=fnt(20),fill='#69615C')
for x,fn in [(24,old),(1488,new)]:
 for dx,s,label in [(306,'inbox-mobile','Inbox'),(744,'widget-mobile','Widget')]:
  d.text((x+dx,y+38),label,font=fnt(18),fill='#69615C');board.paste(Image.open(fn(s)).convert('RGB'),(x+dx,y+68))
d.text((24,3990),'Fictional design fixture. Direction 3 only. Original artwork retained. No production UI.',font=fnt(18),fill='#69615C');board.save(HERE/'comparison-direction3-before-after.png')
quick=Image.new('RGB',(1464,502),'#E6E4E0');d=ImageDraw.Draw(quick)
for x,fn,label in [(0,old,'Before'),(744,new,'Refined')]:d.text((x+12,12),label,font=fnt(22),fill='#2B2725');quick.paste(Image.open(fn('inbox-desktop')).convert('RGB').resize((720,450)),(x,48))
quick.save(HERE/'comparison-direction3-inbox.png')
# Contrast, glyph, exact fixture and type/control checks for the new set.
def lum(h):
 a=[int(h[i:i+2],16)/255 for i in (1,3,5)];a=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in a];return sum(x*y for x,y in zip(a,[.2126,.7152,.0722]))
def contrast(a,b):
 a,b=sorted([lum(a),lum(b)]);return round((b+.05)/(a+.05),2)
contrast_pairs={k:contrast(a,b) for k,a,b in [('body / AI',T['text'],'#F2F0EB'),('body / customer',T['text'],'#F4F1EC'),('body / widget customer',T['text'],'#E6E1D9'),('body / selection',T['text'],'#EDE6DF'),('body / Home attention',T['text'],'#F1E9E2'),('muted / AI',T['muted'],'#F2F0EB'),('white / primary','#FFFFFF',T['accent']),('handling label / charcoal','#E8DDD2',T['nav']),('handling muted / charcoal','#D8D1CB',T['nav'])]}
assert min(contrast_pairs.values())>=4.5
before_exposure=after_exposure=0;color_rows=[];original_hashes={}
def exposure(a):
 r,g,b=a[:,:,0],a[:,:,1],a[:,:,2];return int(np.sum((r-b)*((r>=g)&(g>=b))))
for screen in screens:
 expected=(390,844) if 'mobile' in screen else (1440,900);a=Image.open(old(screen)).convert('RGB');b=Image.open(new(screen)).convert('RGB');assert a.size==b.size==expected
 x=exposure(np.asarray(a).astype('int16'));y=exposure(np.asarray(b).astype('int16'));before_exposure+=x;after_exposure+=y;color_rows.append({'screen':screen,'before':x,'after':y,'reduction_pct':round(100*(1-y/x),2)})
 for suffix in ['.png','.svg']:
  p=old(screen).with_suffix(suffix);original_hashes[str(p.relative_to(BASE))]=hashlib.sha256(p.read_bytes()).hexdigest()
 # Body text is outlined; accessible labels retain the same fictional fixture content.
 root=ET.parse(new(screen).with_suffix('.svg')).getroot();labels=' '.join(e.get('aria-label','') for e in root.iter())
 for txt in (['Northstar Studio' if 'widget' in screen or 'desktop' in screen else 'Alex Morgan'] + (['alex@example.test.'] if 'widget' in screen or 'inbox' in screen else [])):
  assert txt in labels,(screen,txt)
 if 'inbox' in screen:
  for txt in ['Needs human · AI paused','Unclaimed','Claim conversation','Your human reply','Qualified' if 'desktop' in screen else 'Customer']:assert txt in labels
for drawing in j['drawings']:
 for m in drawing['messages']:
  expected=14 if 'widget' in drawing['name'] else 13.5 if 'mobile' in drawing['name'] else 14.5
  assert m['size']==expected
 if 'mobile' in drawing['name']:
  accent_rects=[r for r in drawing['rects'] if r['fill']==T['accent']]
  assert any(r['h']==44 for r in accent_rects),'44px mobile primary missing'
assert (T['nav'],T['accent'],T['font'],T['side'],T['master'],T['context'])==('#272321','#A6442A','manrope',224,320,272)
metrics={'base_commit':'09c9a8da5f573731e840c08789cf04284ab40393','scope':'Direction 3 design-only','original_artwork_hashes':original_hashes,'image_dimensions':'6 matched compositions passed','fixture_state':'same data and unclaimed/paused state','font_sizes':'unchanged','mobile_primary_height':44,'contrast_ratios':contrast_pairs,'warm_color_metric':{'definition':'Sum of (R-B) over all RGB pixels where R>=G>=B, across six matched full canvases. Area-weighted warm chroma exposure; not simple colored-pixel area, saturation percentage or usability measure.','before':before_exposure,'after':after_exposure,'reduction_pct':round(100*(1-after_exposure/before_exposure),2),'per_scene':color_rows},'density':j['density_measurements'],'remaining_limit':'Static artwork does not verify live focus, touch hit testing or virtual-keyboard behavior.'}
(HERE/'validation-refinement.json').write_text(json.dumps(metrics,indent=2))
# Local image review, not an implementation or backend-connected prototype.
html=['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Avenlyo / Direction 3 refinement</title><style>body{margin:0;padding:28px;background:#F1EEEA;color:#2B2725;font:15px/1.5 system-ui,sans-serif}main{max-width:1500px;margin:auto}h1{font-size:32px}p{max-width:950px;color:#69615C}a{color:#A6442A}section{margin:32px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}.pair img{width:100%;height:auto}.mobile img{max-width:390px}figure{margin:0}figcaption{font-weight:600;padding:10px 0}a:focus-visible{outline:3px solid #A6442A;outline-offset:3px}@media(max-width:700px){.pair{grid-template-columns:1fr}body{padding:16px}}</style><main><h1>Direction 3, refined.</h1><p>Approved identity retained. Ordinary content is more neutral; operational surfaces are tighter; Inbox spacing provides approximately 10–13% more vertical capacity. Same fictional fixture, type sizes, shell and handling semantics. No production implementation.</p><p><a href="comparison-direction3-before-after.png">Full before/after board</a> · <a href="../../../docs/frontend-visual-directions-v1.md#direction-3-refinement">Refinement notes and exact token changes</a></p>']
for screen in screens:
 html.append('<section><h2>'+screen.replace('-',' ').title()+'</h2><div class="pair '+('mobile' if 'mobile' in screen else '')+'">')
 for p,label in [('../mockups/03-ai-product-'+screen+'.png','Before'),('mockups/03-ai-product-refined-'+screen+'.png','Refined')]:html.append('<figure><figcaption>'+label+'</figcaption><a href="'+p+'"><img src="'+p+'" alt="Direction 3 '+label+' '+screen+' fictional fixture"></a></figure>')
 html.append('</div></section>')
html.append('<p>Original Direction 3 artwork remains available and unchanged. No hybrid elements from Directions 1 or 2.</p></main></html>');(HERE/'index.html').write_text(''.join(html))
print(json.dumps({'warm_chroma_reduction_pct':metrics['warm_color_metric']['reduction_pct'],'density':{k:{kk:vv for kk,vv in v.items() if kk!='messages'} for k,v in metrics['density'].items()},'contrast':contrast_pairs},indent=2))
