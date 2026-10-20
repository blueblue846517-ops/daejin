// Local static preview; mirrors the five explicit Vercel rewrites. No production writes.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const rules = require('../vercel.json').rewrites;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.ico':'image/x-icon','.xml':'application/xml','.txt':'text/plain'};
http.createServer((req,res) => {
 let url;
 try { url = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch (_) {res.writeHead(400);return res.end();}
 url = rules.find(r=>r.source===url)?.destination || url;
 if(url==='/') url='/index.html';
 const file = path.resolve(root,'.'+url);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.stat(file,(error,stat)=>{
  if(error||!stat.isFile()){res.writeHead(404);return res.end('Not found');}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
 });
}).listen(4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173/services/urethane'));
