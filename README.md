# Slayer AI

O‘zbek tilidagi, mobilga mos AI chat sayti. Frontend oddiy HTML/CSS/JavaScript’da, backend Node.js’da yozilgan. API kaliti serverda `.env` faylida saqlanadi.

## Ishga tushirish

1. Node.js 18 yoki yangiroq versiyasini o‘rnating.
2. `.env.example` faylidan `.env` nusxa yarating va `OPENAI_API_KEY` qiymatiga o‘z API kalitingizni kiriting.
3. Terminalda:

   ```bash
   npm start
   ```

4. Brauzerda `http://localhost:3000` sahifasini oching.

Modelni `OPENAI_MODEL`, OpenAI-compatible server manzilini esa ixtiyoriy `OPENAI_BASE_URL` orqali sozlash mumkin. API kalitini hech qachon GitHub’ga yoki brauzer kodiga joylamang. `.env` Git tomonidan e’tiborsiz qoldiriladi.

## ZIP yuklab olish

GitHub repozitoriy sahifasida **Code → Download ZIP** ni tanlang yoki [ZIP arxivini yuklab oling](https://github.com/slayerknightdev-svg/Slayer-AI/archive/refs/heads/main.zip).

Saytni internetga joylaganda Node.js backendni ham ishga tushirish va muhit o‘zgaruvchilariga API kalitini qo‘shish kerak.
