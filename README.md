# Slayer AI

Slayer AI — 8 tilli interfeys, kunduzgi/tungi mavzu va yon paneldan tanlanadigan Slayer AI hamda Slayer-Code rejimlariga ega shaxsiy chat sayti. Javoblar Ollama orqali o‘z serveringizda/kompyuteringizda ishlaydi. OpenAI API kaliti kerak emas.

## GitHub repodan to‘liq ishga tushirish (Docker)

Kompyuteringizga Docker Desktop (yoki Docker Engine va Compose) o‘rnating. Reponi oling:

```bash
git clone https://github.com/slayerknightdev-svg/Slayer-AI.git
cd Slayer-AI
docker compose up --build
```

Birinchi ishлалтishda Ollama контейнеры `llama3.2` болон `qwen2.5-coder:7b` загваруудыг автоматаар татна. Тэдгээрийн нийт хэмжээ хэд хэдэн GB тул эхний таталт удаж, диск болон RAM/VRAM шаардаж болно; контейнерийн лог дээр таталтын явцыг харна. Дууссаны дараа `http://localhost:3000` хаягийг нээнэ. Ollama загварууд persistent Docker volume-д хадгалагдана.

Зогсоох: `Ctrl+C`, дараа нь хүсвэл `docker compose down`. AI сайт ажиллахын тулд Docker ажиллаж байгаа компьютер/сервер асаалттай байх ёстой. GitHub репозитор нь кодыг хадгалж, татаж өгдөг болохоос GitHub Pages дангаараа Ollama model ажиллуулахгүй.

Хэрэв хөнгөн model шаардлагатай бол `.env.example`-ийг `.env` болгон хуулж, `OLLAMA_MODEL` болон `OLLAMA_CODE_MODEL` утгыг өөрийн компьютерт тохирох Ollama model-оор солино. Шинэ model татахын тулд Ollama container ажиллаж байх үед `docker compose exec ollama ollama pull MODEL_NAME` ажиллуулж, Compose-ийг дахин эхлүүлнэ.

## Node.js + Ollama хувилбар

Node.js 18+ болон Ollama суулгаж, `ollama pull llama3.2`, `ollama pull qwen2.5-coder:7b` командыг ажиллуулаад дараа нь `npm start` ажиллуулна. `http://localhost:3000` нээнэ.

[ZIP архив татах](https://github.com/slayerknightdev-svg/Slayer-AI/archive/refs/heads/main.zip)
