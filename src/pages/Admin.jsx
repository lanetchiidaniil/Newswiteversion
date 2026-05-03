import { Link, useNavigate } from 'react-router-dom'
import { createAdminAccount, hasAdminAccount, isAdminLoggedIn, loginAdmin, logoutAdmin } from '../adminStorage.js'
import '../styles/admin.css'

export default function Admin() {
  const navigate = useNavigate()
  const accountExists = hasAdminAccount()
  const loggedIn = isAdminLoggedIn()

  const handleSubmit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')

    if (!email || !password) return

    if (accountExists) {
      if (loginAdmin(email, password)) {
        navigate('/poezii')
      } else {
        event.currentTarget.dataset.error = 'true'
      }
      return
    }

    createAdminAccount(email, password)
    navigate('/poezii')
  }

  const handleLogout = () => {
    logoutAdmin()
    navigate('/')
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Администрация</h1>
        <nav>
          <Link to="/">Главная</Link>
          <Link to="/poezii">Стихи</Link>
          <Link to="/stories">Рассказы</Link>
        </nav>
      </header>

      <main className="admin-main">
        <form className="admin-card" onSubmit={handleSubmit}>
          <h2>{accountExists ? 'Вход' : 'Создать доступ'}</h2>
          <input name="email" type="email" placeholder="Почта" autoComplete="username" />
          <input name="password" type="password" placeholder="Пароль" autoComplete={accountExists ? 'current-password' : 'new-password'} />
          <p className="admin-error">Почта или пароль не подошли.</p>
          <button type="submit">{accountExists ? 'Войти' : 'Создать и войти'}</button>
          {loggedIn && (
            <button type="button" className="admin-secondary" onClick={handleLogout}>
              Выйти
            </button>
          )}
        </form>
      </main>
    </div>
  )
}
