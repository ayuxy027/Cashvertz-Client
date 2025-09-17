import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AppProvider } from './context/AppContext'
import ComingSoon from './ComingSoon'
import EventsPage from './pages/EventsPage'
import AdminPage from './pages/AdminPage'

const App = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ComingSoon />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
      <Analytics />
    </AppProvider>
  )
}

export default App