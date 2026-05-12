import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import { Scissors, LayoutDashboard, Users } from 'lucide-react'
import client from './apollo'
import Booking from './pages/Booking'
import Owner from './pages/Owner'
import Staff from './pages/Staff'

function Nav() {
  const base = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'
  const active = 'bg-white/20 text-white'
  const inactive = 'text-violet-200 hover:text-white hover:bg-white/10'

  return (
    <nav className="bg-violet-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <span className="text-lg font-bold tracking-tight flex items-center gap-2">
        <Scissors size={20} />
        BeautyBook ZM
      </span>
      <div className="flex gap-1">
        <NavLink to="/" end className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <Scissors size={15} /> Book
        </NavLink>
        <NavLink to="/staff" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <Users size={15} /> Staff
        </NavLink>
        <NavLink to="/owner" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <LayoutDashboard size={15} /> Owner
        </NavLink>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Nav />
          <Routes>
            <Route path="/" element={<Booking />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/owner" element={<Owner />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ApolloProvider>
  )
}
