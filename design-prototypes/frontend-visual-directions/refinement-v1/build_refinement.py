"""Direction 3-only, design-only refinement. Original artwork remains immutable.
Reuse only the existing artwork renderer and Direction 3 fixture; no app imports.
"""
from pathlib import Path
import sys,importlib.util,json
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent;BASE=HERE.parent
spec=importlib.util.spec_from_file_location('avenlyo_original_artwork',BASE/'build.py')
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
OriginalSVG=b.SVG;SCENE='';DRAWINGS=[]
b.OUT=HERE/'mockups';b.OUT.mkdir(exist_ok=True)
T=dict(b.T[2]);T.update(name='Contemporary AI Product / Refined',selection='#EDE6DF',subtle='#F4F1EC',radius=10,row=96)
EXTRA={
 'ai_fill':'#F2F0EB','home_attention_fill':'#F1E9E2','summary_fill':'#F4F1EC',
 'widget_customer_fill':'#E6E1D9','handling_text':'#E8DDD2','handling_muted':'#D8D1CB',
 'radius_work':10,'radius_home_attention':8,'radius_summary':8,'radius_selected_row':6,
 'radius_inbox_message':10,'radius_composer':8,'radius_widget':22,'radius_widget_message':15,
 'handling_height':72,'mobile_handling_height':57,'composer_height':116,'mobile_composer_height':98,
 'message_author_offset':17,'message_gap':9,'mobile_message_gap':6,
 'message_vertical_padding':14,'mobile_message_vertical_padding':12,
}
class SVG(OriginalSVG):
 def __init__(self,w,h,t):
  self.scene=SCENE;self.message_log=[];self.rect_log=[]
  super().__init__(w,h,t)
 def rect(self,x,y,w,h,fill,rx=0,stroke=None,sw=1):
  if self.scene=='home':
   if y==202 and h==544:rx=10
   if y==266 and h==240:fill=EXTRA['home_attention_fill'];rx=8
  if self.scene=='agent':
   if y==211 and h==642:rx=10
   if y==307 and h==399:fill=EXTRA['summary_fill'];rx=8
  if self.scene.startswith('widget'):
   if h in (46,52) or (fill==T['accent'] and w==60):rx=12
   if fill=='#E3E3DD':rx=30
   if fill=='#DADCD5':rx=28
  self.rect_log.append(dict(x=x,y=y,w=w,h=h,fill=fill,radius=rx))
  super().rect(x,y,w,h,fill,rx,stroke,sw)
 def save(self,name):
  final=name.replace('03-ai-product','03-ai-product-refined')
  super().save(final);DRAWINGS.append(dict(name=final,size=[self.w,self.h],messages=self.message_log,rects=self.rect_log))
b.SVG=SVG

def message(s,x,y,w,role,txt,size=None,mobile=False,widget=False):
 t=s.t;size=size or t['msg'];customer=role=='customer';maxw=w*(.94 if mobile else .84);pad=10 if mobile else 12;lh=20 if mobile else 22
 # Widget stays deliberately soft and keeps its original spacing and type.
 voffset=19 if widget else EXTRA['message_author_offset'];vpad=16 if widget else EXTRA['mobile_message_vertical_padding'] if mobile else EXTRA['message_vertical_padding']
 lines=b.wrap(txt,maxw-pad*2,size,t['font']);bw=min(maxw,max(b.tw(a,size,t['font']) for a in lines)+pad*2+.2);bh=len(lines)*lh+vpad
 right=(customer and widget) or (not customer and not widget);bx=x+w-bw if right else x
 author='You' if widget and customer else 'Customer' if customer else 'Avenlyo' if widget else 'Avenlyo · AI'
 s.text(bx+bw if right else bx,y,author,12,t['muted'],500,align='right' if right else 'left')
 fill=EXTRA['widget_customer_fill'] if widget and customer else t['subtle'] if customer else EXTRA['ai_fill']
 radius=EXTRA['radius_widget_message'] if widget else EXTRA['radius_inbox_message']
 s.rect(bx,y+voffset,bw,bh,fill,radius)
 s.text(bx+pad,y+voffset+vpad/2,txt,size,t['text'],width=bw-pad*2,lh=lh)
 end=y+voffset+bh
 s.message_log.append(dict(role=role,text=txt,size=size,line_height=lh,y=y,end=end,radius=radius,fill=fill,vertical_padding=vpad))
 return end
