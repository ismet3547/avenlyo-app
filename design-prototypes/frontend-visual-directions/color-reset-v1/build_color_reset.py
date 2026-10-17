"""Design artwork only. Reuse approved Direction 3 geometry, never production code.

Palette frames keep Manrope for a controlled color comparison. Type studies change
font outlines only: Manrope wrapping, all containers, anchors, sizes and spacing stay.
Existing refinement artwork is read-only and is never regenerated or overwritten.
"""
from pathlib import Path
import importlib.util, sys, json, re, hashlib
import xml.etree.ElementTree as ET
sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
BASE = HERE.parent
spec = importlib.util.spec_from_file_location('approved_refinement', BASE/'refinement-v1/build_refinement.py')
r = importlib.util.module_from_spec(spec); spec.loader.exec_module(r)
b = r.b
OUT = HERE/'mockups'; OUT.mkdir(exist_ok=True)
b.OUT = OUT
NS = 'http://www.w3.org/2000/svg'; ET.register_namespace('', NS)
SHARED = {
 'success':'#23764B', 'success-fill':'#EAF4EE',
 'attention':'#946200', 'attention-fill':'#F1F4F7',
 'danger':'#C12E4B', 'danger-fill':'#FAEDF1',
 'ai-paused':'#526576', 'ai-paused-fill':'#EAF0F4',
 'handling-text':'#E0E9F0', 'handling-muted':'#B8C7D3',
}
PALETTES = {
 'a': {'name':'Graphite + Azure',
  'canvas':'#F3F6F9', 'surface':'#FFFFFF', 'surface-subtle':'#EDF2F6',
  'navigation':'#1C2026', 'navigation-selected':'#303A46',
  'text':'#17212B', 'muted':'#566575', 'border':'#D7E0E8',
  'accent':'#1967D2', 'accent-hover':'#1153AD', 'accent-ink':'#1967D2', 'action-text':'#FFFFFF',
  'selection':'#E8F0FC', 'ai-message':'#F0F4F8', 'customer-message':'#E9EEF3',
  'focus':'#1B73E8', 'navigation-text':'#EDF3F8', 'navigation-muted':'#B4C1CD',
  'navigation-selected-text':'#B7D6FF', 'brand-mark':'#B7D6FF',
  'workspace-fill':'#262E37', 'workspace-mark':'#3B4856', 'navigation-border':'#3C4652'},
 'b': {'name':'Graphite + Cyan / Teal',
  'canvas':'#F2F6F8', 'surface':'#FFFFFF', 'surface-subtle':'#EDF3F5',
  'navigation':'#1B232A', 'navigation-selected':'#2B3E48',
  'text':'#14232D', 'muted':'#526572', 'border':'#D4E0E6',
  'accent':'#087F8C', 'accent-hover':'#056673', 'accent-ink':'#087583', 'action-text':'#FFFFFF',
  'selection':'#E3F1F4', 'ai-message':'#F0F5F7', 'customer-message':'#E8F0F3',
  'focus':'#007FAD', 'navigation-text':'#ECF3F7', 'navigation-muted':'#B2C3CD',
  'navigation-selected-text':'#A9DEE6', 'brand-mark':'#A9DEE6',
  'workspace-fill':'#25313A', 'workspace-mark':'#3B4D59', 'navigation-border':'#3B4B57'},
 'c': {'name':'Midnight + Ice Blue',
  'canvas':'#F2F5FA', 'surface':'#FFFFFF', 'surface-subtle':'#ECF1F7',
  'navigation':'#111D33', 'navigation-selected':'#213653',
  'text':'#17263B', 'muted':'#53667E', 'border':'#D5DFED',
  'accent':'#A6D5F2', 'accent-hover':'#8CC5E9', 'accent-ink':'#235A80', 'action-text':'#10263B',
  'selection':'#E6F2FC', 'ai-message':'#F0F4FA', 'customer-message':'#E7EEF7',
  'focus':'#397EAF', 'navigation-text':'#EAF1FC', 'navigation-muted':'#AFBED4',
  'navigation-selected-text':'#C0E5FC', 'brand-mark':'#C0E5FC',
  'workspace-fill':'#1C2D46', 'workspace-mark':'#324762', 'navigation-border':'#344761'},
}
for p in PALETTES.values(): p.update(SHARED)
PREFERRED_PALETTE = 'b'
PREFERRED_FONT = 'manrope'
FONTS = [('manrope','Manrope'), ('geist','Geist'), ('instrument-sans','Instrument Sans')]
ACTIVE_PALETTE = 'a'; ACTIVE_FONT = 'manrope'; ACTIVE_SCENE = ''
OUTPUTS = []; TYPE_OVERFLOWS = []

