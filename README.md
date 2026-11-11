# Slayer AI

Slayer AI — shaxsiy, o‘z kompyuteringizda ishlaydigan AI chat sayti. Frontend HTML/CSS/JavaScript’da, backend Node.js’da yozilgan; javoblar mahalliy Ollama modelidan olinadi. OpenAI yoki boshqa pullik token API’si kerak emas.

## Ishga tushirish

1. Node.js 18+ va [Ollama](https://ollama.com/download) ni o‘rnating.
2. Terminalda modelni yuklab oling (misol):

   ```bash
   ollama pull llama3.2
   ```

   Ollama xizmatini ishga tushirib qo‘ying. Model fayllari katta bo‘lishi mumkin; kerakli disk hajmi va xotira modelga bog‘liq.
3. Ixtiyoriy ravishda `.env.example` faylidan `.env` nusxa oling. `OLLAMA_MODEL` qiymatini o‘zingiz yuklagan model nomiga moslang.
4. Slayer AI papkasida terminal ochib:

   ```bash
   npm start
   ```

5. Brauzerda `http://localhost:3000`-ni oching.

Suhbatlar таны brauzerda хадгалагдана. Mahalliy model uchun API tokeni yoki har bir xabar uchun to‘lov yo‘q, lekin foydalanish tezligi va hajmi kompyuteringizning xotirasi, protsessori yoki videokartasi hamda disk imkoniyatlariga bog‘liq. Sayt boshqa odamlar internet orqali foydalana oladigan serverga joylansa, Ollama ishlaydigan server va kirishni himoyalash ham kerak.

## ZIP yuklab olish

[Slayer AI ZIP arxivini yuklab oling](https://github.com/slayerknightdev-svg/Slayer-AI/archive/refs/heads/main.zip).
