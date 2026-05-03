import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Books from './pages/Books.jsx'
import Stories from './pages/Stories.jsx'
import Poezii from './pages/Poezii.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/books" element={<Books />} />
      <Route path="/stories" element={<Stories />} />
      <Route path="/poezii" element={<Poezii />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}
