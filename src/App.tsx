import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Stacks from './pages/Stacks'
import Inbox from './pages/Inbox'
import AIReviews from './pages/AIReviews'
import MergeQueue from './pages/MergeQueue'
import Insights from './pages/Insights'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="stacks" element={<Stacks />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="reviews" element={<AIReviews />} />
        <Route path="merge-queue" element={<MergeQueue />} />
        <Route path="insights" element={<Insights />} />
      </Route>
    </Routes>
  )
}
