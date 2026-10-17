"""Design-only artwork generator. No production imports, services or app runtime.
Run with Python + Pillow + fontTools; render resulting SVGs with render.mjs.
All text is outlined from bundled OFL fonts for portable, exact review.
"""
from pathlib import Path
from xml.sax.saxutils import escape
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from PIL import ImageFont
import json, re
ROOT=Path(__file__).resolve().parent
FONT=ROOT/'assets/fonts'
OUT=ROOT/'mockups';OUT.mkdir(exist_ok=True)
FONT_KEYS=['inter','geist','ibm-plex-sans','manrope','instrument-sans','newsreader','source-serif','instrument-serif','system-ui-review']
FONTS={k:TTFont(FONT/(k+'.ttf')) for k in FONT_KEYS}
FM={}
def fm(key,weight=400):
    ck=(key,weight)
    if ck not in FM:
        ft=FONTS[key];loc={};pf=ImageFont.truetype(str(FONT/(key+'.ttf')),1000)
        if 'fvar' in ft:
            vals=[]
            for a in ft['fvar'].axes:
                v=weight if a.axisTag=='wght' else 100 if a.axisTag=='wdth' else 24 if a.axisTag=='opsz' else a.defaultValue
                v=max(a.minValue,min(a.maxValue,v));loc[a.axisTag]=v;vals.append(v)
            pf.set_variation_by_axes(vals)
        FM[ck]=(ft,ft.getGlyphSet(location=loc),pf,ft['head'].unitsPerEm)
    return FM[ck]
def tw(s,size,key,weight=400):return fm(key,weight)[2].getlength(s)/1000*size

def wrap(s,width,size,key,weight=400):
    lines=[]
    for para in s.split('\n'):
        line=''
        for word in para.split():
            test=(line+' '+word).strip()
            if line and tw(test,size,key,weight)>width+.1:lines.append(line);line=word
            else:line=test
        lines.append(line)
    return lines