b.message=message

def inbox(mobile=False):
 t=T;s=SVG(390 if mobile else 1440,844 if mobile else 900,t)
 if mobile:
  s.rect(0,0,390,826,t['surface']);s.icon(14,19,'back',22);s.text(47,14,'Alex Morgan',16,weight=650);s.text(47,36,'Website Chat',11.5,t['muted']);s.icon(300,18,'context',22);s.icon(349,18,'menu',22);s.line(0,62,390,62)
  s.icon(16,74,'pause',16,t['attention']);s.text(40,74,'Needs human · AI paused',12.5,t['attention'],600);s.text(16,96,'Unclaimed',12,t['muted']);s.text(374,96,'Context',12,t['accent'],500,align='right');s.line(0,119,390,119)
  yy=135
  for role,txt in b.TRANSCRIPT:yy=message(s,16,yy,358,role,txt,13.5,True)+6
  assert yy-6<728,'Mobile transcript overlaps composer'
  s.rect(0,728,390,98,t['surface']);s.line(0,728,390,728);s.text(16,739,'Your human reply',12,t['muted'],500);s.text(16,758,'Claim this conversation to reply.',12,t['muted']);s.button(16,778,'Claim conversation',358,h=44)
  b.fixture(s,True);s.save(t['id']+'-inbox-mobile');return
 x=b.shell(s,'Inbox');master=t['master'];cx=1440-t['context'];tx=x+master;ww=cx-tx
 s.rect(x,0,master,876,'#F6F2EC');s.line(tx,0,tx,876)
 s.text(x+24,26,'Inbox',22,weight=600);s.icon(tx-39,28,'refresh',17);s.text(x+24,62,'Recent customer conversations',12,t['muted']);s.line(x,92,tx,92)
 ry=108;s.rect(x+12,ry,master-24,96,t['selection'],6);s.rect(x+12,ry+12,2,72,t['accent'],1)
 s.text(x+28,ry+14,'Alex Morgan',14,weight=600);s.text(x+28,ry+39,'Automated answers are paused.',12.5,t['muted'],width=master-52,lh=18);s.text(x+28,ry+71,'Website Chat · Unclaimed',11.5,t['muted'])
 s.text(x+24,776,'Customer conversations only.',11.5,t['muted']);s.text(x+24,796,'Tests stay in Agent.',11.5,t['muted']);s.line(x,831,tx,831);s.text(x+24,849,'1 conversation',12,t['muted']);s.icon(tx-59,847,'back',16);s.icon(tx-30,847,'arrow',16)
 s.rect(tx,0,ww,876,t['surface']);s.text(tx+28,22,'Alex Morgan',20,weight=600);s.text(tx+28,50,'Website Chat',12,t['muted']);s.icon(cx-42,26,'context',20,t['accent']);s.line(tx,78,cx,78)
 s.rect(tx,79,ww,72,t['nav']);s.icon(tx+24,92,'pause',16,EXTRA['handling_text']);s.text(tx+47,92,'Needs human · AI paused',12.5,EXTRA['handling_text'],600);s.text(tx+24,120,'Unclaimed',12,EXTRA['handling_muted']);s.button(cx-193,96,'Claim conversation',169)
 yy=170
 for role,txt in b.TRANSCRIPT:yy=message(s,tx+28,yy,ww-56,role,txt)+9
 assert yy-9<760,'Desktop transcript overlaps composer'
 s.rect(tx,760,ww,116,t['surface']);s.line(tx,760,cx,760);s.text(tx+28,778,'Your human reply',12,t['muted'],500);s.rect(tx+28,803,ww-56,52,t['subtle'],8,t['border']);s.text(tx+42,816,'Claim this conversation to reply.',12,t['muted']);s.button(cx-191,813,'Send human reply',149,'disabled',h=32)
 s.rect(cx,0,t['context'],876,t['canvas']);s.line(cx,0,cx,876);s.text(cx+24,26,'Context',14,weight=600);s.icon(1403,25,'close',16);s.line(cx,78,1440,78)
 s.text(cx+24,108,'LINKED LEAD',10.5,t['muted'],500);s.text(cx+24,135,'Alex Morgan',17,weight=600);s.badge(cx+24,165,'Qualified','success');s.text(cx+24,207,'View linked lead →',12.5,t['accent'],600);s.line(cx+24,235,1416,235)
 s.text(cx+24,260,'Human ownership',12,t['muted']);s.text(cx+24,285,'Unclaimed',14,weight=500);s.text(cx+24,320,'Claiming allows you to reply. AI stays paused.',12.5,t['muted'],width=t['context']-48,lh=20)
 s.line(cx+24,388,1416,388);s.text(cx+24,414,'Automation',12,t['muted']);s.icon(cx+24,442,'pause',16,t['attention']);s.text(cx+48,442,'AI paused',13,t['attention'],500)
 s.text(cx+24,482,'Resume AI',12.5,t['accent'],600);s.text(cx+24,509,'Let AI answer the next customer message.',12,t['muted'],width=t['context']-48,lh=20)
 b.fixture(s);s.save(t['id']+'-inbox-desktop')

