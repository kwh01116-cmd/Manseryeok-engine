// index.html은 게시용 조각이라 <html> 뼈대가 없다. 게시될 때와 같은 뼈대를 씌워 test/page.html로 만든다.
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
fs.writeFileSync(path.join(__dirname, 'page.html'), '<!doctype html><html><head><meta charset="utf-8"><base href="../"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + src + '</body></html>');
