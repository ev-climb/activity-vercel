import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { mode, uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }

  function getRandom() {
    return Math.floor(Math.random() * 12);
  }

  const promptOptions = [
    "everyday mishaps or awkward moments as noun phrases. Examples: конфуз на свидании / пробка в пятницу / штраф за парковку",
    "small social situations as noun phrases. Examples: звонок в ночи / скандал без причины / опоздание на час",
    "an emotion in a specific context, NOT a standalone abstract noun. Examples: неловкое молчание / злость без причины / запоздалое извинение",
    "feelings grounded in everyday life, not academic terms. Examples: притворная радость / чужая вина / зависть к другу",
    "a type of person in an unexpected situation. Examples: забывчивый врач / повар без вкуса / молчаливый адвокат",
    "a vivid concrete image from daily life (NOT simple nature like 'лесной дождь'). Examples: мокрые носки / сосед с дрелью / кот на совещании",
    "a single expressive Russian noun — can be abstract or emotional. Examples: обида / ловкость / растерянность / упрямство / зависть",
    "two nouns in an unexpected pairing. Examples: побег из отпуска / дружба с врагом / алиби без слов",
    "an adjective-noun pair from human experience (not 'синее небо', not '-изм'). Examples: неудобный вопрос / чужая тайна / громкий намёк",
    "a phrase built on irony or contradiction. Examples: громкая тишина / занятой бездельник / честный обман",
    "a recognizable urban or social scene. Examples: очередь без конца / лифт в понедельник / совещание о совещании",
    "a phrase mixing two unexpected domains (work+home, food+law, sport+medicine). Examples: диета в армии / отпуск с начальником / операция по расписанию",
  ];

  try {
    const prompt = `Generate 10 short Russian phrases for an Activity game (Charades/Pictionary).
      Mode: ${mode}.
      Rules:
        — 1–3 words MAX per phrase. Single nouns are allowed (обида, ловкость, упрямство).
        — No verbs or infinitives (притворяться, уронить etc. are banned).
        — No sentences, no commas, no explanations.
        — Medium difficulty: not trivially obvious, not impossibly abstract.
        — No words ending in -изм or -изация.
        — No plain nature combinations (лесной дождь, морской закат etc. are banned).
        — All 10 phrases must differ in theme and structure.
      Theme for this batch: ${promptOptions[getRandom()]}
      Output: 10 lines, one phrase per line, Russian only, no numbering.`;

    const openaiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: 'Ты генератор коротких фраз для игры Активити. Отвечай только списком фраз.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
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
