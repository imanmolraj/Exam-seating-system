import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { UserPlus, Trash2, Shield, User, Eye, EyeOff } from 'lucide-react'

export default function AdminManage() {
  const { admin: self } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'admin' })
  const [showPass, setShowPass] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const fetchAdmins = () => {
    api.get('/admins')
      .then(res => setAdmins(res.data.admins))
      .catch(() => toast.error('Failed to load admins'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAdmins() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) { toast.error('All fields required'); return }
    setCreating(true)
    try {
      await api.post('/admins', form)
      toast.success(`Admin "${form.username}" created`)
      setForm({ username: '', email: '', password: '', role: 'admin' })
      setShowForm(false)
      fetchAdmins()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create admin')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Remove admin "${username}"?`)) return
    setDeleting(id)
    try {
      await api.delete(`/admins/${id}`)
      toast.success('Admin removed')
      setAdmins(a => a.filter(x => x.id !== id))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
  }

  return (
    <div style={{ padding: 32, animation: 'fadeIn 0.4s ease', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Admin Users</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage who has access to the ExamSeat portal</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
          background: showForm ? 'var(--bg-card)' : 'var(--primary)',
          border: showForm ? '1px solid var(--border)' : 'none',
          borderRadius: 'var(--radius-md)', color: showForm ? 'var(--text-secondary)' : 'white',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
        }}>
          <UserPlus size={15} />
          {showForm ? 'Cancel' : 'Add Admin'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24,
          animation: 'fadeIn 0.3s ease', boxShadow: '0 0 30px rgba(99,102,241,0.08)',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Create New Admin</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>USERNAME</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="john_doe" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>EMAIL</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Secure password" style={{ ...inputStyle, paddingRight: 40 }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>ROLE</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={creating} style={{
              padding: '11px 24px', background: creating ? 'rgba(99,102,241,0.4)' : 'var(--primary)',
              border: 'none', borderRadius: 'var(--radius-md)', color: 'white',
              fontSize: 14, fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {creating ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Creating...</> : <><UserPlus size={14} /> Create Admin</>}
            </button>
          </form>
        </div>
      )}

      {/* Admins list */}
      {loading ? (
        [...Array(3)].map((_, i) => <div key={i} style={{ height: 72, marginBottom: 10, borderRadius: 12 }} className="skeleton" />)
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {admins.map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              background: 'var(--bg-card)', border: `1px solid ${a.id === self?.id ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)', transition: 'border-color 0.2s',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: a.role === 'superadmin' ? 'rgba(99,102,241,0.15)' : 'rgba(34,211,238,0.1)',
                border: `1px solid ${a.role === 'superadmin' ? 'rgba(99,102,241,0.3)' : 'rgba(34,211,238,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {a.role === 'superadmin' ? <Shield size={18} color="var(--primary)" /> : <User size={18} color="var(--accent)" />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{a.username}</span>
                  {a.id === self?.id && <span style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>YOU</span>}
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)',
                    background: a.role === 'superadmin' ? 'rgba(99,102,241,0.1)' : 'rgba(34,211,238,0.08)',
                    color: a.role === 'superadmin' ? 'var(--primary)' : 'var(--accent)',
                  }}>{a.role.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {a.email} · Added {new Date(a.created_at).toLocaleDateString()}
                </div>
              </div>

              {a.id !== self?.id && (
                <button onClick={() => handleDelete(a.id, a.username)} disabled={deleting === a.id}
                  style={{
                    padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 8, cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                >
                  {deleting === a.id
                    ? <div style={{ width: 14, height: 14, border: '2px solid rgba(239,68,68,0.3)', borderTopColor: 'var(--danger)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    : <Trash2 size={14} />}
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
