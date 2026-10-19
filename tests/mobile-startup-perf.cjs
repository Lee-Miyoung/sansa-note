// Controlled loading experiment; SDKs are inert delayed fixtures, not real Firebase.
// Usage: node tests/mobile-startup-perf.cjs [directory with baseline index.html and sw.js]
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'), variant=process.argv[2]||root;
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const measurements=[];
 for(let run=0;run<3;run++){
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const c=await p.context().newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:4});
 await p.addInitScript(()=>{window.perfLCP=0;new PerformanceObserver(l=>{for(const e of l.getEntries())window.perfLCP=e.startTime}).observe({type:'largest-contentful-paint',buffered:true})});
 await p.route('**/*',async r=>{const u=new URL(r.request().url());if(u.hostname==='www.gstatic.com'||u.hostname==='cdnjs.cloudflare.com'){await new Promise(resolve=>setTimeout(resolve,2000));return r.fulfill({contentType:'application/javascript',body:''})}const f=(['/index.html','/sw.js','/'].includes(u.pathname)?variant:root)+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname));if(u.origin==='https://sansanote.com'&&fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});return r.abort()});
 await p.goto('https://sansanote.com/',{waitUntil:'load'});await p.evaluate(()=>startLocalMode());await p.waitForTimeout(500);
 measurements.push(await p.evaluate(()=>({fcp:Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime||0),dom:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),lcp:Math.round(window.perfLCP),home:document.getElementById('app').style.display})));
 await p.close();}
 const requested=[];const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;if(pathname==='/'&&req.headers['sec-fetch-dest']==='document'){res.setHeader('Content-Type','text/html');return res.end('<h1>Worker install measurement</h1><script>navigator.serviceWorker.register("/sw.js")</script>')}const f=(pathname==='/sw.js'||pathname==='/'?variant:root)+(pathname==='/'?'/index.html':decodeURIComponent(pathname));if(!fs.existsSync(f)){res.writeHead(404).end();return;}const size=fs.statSync(f).size;requested.push({path:pathname,bytes:size});res.setHeader('Content-Type',pathname.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const p=await b.newPage();await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForFunction(()=>navigator.serviceWorker.controller);await p.waitForTimeout(300);await p.close();server.close();await b.close();console.log(JSON.stringify({variant,conditions:'390x844 Chromium, 4x CPU, empty SDK responses delayed 2000ms; no real Firebase or mobile network',measurements,workerRequests:requested.length,workerBytes:requested.reduce((n,r)=>n+r.bytes,0),media:requested.filter(r=>/\.(mp3|mp4)$/.test(r.path))},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
