import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const port=4161;
const child=spawn(process.execPath,['dist/server.js'],{env:{...process.env,API_HOST:'127.0.0.1',API_PORT:String(port)},stdio:['ignore','ignore','pipe']});
let exited=false;
child.once('exit',()=>{exited=true;});
let failure='';
child.stderr.on('data',chunk=>{failure+=String(chunk);});
try{
 let ready=false;
 for(let attempt=0;attempt<40;attempt++){
  if(exited)throw new Error('Production artifact exited before health was available');
  try{const response=await fetch(`http://127.0.0.1:${port}/health`);if(response.ok){assert.equal((await response.json()).status,'ok');ready=true;break;}}catch{/* wait for the owned child process */}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 assert(ready,'Production artifact did not become live');
 const denied=await fetch(`http://127.0.0.1:${port}/v1/agent/turn`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
 assert.equal(denied.status,401);
 const widget=await fetch(`http://127.0.0.1:${port}/widget.js`);
 assert(widget.ok && (await widget.text()).includes('data-avenlyo-channel'),'Bundled widget unavailable');
 const inbox=await fetch(`http://127.0.0.1:${port}/v1/inbox/11111111-1111-4111-8111-111111111111/reply`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
 assert.equal(inbox.status,401);
 console.info('API production artifact smoke passed: plain Node boot, health, unauthorized ingress.');
}catch(error){console.error(error instanceof Error?error.message:'Artifact smoke failed');if(failure.includes('ERR_UNKNOWN_FILE_EXTENSION'))console.error('Production artifact attempted to load a TypeScript source file.');process.exitCode=1;}
finally{child.kill('SIGTERM');await new Promise(resolve=>{if(exited)return resolve();child.once('exit',resolve);setTimeout(()=>{child.kill('SIGKILL');resolve();},3000).unref();});}
