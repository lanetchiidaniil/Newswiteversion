const ADMIN_ACCOUNT_KEY = 'fallenAngelAdminAccount'
const ADMIN_SESSION_KEY = 'fallenAngelAdminSession'
const CUSTOM_POEMS_KEY = 'fallenAngelCustomPoems'
const CUSTOM_STORIES_KEY = 'fallenAngelCustomStories'
const POEM_EDITS_KEY = 'fallenAngelPoemEdits'
const STORY_EDITS_KEY = 'fallenAngelStoryEdits'

export const CATEGORY_LABELS = {
  love: 'Любовь',
  friends: 'Друзья',
  other: 'Другое',
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function encodePassword(password) {
  return btoa(unescape(encodeURIComponent(password)))
}

export function hasAdminAccount() {
  return Boolean(localStorage.getItem(ADMIN_ACCOUNT_KEY))
}

export function createAdminAccount(email, password) {
  const account = {
    email: email.trim().toLowerCase(),
    passwordHash: encodePassword(password),
  }
  writeJson(ADMIN_ACCOUNT_KEY, account)
  localStorage.setItem(ADMIN_SESSION_KEY, account.email)
  return account
}

export function loginAdmin(email, password) {
  const account = readJson(ADMIN_ACCOUNT_KEY, null)
  if (!account) return false

  const isValid =
    account.email === email.trim().toLowerCase() &&
    account.passwordHash === encodePassword(password)

  if (isValid) {
    localStorage.setItem(ADMIN_SESSION_KEY, account.email)
  }

  return isValid
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function isAdminLoggedIn() {
  const account = readJson(ADMIN_ACCOUNT_KEY, null)
  const sessionEmail = localStorage.getItem(ADMIN_SESSION_KEY)
  return Boolean(account && sessionEmail === account.email)
}

export function getCustomPoems() {
  return readJson(CUSTOM_POEMS_KEY, { love: [], friends: [], other: [] })
}

export function addCustomPoem(category, text) {
  const poems = getCustomPoems()
  const nextPoem = {
    id: crypto.randomUUID(),
    text: text.trim(),
    createdAt: new Date().toISOString(),
  }
  poems[category] = [nextPoem, ...(poems[category] || [])]
  writeJson(CUSTOM_POEMS_KEY, poems)
  return poems
}

export function updateCustomPoem(category, id, text) {
  const poems = getCustomPoems()
  poems[category] = (poems[category] || []).map((poem) =>
    poem.id === id ? { ...poem, text: text.trim(), updatedAt: new Date().toISOString() } : poem,
  )
  writeJson(CUSTOM_POEMS_KEY, poems)
  return poems
}

export function getPoemEdits() {
  return readJson(POEM_EDITS_KEY, {})
}

export function savePoemEdit(category, originalIndex, text) {
  const edits = getPoemEdits()
  edits[`${category}:${originalIndex}`] = {
    text: text.trim(),
    updatedAt: new Date().toISOString(),
  }
  writeJson(POEM_EDITS_KEY, edits)
  return edits
}

export function getCustomStories() {
  return readJson(CUSTOM_STORIES_KEY, [])
}

export function addCustomStory({ title, excerpt, fullText }) {
  const stories = getCustomStories()
  const nextStory = {
    id: crypto.randomUUID(),
    title: title.trim(),
    excerpt: excerpt.trim(),
    fullText: fullText.trim(),
    createdAt: new Date().toISOString(),
  }
  const nextStories = [nextStory, ...stories]
  writeJson(CUSTOM_STORIES_KEY, nextStories)
  return nextStories
}

export function updateCustomStory(id, { title, excerpt, fullText }) {
  const stories = getCustomStories()
  const nextStories = stories.map((story) =>
    story.id === id
      ? {
          ...story,
          title: title.trim(),
          excerpt: excerpt.trim(),
          fullText: fullText.trim(),
          updatedAt: new Date().toISOString(),
        }
      : story,
  )
  writeJson(CUSTOM_STORIES_KEY, nextStories)
  return nextStories
}

export function getStoryEdits() {
  return readJson(STORY_EDITS_KEY, {})
}

export function removeStoryEdit(originalIndex) {
  const edits = getStoryEdits()
  delete edits[String(originalIndex)]
  writeJson(STORY_EDITS_KEY, edits)
  return edits
}

export function saveStoryEdit(originalIndex, { title, excerpt, fullText }) {
  const edits = getStoryEdits()
  edits[String(originalIndex)] = {
    title: title.trim(),
    excerpt: excerpt.trim(),
    fullText: fullText.trim(),
    updatedAt: new Date().toISOString(),
  }
  writeJson(STORY_EDITS_KEY, edits)
  return edits
}
