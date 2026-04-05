import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { Search, Download, Trash2, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Badge({ children, color = 'var(--primary)', bg }) {
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)',
      background: bg || `${color}18`, color,
    }}>{children}</span>
  )
}

export default function Records() {
  const { admin } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const fetchRecords = () => {
    setLoading(true)
    api.get('/records')
      .then(res => setRecords(res.data.records))
      .catch(() => toast.error('Failed to load records'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRecords() }, [])

  const handleDownload = async (record) => {
    try {
      const res = await api.get(`/allocate/${record.id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${record.exam_name.replace(/\s+/g, '_')}_seating_plan.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return
    setDeleting(id)
    try {
      await api.delete(`/records/${id}`)
      toast.success('Record deleted')
      setRecords(r => r.filter(rec => rec.id !== id))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = records.filter(r =>
    r.exam_name.toLowerCase().includes(search.toLowerCase()) ||
    r.created_by.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ padding: 32 }}>
      {[...Array(5)].map((_, i) => <div key={i} style={{ height: 68, marginBottom: 12, borderRadius: 12 }} className="skeleton" />)}
    </div>
  )

  return (
    <div style={{ padding: 32, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Exam Records</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{records.length} total record{records.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by exam name or admin..."
          style={{
            width: '100%', padding: '11px 16px 11px 40px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>No records found</p>
          <p style={{ fontSize: 13 }}>{search ? 'Try a different search term' : 'Generate your first seating plan to see records here'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(record => (
            <div key={record.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              transition: 'border-color 0.2s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--primary)', fontWeight: 700,
                }}>#{record.id}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.exam_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {record.created_by} · {new Date(record.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <Badge color="var(--accent)">{record.total_students} students</Badge>
                  <Badge color="var(--text-secondary)">{record.total_rooms} rooms</Badge>
                  <Badge color="var(--success)">{record.room_utilization}% util</Badge>
                  <Badge color="var(--primary)">{record.fairness_index} fair</Badge>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setExpanded(expanded === record.id ? null : record.id)}
                    style={{ padding: '7px 10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6, cursor: 'pointer', color: 'var(--primary)', display: 'flex' }}>
                    {expanded === record.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button onClick={() => handleDownload(record)}
                    style={{ padding: '7px 10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, cursor: 'pointer', color: 'var(--success)', display: 'flex' }}>
                    <Download size={14} />
                  </button>
                  {(admin?.role === 'superadmin' || record.created_by === admin?.username) && (
                    <button onClick={() => handleDelete(record.id)} disabled={deleting === record.id}
                      style={{ padding: '7px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}>
                      {deleting === record.id
                        ? <div style={{ width: 14, height: 14, border: '2px solid rgba(239,68,68,0.3)', borderTopColor: 'var(--danger)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        : <Trash2 size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {expanded === record.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '20px', animation: 'fadeIn 0.25s ease', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Room Utilization', value: `${record.room_utilization}%`, color: 'var(--success)' },
                      { label: 'Fairness Index', value: record.fairness_index, color: 'var(--primary)' },
                      { label: 'Load Variance', value: record.load_variance, color: 'var(--accent)' },
                      { label: 'Conflicts', value: record.conflict_count, color: record.conflict_count === 0 ? 'var(--success)' : 'var(--danger)' },
                    ].map(m => (
                      <div key={m.label} style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '12px 16px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6, letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {record.summary?.length > 0 && (
                    <>
                      <h4 style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>ROOM SUMMARY</h4>
                      <div style={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)' }}>
                            <tr>
                              {['Room', 'Departments', 'Students', 'Invigilators', 'Status'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {record.summary.map(row => (
                              <tr key={row.Room} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>#{row.Room}</td>
                                <td style={{ padding: '8px 12px' }}>{row.Departments}</td>
                                <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>{row.Students_Assigned}</td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.Invigilators}</td>
                                <td style={{ padding: '8px 12px' }}>
                                  <Badge color={row.Constraint_Check?.includes('Leftover') ? 'var(--warning)' : 'var(--success)'}>
                                    {row.Constraint_Check?.includes('Leftover') ? 'LEFTOVER' : 'OK'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {record.unallocated_log?.length > 0 && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
                      {record.unallocated_log.map((l, i) => <p key={i} style={{ fontSize: 11, color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>{l}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
