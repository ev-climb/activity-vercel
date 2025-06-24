// /api/generatePhrase.js
import admin from '../lib/firebaseAdmin.js';
import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios';

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { mode, uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }

  try {
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
Покажи список из 50 уникальных подходящих слов или фраз.`;

    const openaiRes = await axios.post(
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

    const rawText = openaiRes.data.choices[0].message.content || '';
    const lines = rawText
      .split('\n')
      .map(l => l.replace(/^\d+[).\-] */g, '').trim())
      .filter(Boolean);

    return res.status(200).json({ phrases: lines });
  } catch (err) {
    console.error('Ошибка генерации фразы:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Не удалось сгенерировать фразу' });
  }
}
