import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Doctors from './pages/Doctors'
import Appointments from './pages/Appointments'
import Departments from './pages/Departments'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-sienna-500 flex items-center justify-center mx-auto mb-4 shadow-glow-sienna">
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
            <path d="M12 4v4m0 8v4M4 12h4m8 0h4" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="3" y="3" width="18" height="18" rx="4" stroke="white" strokeWidth="1.5" opacity="0.4"/>
          </svg>
        </div>
        <p className="text-ink-400 text-sm font-sans">Loading Borderless HMS…</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/"            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/patients"    element={<ProtectedRoute><Patients /></ProtectedRoute>} />
      <Route path="/doctors"     element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
      <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
      <Route path="*"            element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
