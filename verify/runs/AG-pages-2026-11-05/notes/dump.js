const j=require(process.argv[2]);const key=process.argv[3];const re=new RegExp(process.argv[4]||'.');const max=+process.argv[5]||4;
const p=j[key];console.log(key,'status',p.status,'docH',p.docH);
for(const [k,arr] of Object.entries(p.m)){ if(!re.test(k))continue;
 console.log(k, arr.length);
 arr.slice(0,max).forEach(e=>console.log('  ',[e.x,e.y,e.w,e.h].join(','),'fs',e.fs,'lh',e.lh,'c',e.color,'bg',e.bg,'b',e.border,'r',e.radius,'sh',e.shadow,'op',e.opacity,e.display,e.flexDir,e.visibility,JSON.stringify((e.text||'').slice(0,50))));
}
