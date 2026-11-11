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
} catch {
  // .env ixtiyoriy; muhit o‘zgaruvchilarini to‘g‘ridan-to‘g‘ri ham berish mumkin.
}

const port = Number(process.env.PORT) || 3000;
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(data));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error("So‘rov hajmi juda katta.");
  }
  return JSON.parse(body || "{}");
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "POST" && url.pathname === "/api/chat") {
    let messages;
    try {
      const body = await readJson(request);
      messages = body.messages;
      if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
        return sendJson(response, 400, { error: "Xabarlar ro‘yxati noto‘g‘ri." });
      }
      if (messages.some((message) =>
        !message || !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" || message.content.length > 20_000
      )) {
        return sendJson(response, 400, { error: "Xabar formati noto‘g‘ri." });
      }
    } catch (error) {
      return sendJson(response, 400, { error: error.message || "So‘rovni o‘qib bo‘lmadi." });
    }

    try {
      const ollamaHost = (process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/+$/, "");
      const model = process.env.OLLAMA_MODEL || "llama3.2";
      const upstream = await fetch(`${ollamaHost}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: "system", content: "Sen Slayer AI nomli foydali va samimiy shaxsiy yordamchisan. Foydalanuvchi boshqa tilni so‘ramasa, o‘zbek tilida javob ber." },
            ...messages
          ]
        }),
        signal: AbortSignal.timeout(180_000)
      });

      const result = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        console.error("Ollama error:", upstream.status, result.error || "Unknown error");
        return sendJson(response, 502, {
          error: result.error || "Ollama modelidan javob olinmadi. Ollama ishlayotganini va model yuklanganini tekshiring."
        });
      }

      const reply = result.message?.content;
      if (typeof reply !== "string" || !reply.trim()) {
        return sendJson(response, 502, { error: "Mahalliy AI bo‘sh javob qaytardi." });
      }
      return sendJson(response, 200, { reply: reply.trim() });
    } catch (error) {
      console.error("Ollama so‘rovi bajarilmadi:", error.message);
      return sendJson(response, 503, {
        error: error.name === "TimeoutError"
          ? "AI javob berishi uzoq davom etdi. Yengilroq modelni sinab ko‘ring."
          : "Ollama bilan aloqa yo‘q. Ollama o‘rnatilganini va ishga tushganini, model yuklanganini tekshiring. Masalan: ollama pull llama3.2"
      });
    }
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return sendJson(response, 405, { error: "Bu HTTP usuli qo‘llab-quvvatlanmaydi." });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    pathname = "/";
  }
  const relativePath = normalize(pathname === "/" ? "index.html" : pathname.slice(1));
  const filePath = join(publicDir, relativePath);
  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403);
    return response.end("Forbidden");
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Sahifa topilmadi");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Slayer AI: http://localhost:${port}`);
});
