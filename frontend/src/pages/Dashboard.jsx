import { useEffect, useState } from 'react';
import { dashboardAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const CARDS = [
  { key: 'totalTasks',      label: 'Total Tasks',  emoji: '📋', accent: '#4F46E5', glow: 'rgba(79,70,229,0.12)' },
  { key: 'completedTasks',  label: 'Completed',    emoji: '✅', accent: '#10B981', glow: 'rgba(16,185,129,0.12)' },
  { key: 'inProgressTasks', label: 'In Progress',  emoji: '⏳', accent: '#818CF8', glow: 'rgba(129,140,248,0.12)' },
  { key: 'pendingTasks',    label: 'Pending',      emoji: '📌', accent: '#F59E0B', glow: 'rgba(245,158,11,0.12)' },
  { key: 'overdueTasks',    label: 'Overdue',      emoji: '⚠️', accent: '#EF4444', glow: 'rgba(239,68,68,0.12)' },
];

const StatCard = ({ label, value, emoji, accent, glow }) => (
  <div style={{
    background: '#1E293B',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: '16px',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s, border-color 0.2s',
    cursor: 'default',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${accent}40`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(148,163,184,0.1)'; }}
  >
    {/* Glow orb */}
    <div style={{
      position: 'absolute', top: '-20px', right: '-20px',
      width: '80px', height: '80px', borderRadius: '50%',
      background: glow, pointerEvents: 'none',
    }} />

    <div style={{
      width: '32px', height: '32px', borderRadius: '9px',
      background: `${accent}20`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '15px', marginBottom: '14px',
    }}>{emoji}</div>

    <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
      {label}
    </div>
    <div style={{
      fontFamily: "'Syne', 'DM Sans', sans-serif",
      fontWeight: 700, fontSize: '32px', color: '#E2E8F0', lineHeight: 1,
    }}>
      {value ?? <span style={{ color: '#334155' }}>—</span>}
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? 'Good morning' : greetHour < 18 ? 'Good afternoon' : 'Good evening';

  const completion = stats?.totalTasks
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div style={{
      padding: '32px 28px', maxWidth: '1100px', margin: '0 auto',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{
          fontFamily: "'Syne', 'DM Sans', sans-serif",
          fontWeight: 700, fontSize: '26px', color: '#E2E8F0',
          marginBottom: '4px',
        }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ color: '#475569', fontSize: '13px' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', marginBottom: '28px' }}>
          {CARDS.map(c => (
            <div key={c.key} style={{ background: '#1E293B', borderRadius: '16px', height: '120px', border: '1px solid rgba(148,163,184,0.1)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', marginBottom: '28px' }}>
          {CARDS.map(c => (
            <StatCard key={c.key} label={c.label} value={stats?.[c.key]} emoji={c.emoji} accent={c.accent} glow={c.glow} />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {stats?.totalTasks > 0 && (
        <div style={{
          background: '#1E293B', border: '1px solid rgba(148,163,184,0.1)',
          borderRadius: '16px', padding: '20px 24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>Overall Progress</span>
            <span style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '18px', color: '#E2E8F0',
            }}>{completion}%</span>
          </div>
          <div style={{ height: '6px', background: '#0F172A', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '99px',
              background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
              width: `${completion}%`, transition: 'width 0.8s ease',
            }} />
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '14px' }}>
            {[
              { label: 'Completed', val: stats?.completedTasks, color: '#10B981' },
              { label: 'Remaining', val: (stats?.totalTasks || 0) - (stats?.completedTasks || 0), color: '#64748B' },
              { label: 'Overdue',   val: stats?.overdueTasks, color: '#EF4444' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '12px', color: '#475569' }}>{label}:</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>{val ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
