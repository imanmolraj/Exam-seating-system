import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function MetricCard({ label, value, unit = '', icon: Icon, color = 'var(--primary)', subtitle, trend }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, border-color 0.2s ease',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--border-bright)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* Subtle background accent */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        borderRadius: '50%',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
        {Icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={15} color={color} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-mono)',
          color, letterSpacing: '-0.02em',
        }}>{value}</span>
        {unit && <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{unit}</span>}
      </div>

      {(subtitle || trend !== undefined) && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          {trend !== undefined && (
            trend > 0 ? <TrendingUp size={13} color="var(--success)" /> :
            trend < 0 ? <TrendingDown size={13} color="var(--danger)" /> :
            <Minus size={13} color="var(--text-muted)" />
          )}
          {subtitle && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{subtitle}</span>}
        </div>
      )}
    </div>
  )
}
