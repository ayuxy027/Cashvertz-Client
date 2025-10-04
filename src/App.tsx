import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import ComingSoon from './ComingSoon'
import EventsPage from './pages/EventsPage'
import AdminDashboard from './components/AdminDashboard'
import Terms from './pages/Terms'

const App = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<ComingSoon />} />
          <Route path="/toing" element={<EventsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </Router>
      <Analytics />
    </>
  )
}

export default App