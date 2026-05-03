import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addCustomStory,
  getCustomStories,
  getStoryEdits,
  isAdminLoggedIn,
  removeStoryEdit,
  saveStoryEdit,
  updateCustomStory,
} from '../adminStorage.js'
import storiesHtml from '../stories-section-inner.html?raw'
import '../styles/stories.css'

const ORIGINAL_STORY_COUNT = (storiesHtml.match(/class="story-box"/g) || []).length

function cleanText(value) {
  return String(value || '').replace(/\s+\n/g, '\n').trim()
}

function textFromElement(element) {
  return cleanText(element?.textContent || '')
}

function originalStoryParts(box) {
  const excerptClone = box.querySelector('.excerpt')?.cloneNode(true)
  excerptClone?.querySelectorAll('label, input, .full-text').forEach((node) => node.remove())

  return {
    title: textFromElement(box.querySelector('h2')),
    excerpt: textFromElement(excerptClone),
    fullText: textFromElement(box.querySelector('.full-text')),
  }
}

function rebuildStoryParagraph(box, index, { excerpt, fullText }) {
  const paragraph = box.querySelector('.story-content p')
  if (!paragraph) return

  paragraph.textContent = ''

  const excerptSpan = document.createElement('span')
  excerptSpan.className = 'excerpt'
  excerptSpan.textContent = excerpt
  paragraph.appendChild(excerptSpan)

  if (fullText.trim()) {
    const inputId = `edited-story-${index}`

    paragraph.appendChild(document.createElement('br'))

    const label = document.createElement('label')
    label.setAttribute('for', inputId)
    label.textContent = '▼'
    paragraph.appendChild(label)

    const input = document.createElement('input')
    input.type = 'checkbox'
    input.id = inputId
    paragraph.appendChild(input)

    const fullTextSpan = document.createElement('span')
    fullTextSpan.className = 'full-text'
    fullTextSpan.textContent = fullText
    paragraph.appendChild(fullTextSpan)
  }
}