T=[
 dict(id='01-editorial',name='Editorial Front Office',font='ibm-plex-sans',display='newsreader',canvas='#F7F5F0',surface='#FFFEFB',nav='#ECE8DF',text='#252923',muted='#66675F',border='#DAD7CD',accent='#763C48',hover='#5C2934',selection='#E9E0E1',subtle='#F0EEE8',success='#326247',successfill='#EAF2E9',attention='#825018',attentionfill='#F8EBD4',danger='#AE323B',focus='#763C48',side=232,master=320,context=264,radius=5,gutter=44,row=112,button=38,input=40,msg=15,shadow='0 16px 48px rgba(37,41,35,.14)'),
 dict(id='02-precision',name='Precision Workspace',font='geist',display='geist',canvas='#F7F8FA',surface='#FFFFFF',nav='#F2F4F7',text='#192330',muted='#596575',border='#DFE4EA',accent='#245BD1',hover='#1748B0',selection='#E8EFFD',subtle='#F1F4F8',success='#256348',successfill='#E8F3ED',attention='#825016',attentionfill='#FFF2DC',danger='#B13442',focus='#245BD1',side=216,master=312,context=260,radius=6,gutter=32,row=100,button=34,input=36,msg=14,shadow='0 8px 28px rgba(25,35,48,.12)'),
 dict(id='03-ai-product',name='Contemporary AI Product',font='manrope',display='manrope',canvas='#F1EEEA',surface='#FFFEFC',nav='#272321',text='#2B2725',muted='#69615C',border='#DED8D1',accent='#A6442A',hover='#87341E',selection='#F4E5DC',subtle='#F4F0EA',success='#426446',successfill='#ECF1E7',attention='#845119',attentionfill='#F9ECD6',danger='#B32F3B',focus='#A6442A',side=224,master=320,context=272,radius=12,gutter=36,row=108,button=38,input=40,msg=14.5,shadow='0 20px 56px rgba(43,39,37,.18)'),
]
class SVG:
 def __init__(self,w,h,t):
    self.w=w;self.h=h;self.t=t;self.parts=[];self.defs={};self.rect(0,0,w,h,t['canvas'])
 def rect(self,x,y,w,h,fill,rx=0,stroke=None,sw=1):
    self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="{sw}"' if stroke else '')+'/>')
 def line(self,x1,y1,x2,y2,c=None,sw=1):self.parts.append(f'<path d="M{x1} {y1}H{x2}" fill="none" stroke="{c or self.t["border"]}" stroke-width="{sw}"/>' if y1==y2 else f'<path d="M{x1} {y1}L{x2} {y2}" fill="none" stroke="{c or self.t["border"]}" stroke-width="{sw}"/>')
 def circle(self,x,y,r,c):self.parts.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>')
 def text(self,x,y,s,size=14,color=None,weight=400,font=None,width=None,lh=None,align='left'):
    key=font or self.t['font'];color=color or self.t['text'];lines=wrap(s,width,size,key,weight) if width else s.split('\n');lh=lh or size*1.5
    ft,gs,pf,upem=fm(key,weight);cmap=ft.getBestCmap()
    for li,txt in enumerate(lines):
        start=x-tw(txt,size,key,weight) if align=='right' else x-tw(txt,size,key,weight)/2 if align=='center' else x
        uses=[]
        for i,ch in enumerate(txt):
            gn=cmap.get(ord(ch));
            if not gn:continue
            ident='g'+str(FONT_KEYS.index(key))+'_'+str(weight)+'_'+str(ord(ch))
            if ident not in self.defs:
                pen=SVGPathPen(gs);gs[gn].draw(pen);self.defs[ident]=f'<path id="{ident}" d="{pen.getCommands()}"/>'
            # Pair kerning from actual rendered font, including Turkish glyph metrics.
            offset=(pf.getlength(txt[:i+1])-pf.getlength(ch))/1000*size if i else 0
            uses.append(f'<use href="#{ident}" transform="translate({start+offset:.3f} {y+li*lh+size*.83:.3f}) scale({size/upem:.7f} {-size/upem:.7f})"/>')
        self.parts.append(f'<g fill="{color}" role="img" aria-label="{escape(txt, {chr(34): "&quot;"})}">{"".join(uses)}</g>')
    return len(lines)*lh
 def icon(self,x,y,name,size=18,c=None):
    paths={
    'home':'M3 10 12 3l9 7v10h-6v-6H9v6H3Z',
    'inbox':'M4 4h16v15H4Z M4 13h5l2 3h2l2-3h5',
    'leads':'M6 4h12v16H6Z M9 8h6 M9 12h6 M9 16h3',
    'agent':'M7 7h10v10H7Z M10 3v4 M14 3v4 M10 17v4 M14 17v4 M3 10h4 M17 10h4 M3 14h4 M17 14h4',
    'knowledge':'M4 4h7v16H4Z M13 4h7v16h-7',
    'channels':'M5 12h14 M12 5v14 M4 8V4h4 M16 4h4v4 M20 16v4h-4 M8 20H4v-4',
    'settings':'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
    'arrow':'M5 12h14 M14 7l5 5-5 5','back':'M15 5l-7 7 7 7',
    'chevron':'M8 10l4 4 4-4','check':'M5 12l4 4 10-10',
    'pause':'M9 6v12 M15 6v12','refresh':'M20 8a8 8 0 1 0 0 8 M20 3v5h-5',
    'chat':'M4 4h16v13H9l-5 4Z','close':'M6 6l12 12 M18 6 6 18',
    'globe':'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M3 12h18 M12 3c5 6 5 12 0 18-5-6-5-12 0-18',
    'instagram':'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M17 7h.01',
    'book':'M4 4h7l1 2 1-2h7v15h-7l-1 2-1-2H4Z M12 6v15',
    'menu':'M4 7h16 M4 12h16 M4 17h16','context':'M4 4h16v16H4Z M15 4v16',
    'lock':'M7 10V8a5 5 0 0 1 10 0v2 M5 10h14v11H5Z','send':'m4 4 17 8-17 8 4-8-4-8 M8 12h13',
    'attention':'M12 3 22 21H2Z M12 9v5 M12 17h.01',
    }
    self.parts.append(f'<path d="{paths.get(name,paths["chat"])}" transform="translate({x} {y}) scale({size/24})" stroke="{c or self.t["muted"]}" stroke-width="1.65" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
 def button(self,x,y,label,w=None,kind='primary',h=None,icon=None):
    t=self.t;h=h or t['button'];w=w or tw(label,13,t['font'],600)+28+(24 if icon else 0)
    bg=t['accent'] if kind=='primary' else t['subtle'] if kind=='disabled' else t['surface'];fg='#FFFFFF' if kind=='primary' else t['muted'] if kind=='disabled' else t['text']
    self.rect(x,y,w,h,bg,t['radius'] if kind!='quiet' else 0,t['border'] if kind=='secondary' else None)
    tx=x+(14 if icon else w/2);self.text(tx,y+(h-14)/2,label,13,fg,600,align='left' if icon else 'center')
    if icon:self.icon(x+w-28,y+(h-16)/2,icon,16,fg)
    return w
 def badge(self,x,y,label,kind='attention'):
    t=self.t;fg=t.get(kind,t['muted']);bg=t.get(kind+'fill',t['subtle']);w=tw(label,12,t['font'],500)+20
    self.rect(x,y,w,24,bg,4 if t['id'][0:2]!='03' else 7);self.text(x+10,y+6,label,12,fg,500);return w
 def save(self,name):
    self.parts.append(f'<title>{escape(name)} — Fictional design fixture. Not a production interface.</title>')
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}" role="img"><defs>{"".join(self.defs.values())}</defs>{"".join(self.parts)}</svg>'
    (OUT/(name+'.svg')).write_text(svg)

