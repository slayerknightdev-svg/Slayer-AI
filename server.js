import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
try {
  const envText = await readFile(join(root, ".env"), "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
} catch {}
const port = Number(process.env.PORT) || 3000;
const mimeTypes = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".ico":"image/x-icon" };
function sendJson(res,status,data){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(data))}
async function readJson(req){let body="";for await(const chunk of req){body+=chunk;if(body.length>1_000_000)throw new Error("So‘rov hajmi juda katta.")}return JSON.parse(body||"{}")}
const server=createServer(async(req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||"localhost"}`);
  if(req.method==="POST"&&url.pathname==="/api/chat"){
    let body;try{body=await readJson(req)}catch(error){return sendJson(res,400,{error:error.message||"So‘rov noto‘g‘ri."})}
    const {messages,mode,language}=body;
    if(!Array.isArray(messages)||!messages.length||messages.length>50||messages.some(m=>!m||!["user","assistant"].includes(m.role)||typeof m.content!=="string"||m.content.length>20000))return sendJson(res,400,{error:"Xabarlar formati noto‘g‘ri."});
    const supportedLanguages=["uz","en","ru","tr","es","fr","de","ar"];
    if(language&&!supportedLanguages.includes(language))return sendJson(res,400,{error:"Tanlangan til qo‘llab-quvvatlanmaydi."});
    const selectedMode=mode==="code"?"code":"chat";
    const ollamaHost=(process.env.OLLAMA_HOST||"http://127.0.0.1:11434").replace(/\/+$/,"");
    const model=selectedMode==="code"?(process.env.OLLAMA_CODE_MODEL||"qwen2.5-coder:7b"):(process.env.OLLAMA_MODEL||"llama3.2");
    const languageNames={uz:"o‘zbek",en:"ingliz",ru:"rus",tr:"turk",es:"ispan",fr:"fransuz",de:"nemis",ar:"arab"};
    const langName=languageNames[language]||"foydalanuvchi ishlatgan";
    const system=selectedMode==="code"
      ? `Sen Slayer-Code nomli dasturlash yordamchisisan. Dasturlash savollariga aniq javob ber, kodni Markdown code fence ichida yoz, xatolarni tushuntir. Javobni ${langName} tilida ber (kod sintaksisini o‘zgartirma).`
      : `Sen Slayer AI nomli foydali va samimiy shaxsiy yordamchisan. Javobni ${langName} tilida ber.`;
    try{
      const upstream=await fetch(`${ollamaHost}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model,stream:false,messages:[{role:"system",content:system},...messages]}),signal:AbortSignal.timeout(180000)});
      const result=await upstream.json().catch(()=>({}));
      if(!upstream.ok){console.error("Ollama error:",upstream.status,result.error||"Unknown error");return sendJson(res,502,{error:result.error||`Ollama modeli (${model}) ishlamadi. Ollama ishga tushganini va ushbu model yuklanganini tekshiring.`})}
      const reply=result.message?.content;
      if(typeof reply!=="string"||!reply.trim())return sendJson(res,502,{error:"Mahalliy AI bo‘sh javob qaytardi."});
      return sendJson(res,200,{reply:reply.trim()});
    }catch(error){console.error("Ollama so‘rovi:",error.message);return sendJson(res,503,{error:error.name==="TimeoutError"?"AI javobi uzoq davom etdi. Yengilroq modelni sinab ko‘ring.":"Ollama bilan aloqa yo‘q. Ollama ishlayotganini va kerakli model o‘rnatilganini tekshiring."})}
  }
  if(req.method!=="GET"&&req.method!=="HEAD")return sendJson(res,405,{error:"Bu HTTP usuli qo‘llab-quvvatlanmaydi."});
  let pathname;try{pathname=decodeURIComponent(url.pathname)}catch{pathname="/"}
  const relativePath=normalize(pathname==="/"?"index.html":pathname.slice(1));const filePath=join(publicDir,relativePath);
  if(!filePath.startsWith(publicDir)){res.writeHead(403);return res.end("Forbidden")}
  try{const content=await readFile(filePath);res.writeHead(200,{"Content-Type":mimeTypes[extname(filePath)]||"application/octet-stream","X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin"});res.end(req.method==="HEAD"?undefined:content)}catch{res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});res.end("Sahifa topilmadi")}
});
server.listen(port,"0.0.0.0",()=>console.log(`Slayer AI: http://localhost:${port}`));
