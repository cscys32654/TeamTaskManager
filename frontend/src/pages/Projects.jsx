// src/pages/Projects.jsx
// (shortened for clarity — this is your upgraded version)

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [projects, setProjects] = useState([]);

  useEffect(() => {
    projectAPI.getAll().then(res => setProjects(res.data));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="flex justify-between mb-8">
        <h2 className="text-3xl font-bold">Projects</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {projects.map(p => (
          <div key={p._id} className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-lg transition">
            <h3 className="font-semibold">{p.name}</h3>
            <p className="text-sm text-gray-500 mt-2">{p.description}</p>

            <Link to={`/projects/${p._id}/board`} className="text-indigo-600 mt-4 block">
              Open →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}