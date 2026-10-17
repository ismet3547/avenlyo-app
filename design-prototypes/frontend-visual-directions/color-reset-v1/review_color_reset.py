"""Validate static artwork and build review boards. Does not run an application."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, hashlib, re, xml.etree.ElementTree as ET
HERE=Path(__file__).resolve().parent; BASE=HERE.parent
J=json.loads((HERE/'tokens-color-reset.json').read_text()); P=J['palettes']
NS='{http://www.w3.org/2000/svg}'
def font(n,key='manrope',weight=500):
 f=ImageFont.truetype(str(BASE/'assets/fonts'/(key+'.ttf')),n)
 axes=f.get_variation_axes()
 if axes:f.set_variation_by_axes([weight if a['name']==b'Weight' else a['default'] for a in axes])
 return f
def txt(d,xy,s,n=18,color='#213343',key='manrope',weight=500):d.text(xy,s,font=font(n,key,weight),fill=color)
def image(stem):return Image.open(HERE/'mockups'/(stem+'.png')).convert('RGB')
def stem(p,f,scene):return f'{p}-{scene}' if f=='manrope' else f'type-{p}-{f}-{scene}'

# Native 1440x900 panels: color is the only variable across columns.
for scene,out in [('home','color-reset-comparison-home.png'),('inbox-desktop','color-reset-comparison-inbox.png')]:
 board=Image.new('RGB',(4416,1308),'#E7EDF2');d=ImageDraw.Draw(board)
 txt(d,(24,18),'AVENLYO / COLOR RESET / '+('HOME' if scene=='home' else 'INBOX'),30,weight=650)
 txt(d,(24,65),'Same approved Direction 3 geometry, Manrope, fixture, density and radii. Palette only.',20,color='#526575')
 for i,k in enumerate(P):
  x=24+i*1464;p=P[k]
  txt(d,(x,110),k.upper()+' / '+p['name'],24,weight=650)
  board.paste(image(k+'-'+scene),(x,152))
  for j,(token,label) in enumerate([('navigation','Navigation'),('accent','Action'),('selection','Selection'),('ai-message','AI'),('customer-message','Customer')]):
   xx=x+j*280;d.rectangle((xx,1074,xx+34,1108),fill=p[token],outline=p['border'])
   txt(d,(xx+44,1073),label,16);txt(d,(xx+44,1098),p[token],14,color='#526575')
  for j,(token,label) in enumerate([('accent','Primary / action'),('success','Success'),('attention','Attention'),('danger','Danger'),('ai-paused','AI paused')]):
   xx=x+j*280;d.rectangle((xx,1142,xx+34,1176),fill=p[token])
   txt(d,(xx+44,1141),label,16);txt(d,(xx+44,1166),p[token],14,color='#526575')
 txt(d,(24,1220),'A = familiar clarity    /    B = preferred: restrained cyan, graphite and cool whites    /    C = quiet ice actions against ink',20)
 txt(d,(24,1263),'Semantic legend: status colors are independent of brand/action. AI paused uses words + a pause icon on neutral surfaces.',17,color='#526575')
 board.save(HERE/out)

# All three palettes x all three fonts. Every crop is at native size; no new layouts.
board=Image.new('RGB',(2040,2260),'#E7EDF2');d=ImageDraw.Draw(board)
txt(d,(24,18),'TYPE IN THE SAME WORK / 3 PALETTES × 3 FAMILIES',28,weight=650)
txt(d,(24,60),'Native-size crops. Same pixel sizes, weights, line breaks, containers and anchors. No type-size compensation.',16,color='#526575')
for i,k in enumerate(P):txt(d,(24+i*672,100),k.upper()+' / '+P[k]['name'],22,weight=650)
for row,(f,label) in enumerate([('manrope','Manrope'),('geist','Geist'),('instrument-sans','Instrument Sans')]):
 y=148+row*690
 for col,k in enumerate(P):
  x=24+col*672;p=P[k]
  d.rectangle((x,y,x+648,y+670),fill='#FFFFFF',outline=p['border'])
  txt(d,(x+12,y+10),label+' / 400 · 500 · 600 · 650',20,key=f,weight=600)
  home=image(stem(k,f,'home'));inbox=image(stem(k,f,'inbox-desktop'))
  board.paste(home.crop((260,100,884,186)),(x+12,y+50))
  board.paste(inbox.crop((544,79,1168,459)),(x+12,y+146))
  board.paste(inbox.crop((236,108,532,204)),(x+12,y+540))
  board.paste(inbox.crop((1192,108,1416,204)),(x+338,y+540))
  txt(d,(x+12,y+640),'İ ı Ş ş Ğ ğ Ç ç Ö ö Ü ü · 0123456789',15,key=f,color=p['text'])
txt(d,(24,2230),'Preferred: Manrope. Preserve mature character and established fit. Font judgments are visual, not usability-test results.',15)
board.save(HERE/'color-reset-typography.png')

# Strict geometry and fixture checks against preserved approved refinement files.
geometry_results=[];baseline_hashes={}
def baseline(scene):
 scene={'home':'home-desktop','agent':'agent-desktop'}.get(scene,scene)
 return BASE/'refinement-v1/mockups'/('03-ai-product-refined-'+scene+'.svg')
def geometry(root):
 return [(e.tag,tuple(sorted((a,v) for a,v in e.attrib.items() if a not in ('fill','stroke'))))
         for e in root if e.tag not in (NS+'g',NS+'defs',NS+'title')]
def labels(root):return [e.get('aria-label') for e in root if e.tag==NS+'g']
for o in J['outputs']:
 path=HERE/o['file'];new=ET.parse(path).getroot();old=ET.parse(baseline(o['scene'])).getroot()
 assert geometry(new)==geometry(old),('Geometry changed',path)
 assert labels(new)==labels(old),('Fixture/wrapping changed',path)
 assert Image.open(path.with_suffix('.png')).size==tuple(o['dimensions'])
 # Palette-only Manrope drawings retain every glyph placement too.
 if o['font']=='manrope':
  glyphs=lambda root:[e.attrib for e in root.iter(NS+'use')]
  assert glyphs(new)==glyphs(old),('Glyph positions changed',path)
 geometry_results.append({'file':o['file'],'geometry':'identical','fixture_and_line_breaks':'identical','dimensions':o['dimensions']})
 for f in [baseline(o['scene']),baseline(o['scene']).with_suffix('.png')]:
  baseline_hashes[str(f.relative_to(BASE))]=hashlib.sha256(f.read_bytes()).hexdigest()
 # The palette accent never represents success, attention, danger or pause.
 p=P[o['palette']]
 assert len({p[k] for k in ('accent','success','attention','danger','ai-paused')})==5
 # Disallowed prior visual-family paint cannot survive a complete reset.
 paint={v.upper() for e in new.iter() for a,v in e.attrib.items() if a in ('fill','stroke') and v.startswith('#')}
 forbidden={'#F1EEEA','#FFFEFC','#F4F1EC','#F2F0EB','#E6E1D9','#EDE6DF','#F1E9E2','#272321','#A6442A','#DDAE91','#332C28','#51443C','#44342E','#F6F2EC','#F9ECD6'}
 assert not paint&forbidden,(path,paint&forbidden)
def lum(h):
 c=[int(h[i:i+2],16)/255 for i in (1,3,5)];c=[a/12.92 if a<=.04045 else ((a+.055)/1.055)**2.4 for a in c]
 return sum(a*b for a,b in zip(c,[.2126,.7152,.0722]))
def contrast(a,b):
 a,b=sorted([lum(a),lum(b)]);return round((b+.05)/(a+.05),2)
contrasts={}
for k,p in P.items():
 pairs=[('text / surface','text','surface'),('muted / subtle','muted','surface-subtle'),
 ('text / AI','text','ai-message'),('text / customer','text','customer-message'),
 ('action label / action','action-text','accent'),('link / surface','accent-ink','surface'),
 ('nav text / nav','navigation-text','navigation'),('nav selected text / selected','navigation-selected-text','navigation-selected'),
 ('success / success fill','success','success-fill'),('attention / neutral fill','attention','attention-fill'),
 ('danger / surface','danger','surface'),('paused / paused fill','ai-paused','ai-paused-fill'),
 ('handling / nav','handling-text','navigation'),('handling muted / nav','handling-muted','navigation'),('focus / canvas','focus','canvas')]
 contrasts[k]={name:contrast(p[a],p[b]) for name,a,b in pairs}
 assert min(v for n,v in contrasts[k].items() if n!='focus / canvas')>=4.5,(k,contrasts[k])
 assert contrasts[k]['focus / canvas']>=3
metrics={
 'scope':'static design artwork only', 'geometry_source_commit':'4efa686ff043c8d56350cf603f72574320529ae8',
 'preferred_palette':'B / Graphite + Cyan / Teal','preferred_font':'Manrope',
 'geometry_and_fixture_checks':geometry_results,'preserved_refinement_hashes':baseline_hashes,
 'contrast_ratios':contrasts,
 'type_study_padding_intrusions':J['type_width_overflows'],
 'type_study_note':'Locked Manrope line breaks and bubble widths. Geist reaches up to 6.39px into the original 12px text padding; it remains inside the bubble. No font is scaled or given more space. Preferred Manrope has no fit change.',
 'unchanged_geometry':{'sidebar':224,'conversation_list':320,'thread':624,'context':272,'conversation_row':96,'handling_desktop':72,'handling_mobile':57,'composer_desktop':116,'composer_mobile':98,'message_radius':10,'work_radius':10,'widget_radius':22,'mobile_primary_height':44},
 'limits':'Static outlines and raster QA do not validate browser focus, hit testing, virtual keyboard or production behavior.'}
(HERE/'validation-color-reset.json').write_text(json.dumps(metrics,indent=2))

html=['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Avenlyo / Color reset</title><style>body{margin:0;padding:28px;background:#F2F6F8;color:#14232D;font:15px/1.5 system-ui,sans-serif}main{max-width:1500px;margin:auto}h1{font-size:32px}p{max-width:1050px;color:#526572}a{color:#087583}img{width:100%;height:auto}.three{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.two{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}.mobile img{max-width:390px}figure{margin:16px 0}figcaption{font-weight:600;margin:8px 0}section{margin:32px 0}a:focus-visible{outline:3px solid #007FAD;outline-offset:3px}@media(max-width:800px){.three,.two{grid-template-columns:1fr}}</style><main><h1>Avenlyo / Color reset</h1><p>Approved Direction 3 architecture, refined density and radii. Three new cool color systems. Preferred: B, Graphite + Cyan / Teal, with Manrope. Design only; no production UI.</p><p><a href="README.md">Recommendation, exact tokens and status semantics</a> · <a href="../../../docs/frontend-visual-directions-v1.md#cool-color-reset">Visual-direction documentation</a></p>']
for scene,label,boardname in [('home','Home','color-reset-comparison-home.png'),('inbox-desktop','Inbox','color-reset-comparison-inbox.png')]:
 html.append('<section><h2>'+label+' / three palettes</h2><p><a href="'+boardname+'">Native-size side-by-side board</a></p><div class="three">')
 for k,p in P.items():
  file='mockups/'+k+'-'+scene+'.png';html.append('<figure><figcaption>'+k.upper()+' / '+p['name']+'</figcaption><a href="'+file+'"><img src="'+file+'" alt="'+k.upper()+' '+label+' fictional fixture"></a></figure>')
 html.append('</div></section>')
html.append('<section><h2>Typography / same composition</h2><p>All three palettes × Manrope, Geist and Instrument Sans. Native-size crops; same sizes, line breaks and container geometry.</p><a href="color-reset-typography.png"><img src="color-reset-typography.png" alt="Three by three palette and typography comparison"></a></section><section><h2>Preferred B / complete system</h2><div class="two">')
for scene,label in [('agent','Agent desktop'),('widget-desktop','Widget desktop'),('inbox-mobile','Inbox mobile'),('widget-mobile','Widget mobile')]:
 file='mockups/b-'+scene+'.png';html.append('<figure class="'+('mobile' if 'mobile' in scene else '')+'"><figcaption>'+label+'</figcaption><a href="'+file+'"><img src="'+file+'" alt="Preferred palette B '+label+' fictional fixture"></a></figure>')
html.append('</div></section><p>Original studies and approved refinement artwork remain unchanged. Await stakeholder color approval before implementation.</p></main></html>')
(HERE/'index.html').write_text(''.join(html))
print(json.dumps({'frames_checked':len(geometry_results),'geometry':'all identical','fixture_and_line_breaks':'all identical','contrast':contrasts},indent=2))
