"""Protect every previously verified record and original/thumbnail during catalog completion."""
import pathlib,json,hashlib,gzip
r=pathlib.Path(__file__).resolve().parents[1];b=json.load(open(r/'docs/catalog-finalization/baseline-200cbb9.json'))
def h(x):return hashlib.sha256(json.dumps(x,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
for baseline in ['docs/catalog-finalization/baseline-200cbb9.json','docs/mountain-static/baseline-8beccfd.json']:
 b=json.load(open(r/baseline))
 for kind,file in [('tips','data/visit-tips.json'),('artwork','data/place-artwork.json')]:
  rows={x['id']:x for x in json.load(open(r/file))}
  for id,sha in b[kind].items():assert id in rows and h(rows[id])==sha,('previously verified record changed',id)
 for path,sha in b['files'].items():assert hashlib.sha256((r/path.lstrip('/')).read_bytes()).hexdigest()==sha,('previous artwork changed',path)
 print('PASS unchanged verified tips',len(b['tips']),'artwork records',len(b['artwork']),'original/thumbnail files',len(b['files']))
b=json.load(open(r/'docs/catalog-finalization/baseline-200cbb9.json'))

before=sum(b["initialPublicJsGzipBytes"].values());after=sum(len(gzip.compress((r/f).read_bytes())) for f in b["initialPublicJsGzipBytes"])
assert after-before<=2048,("initial registry delivery budget exceeded",before,after)
print("PASS initial public registry JS gzip estimate",before,"->",after,"delta",after-before,"bytes; no new library")
