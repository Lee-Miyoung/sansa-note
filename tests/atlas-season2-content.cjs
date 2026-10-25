const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const rows=JSON.parse(fs.readFileSync('scripts/atlas/episodes.json')),season=rows.filter(e=>e.season==='02');assert.equal(season.length,10);let scenes=0,quizzes=0,cards=0,images=0;
for(const [i,e]of season.entries()){
assert.equal(e.displayNumber||e.number,String(i+11).padStart(3,'0'));const base=e.href.slice(1),ctx={window:{}};vm.runInNewContext(fs.readFileSync(base+'content.js','utf8'),ctx);const c=ctx.window.SansaAtlasContent;assert.equal(c.id,e.id);assert.equal(c.season,'02');assert.equal(c.scenes.length,12);assert.equal(c.quizzes.length,6);assert.equal(c.cards.length,3);
assert.equal(new Set(c.scenes.map(s=>s.art)).size,12);assert(c.scenes.every(s=>s.paragraphs.length===3&&s.highlights.some(h=>s.paragraphs.join(' ').includes(h))&&s.sources.every(id=>c.sources[id]?.status==='verified')));
for(const a of [c.cover,...c.scenes.map(s=>s.art),...c.cards.map(c=>c.art)])for(const suffix of ['', '-small'])assert(fs.existsSync(base+'images/'+a+suffix+'.webp'));
const manifest=JSON.parse(fs.readFileSync(base+'images/manifest.json'));assert.equal(manifest.files.length,32);for(const f of manifest.files){const b=fs.readFileSync(base+'images/'+f.file);assert.equal(b.length,f.bytes);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),f.sha256);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');if(f.file.includes('-small.'))assert(b.length<100000)}
assert(fs.existsSync(base+'CREDITS.html'));scenes+=12;quizzes+=6;cards+=3;images+=32;
console.log('PASS',e.id,'12 scenes,6 quizzes,3 cards,32 valid WebP and matching SHA256,verified source keys');
}
assert.deepEqual([scenes,quizzes,cards,images],[120,60,30,320]);console.log('PASS totals',scenes,quizzes,cards,images);