def color_map(p):
 return {
  '#F1EEEA':p['canvas'], '#FFFEFC':p['surface'], '#F4F1EC':p['surface-subtle'],
  '#F2F0EB':p['ai-message'], '#E6E1D9':p['customer-message'], '#F1E9E2':p['surface-subtle'],
  '#EDE6DF':p['selection'], '#F6F2EC':p['surface-subtle'],
  '#272321':p['navigation'], '#2B2725':p['text'], '#69615C':p['muted'],
  '#DED8D1':p['border'], '#A6442A':p['accent-ink'], '#87341E':p['accent-hover'],
  '#F5F0E9':p['navigation-text'], '#BFB4AC':p['navigation-muted'],
  '#DDAE91':p['brand-mark'], '#332C28':p['workspace-fill'], '#51443C':p['workspace-mark'],
  '#44342E':p['navigation-selected'], '#F5D4BD':p['navigation-selected-text'],
  '#4A403B':p['navigation-border'], '#426446':p['success'], '#ECF1E7':p['success-fill'],
  '#845119':p['attention'], '#F9ECD6':p['ai-paused-fill'],
  '#E8DDD2':p['handling-text'], '#D8D1CB':p['handling-muted'],
  '#FFF8F0':p['navigation-text'], '#D5C5B9':p['handling-muted'],
  '#E8E6E1':'#E5EBF0', '#565B60':'#516170', '#858D96':'#758795',
  '#FFFFFF':'#FFFFFF',
  # The fictional host changes color only too, so no cream/olive surround remains.
  '#F2F2EF':'#F0F4F7', '#323532':'#243547', '#686E68':'#5C6E7D',
  '#EBECE6':'#E5EDF3', '#CFD2CA':'#CBD8E3', '#D1D4CC':'#D1DCE5',
  '#70766F':'#607586', '#30372F':'#21394D', '#6C736A':'#5C7081',
  '#454D42':'#3A5265', '#E3E6DF':'#DFE9F1', '#D4D8D0':'#D1DFEA',
  '#636E5B':'#557186', '#66705E':'#526D82', '#72796E':'#60798C',
  '#E3E3DD':'#DCE5EB', '#DADCD5':'#CEDAE3',
 }

def remap(root, p, scene):
 mapping = color_map(p)
 for e in root.iter():
  for attr in ('fill','stroke'):
   old=e.get(attr)
   if old and old.startswith('#'):
    assert old in mapping, ('unmapped paint',old)
    value=mapping[old]
    # Primary fills and checkboxes use the action color; links use accent ink.
    if old=='#A6442A' and e.tag.endswith('rect'): value=p['accent']
    if old=='#A6442A' and e.tag.endswith('rect') and scene=='inbox-desktop' and e.get('width')=='2': value=p['accent-ink']
    # Human-attention object is not a brand/selection state.
    if old=='#A6442A' and e.tag.endswith('rect') and scene=='home' and e.get('y')=='287': value=p['attention']
    e.set(attr,value)
 for e in root.findall('./{'+NS+'}g'):
  label=e.get('aria-label','')
  if label in ('AI paused','Needs human · AI paused'):
   # On the dark handling strip use cool on-dark semantics; elsewhere neutral slate.
   first=e.find('{'+NS+'}use'); y=0
   if first is not None:
    m=re.search(r'translate\([\d.\-]+ ([\d.\-]+)\)',first.get('transform','')); y=float(m[1]) if m else 0
   e.set('fill',p['handling-text'] if scene=='inbox-desktop' and y<120 else p['ai-paused'])
  if label in ('Automated answers are paused.','A team member can continue.') and scene.startswith('widget'):
   e.set('fill',p['ai-paused'])
 # Pause icons always carry paused semantics, separate from attention.
 for e in root.findall('./{'+NS+'}path'):
  if e.get('d')=='M9 6v12 M15 6v12':
   on_dark=scene=='inbox-desktop' and ' 92)' in e.get('transform','')
   e.set('stroke',p['handling-text'] if on_dark else p['ai-paused'])
 # Home paused badge: neutral instead of a warning-tinted status badge.
 if scene=='home':
  for e in root.findall('./{'+NS+'}rect'):
   if e.get('height')=='24' and e.get('y')=='286': e.set('fill',p['ai-paused-fill'])
 # The light ice-blue study needs dark button labels/check marks/launcher icon.
 for e in root.iter():
  if e.get('fill')=='#FFFFFF' and e.tag.endswith('g'): e.set('fill',p['action-text'])
  if e.get('stroke')=='#FFFFFF':e.set('stroke',p['action-text'])
 return root

