import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import MetricCard from '../components/MetricCard'
import api from '../api'
import { BarChart2, Users, BookOpen, CheckCircle, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useNavigate } from 'react-router-dom'

const COLORS = ['#6366F1', '#22D3EE', '#10B981', '#F59E0B', '#EF4444', '#A78BFA']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  )
  return null
}

export default function Dashboard() {
  const { admin } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const recentChartData = stats?.recent_records?.slice(0, 6).map(r => ({
    name: r.exam_name.length > 12 ? r.exam_name.slice(0, 12) + '…' : r.exam_name,
    students: r.total_students,
    rooms: r.total_rooms,
    utilization: r.room_utilization,
  })) || []

  const fairnessData = stats?.recent_records?.slice(0, 5).map(r => ({
    name: r.exam_name.length > 10 ? r.exam_name.slice(0, 10) + '…' : r.exam_name,
    value: Math.round((r.fairness_index || 0) * 100),
  })) || []

  if (loading) return (
    <div style={{ padding: 32 }}>
      <div style={{ height: 24, width: 200, marginBottom: 32 }} className="skeleton" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ height: 120 }} className="skeleton" />)}
      </div>
    </div>
  )

  return (
    <div style={{ padding: 32, animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
          Welcome back, <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{admin?.username}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Here's your exam management overview
        </p>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        <MetricCard label="Total Exams" value={stats?.total_exams ?? 0} icon={BookOpen} color="var(--primary)" subtitle="All time" />
        <MetricCard label="Students Processed" value={stats?.total_students_processed ?? 0} icon={Users} color="var(--accent)" subtitle="Across all exams" />
        <MetricCard label="Avg Utilization" value={stats?.avg_utilization ?? 0} unit="%" icon={BarChart2} color="var(--success)" subtitle="Room fill rate" />
        <MetricCard label="Avg Fairness Index" value={stats?.avg_fairness ?? 0} icon={CheckCircle} color="var(--warning)" subtitle="Distribution score" />
      </div>

      {/* Charts row */}
      {stats?.total_exams > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 32 }}>
          {/* Bar Chart */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Students & Rooms per Exam</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Recent 6 exams</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={recentChartData} barSize={20}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="students" fill="#6366F1" radius={[4,4,0,0]} name="Students" />
                <Bar dataKey="rooms" fill="#22D3EE" radius={[4,4,0,0]} name="Rooms" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Fairness Scores</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Per exam (%)</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={fairnessData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {fairnessData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 48, textAlign: 'center', marginBottom: 32,
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎓</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No exams yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Generate your first seating plan to see analytics here</p>
          <button onClick={() => navigate('/allocate')} style={{
            padding: '10px 24px', background: 'var(--primary)', border: 'none',
            borderRadius: 'var(--radius-md)', color: 'white', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            Create Allocation <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Recent Records Table */}
      {stats?.recent_records?.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Recent Exams</h3>
            <button onClick={() => navigate('/records')} style={{
              display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
              color: 'var(--primary)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}>View all <ArrowRight size={12} /></button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Exam Name', 'Created By', 'Date', 'Students', 'Rooms', 'Utilization', 'Fairness'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recent_records.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px', fontWeight: 500 }}>{r.exam_name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{r.created_by}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{r.total_students}</td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{r.total_rooms}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{r.room_utilization}%</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{r.fairness_index}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
