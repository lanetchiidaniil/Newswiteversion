import { Link } from 'react-router-dom'
import '../styles/books.css'

export default function Books() {
  return (
    <div className="books-page">
      <div className="navbar">
        <div className="navbar-left">Книги</div>
        <nav>
          <Link to="/">Главная</Link>
        </nav>
      </div>
      <div className="content">
        <div className="text-box">
          <p>
            <span className="attention">Внимание</span>
            <br />
            На данный момент, все книги разделили участь рукописей Гоголя. Сейчас полноценных книг нет, есть только
            наброски одного большого рассказа под названием &quot;Истории Уолтера&quot;, а также начертания сказки, схожей
            с &quot;Красной Шапочкой&quot;, но в более подробной и большой версии. Оба произведения начаты, но для показа
            ещё не готовы. В случае интереса к созданию этих произведений, напишите в личные сообщения автору сайта для
            получения новой информации и новых глав при их создании. Большое спасибо за внимание.
          </p>
        </div>
      </div>
    </div>
  )
}