class StudySVG(r.SVG):
 def __init__(self,w,h,t):
  self.text_log=[]
  super().__init__(w,h,t)
 def text(self,x,y,s,size=14,color=None,weight=400,font=None,width=None,lh=None,align='left'):
  baseline_font=font or self.t['font']; target=ACTIVE_FONT if baseline_font=='manrope' else baseline_font
  lines=b.wrap(s,width,size,baseline_font,weight) if width else s.split('\n'); lh=lh or size*1.5
  for i,line in enumerate(lines):
   if width and b.tw(line,size,target,weight)>width+1:
    TYPE_OVERFLOWS.append({'font':target,'scene':ACTIVE_SCENE,'text':line,'available':width,'actual':b.tw(line,size,target,weight)})
   r.OriginalSVG.text(self,x,y+i*lh,line,size,color,weight,target,None,lh,align)
  self.text_log.append({'x':x,'y':y,'size':size,'weight':weight,'font':target,'lines':lines,'line_height':lh,'align':align})
  return len(lines)*lh
 def save(self,name):
  p=PALETTES[ACTIVE_PALETTE]
  # Assign customer role before color mapping; geometry is already final.
  raw=f'<svg xmlns="{NS}" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}" role="img"><defs>{"".join(self.defs.values())}</defs>{"".join(self.parts)}</svg>'
  root=ET.fromstring(raw)
  for m in self.message_log:
   if m['role']=='customer' and not ACTIVE_SCENE.startswith('widget'):
    for e in root.findall('./{'+NS+'}rect'):
     if abs(float(e.get('y'))-(m['y']+17))<.01:
      e.set('fill','#E6E1D9')
  root=remap(root,p,ACTIVE_SCENE)
  title=ET.SubElement(root,'{'+NS+'}title');title.text=f'Palette {ACTIVE_PALETTE.upper()} / {p["name"]} / {ACTIVE_FONT} / {ACTIVE_SCENE}. Fictional design fixture; design only.'
  stem=f'{ACTIVE_PALETTE}-{ACTIVE_SCENE}' if ACTIVE_FONT=='manrope' else f'type-{ACTIVE_PALETTE}-{ACTIVE_FONT}-{ACTIVE_SCENE}'
  ET.ElementTree(root).write(OUT/(stem+'.svg'),encoding='unicode')
  OUTPUTS.append({'file':'mockups/'+stem+'.svg','palette':ACTIVE_PALETTE,'font':ACTIVE_FONT,'scene':ACTIVE_SCENE,'dimensions':[self.w,self.h],'messages':self.message_log,'text':self.text_log})

r.SVG=StudySVG;b.SVG=StudySVG
def draw(palette,font,scene):
 global ACTIVE_PALETTE,ACTIVE_FONT,ACTIVE_SCENE
 ACTIVE_PALETTE=palette;ACTIVE_FONT=font;ACTIVE_SCENE=scene;r.SCENE=scene
 fn={'home':lambda:b.home(r.T),'inbox-desktop':lambda:r.inbox(), 'agent':lambda:b.agent(r.T),'widget-desktop':lambda:b.widget(r.T),'inbox-mobile':lambda:r.inbox(True),'widget-mobile':lambda:b.widget(r.T,True)}[scene]
 fn()
def build():
 for p in PALETTES:
  for f,_ in FONTS:
   for scene in ('home','inbox-desktop'):draw(p,f,scene)
 for scene in ('agent','widget-desktop','inbox-mobile','widget-mobile'):draw(PREFERRED_PALETTE,PREFERRED_FONT,scene)
 (HERE/'tokens-color-reset.json').write_text(json.dumps({'preferred_palette':PREFERRED_PALETTE,'preferred_font':PREFERRED_FONT,'palettes':PALETTES,'geometry_source':'../refinement-v1','geometry':'unchanged','outputs':OUTPUTS,'type_width_overflows':TYPE_OVERFLOWS},indent=2))
 css=['/* Design-only palette studies. No production import. */']
 for k,p in PALETTES.items():
  css.append('.color-study-'+k+' {')
  for name,value in p.items():
   if name!='name':css.append('  --'+name+': '+value+';')
  css.append('}')
 (HERE/'tokens-color-reset.css').write_text('\n'.join(css)+'\n')
 print(json.dumps({'frames':len(OUTPUTS),'palette_frames':10,'additional_type_frames':12,'type_width_overflows':TYPE_OVERFLOWS},indent=2))
if __name__=='__main__':build()
