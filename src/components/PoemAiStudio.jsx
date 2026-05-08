import { useMemo, useState } from 'react'

const REQUEST_TIMEOUT_MS = 45000
const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send'
const EMAIL_SEND_DELAY_MS = 1100

const POEM_SIZES = {
  short: 'Короткий',
  medium: 'Средний',
  long: 'Большой',
}

const POEM_CATEGORIES = {
  love: 'Любовь',
  friends: 'Друзья',
  other: 'Другое',
}

const initialForm = {
  theme: '',
  mood: 'нежное',
  size: 'medium',
  recipient: '',
  occasion: '',
  details: '',
  category: 'other',
}

async function postJson(url, body) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Запрос занял слишком много времени. Попробуйте выбрать короткий стих или повторить позже.')
    }

    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Запрос не был выполнен.')
  }

  return data
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseEmailList(value) {
  return String(value || '')
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter(Boolean)
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

async function sendPoemEmail({ toEmail, toName, poem, theme }) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('Для отправки email нужно указать VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID и VITE_EMAILJS_PUBLIC_KEY в .env.local.')
  }

  const response = await fetch(EMAILJS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email: toEmail,
        to_name: toName || 'читатель',
        sender_name: 'Литературный сайт',
        poem,
        theme: theme || 'стихотворение',
        site_name: 'Литературный сайт',
        from_email: 'diaconnicita@gmail.com',
        reply_to: 'diaconnicita@gmail.com',
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || 'EmailJS не смог отправить письмо.')
  }
}

export default function PoemAiStudio({ onSavePoem }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [poem, setPoem] = useState('')
  const [toEmail, setToEmail] = useState('')
  const [toName, setToName] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [saved, setSaved] = useState(false)

  const canSend = useMemo(() => poem.trim() && parseEmailList(toEmail).length > 0, [poem, toEmail])

  const updateForm = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleGenerate = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')
    setSaved(false)

    if (!form.theme.trim()) {
      setError('Укажите тему стихотворения.')
      return
    }

    setLoading(true)
    setPoem('')
    try {
      const data = await postJson('/api/generate-poem', form)
      setPoem(data.poem || '')
      setStatus('Стихотворение создано. Его можно сохранить или отправить на почту.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать стихотворение.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (!poem.trim()) {
      setError('Сначала создайте стихотворение.')
      return
    }

    onSavePoem(form.category, poem)
    setSaved(true)
    setStatus('Стихотворение сохранено в выбранную категорию.')
  }

  const handleSend = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')

    const emailList = parseEmailList(toEmail)
    const invalidEmails = emailList.filter((email) => !isEmail(email))

    if (!poem.trim() || emailList.length === 0) {
      setError('Создайте стихотворение и укажите email получателя.')
      return
    }

    if (invalidEmails.length > 0) {
      setError(`Проверьте email: ${invalidEmails.join(', ')}`)
      return
    }

    setSending(true)
    try {
      for (let index = 0; index < emailList.length; index += 1) {
        if (index > 0) await wait(EMAIL_SEND_DELAY_MS)
        await sendPoemEmail({
          toEmail: emailList[index],
          toName,
          poem,
          theme: form.theme,
        })
      }

      setStatus(
        emailList.length === 1
          ? 'Стихотворение отправлено на email получателя.'
          : `Стихотворение отправлено получателям: ${emailList.length}.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить письмо.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className={`poem-ai-studio${open ? ' poem-ai-studio-open' : ''}`} aria-labelledby="poem-ai-title">
      <button
        type="button"
        className="poem-ai-toggle"
        aria-expanded={open}
        aria-controls="poem-ai-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span id="poem-ai-title">Создать стих с ИИ</span>
        <span className="poem-ai-toggle-icon" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div id="poem-ai-panel" className="poem-ai-panel">
          <div className="poem-ai-header">
            <p>Выберите настроение, тему и детали, а сайт создаст стихотворение и поможет отправить его по email.</p>
          </div>

          <div className="poem-ai-layout">
            <form className="poem-ai-form" onSubmit={handleGenerate}>
              <label>
                Тема
                <input name="theme" value={form.theme} onChange={updateForm} placeholder="Например: дружба, любовь, весна" />
              </label>

              <div className="poem-ai-row">
                <label>
                  Настроение
                  <select name="mood" value={form.mood} onChange={updateForm}>
                    <option value="нежное">Нежное</option>
                    <option value="радостное">Радостное</option>
                    <option value="грустное">Грустное</option>
                    <option value="романтичное">Романтичное</option>
                    <option value="вдохновляющее">Вдохновляющее</option>
                  </select>
                </label>

                <label>
                  Размер
                  <select name="size" value={form.size} onChange={updateForm}>
                    {Object.entries(POEM_SIZES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="poem-ai-row">
                <label>
                  Получатель
                  <input name="recipient" value={form.recipient} onChange={updateForm} placeholder="Имя или обращение" />
                </label>

                <label>
                  Категория
                  <select name="category" value={form.category} onChange={updateForm}>
                    {Object.entries(POEM_CATEGORIES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Повод
                <input name="occasion" value={form.occasion} onChange={updateForm} placeholder="День рождения, признание, благодарность" />
              </label>

              <label>
                Дополнительные детали
                <textarea
                  name="details"
                  value={form.details}
                  onChange={updateForm}
                  rows="4"
                  placeholder="Например: упомянуть море, город, общие воспоминания"
                />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? 'Создаем...' : 'Создать стих'}
              </button>
            </form>

            <div className="poem-ai-result">
              <h3>Готовый стих</h3>
              <textarea
                value={poem}
                readOnly
                rows="14"
                placeholder={loading ? 'Стих создаётся по выбранным критериям...' : 'Здесь появится созданное стихотворение'}
              />

              <div className="poem-ai-actions">
                <button type="button" onClick={handleSave} disabled={!poem.trim() || saved}>
                  {saved ? 'Сохранено' : 'Сохранить на сайте'}
                </button>
              </div>

              <form className="poem-email-form" onSubmit={handleSend}>
                <label>
                  Email получателей
                  <input
                    type="text"
                    value={toEmail}
                    onChange={(event) => setToEmail(event.target.value)}
                    placeholder="example@mail.com, friend@mail.com"
                  />
                </label>
                <label>
                  Имя получателя
                  <input value={toName} onChange={(event) => setToName(event.target.value)} placeholder="Можно оставить пустым" />
                </label>
                <button type="submit" disabled={sending || !canSend}>
                  {sending ? 'Отправляем...' : 'Отправить на email'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {(status || error) && (
        <p className={error ? 'poem-ai-message poem-ai-message-error' : 'poem-ai-message'} role="status">
          {error || status}
        </p>
      )}
    </section>
  )
}
