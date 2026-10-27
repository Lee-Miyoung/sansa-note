"""Decode and compare actual artworks (named neutral SVGs are explicitly not artwork)."""
import pathlib,json,hashlib,itertools
from PIL import Image,ImageOps
root=pathlib.Path(__file__).resolve().parents[1];rows=json.load(open(root/'data/place-artwork.json'));actual=[x for x in rows if x['status']=='verified'];hashes={};result=[]
def dhash(im):
 im=ImageOps.grayscale(im).resize((17,16));p=list(im.getdata());return sum((p[y*17+x]>p[y*17+x+1])<<(y*16+x) for y in range(16) for x in range(16))
for r in actual:
 f=root/r['src'].lstrip('/');raw=f.read_bytes();sha=hashlib.sha256(raw).hexdigest();assert sha not in hashes,(r['id'],hashes.get(sha));hashes[sha]=r['id'];im=Image.open(f);im.load();assert im.width>=480 and im.height>=320
 thumb=Image.open(root/r['thumbnail'].lstrip('/'));thumb.load();assert abs(im.width/im.height-thumb.width/thumb.height)<.02
 result.append({'id':r['id'],'sha256':sha,'dhash':dhash(im),'mirroredDhash':dhash(ImageOps.mirror(im)),'thumbnailDhash':dhash(thumb),'dimensions':[im.width,im.height],'bytes':len(raw)})
near=[];pairs=0
for a,b in itertools.combinations(result,2):
 pairs+=1;distance=(a['dhash']^b['dhash']).bit_count()
 if distance<=22:near.append({'a':a['id'],'b':b['id'],'distanceOf256':distance,'orientation':'original'})
 mirrorDistance=(a['dhash']^b['mirroredDhash']).bit_count()
 if mirrorDistance<=22:near.append({'a':a['id'],'b':b['id'],'distanceOf256':mirrorDistance,'orientation':'horizontal-mirror'})
output={'catalogMappings':len(rows),'actualArtwork':len(actual),'neutralPending':len(rows)-len(actual),'distinctFiles':len(hashes),'pairsCompared':pairs,'mirrorPairsCompared':pairs,'nearDuplicateThreshold':22,'nearDuplicateCandidates':near,'artwork':[{**x,'dhash':hex(x['dhash']),'thumbnailDhash':hex(x['thumbnailDhash']),'mirroredDhash':hex(x['mirroredDhash'])} for x in result]}
p=root/'docs/catalog-complete';p.mkdir(exist_ok=True,parents=True);(p/'image-audit.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in output.items() if k!='artwork'},ensure_ascii=False));assert not near,'Review perceptual near-duplicate candidates before release'
