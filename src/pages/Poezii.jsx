import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addCustomPoem,
  CATEGORY_LABELS,
  getCustomPoems,
  getPoemEdits,
  isAdminLoggedIn,
  savePoemEdit,
  updateCustomPoem,
} from '../adminStorage.js'
import PoemAiStudio from '../components/PoemAiStudio.jsx'
import { poems } from '../data/poemsData.js'
import '../styles/poezii.css'

const CATEGORIES = ['love', 'friends', 'other']

function slidesForWidth(w) {
  if (w >= 1000) return 3
  if (w >= 768) return 2
  return 1
}

function htmlToText(value) {
  return value.replace(/<br\s*\/?>/gi, '\n')
}

function PoemContent({ poem }) {
  if (poem.source === 'original' && !poem.edited) {
    return (
      <div
        className="poem-content"
        dangerouslySetInnerHTML={{ __html: poem.text.replace(/\n/g, '<br>') }}
      />
    )
  }

  return <div className="poem-content poem-content-text">{poem.text}</div>
}

function PoemCategory({ category, label, slides, offset, onOffset, list, admin, onEdit }) {
  const maxOffset = Math.max(0, list.length - slides)
  const start = Math.min(offset, maxOffset)

  const scroll = (dir) => {
    const step = slides
    onOffset(Math.max(0, Math.min(start + dir * step, maxOffset)))
  }

  return (
    <section id={category} className="category">
      <h2>{label}</h2>
      <div className="poem-container">
        <div className="poems" id={`poems-${category}`}>
          {list.slice(start, start + slides).map((poem, i) => (
            <div className="poem" key={poem.id}>
              {admin && (
                <button className="admin-edit-button" type="button" onClick={() => onEdit(poem, category)}>
                  Изменить
                </button>
              )}
              <PoemContent poem={poem} />
            </div>
          ))}
        </div>
        <div className="poem-buttons">
          <button type="button" className="scroll-button" onClick={() => scroll(-1)}>
            &#8678;
          </button>
          <button type="button" className="scroll-button" onClick={() => scroll(1)}>
            &#8680;
          </button>
        </div>
      </div>
    </section>
  )
}

export default function Poezii() {
  const [admin, setAdmin] = useState(() => isAdminLoggedIn())
  const [customPoems, setCustomPoems] = useState(() => getCustomPoems())
  const [poemEdits, setPoemEdits] = useState(() => getPoemEdits())
  const [formOpen, setFormOpen] = useState(false)
  const [editingPoem, setEditingPoem] = useState(null)
  const [slides, setSlides] = useState(() =>
    slidesForWidth(typeof window !== 'undefined' ? window.innerWidth : 1000),
  )
  const [offsets, setOffsets] = useState(() => Object.fromEntries(CATEGORIES.map((c) => [c, 0])))

  useEffect(() => {
    const onResize = () => {
      setSlides(slidesForWidth(window.innerWidth))
      setOffsets(Object.fromEntries(CATEGORIES.map((c) => [c, 0])))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const onStorage = () => {
      setAdmin(isAdminLoggedIn())
      setCustomPoems(getCustomPoems())
      setPoemEdits(getPoemEdits())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const buildPoems = (category) => [
    ...(customPoems[category] || []).map((poem) => ({ ...poem, source: 'custom' })),
    ...poems[category].map((poem, index) => {
      const edit = poemEdits[`${category}:${index}`]
      return {
        id: `original-${category}-${index}`,
        source: 'original',
        category,
        originalIndex: index,
        text: edit?.text || poem,
        edited: Boolean(edit),
      }
    }),
  ]

  const mergedPoems = {
    love: buildPoems('love'),
    friends: buildPoems('friends'),
    other: buildPoems('other'),
  }

  const handleAddPoem = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const category = String(form.get('category') || 'other')
    const text = String(form.get('text') || '')

    if (!text.trim()) return

    setCustomPoems(addCustomPoem(category, text))
    setOffsets((prev) => ({ ...prev, [category]: 0 }))
    setFormOpen(false)
    event.currentTarget.reset()
  }

  const handleSaveGeneratedPoem = (category, text) => {
    if (!text.trim()) return

    setCustomPoems(addCustomPoem(category, text))
    setOffsets((prev) => ({ ...prev, [category]: 0 }))
  }

  const handleEditPoem = (event) => {
    event.preventDefault()
    if (!editingPoem) return

    const form = new FormData(event.currentTarget)
    const text = String(form.get('text') || '')
    if (!text.trim()) return

    if (editingPoem.source === 'custom') {
      setCustomPoems(updateCustomPoem(editingPoem.category, editingPoem.id, text))
    } else {
      setPoemEdits(savePoemEdit(editingPoem.category, editingPoem.originalIndex, text))
    }

    setEditingPoem(null)
  }

  const openPoemEditor = (poem, category) => {
    setEditingPoem({
      ...poem,
      category,
      text: poem.source === 'original' && !poem.edited ? htmlToText(poem.text) : poem.text,
    })
  }

  return (
    <div className="poezii-page">
      <nav className="navbar">
        <div className="navbar-local-links">
          <span>Категория стихов:</span>
          <a href="#love">Любовь</a>
          <a href="#friends">Друзья</a>
          <a href="#other">Другое</a>
        </div>
        <div className="navbar-global-links">
          <Link to="/">Главная</Link>
          <a href="#top">Начало</a>
          <Link to="/admin">Админ</Link>
        </div>
      </nav>

      {admin && (
        <>
          <button className="admin-add-button" type="button" onClick={() => setFormOpen(true)}>
            +
          </button>
          {formOpen && (
            <div className="admin-modal" role="dialog" aria-modal="true">
              <form className="admin-modal-card" onSubmit={handleAddPoem}>
                <h2>Добавить стих</h2>
                <select name="category" defaultValue="love">
                  {CATEGORIES.map((category) => (
                    <option value={category} key={category}>
                      {CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
                <textarea name="text" placeholder="Текст стиха" rows="12" />
                <div className="admin-modal-actions">
                  <button type="button" onClick={() => setFormOpen(false)}>
                    Отмена
                  </button>
                  <button type="submit">Добавить</button>
                </div>
              </form>
            </div>
          )}
          {editingPoem && (
            <div className="admin-modal" role="dialog" aria-modal="true">
              <form className="admin-modal-card" onSubmit={handleEditPoem}>
                <h2>Редактировать стих</h2>
                <textarea name="text" defaultValue={editingPoem.text} rows="14" />
                <div className="admin-modal-actions">
                  <button type="button" onClick={() => setEditingPoem(null)}>
                    Отмена
                  </button>
                  <button type="submit">Сохранить</button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      <main id="top">
        <PoemAiStudio onSavePoem={handleSaveGeneratedPoem} />

        <PoemCategory
          category="love"
          label="Любовь"
          slides={slides}
          offset={offsets.love}
          onOffset={(v) => setOffsets((p) => ({ ...p, love: v }))}
          list={mergedPoems.love}
          admin={admin}
          onEdit={openPoemEditor}
        />
        <PoemCategory
          category="friends"
          label="Друзья"
          slides={slides}
          offset={offsets.friends}
          onOffset={(v) => setOffsets((p) => ({ ...p, friends: v }))}
          list={mergedPoems.friends}
          admin={admin}
          onEdit={openPoemEditor}
        />
        <PoemCategory
          category="other"
          label="Другое"
          slides={slides}
          offset={offsets.other}
          onOffset={(v) => setOffsets((p) => ({ ...p, other: v }))}
          list={mergedPoems.other}
          admin={admin}
          onEdit={openPoemEditor}
        />
      </main>
    </div>
  )
}
