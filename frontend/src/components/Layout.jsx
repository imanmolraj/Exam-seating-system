import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, ClipboardList, History, Users, LogOut, GraduationCap, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/allocate', icon: ClipboardList, label: 'New Allocation' },
  { to: '/records', icon: History, label: 'Exam Records' },
]

export default function Layout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px var(--primary-glow)',
            }}>
              <GraduationCap size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>ExamSeat</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>INTELLIGENT SYSTEM</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', padding: '4px 12px 8px' }}>NAVIGATION</div>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                transition: 'all 0.15s ease',
                position: 'relative',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} color={isActive ? 'var(--primary)' : 'currentColor'} />
                  {label}
                  {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />}
                </>
              )}
            </NavLink>
          ))}

          {admin?.role === 'superadmin' && (
            <>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', padding: '12px 12px 8px' }}>ADMINISTRATION</div>
              <NavLink
                to="/admins"
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  textDecoration: 'none', fontSize: 14, fontWeight: 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                {({ isActive }) => (
                  <>
                    <Users size={16} color={isActive ? 'var(--primary)' : 'currentColor'} />
                    Admin Users
                    {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />}
                  </>
                )}
              </NavLink>
            </>
          )}
        </nav>

        {/* User info + logout */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{
            padding: '10px 12px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            marginBottom: 8,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{admin?.username}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{admin?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', borderRadius: 'var(--radius-md)',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.08)'; e.target.style.color = 'var(--danger)'; e.target.style.borderColor = 'rgba(239,68,68,0.3)' }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-secondary)'; e.target.style.borderColor = 'var(--border)' }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        background: 'var(--bg-base)',
        position: 'relative',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'fixed', top: -200, right: -200, width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100%' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