function CustomStory({ story, index, admin, onEdit }) {
  const inputId = `custom-story-${story.id}`

  return (
    <div className="story-box">
      {admin && (
        <button className="admin-edit-button" type="button" onClick={() => onEdit(story)}>
          Изменить
        </button>
      )}
      <div className="story-number">{index}</div>
      <div className="story-content">
        <h2>{story.title}</h2>
        <p>
          <span className="excerpt">{story.excerpt}</span>
          {story.fullText && (
            <>
              <br />
              <label htmlFor={inputId}>▼</label>
              <input type="checkbox" id={inputId} />
              <span className="full-text">{story.fullText}</span>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default function Stories() {
  const originalStoriesRef = useRef(null)
  const [admin, setAdmin] = useState(() => isAdminLoggedIn())
  const [customStories, setCustomStories] = useState(() => getCustomStories())
  const [storyEdits, setStoryEdits] = useState(() => getStoryEdits())
  const [formOpen, setFormOpen] = useState(false)
  const [editingStory, setEditingStory] = useState(null)

  useEffect(() => {
    const onStorage = () => {
      setAdmin(isAdminLoggedIn())
      setCustomStories(getCustomStories())
      setStoryEdits(getStoryEdits())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const root = originalStoriesRef.current
    if (!root) return undefined

    const boxes = Array.from(root.querySelectorAll('.story-box'))
    const brokenEditIndexes = Object.entries(storyEdits)
      .filter(([, edit]) => !edit.fullText?.trim() && (!edit.excerpt?.trim() || edit.excerpt.length > 700))
      .map(([index]) => index)

    if (brokenEditIndexes.length > 0) {
      let nextEdits = storyEdits
      brokenEditIndexes.forEach((index) => {
        nextEdits = removeStoryEdit(index)
      })
      setStoryEdits(nextEdits)
      return undefined
    }

    boxes.forEach((box, index) => {
      const edit = storyEdits[String(index)]
      if (edit) {
        const title = box.querySelector('h2')
        if (title) title.textContent = edit.title
        rebuildStoryParagraph(box, index, edit)
      }

      box.querySelector('.admin-edit-button')?.remove()

      if (admin) {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'admin-edit-button'
        button.textContent = 'Изменить'
        button.addEventListener('click', () => {
          setEditingStory({
            source: 'original',
            originalIndex: index,
            ...originalStoryParts(box),
          })
        })
        box.appendChild(button)
      }
    })

    return () => {
      boxes.forEach((box) => box.querySelector('.admin-edit-button')?.remove())
    }
  }, [admin, storyEdits])

  const handleAddStory = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') || '')
    const excerpt = String(form.get('excerpt') || '')
    const fullText = String(form.get('fullText') || '')

    if (!title.trim() || !excerpt.trim()) return

    setCustomStories(addCustomStory({ title, excerpt, fullText }))
    setFormOpen(false)
    event.currentTarget.reset()
  }

  const handleEditStory = (event) => {
    event.preventDefault()
    if (!editingStory) return

    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') || '')
    const excerpt = String(form.get('excerpt') || '')
    const fullText = String(form.get('fullText') || '')
    if (!title.trim() || !excerpt.trim()) return

    if (editingStory.source === 'custom') {
      setCustomStories(updateCustomStory(editingStory.id, { title, excerpt, fullText }))
    } else {
      setStoryEdits(saveStoryEdit(editingStory.originalIndex, { title, excerpt, fullText }))
    }

    setEditingStory(null)
  }

  const handleRestoreOriginalStory = () => {
    if (!editingStory || editingStory.source !== 'original') return
    setStoryEdits(removeStoryEdit(editingStory.originalIndex))
    setEditingStory(null)
  }

  return (
    <div className="stories-page">
      <header>
        <div className="header__content">
          <h1>Рассказы</h1>
          <nav>
            <Link to="/">Главная</Link>
            <a href="#top">Начало</a>
            <Link to="/admin">Админ</Link>
          </nav>
        </div>
      </header>

      {admin && (
        <>
          <button className="admin-add-button" type="button" onClick={() => setFormOpen(true)}>
            +
          </button>
          {formOpen && (
            <div className="admin-modal" role="dialog" aria-modal="true">
              <form className="admin-modal-card" onSubmit={handleAddStory}>
                <h2>Добавить рассказ</h2>
                <input name="title" placeholder="Название" />
                <textarea name="excerpt" placeholder="Начальный текст, который виден сразу" rows="5" />
                <textarea name="fullText" placeholder="Продолжение после раскрытия" rows="10" />
                <div className="admin-modal-actions">
                  <button type="button" onClick={() => setFormOpen(false)}>
                    Отмена
                  </button>
                  <button type="submit">Добавить</button>
                </div>
              </form>
            </div>
          )}
          {editingStory && (
            <div className="admin-modal" role="dialog" aria-modal="true">
              <form className="admin-modal-card" onSubmit={handleEditStory}>
                <h2>Редактировать рассказ</h2>
                <input name="title" defaultValue={editingStory.title} placeholder="Название" />
                <textarea name="excerpt" defaultValue={editingStory.excerpt} placeholder="Начальный текст" rows="5" />
                <textarea name="fullText" defaultValue={editingStory.fullText} placeholder="Продолжение" rows="10" />
                <div className="admin-modal-actions">
                  {editingStory.source === 'original' && (
                    <button type="button" className="admin-restore-button" onClick={handleRestoreOriginalStory}>
                      Вернуть оригинал
                    </button>
                  )}
                  <button type="button" onClick={() => setEditingStory(null)}>
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
        <div ref={originalStoriesRef} dangerouslySetInnerHTML={{ __html: storiesHtml }} />
        <section id="stories">
          {customStories.map((story, index) => (
            <CustomStory
              story={story}
              index={ORIGINAL_STORY_COUNT + index + 1}
              admin={admin}
              onEdit={(selectedStory) => setEditingStory({ ...selectedStory, source: 'custom' })}
              key={story.id}
            />
          ))}
        </section>
      </main>
    </div>
  )
}
