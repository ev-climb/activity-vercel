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
    return Math.floor(Math.random() * 4);
  }

  const promptOptions = [
    // Одно абстрактное или сложное слово
    "Suggest one Russian word that is abstract, intellectually stimulating, and not a physical object. Focus on concepts, feelings, or ideas. Reply with just the word.",
    "Give a single uncommon Russian word that could be challenging to act out or draw—lean toward philosophical, psychological, or social phenomena. No explanations.",
    "Share a Russian word that describes a situation, state, or emotion that evokes a vivid mental image but is notoriously difficult to convey without speaking.",

    // Пример как 'сарказм', 'обещание', 'лакомство'
    "Choose one expressive Russian word comparable to 'сарказм', 'обещание', or 'лакомство'—choose something frequently discussed but hard to visualize. Only provide the word.",
    "Generate a Russian term that is memorable yet elusive in meaning—words about feelings, experiences, or actions, recognizable but not physical. Output the word alone.",
    "Pick one clever Russian word that represents a subtle or nuanced idea, challenge the players with a term familiar but hard to pantomime or sketch.",

    // Сочетание двух существительных
    "Suggest an original Russian phrase with two nouns forming an unexpected, vivid, or intriguing compound. The result should spark curiosity and be tricky for gestures or images.",
    "Generate a memorable Russian combination of two nouns (such as 'чемодан приключений' or 'сказка времени'), making sure it's difficult to explain without words.",
    "Give a two-noun Russian phrase that reveals an imaginative situation or object—avoid obvious pairs, favor emotional or metaphorical associations.",

    // Сочетание прилагательного и существительного
    "Suggest one Russian phrase with an adjective and a noun, emphasizing poetic, conceptual, or unusual qualities. Output only the phrase.",
    "Generate an imaginative Russian adjective-noun pair that feels mysterious or thought-provoking rather than basic or concrete—examples: 'невидимый аргумент', 'тревожная радость'. Only the phrase.",
    "Create one Russian phrase in which an adjective describes a noun in an unusual way, making the meaning hard to depict or act out nonverbally.",
  ];

  try {
    const prompt = `You are a creative word generator for a Russian Activity-like game. Come up with a random word or phrase for the Activity game according to the following rules:
      Is the phrase suitable so that its meaning can be explained using ${mode};
      ${promptOptions[getRandom()]}
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
