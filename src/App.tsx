import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import ComingSoon from './ComingSoon'
import EventsPage from './pages/EventsPage'

const App = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<ComingSoon />} />
          <Route path="/events" element={<EventsPage />} />
        </Routes>
      </Router>
      <Analytics />
    </>
  )
}

export default App