def fixture(s,mobile=False):
    h=18 if mobile else 24;y=s.h-h
    s.rect(0,y,s.w,h,'#E8E6E1' if s.t['id']!='02-precision' else '#E9EDF3')
    s.text(12,y+6,'FICTIONAL DESIGN FIXTURE · '+('AVENLYO VISUAL STUDY' if mobile else s.t['name'].upper()+' · Northstar Studio · No customer or backend data'),9.5,'#565B60',500,font='geist')

def shell(s,page):
    t=s.t;side=t['side'];dark=t['id']=='03-ai-product';fg='#F5F0E9' if dark else t['text'];muted='#BFB4AC' if dark else t['muted']
    s.rect(0,0,side,876,t['nav']);s.line(side,0,side,876)
    if dark:
        s.rect(22,26,27,27,'#DDAE91',8);s.text(35.5,30,'a',22,'#272321',600,align='center');s.text(60,29,'avenlyo',23,fg,700)
    else:s.text(24,29,'avenlyo',25,fg,600,font='instrument-sans' if t['id']=='01-editorial' else 'geist')
    s.rect(16,84,side-32,54,'#332C28' if dark else ('#F4F1EA' if t['id']=='01-editorial' else '#FFFFFF'),8 if dark else 5, None if dark else t['border'])
    s.rect(28,98,27,27,'#51443C' if dark else t['subtle'],5);s.text(41.5,104,'N',13,fg,600,align='center')
    s.text(65,97,'Northstar',13,fg,600);s.text(65,115,'Studio',11.5,muted);s.icon(side-39,103,'chevron',16,muted)
    entries=[('Home','home',178),('Inbox','inbox',222),('Leads','leads',266),('Agent','agent',374),('Knowledge','knowledge',418),('Channels','channels',462)]
    s.text(28,340,'SETUP',10.5,muted,500)
    for name,ic,y in entries:
        sel=name==page
        if sel:
            s.rect(14,y-9,side-28,38,'#44342E' if dark else (t['surface'] if t['id']=='01-editorial' else t['selection']),8 if dark else 5)
            if not dark:s.rect(14,y-1,2,22,t['accent'],1)
        c=('#F5D4BD' if dark else t['accent']) if sel else fg if dark else t['muted']
        s.icon(28,y,ic,18,c);s.text(57,y+2,name,14,c,600 if sel else 400)
    s.line(24,808,side-24,808,'#4A403B' if dark else t['border']);s.icon(28,834,'settings',18,muted);s.text(57,836,'Settings',13,muted)
    return side

def chrome(s,page,title=None):
    x=s.t['side'];s.rect(x,0,1440-x,64,s.t['surface']);s.line(x,64,1440,64)
    s.text(x+28,24,title or page,14,s.t['text'],600)
    s.text(1408,25,'Northstar Studio',12,s.t['muted'],align='right')

