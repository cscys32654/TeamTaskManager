// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { dashboardAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
    <div className="flex justify-between mb-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span>{icon}</span>
    </div>
    <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardAPI.getStats().then(res => setStats(res.data));
  }, []);

  const cards = [
    { label: 'Total Tasks', value: stats?.totalTasks, color: 'text-gray-800', icon: '📊' },
    { label: 'Completed', value: stats?.completedTasks, color: 'text-green-600', icon: '✅' },
    { label: 'In Progress', value: stats?.inProgressTasks, color: 'text-blue-600', icon: '🚧' },
    { label: 'Pending', value: stats?.pendingTasks, color: 'text-yellow-600', icon: '📌' },
    { label: 'Overdue', value: stats?.overdueTasks, color: 'text-red-600', icon: '⚠️' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Welcome, {user?.name} 👋</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>
    </div>
  );
}