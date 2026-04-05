import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Allocate from './pages/Allocate'
import Records from './pages/Records'
import AdminManage from './pages/AdminManage'
import Layout from './components/Layout'

function ProtectedRoute({ children, superadminOnly = false }) {
  const { admin, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-base)' }}>
      <div style={{ width:40, height:40, border:'3px solid var(--border)', borderTopColor:'var(--primary)', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
    </div>
  )
  if (!admin) return <Navigate to="/login" replace />
  if (superadminOnly && admin.role !== 'superadmin') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { admin } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={admin ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="allocate" element={<Allocate />} />
        <Route path="records" element={<Records />} />
        <Route path="admins" element={<ProtectedRoute superadminOnly><AdminManage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--bg-card)' } },
            error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg-card)' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