def home(t):
    s=SVG(1440,900,t);x=shell(s,'Home');chrome(s,'Home');g=t['gutter'];l=x+g;r=1440-g;wide=r-l
    title_size=42 if t['id']=='01-editorial' else 34
    s.text(l,106,'Your AI front office',title_size,weight=500 if t['id']=='01-editorial' else 650,font=t['display'])
    s.text(l,161,'Customer conversations, ready for your attention.',14,t['muted'])
    s.button(r-282,112,'Test agent',108,'secondary');s.button(r-162,112,'Open Inbox',162,icon='arrow')
    gap=40 if t['id']=='01-editorial' else 32;rw=300;mw=wide-rw-gap;rx=l+mw+gap
    if t['id']=='01-editorial':
        s.rect(l-20,202,mw+40,534,t['surface'],0)
    elif t['id']=='03-ai-product':
        s.rect(l-18,202,wide+36,544,t['surface'],18)
    s.text(l,218,'Needs human',16,weight=600);s.text(l+mw,221,'Website Chat',12,t['muted'],align='right')
    s.line(l,250,l+mw,250,t['text'] if t['id']=='01-editorial' else t['border'],1)
    if t['id']=='03-ai-product':s.rect(l,266,mw,240,t['selection'],14);s.rect(l,287,3,196,t['accent'],1)
    elif t['id']=='02-precision':s.rect(l,266,mw,172,t['surface'],8,t['border'])
    tx=l+24 if t['id']!='01-editorial' else l;ty=286 if t['id']!='01-editorial' else 275
    if t['id']=='02-precision':
        s.text(tx,ty,'Alex Morgan',21,weight=650);s.text(tx,ty+34,'Logo design',13,t['muted']);s.badge(l+mw-121,ty,'AI paused');s.text(l+mw-121,ty+33,'Unclaimed',12,t['muted']);s.text(tx,ty+77,'“I’d like to speak with a person.”',14);s.text(l+mw-24,ty+121,'Open conversation →',13,t['accent'],600,align='right')
    else:
        s.badge(tx,ty,'AI paused');s.text(tx+110,ty+6,'Unclaimed',12,t['muted'])
        s.text(tx,ty+48,'Alex Morgan',29 if t['id']=='01-editorial' else 25,weight=500 if t['id']=='01-editorial' else 650,font=t['display'])
        s.text(tx,ty+88,'Logo design',15,t['muted']);s.text(tx,ty+121,'“I’d like to speak with a person.”',16,width=mw-52)
        s.text(tx,ty+169,'Open conversation',13,t['accent'],600);s.icon(tx+139,ty+166,'arrow',17,t['accent'])
    if t['id']=='01-editorial':s.line(l,493,l+mw,493)
    # A factual readiness ledger; deliberately no completeness score.
    s.text(rx,218,'Answering readiness',16,weight=600);s.line(rx,250,r,250)
    for i,(ic,title,detail,kind) in enumerate([('book','Published knowledge','4 published items','success'),('globe','Website Chat','Active','success'),('instagram','Instagram','Setup required','attention')]):
        yy=275+i*84;s.icon(rx,yy+4,ic,20);s.text(rx+34,yy,title,13,weight=600);s.text(rx+34,yy+25,detail,13,t[kind]);s.icon(r-18,yy+14,'arrow',16);s.line(rx,yy+63,r,yy+63)
    ry=506 if t['id']=='02-precision' else 562
    s.text(l,ry,'Recent conversation',16,weight=600);s.text(l+mw,ry+3,'Open Inbox',12,t['accent'],600,align='right');s.line(l,ry+34,l+mw,ry+34)
    s.text(l+4,ry+53,'CUSTOMER / INQUIRY',10.5,t['muted'],500);s.text(l+mw-164,ry+53,'HANDLING',10.5,t['muted'],500)
    s.text(l+4,ry+85,'Alex Morgan',14,weight=600);s.text(l+4,ry+109,'Logo design · Website Chat',12,t['muted']);s.text(l+mw-164,ry+85,'Needs human',12,t['attention'],500);s.text(l+mw-164,ry+109,'AI paused · Unclaimed',11.5,t['muted']);s.line(l,ry+146,l+mw,ry+146)
    s.text(rx,574,'Saved behavior',14,weight=600);s.text(rx,608,'Professional tone. Answers from published knowledge. Human handoff always available.',13,t['muted'],width=rw,lh=21);s.text(rx,695,'View Agent',13,t['accent'],600);s.icon(rx+78,693,'arrow',16,t['accent'])
    s.text(l,794,'Real customer work lives in Inbox.',12,t['muted']);s.text(l,816,'Test agent and test history stay in Agent.',12,t['muted'])
    fixture(s);s.save(t['id']+'-home-desktop')

TRANSCRIPT=[
 ('customer',"Hi, I'm interested in your logo design."),
 ('assistant',"Absolutely. Our published pricing lists logo design at $50.\nIf you'd like, share your name and email and I can save your inquiry for team follow-up."),
 ('customer',"I'm Alex. My email is alex@example.test."),
 ('assistant',"Thanks, Alex. Your inquiry has been saved for team follow-up."),
 ('customer',"I'd like to speak with a person."),
 ('assistant',"A team member can continue this conversation.\nAutomated answers are paused.")]

def message(s,x,y,w,role,txt,size=None,mobile=False,widget=False):
    t=s.t;size=size or t['msg'];customer=role=='customer';maxw=w*(.94 if mobile else .84);pad=12 if not mobile else 10;lh=20 if mobile else 22
    lines=wrap(txt,maxw-pad*2,size,t['font']);bw=min(maxw,max(tw(a,size,t['font']) for a in lines)+pad*2+.2);bh=len(lines)*lh+16
    bx=x+w-bw if (customer and widget) or (not customer and not widget) else x
    author='You' if widget and customer else 'Customer' if customer else 'Avenlyo · AI' if not widget else 'Avenlyo'
    s.text(bx+bw if ((customer and widget) or(not customer and not widget)) else bx,y,author,12,t['muted'],500,align='right' if ((customer and widget) or(not customer and not widget)) else 'left')
    # AI and customer authorship is explicit; bubble hue is only supporting hierarchy.
    fill=(t['accent'] if customer and widget else t['subtle'] if customer else t['selection'] if t['id']=='03-ai-product' else t['surface'])
    stroke=t['border'] if not customer and t['id']=='02-precision' and not widget else None
    s.rect(bx,y+19,bw,bh,fill,t['radius']+3,stroke)
    s.text(bx+pad,y+27,txt,size,'#FFFFFF' if customer and widget else t['text'],width=bw-pad*2,lh=lh)
    return y+19+bh

