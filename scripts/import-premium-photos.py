import pathlib,json,urllib.request,io,hashlib
from PIL import Image,ImageOps,ImageStat
root=pathlib.Path('public/invitation-photos')
manifest=pathlib.Path('lib/imported-invitation-photos.json')
data=json.loads(manifest.read_text())
ids=[34615484,36380140,10970559,4887772,16933504,20091883,29040927,17023148,37958120,16120224,35985200]
for id in ids:
 key='pexels'+str(id)
 file=root/(key+'.webp')
 req=urllib.request.Request(f'https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?auto=compress&cs=tinysrgb&w=1800',headers={'User-Agent':'Mozilla/5.0'})
 with urllib.request.urlopen(req,timeout=45) as response:
  raw=response.read(15000000)
 img=ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
 if min(img.size)<650: raise ValueError(f'Low resolution {id}: {img.size}')
 img.thumbnail((1800,1800))
 img.save(file,'WEBP',quality=84,method=6)
 stat=ImageStat.Stat(img.resize((64,64)))
 data[key]={'label':'Decor nuntă '+str(id),'category':'Elegant','source':f'https://www.pexels.com/photo/{id}/','license':'Pexels License https://www.pexels.com/license/','hash':hashlib.sha256(file.read_bytes()).hexdigest(),'meanRGB':[round(x) for x in stat.mean],'size':list(img.size)}
manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
