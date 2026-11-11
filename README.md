# Slayer AI

Slayer AI — ko‘p tilli, shaxsiy mahalliy AI chat sayti. Oddiy chat va Slayer-Code o‘rtasida yon paneldan almashish, tungi/kunduzgi rejim va 8 ta interfeys tili mavjud. AI javoblari kompyuteringizda ishlaydigan Ollama modelidan olinadi; OpenAI API kaliti yoki pullik token ishlatilmaydi.

## O‘rnatish va ishga tushirish

1. Node.js 18+ hamda [Ollama](https://ollama.com/download) o‘rnating.
2. Terminalda kerakli modellarni yuklang:

   ```bash
   ollama pull llama3.2
   ollama pull qwen2.5-coder:7b
   ```

   Kod modeli kompyuteringiz resursiga og‘irlik qilsa, `.env` faylida `OLLAMA_CODE_MODEL` qiymatini o‘zingiz yuklagan yengilroq kod modeliga almashtiring. Model nomlarini `ollama list` bilan ko‘rish mumkin.
3. Ollama dasturini ishga tushiring. `.env.example` faylidan `.env` nusxa olish ixtiyoriy; sozlamalarni muhit o‘zgaruvchilari bilan ham berish mumkin.
4. Loyiha papkasida terminal ochib `npm start` bajaring.
5. Brauzerda `http://localhost:3000` ni oching.

Chat modeli `OLLAMA_MODEL`, kod modeli `OLLAMA_CODE_MODEL`, Ollama manzili `OLLAMA_HOST` bilan sozlanadi. Javob tili tanlangan interfeys tiliga ko‘ra so‘raladi; modelning tillarni bilishi uning o‘qitilgan ma’lumotlariga bog‘liq. Sayt boshqa odamlar internet orqali foydalana oladigan serverga joylansa, Ollama ishlaydigan server va kirishni alohida himoyalang.

[ZIP arxivini yuklab olish](https://github.com/slayerknightdev-svg/Slayer-AI/archive/refs/heads/main.zip)