def inbox(t,mobile=False):
    s=SVG(390 if mobile else 1440,844 if mobile else 900,t)
    if mobile:
        s.rect(0,0,390,826,t['surface']);s.icon(14,19,'back',22);s.text(47,14,'Alex Morgan',16,weight=650);s.text(47,36,'Website Chat',11.5,t['muted']);s.icon(300,18,'context',22);s.icon(349,18,'menu',22);s.line(0,62,390,62)
        s.icon(16,77,'pause',16,t['attention']);s.text(40,77,'Needs human · AI paused',12.5,t['attention'],600);s.text(16,100,'Unclaimed',12,t['muted']);s.text(374,100,'Context',12,t['accent'],500,align='right');s.line(0,127,390,127)
        yy=144
        for role,txt in TRANSCRIPT:yy=message(s,16,yy,358,role,txt,13.5,True)+8
        # The fixed unclaimed state gates the human composer.
        s.rect(0,716,390,110,t['surface']);s.line(0,716,390,716);s.text(16,729,'Your human reply',12,t['muted'],500);s.text(16,751,'Claim this conversation to reply.',12,t['muted']);s.button(16,778,'Claim conversation',358,h=44)
        fixture(s,True);s.save(t['id']+'-inbox-mobile');return
    x=shell(s,'Inbox');master=t['master'];cx=1440-t['context'];tx=x+master;ww=cx-tx
    s.rect(x,0,master,876,t['surface'] if t['id']=='01-editorial' else t['nav'] if t['id']=='02-precision' else '#F6F2EC');s.line(tx,0,tx,876)
    s.text(x+24,26,'Inbox',22,weight=600);s.icon(tx-39,28,'refresh',17);s.text(x+24,62,'Recent customer conversations',12,t['muted']);s.line(x,92,tx,92)
    ry=108;s.rect(x+12,ry,master-24,t['row'],t['selection'],t['radius']);s.rect(x+12,ry+12,2,t['row']-24,t['accent'],1)
    s.text(x+28,ry+16,'Alex Morgan',14,weight=600);s.text(x+28,ry+43,'Automated answers are paused.',12.5,t['muted'],width=master-52,lh=18);s.text(x+28,ry+76,'Website Chat · Unclaimed',11.5,t['muted'])
    s.text(x+24,776,'Customer conversations only.',11.5,t['muted']);s.text(x+24,796,'Tests stay in Agent.',11.5,t['muted']);s.line(x,831,tx,831);s.text(x+24,849,'1 conversation',12,t['muted']);s.icon(tx-59,847,'back',16);s.icon(tx-30,847,'arrow',16)
    s.rect(tx,0,ww,876,t['surface']);s.text(tx+28,22,'Alex Morgan',20,weight=600);s.text(tx+28,50,'Website Chat',12,t['muted']);s.icon(cx-42,26,'context',20,t['accent']);s.line(tx,78,cx,78)
    ai=t['id']=='03-ai-product';s.rect(tx,79,ww,81,t['nav'] if ai else t['attentionfill']);s.icon(tx+24,94,'pause',16,'#F5D4BD' if ai else t['attention']);s.text(tx+47,94,'Needs human · AI paused',12.5,'#F5D4BD' if ai else t['attention'],600);s.text(tx+24,124,'Unclaimed',12,'#D5C5B9' if ai else t['muted']);s.button(cx-193,103,'Claim conversation',169)
    yy=183
    for role,txt in TRANSCRIPT:yy=message(s,tx+28,yy,ww-56,role,txt)+13
    s.rect(tx,746,ww,130,t['surface']);s.line(tx,746,cx,746);s.text(tx+28,764,'Your human reply',12,t['muted'],500);s.rect(tx+28,789,ww-56,62,t['subtle'],t['radius'],t['border']);s.text(tx+42,804,'Claim this conversation to reply.',12,t['muted']);s.button(cx-191,807,'Send human reply',149,'disabled',h=32)
    # Context only contains fields in current payload. Email stays in the transcript.
    s.rect(cx,0,t['context'],876,t['canvas']);s.line(cx,0,cx,876);s.text(cx+24,26,'Context',14,weight=600);s.icon(1403,25,'close',16);s.line(cx,78,1440,78)
    s.text(cx+24,108,'LINKED LEAD',10.5,t['muted'],500);s.text(cx+24,141,'Alex Morgan',17,weight=600);s.badge(cx+24,175,'Qualified','success');s.text(cx+24,225,'View linked lead →',12.5,t['accent'],600);s.line(cx+24,265,1416,265)
    s.text(cx+24,292,'Human ownership',12,t['muted']);s.text(cx+24,320,'Unclaimed',14,weight=500);s.text(cx+24,363,'Claiming allows you to reply. AI stays paused.',12.5,t['muted'],width=t['context']-48,lh=20)
    s.line(cx+24,438,1416,438);s.text(cx+24,464,'Automation',12,t['muted']);s.icon(cx+24,496,'pause',16,t['attention']);s.text(cx+48,496,'AI paused',13,t['attention'],500)
    s.text(cx+24,541,'Resume AI',12.5,t['accent'],600);s.text(cx+24,568,'Let AI answer the next customer message.',12,t['muted'],width=t['context']-48,lh=20)
    fixture(s);s.save(t['id']+'-inbox-desktop')

