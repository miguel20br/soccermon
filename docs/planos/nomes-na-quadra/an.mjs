import fs from 'node:fs';
const f=process.argv[2];const S=JSON.parse(fs.readFileSync(f));
const pairs=(L,th,filt=()=>true)=>{L=L.filter(filt);let n=0;for(let a=0;a<L.length;a++)for(let c=a+1;c<L.length;c++){const A=L[a],B=L[c];if(A.a>th&&B.a>th&&A.x0<B.x1&&A.x1>B.x0&&A.y0<B.y1&&A.y1>B.y0)n++;}return n;};
const m=(a)=>a.reduce((x,y)=>x+y,0)/a.length;
const raw=S.map(s=>pairs(s.L,-1)), shown=S.map(s=>pairs(s.L,0.5));
const hid=S.map(s=>s.L.filter(v=>v.a<0.5).length);
const mine=S.map(s=>pairs(s.L,-1,v=>v.t===0));
const sorted=[...raw].sort((a,b)=>b-a);const top=sorted.slice(0,Math.ceil(S.length/4));
console.log(f,'n',S.length,'largura',Math.round(S[0].compact),'| pares raw/quadro',m(raw).toFixed(2),'| com a regra atual',m(shown).toFixed(2),'| só meu time (raw)',m(mine).toFixed(2),'| nomes escondidos/quadro',m(hid).toFixed(2),'| quadros com >=1 par raw',(raw.filter(x=>x>0).length/S.length*100).toFixed(0)+'%','| pior quartil raw',m(top).toFixed(2),'-> atual',m(S.map((s,i)=>[pairs(s.L,0.5),raw[i]]).sort((a,b)=>b[1]-a[1]).slice(0,top.length).map(x=>x[0])).toFixed(2));
