import pathlib, json, time, urllib.request, urllib.parse, io, re, hashlib
from PIL import Image, ImageOps
import cv2
import numpy as np
root=pathlib.Path('public/invitation-photos')
root.mkdir(parents=True,exist_ok=True)
manifest=pathlib.Path('lib/imported-invitation-photos.json')
items=json.loads(manifest.read_text())
seen={v['source'] for v in items.values()}
hashes={v['hash'] for v in items.values()}
face=cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_frontalface_default.xml')
profile=cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_profileface.xml')
def fetch(url,limit=18000000):
    req=urllib.request.Request(url,headers={'User-Agent':'WedlyInvitationMedia/1.0 (https://www.wedly.ro; Wikimedia public-domain image importer)'})
    with urllib.request.urlopen(req,timeout=45) as res: return res.read(limit)
topics=[('rose flower close up','Trandafiri','Floral'),('peony flowers','Bujori','Floral'),('white orchid flower','Orhidee','Floral'),('lavender flowers','Lavandă','Floral'),('wedding rings still life','Verighete','Elegant'),('flower bouquet','Buchet','Floral'),('candle still life','Lumânări','Elegant'),('table setting flowers','Aranjament de masă','Elegant'),('garden gazebo','Pavilion','Natură'),('flower garden path','Grădină','Natură'),('cherry blossom branch','Flori de cireș','Natură'),('sunset landscape','Apus','Natură'),('baby shoes still life','Pantofiori','Botez'),('teddy bear toy','Ursuleț','Botez'),('starry night sky','Cer înstelat','Celestial'),('moon night sky','Lună','Celestial')]
for query,label,category in topics:
    if len(items)>=194: break
    params={'action':'query','format':'json','generator':'search','gsrnamespace':6,'gsrsearch':query+' filetype:bitmap','gsrlimit':100,'prop':'imageinfo','iiprop':'url|extmetadata|mime','iiurlwidth':1200}
    try: pages=json.loads(fetch('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)))['query']['pages'].values()
    except Exception as e: print(query,e); continue
    count=0
    for p in pages:
        if len(items)>=194 or count>=16: break
        try:
            title=p['title']
            if re.search(r'portrait|people|woman|man |bride|groom|child|person|selfie|family|ceremony',title,re.I): continue
            info=p['imageinfo'][0]; meta=info['extmetadata']
            license=meta.get('LicenseShortName',{}).get('value','')
            if license not in ('CC0','Public domain','CC0 1.0'): continue
            source=info['descriptionurl']
            if source in seen or info['mime'] not in ('image/jpeg','image/png','image/webp'): continue
            time.sleep(1)
            raw=fetch(info.get('thumburl',info['url']))
            im=ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
            if min(im.size)<500: continue
            im.thumbnail((1400,1400))
            gray=cv2.cvtColor(np.array(im),cv2.COLOR_RGB2GRAY)
            if any(len(c.detectMultiScale(g,1.1,4,minSize=(24,24))) for c,g in [(face,gray),(profile,gray),(profile,cv2.flip(gray,1))]): continue
            digest=hashlib.sha256(im.tobytes()).hexdigest()
            if digest in hashes: continue
            key='commons'+str(p['pageid'])
            im.save(root/(key+'.webp'),'WEBP',quality=80)
            items[key]={'label':label+' '+str(p['pageid']),'category':category,'source':source,'license':license,'hash':digest}
            seen.add(source); hashes.add(digest); count+=1
        except Exception as e: print('Skipped',p.get('title'),str(e)[:160])
    manifest.write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
print('Imported total:',len(items))
if not items: raise SystemExit('No eligible photographs found')