def checkbox(s,x,y,label,checked=True,sub=None,locked=False):
    t=s.t;s.rect(x,y,17,17,t['accent'] if checked else t['surface'],4,t['accent'] if checked else '#858D96');
    if checked:s.icon(x+2,y+2,'check',13,'#FFFFFF')
    s.text(x+30,y+1,label,14,weight=500)
    if sub:s.text(x+30,y+24,sub,12,t['muted'])

def agent(t):
    s=SVG(1440,900,t);x=shell(s,'Agent');chrome(s,'Agent');g=(1440-x-1040)/2;l=x+g;r=1440-g
    if t['id']=='03-ai-product':s.rect(l-24,211,1088,642,t['surface'],18)
    s.text(l,99,'Agent',38 if t['id']=='01-editorial' else 32,weight=500 if t['id']=='01-editorial' else 650,font=t['display']);s.button(r-130,101,'Test agent',130,'secondary',icon='arrow')
    for dx,label,sel in [(0,'Behavior',True),(112,'Test Agent',False),(239,'Test history',False)]:
        s.text(l+dx,161,label,13,t['accent'] if sel else t['muted'],600 if sel else 400)
    s.line(l,192,r,192);s.line(l,192,l+76,192,t['accent'],2)
    s.text(l,221,'How your front office works',23 if t['id']=='01-editorial' else 21,weight=500 if t['id']=='01-editorial' else 650,font=t['display']);s.text(l,259,'A clear operating brief for customer conversations.',13,t['muted'])
    rw=292;rx=r-rw;editorw=rx-l-48
    # Four numbered sections on a single plane, never generic settings cards.
    def section(num,label,y):
        s.text(l,y,num,12,t['accent'],600);s.text(l+39,y-1,label,16,weight=600)
    section('01','Help customers',309)
    for i,(label,sub) in enumerate([('Answer customer questions','Published facts only.'),('Identify customer interest',None),('Qualify inquiries',None),('Collect contact details',None)]):
        yy=344+[0,57,93,129][i];checkbox(s,l+(219 if t['id']=='02-precision' else 39),yy,label,True,sub)
    s.line(l,516,l+editorw,516);section('02','Tone',540)
    for j,(label,w) in enumerate([('Professional',142),('Warm',102),('Concise',110)]):
        xx=l+39+[0,151,262][j];s.rect(xx,574,w,38,t['selection'] if j==0 else t['surface'],t['radius'],t['accent'] if j==0 else t['border']);s.text(xx+w/2,587,label,13,t['accent'] if j==0 else t['muted'],500,align='center')
    s.line(l,637,l+editorw,637);section('03','Contact details',660)
    for dx,label,checked in [(0,'Name',True),(114,'Email',True),(227,'Phone',False),(344,'Company',False)]:checkbox(s,l+39+dx,695,label,checked)
    s.line(l,735,l+editorw,735);section('04','Human handoff',759);s.icon(l+39,788,'lock',16,t['muted']);s.text(l+65,789,'Always available',13,weight=500);s.text(l+39,814,'Your team explicitly resumes AI.',12,t['muted'])
    # Deterministic saved summary; planning note remains secondary and not runtime instructions.
    s.rect(rx,307,rw,399,t['selection'] if t['id']=='03-ai-product' else t['surface'],t['radius']+3,None if t['id']=='01-editorial' else t['border']);s.text(rx+24,332,'Effective behavior',16,weight=600);s.text(rx+24,365,'SAVED BEHAVIOR',10.5,t['muted'],500)
    yy=405
    for st in ['Answers from published knowledge','Recognizes customer interest','Qualifies inquiries','Requests name and email','Professional tone','Human assistance always available']:
        s.icon(rx+24,yy,'check',15,t['accent']);h=s.text(rx+49,yy,st,12.5,width=rw-72,lh=20);yy+=h+15
    s.text(rx+24,669,'4 published items',12,t['accent'],600)
    s.text(rx,739,'Planning note',13,weight=500);s.icon(r-18,736,'chevron',16);s.text(rx,766,'For your team. Not sent to the answering AI.',12,t['muted'],width=rw,lh=20)
    s.button(rx,817,'Save settings',rw)
    fixture(s);s.save(t['id']+'-agent-desktop')

