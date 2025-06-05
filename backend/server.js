import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { db } from './firebaseAdmin.js';

const app = express();
const port = process.env.PORT || 3000;

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors());
app.use(express.json());

app.post('/generatePhrase', async (req, res) => {
  const { mode, uid } = req.body;

  const docRef = db.collection('phrases').doc(uid);
  const docSnap = await docRef.get();
  const userPhrases = docSnap.exists ? docSnap.data().phrases || [] : [];

  const prompt = `Придумай случайное слово или словосочетание для игры Активити по следующим правилам:
    1. Фраза подходит для того, чтобы её значение можно было объяснить при помощи ${mode === 'draw' ? 'рисунка' : 'жестов'};
    2. Если одно слово — это должно быть существительное;
    3. Если два слова — сочетание прилагательного и существительного или двух существительных;
    4. Исключить: цвета, имена, времена года, проф. термины;
    5. Примеры: "Плотина", "Надувной матрас", "Волшебный единорог";
    7. Верни только саму фразу, без кавычек и комментариев.
    8. Уровень сложности - максимальный.
    Покажи список из 50 уникальных подходящих слов или фраз`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Ты помощник, генерирующий фразы для игры' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const rawText = response.data.choices[0].message.content;

    const phrases = rawText
      .split(/\n|^\d+\.\s*|^- /gm)
      .map(str => str.trim())
      .filter(Boolean)
      .map(p => p.replace(/[^a-zA-Zа-яА-ЯёЁ\s-]/g, '').trim());

    console.log('Список фраз:', phrases);

    res.json({ phrases });
  } catch (err) {
    console.error('Ошибка генерации фразы:', err.response?.data || err.message);
    res.status(500).json({ error: 'Не удалось сгенерировать фразы' });
  }
});



app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
