const OPENAI_URL = 'https://api.openai.com/v1/responses'
const OPENAI_TIMEOUT_MS = 50000

function sendJson(res, status, payload) {
  res.status(status).json(payload)
}

function readPoemFromResponse(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim()
  }

  const parts = []
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') parts.push(content.text)
      if (typeof content.output_text === 'string') parts.push(content.output_text)
    }
  }

  return parts.join('\n').trim()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Метод не поддерживается.' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return sendJson(res, 500, {
      error: 'Не задан OPENAI_API_KEY в переменных окружения.',
    })
  }

  const {
    theme = '',
    mood = '',
    size = 'medium',
    recipient = '',
    occasion = '',
    details = '',
  } = req.body || {}

  if (!String(theme).trim() || !String(mood).trim()) {
    return sendJson(res, 400, {
      error: 'Укажите тему и настроение стихотворения.',
    })
  }

  const sizeLabels = {
    short: 'короткое стихотворение на 8-10 строк',
    medium: 'стихотворение среднего размера на 12-16 строк',
    long: 'более развернутое стихотворение на 20-24 строки',
  }
  const maxOutputTokensBySize = {
    short: 280,
    medium: 460,
    long: 700,
  }

  const prompt = [
    `Тема: ${theme}`,
    `Настроение: ${mood}`,
    `Размер: ${sizeLabels[size] || sizeLabels.medium}`,
    recipient ? `Получатель или обращение: ${recipient}` : '',
    occasion ? `Повод: ${occasion}` : '',
    details ? `Дополнительные детали: ${details}` : '',
    '',
    'Создай оригинальное стихотворение на русском языке.',
    'Пиши простым, красивым и понятным языком.',
    'Не добавляй пояснений, заголовков и комментариев, верни только текст стихотворения.',
  ]
    .filter(Boolean)
    .join('\n')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
        input: [
          {
            role: 'system',
            content:
              'Ты помощник литературного сайта. Создавай только оригинальные стихотворения без лишних объяснений.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_output_tokens: maxOutputTokensBySize[size] || maxOutputTokensBySize.medium,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return sendJson(res, response.status, {
        error: data.error?.message || 'OpenAI не смог создать стихотворение.',
      })
    }

    const poem = readPoemFromResponse(data)
    if (!poem) {
      return sendJson(res, 502, {
        error: 'OpenAI вернул пустой ответ.',
      })
    }

    return sendJson(res, 200, { poem })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return sendJson(res, 504, {
        error: 'Генерация заняла слишком много времени. Попробуйте короткий размер или повторите запрос позже.',
      })
    }

    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Ошибка генерации стихотворения.',
    })
  } finally {
    clearTimeout(timeoutId)
  }
}