def host(s):
    # Identical neutral fictional customer website in all three directions.
    s.rect(0,0,s.w,s.h,'#F2F2EF')
    if s.w<600:return
    s.text(66,40,'NORTHSTAR STUDIO',16,'#323532',600,font='instrument-sans');s.text(810,43,'Work     Services     About',13,'#686E68',font='instrument-sans');s.rect(1238,25,136,42,'#EBECE6',5, '#CFD2CA');s.text(1306,40,'Get in touch',13,'#323532',500,font='instrument-sans',align='center');s.line(66,102,1374,102,'#D1D4CC')
    s.text(66,166,'INDEPENDENT DESIGN STUDIO',11,'#70766F',500,font='instrument-sans');s.text(62,213,'Small studio.\nClear identities.',65,'#30372F',500,font='instrument-sans',lh=72)
    s.text(66,398,'Logo design and brand identity for businesses finding their next chapter.',18,'#6C736A',font='instrument-sans',width=540,lh=28)
    s.text(66,505,'Selected work',13,'#454D42',500,font='instrument-sans');s.line(66,538,954,538,'#D1D4CC')
    s.rect(66,565,420,240,'#E3E6DF',4);s.rect(508,565,446,240,'#D4D8D0',4)
    s.text(276,637,'NORTH /',38,'#636E5B',600,font='instrument-sans',align='center');s.text(276,681,'STUDIO',38,'#636E5B',600,font='instrument-sans',align='center')
    s.text(552,606,'FORM &\nFUNCTION',46,'#66705E',500,font='instrument-sans',lh=51);s.text(66,829,'Identity systems',12,'#72796E',font='instrument-sans');s.text(508,829,'Brand foundations',12,'#72796E',font='instrument-sans')

def widget(t,mobile=False):
    s=SVG(390 if mobile else 1440,844 if mobile else 900,t);host(s)
    x=8 if mobile else 1032;y=8 if mobile else 117;w=374 if mobile else 376;h=818 if mobile else 674
    # Restrained two-layer shadow, no glass or glow.
    if not mobile:
        s.rect(x-8,y+12,w+16,h+8,'#E3E3DD',t['radius']+18);s.rect(x-3,y+5,w+6,h+4,'#DADCD5',t['radius']+16)
    s.rect(x,y,w,h,t['surface'],16 if t['id']=='01-editorial' else 12 if t['id']=='02-precision' else 22,t['border'])
    hh=83 if t['id']=='03-ai-product' else 78
    if t['id']=='03-ai-product':s.rect(x+1,y+1,w-2,hh,t['nav'],21);s.rect(x+1,y+hh-17,w-2,18,t['nav'])
    headfg='#FFF8F0' if t['id']=='03-ai-product' else t['text'];headmuted='#D5C5B9' if t['id']=='03-ai-product' else t['muted']
    s.text(x+22,y+23,'Northstar Studio',17,headfg,600);s.text(x+22,y+51,'AI assistance by Avenlyo',12,headmuted);s.icon(x+w-42,y+24,'close',19,headfg)
    sy=y+hh;s.rect(x+1,sy,w-2,55,t['attentionfill']);s.icon(x+19,sy+17,'pause',16,t['attention']);s.text(x+44,sy+12,'Automated answers are paused.',12,t['attention'],500);s.text(x+44,sy+32,'A team member can continue.',11.5,t['attention'])
    yy=sy+77;s.text(x+w/2,yy,'Load earlier messages',11.5,t['accent'],500,align='center');yy+=33
    for role,txt in TRANSCRIPT[2:]:
        yy=message(s,x+20,yy,w-40,role,txt,14 if mobile else 14, mobile=True,widget=True)+20
    cy=y+h-105
    s.rect(x+1,cy,w-2,104,t['surface'],16);s.line(x+20,cy,x+w-20,cy)
    s.text(x+20,cy+17,'Your message',12,t['muted'],500);s.rect(x+18,cy+42,w-36,52 if mobile else 46,t['subtle'],t['radius'],t['border']);s.text(x+31,cy+58,'Write a message…',16 if mobile else 14,t['muted']);s.button(x+w-84,cy+(46 if mobile else 48),'Send',60,h=44 if mobile else 34)
    if not mobile:
        s.rect(x+w-56,812,56,56,t['accent'],28 if t['id']!='03-ai-product' else 19);s.icon(x+w-40,828,'chat',24,'#FFFFFF')
    fixture(s,mobile);s.save(t['id']+'-widget-'+('mobile' if mobile else 'desktop'))