def old_span(mobile):
 w=358 if mobile else 568;size=13.5 if mobile else 14.5;lh=20 if mobile else 22;pad=10 if mobile else 12;maxw=w*(.94 if mobile else .84)
 return sum(19+len(b.wrap(txt,maxw-pad*2,size,'manrope'))*lh+16 for _,txt in b.TRANSCRIPT)+(8 if mobile else 13)*5

def build():
 global SCENE
 for SCENE,fn in [('home',lambda:b.home(T)),('inbox-desktop',lambda:inbox()),('agent',lambda:b.agent(T)),('widget-desktop',lambda:b.widget(T)),('inbox-mobile',lambda:inbox(True)),('widget-mobile',lambda:b.widget(T,True))]:fn()
 metrics={}
 for d in DRAWINGS:
  if 'inbox' in d['name']:
   old=old_span('mobile' in d['name']);new=d['messages'][-1]['end']-d['messages'][0]['y'];metrics[d['name']]={'before_message_stack':old,'after_message_stack':new,'height_reduction_pct':round((1-new/old)*100,2),'capacity_increase_pct':round((old/new-1)*100,2),'messages':d['messages']}
 (HERE/'tokens-refined.json').write_text(json.dumps({'inherited_direction':3,'tokens':T,'component_tokens':EXTRA,'density_measurements':metrics,'drawings':DRAWINGS},indent=2))
 values={'--canvas':T['canvas'],'--surface':T['surface'],'--navigation':T['nav'],'--accent':T['accent'],'--accent-hover':T['hover'],'--font-ui':'"Manrope", system-ui, sans-serif','--selection':T['selection'],'--customer-fill':T['subtle'],'--ai-fill':EXTRA['ai_fill'],'--home-attention-fill':EXTRA['home_attention_fill'],'--summary-fill':EXTRA['summary_fill'],'--widget-customer-fill':EXTRA['widget_customer_fill'],'--handling-text':EXTRA['handling_text'],'--handling-muted':EXTRA['handling_muted'],'--radius-control':'10px','--radius-work':'10px','--radius-home-attention':'8px','--radius-summary':'8px','--radius-selected-row':'6px','--radius-inbox-message':'10px','--radius-composer':'8px','--radius-widget':'22px','--radius-widget-message':'15px','--radius-widget-control':'12px','--conversation-row-height':'96px','--handling-height':'72px','--mobile-handling-height':'57px','--composer-height':'116px','--mobile-composer-height':'98px','--message-gap':'9px','--mobile-message-gap':'6px','--message-author-offset':'17px','--message-vertical-padding':'14px','--mobile-message-vertical-padding':'12px'}
 (HERE/'tokens-refined.css').write_text('/* Design-only handoff. Production does not import this file. */\n.direction3-refined {\n'+''.join('  '+k+': '+v+';\n' for k,v in values.items())+'}\n')
 print(json.dumps(metrics,indent=2))
if __name__=='__main__':build()
