import express from 'express';
import axios from 'axios';
import https from 'https';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

import { db } from './firebaseAdmin.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;

// app.use(express.static(path.join(__dirname, 'client/dist')));
// app.get('*', (_, res) => {
//   res.sendFile(path.join(__dirname, 'client/dist/index.html'));
// });

// Middleware
app.use(cors()); // Разрешаем все CORS-запросы
app.use(express.json()); // Для парсинга JSON

const httpsAgent = new https.Agent({  
  rejectUnauthorized: false
});

app.post('/getAccessToken', async (req, res) => {
  const url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";
  const payload = new URLSearchParams({
    scope: 'GIGACHAT_API_PERS',
  });
  
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'RqUID': process.env.RQ_UID,
    'Authorization': `Basic ${process.env.AUTH}`,
    // 'RqUID': 'd5f849d1-08b5-4a15-8644-585ce3676a06',
    // 'Authorization': 'Basic NzU3ZjY0NmEtMjBkMC00ZDEzLWJlYmQtYzk5YTYyNmIzNmNhOjIwM2U4ZWExLWZmNzAtNDVkMy1iMWI2LThmZjllZTdlOTY3MA=='
  };

  try {
    const response = await axios.post(url, payload, {
      headers,
      httpsAgent,
    });
    res.json(response.data);
  } catch (err) {
    console.error('Ошибка получения токена:', err);
    res.status(500).json({ error: 'Не удалось получить токен доступа' });
  }
});

app.post('/generatePhrase', async (req, res) => {
  const { access_token, mode, uid } = req.body;
    
  if (!access_token) {
    return res.status(400).json({ error: 'Токен отсутствует' });
  }

    const docRef = db.collection('phrases').doc(uid);
    const docSnap = await docRef.get();

    const userPhrases = docSnap.exists ? docSnap.data().phrases || [] : [];
  try {
    const prompt = `Придумай случайное слово или словосочетание для игры Активити по следующим правилам: 1. Фраза подходит для того, чтобы ее значение можно было объяснить при помощи ${mode === 'draw' ? 'рисунка' : 'жестов'}; 2. Если одно слово - это должно быть существительное; 3. Если два слова - сочетание прилагательного и существительного или двух существительных (можно с предлогом); 4. Требования к фразам: - Средний уровень сложности (не слишком просто, но и не профессиональные термины); - Никаких цветов (красный, синий и т.д.); - Никаких имен собственных (Москва, Иван и т.д.); - Никаких специфических профессиональных терминов;  5. Примеры хороших фраз: "Плотина", "Надувной матрас", "Гоночный трэк", "Волшебный единорог"; 6. Фразы должны быть понятными для большинства людей и легко изображаемыми; 7. Фраза не должна повторять или быть похожей на фразы из списка уже сгенерированных фраз: ${userPhrases.join(', ')} 8. Сгенерируй 1 вариант (только саму фразу без пояснений, ковычек и прочих символов). - Никаких времен года (летний, зимний) `;

    const response = await axios.post(
      'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
      {
        model: "GigaChat",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        httpsAgent
      }
    );
    
    // Очищаем ответ от возможных лишних элементов
    const cleanPhrase = response.data.choices[0].message.content
      .replace(/[^a-zA-Zа-яА-ЯёЁ\s-]/g, '')
      .trim();

    res.json({ phrase: cleanPhrase });
  } catch (err) {
    console.error('Ошибка генерации фразы:', err);
    res.status(500).json({ error: 'Не удалось сгенерировать фразу' });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});