def typography():
 t=T[1];s=SVG(1440,1870,t);s.rect(0,0,1440,1870,'#FFFFFF');s.text(48,38,'Type, in the work.',35,weight=650);s.text(48,91,'Actual font outlines · identical headings, labels, body copy and Turkish glyphs · font licenses bundled',14,t['muted']);
 for i,(key,title) in enumerate([('inter','Inter'),('geist','Geist'),('ibm-plex-sans','IBM Plex Sans'),('manrope','Manrope'),('instrument-sans','Instrument Sans'),('newsreader','Newsreader'),('source-serif','Source Serif 4'),('instrument-serif','Instrument Serif'),('system-ui-review','System UI / Linux')]):
    yy=152+i*182;s.line(48,yy-15,1392,yy-15);s.text(48,yy,title,16,weight=600,font='geist');s.text(48,yy+35,'400 only' if key in ('instrument-serif','system-ui-review') else '400 / 600',11,t['muted']);s.text(250,yy,'Your AI front office',32,weight=400 if key=='instrument-serif' else 600,font=key);s.text(250,yy+52,'Claim conversation    AI paused    Unclaimed',14,weight=400 if key=='instrument-serif' else 600,font=key);s.text(250,yy+86,'Answers from published knowledge. Your team explicitly resumes AI.',15,font=key);s.text(250,yy+121,'İ ı Ş ş Ğ ğ Ç ç Ö ö Ü ü  ·  İletişim, görüşme, müşteri, ölçü',18,font=key)
 s.text(48,1815,'System sample resolves to DejaVu Sans in this environment. SF is not bundled or falsely simulated.',13,t['muted']);s.save('typography-comparison')

def motion():
 for t in T:
    s=SVG(1440,900,t);s.text(48,34,t['name']+' / motion',32,weight=500 if t['id']=='01-editorial' else 650,font=t['display']);s.text(48,84,'DESIGN PROPOSAL · timings are specified, not measured from reference products',12,t['muted']);
    specs=[('Sidebar selection','Immediate marker; color only', '180ms' if t==T[0] else '90ms' if t==T[1] else '140ms'),('Conversation selection','Immediate; never crossfade identities','0ms'),('New message','Opacity 0→1; rise 3px','180ms' if t==T[0] else '100ms' if t==T[1] else '160ms'),('Context / drawer','Opacity 0→1; translate 12px','220ms' if t==T[0] else '160ms' if t==T[1] else '200ms'),('Claim confirmed','Text + permission after confirmation','0ms'),('AI paused / Resume AI','Text after confirmation; no pulse','0ms'),('Modal','Opacity 0→1; rise 4px','180ms' if t==T[0] else '120ms' if t==T[1] else '180ms'),('Widget opening','Opacity 0→1; rise 8px','240ms' if t==T[0] else '180ms' if t==T[1] else '220ms'),('Button press','Color only; no scale','80ms' if t==T[0] else '70ms' if t==T[1] else '90ms')]
    for i,(name,behavior,duration) in enumerate(specs):
        yy=145+i*71;s.line(48,yy-13,1392,yy-13);s.text(48,yy,name,14,weight=600);s.text(330,yy,behavior,14,t['muted']);s.text(1100,yy,duration,14,t['accent'],600);s.rect(1215,yy+3,145,8,t['subtle'],4)
        dur=int(duration[:-2]);s.rect(1215,yy+3,max(3,dur/240*145),8,t['accent'],4)
    s.text(48,831,'Reduced motion: all movement is immediate. History loads, errors and permission changes never animate.',13,t['muted']);s.save(t['id']+'-motion-board')

if __name__=='__main__':
 for t in T:home(t);inbox(t);agent(t);widget(t);inbox(t,True);widget(t,True)
 typography();motion()
 (ROOT/'tokens.json').write_text(json.dumps(T,indent=2))
 (ROOT/'fixture.json').write_text(json.dumps({'notice':'Fictional design fixture; no customer or backend data','workspace':'Northstar Studio','websiteChat':'Active (past activity; not live installation monitoring)','instagram':'Setup required','publishedKnowledgeItems':4,'customer':{'name':'Alex Morgan','email':'alex@example.test'},'inquiry':'Logo design','qualification':'Qualified','channel':'Website Chat','handoff':'Needs human','ai':'AI paused','ownership':'Unclaimed','messages':[{'role':r,'text':v} for r,v in TRANSCRIPT],'savedAgent':{'goals':['answer_questions','identify_interest','qualify_inquiries','collect_contact'],'tone':'professional','contactFields':['name','email'],'humanHandoff':'always available'}},indent=2))
 print('Built 18 compositions, typography comparison, 3 motion boards, tokens and fixture.')
