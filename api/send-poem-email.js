const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send'

function sendJson(res, status, payload) {
  res.status(status).json(payload)
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Метод не поддерживается.' })
  }

  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_ID
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const privateKey = String(process.env.EMAILJS_PRIVATE_KEY || '').trim()

  if (!serviceId || !templateId || !publicKey) {
    return sendJson(res, 500, {
      error: 'Не заданы EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID или EMAILJS_PUBLIC_KEY.',
    })
  }

  if (!privateKey) {
    return sendJson(res, 500, {
      error: 'EMAILJS_PRIVATE_KEY is missing in Vercel Environment Variables or this deployment was created before it was added.',
    })
  }

  const {
    toEmail = '',
    toName = '',
    senderName = 'Литературный сайт',
    poem = '',
    theme = '',
  } = req.body || {}

  if (!isEmail(toEmail)) {
    return sendJson(res, 400, { error: 'Укажите правильный email получателя.' })
  }

  if (!String(poem).trim()) {
    return sendJson(res, 400, { error: 'Сначала создайте стихотворение.' })
  }

  try {
    const response = await fetch(EMAILJS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          to_email: String(toEmail).trim(),
          to_name: String(toName || 'читатель').trim(),
          sender_name: String(senderName || 'Литературный сайт').trim(),
          poem: String(poem).trim(),
          theme: String(theme || 'стихотворение').trim(),
          site_name: process.env.SITE_NAME || 'Литературный сайт',
          from_email: process.env.SITE_FROM_EMAIL || 'diaconnicita@gmail.com',
          reply_to: process.env.SITE_REPLY_TO || process.env.SITE_FROM_EMAIL || 'diaconnicita@gmail.com',
        },
      }),
    })

    const text = await response.text()
    if (!response.ok) {
      return sendJson(res, response.status, {
        error: text || 'EmailJS не смог отправить письмо.',
      })
    }

    return sendJson(res, 200, { ok: true })
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Ошибка отправки письма.',
    })
  }
}
