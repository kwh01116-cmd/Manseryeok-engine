import sys
from PIL import Image
out, h, names = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims=[Image.open(n).convert('RGB') for n in names]
ims=[i.resize((int(i.width*h/i.height), h)) for i in ims]
W=sum(i.width for i in ims)+8*(len(ims)-1)
s=Image.new('RGB',(W,h),'#666'); x=0
for i in ims: s.paste(i,(x,0)); x+=i.width+8
s.save(out)
