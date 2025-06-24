import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { mode, uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }

  try {
    // const prompt = `Придумай случайное слово или словосочетание для игры Активити по следующим правилам:
    //   1. Фраза подходит для того, чтобы её значение можно было объяснить при помощи ${mode === 'draw' ? 'рисунка' : 'жестов'};
    //   2. Если одно слово — это должно быть существительное;
    //   3. Если два слова — сочетание прилагательного и существительного или двух существительных;
    //   4. Исключить: цвета, имена, времена года, проф. термины;
    //   5. Примеры: "Плотина", "Надувной матрас", "Волшебный единорог";
    //   7. Верни только саму фразу, без кавычек и комментариев.
    //   8. Уровень сложности - максимальный.
    //   Покажи список из 10 уникальных подходящих слов или фраз.`;

    const prompt = `Come up with a random word or phrase for the Activity game according to the following rules:
      1. Is the phrase suitable so that its meaning can be explained using ${mode === 'draw' ? 'drawing' : 'gestures'};
      2. If there is one word, it must be a noun.;
      3. If two words are a combination of an adjective and a noun or two nouns;
      4. Exclude: colors, names, seasons, Prof. terms;
      5. Examples: "Dam", "Inflatable mattress", "Magic unicorn";
      7. Return only the phrase itself, without quotes and comments.
      8. The difficulty level is maximum.
      Show a list of 10 unique suitable words or phrases.
      Use russian language.`;

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
