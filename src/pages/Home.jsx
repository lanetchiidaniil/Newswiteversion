import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/home.css'

export default function Home() {
  const [navOpen, setNavOpen] = useState(false)
  const [worksOpen, setWorksOpen] = useState(false)

  return (
    <div className="home-page">
      <header>
        <div className="header-contaiener">
          <h1>Добро пожаловать</h1>
          <div
            className="burger-menu"
            onClick={() => setNavOpen((v) => !v)}
            onKeyDown={(e) => e.key === 'Enter' && setNavOpen((v) => !v)}
            role="button"
            tabIndex={0}
          >
            ☰ Меню
          </div>
          <nav className={navOpen ? 'active' : ''}>
            <ul className="header-list">
              <li>
                <a href="#about" onClick={() => setNavOpen(false)}>
                  О сайте
                </a>
              </li>
              <li
                className={`hiden-menu${worksOpen ? ' active' : ''}`}
                onClick={(e) => {
                  if (window.matchMedia('(max-width: 768px)').matches) {
                    e.preventDefault()
                    setWorksOpen((v) => !v)
                  }
                }}
              >
                <a href="#works" onClick={(e) => e.preventDefault()}>
                  Произведения
                </a>
                <ul className="dropdown">
                  <li>
                    <Link to="/poezii" onClick={() => { setNavOpen(false); setWorksOpen(false) }}>
                      Стихи
                    </Link>
                  </li>
                  <li>
                    <Link to="/stories" onClick={() => { setNavOpen(false); setWorksOpen(false) }}>
                      Рассказы
                    </Link>
                  </li>
                  <li>
                    <Link to="/books" onClick={() => { setNavOpen(false); setWorksOpen(false) }}>
                      Книги
                    </Link>
                  </li>
                </ul>
              </li>
              <li>
                <a href="#links" onClick={() => setNavOpen(false)}>
                  Ссылки
                </a>
              </li>
              <li>
                <Link to="/admin" onClick={() => setNavOpen(false)}>
                  Админ
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main>
        <div className="wrapper">
          <img src="/X2v02ezo_7w.jpg" className="image" alt="" />
          <div className="text">
            <h2>Падший ангел</h2>
            <p>История об ангелах, любви и возмездии</p>
            <p className="description">
              Предупреждение: Данный сайт был создан по желанию действующих читателей. Сам автор не считает себя ни
              писателем, ни поэтом. Так же автор не является очень грамотным человеком. При чтении стихов, рассказов и
              книг находящихся в наличии сайта, читайте по знакам препинаниям, а не по окончании слов, но это касается
              только стихов.
            </p>
          </div>
        </div>

        <div className="three-columns">
          <section id="about">
            <h2>О сайте</h2>
            <p>
              Сайт был создан 24.10.2024 по инициативе действующих читателей. Фотография находящаяся на главной страницы
              сайта, создана группой писателей из соц сети &quot;Вк&quot;. На данном сайте будут размещены стихи, рассказы
              и книги, которые смогли быть сохранены после потери телефона, что составляет около 20% от изначального
              количества. Все произведения будут размещены в период с 5.11.2024 до 5.11.2025. Всё творчество было
              написано на основе чувств автора, как способ выразить то, что я чувствовал в момент происходящего. Если вам
              не понравились что-либо из прочитанного, можете написать мне с предложениями корректирования. Стихи являются
              на &quot;Любителя&quot;, так что, понять их сможет только тот, кто сам прошёл через многое на своём пути.
              Спасибо, что зашли на этот сайт и соболезную о потраченном вами времени.
            </p>
          </section>

          <section id="works">
            <h2>Произведения</h2>
            <p>
              Все произведения выставленные на сайте, были написаны возрасте от 12 до 18 лет. Если вы не найдёте в них
              смысл, значит у вас ещё всё впереди. Возраст не является показателем ума, так что, не стоит думать, что в
              свои 12 лет я мог писать лишь о боге или цветочках. Я пережил многое в одиночку, и стихи, были одним из
              единственных способов высказаться. Для перехода в раздел конкретных произведений, выберите их в панели
              задач.
            </p>
          </section>

          <section id="links">
            <h2>Ссылки</h2>
            <p>Предупреждение: автор редко отвечает на сообщения.</p>
            <p>
              <a href="https://vk.com/padsiiangel" target="_blank" rel="noreferrer">
                Vk
              </a>
            </p>
            <p>Gmail: diaconnicita@gmail.com</p>
          </section>
        </div>
      </main>
      <footer>
        <div className="footer-content">
          <p>&copy; 2024 Падший ангел. Воспоминания прошлого. </p>
          <p>Создано с уважением к каждому читателю.</p>
        </div>
      </footer>
    </div>
  )
}
