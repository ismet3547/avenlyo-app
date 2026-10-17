"""Package the isolated review. Includes approved source docs read-only.
The ZIP never includes production code, caches, credentials or itself.
"""
from pathlib import Path
import hashlib,json,zipfile
P=Path(__file__).resolve().parent;repo=P.parents[1]
report=repo/'docs/frontend-visual-directions-v1.md'
sources=[repo/'docs/frontend-research-v1.md',repo/'docs/frontend-wireframes-v1.md']
files=[report,*sources,*[p for p in P.rglob('*') if p.is_file() and p.name!='manifest.json' and '__pycache__' not in p.parts]]
rows=[{'path':str(p.relative_to(repo)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'read_only_approved_source':p in sources} for p in sorted(files)]
manifest=P/'manifest.json';manifest.write_text(json.dumps({'notice':'Design-only review. No production code. Manifest excludes its own hash and archive.','base_commit':'570ef1c2cfde754f975a10d63d5ce0ec47539545','files':rows},indent=2))
archive=repo/'design-prototypes/avenlyo-visual-directions-v1.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted([*files,manifest]):z.write(p,p.relative_to(repo))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 assert not any(n.startswith(('apps/','packages/','supabase/','.git/')) for n in z.namelist())
 print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'entries':len(z.namelist()),'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()}))
