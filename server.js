import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");

// .env faylini tashqi kutubxonasiz yuklaydi. Mavjud environment qiymatlarini bosib ketmaydi.
try {
  const envText = await readFile(join(root, ".env"), "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
} catch {
  // .env bo'lmasa, hosting platformasidagi environment variables ishlatiladi.
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
    if (!process.env.OPENAI_API_KEY) {
      return sendJson(response, 503, {
        error: "AI API kaliti sozlanmagan. Serverda .env fayliga OPENAI_API_KEY kiriting."
      });
    }

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
      const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
      const upstream = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: "Sen Slayer AI nomli foydali va samimiy yordamchisan. Foydalanuvchi boshqa tilni so‘ramasa, o‘zbek tilida javob ber." },
            ...messages
          ],
          temperature: 0.7
        }),
        signal: AbortSignal.timeout(90_000)
      });

      const result = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        console.error("AI provider error:", upstream.status, result.error?.message || "Unknown error");
        return sendJson(response, 502, {
          error: result.error?.message || "AI xizmatidan javob olishda xatolik. API kaliti va model sozlamalarini tekshiring."
        });
      }

      const content = result.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        return sendJson(response, 502, { error: "AI bo‘sh yoki noto‘g‘ri javob qaytardi." });
      }
      return sendJson(response, 200, { reply: content });
    } catch (error) {
      console.error("AI request failed:", error.message);
      return sendJson(response, 502, {
        error: error.name === "TimeoutError" ? "AI javob berishi uzoq davom etdi. Qayta urinib ko‘ring." : "AI serveriga ulanib bo‘lmadi. Internet va API manzilini tekshiring."
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
