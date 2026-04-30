import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
  });

  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🔥 SUBMIT CLICKED"); // debug

    setLoading(true);
    try {
      console.log("📤 Sending data:", form);

      const { data } = await authAPI.register(form);

      console.log("✅ RESPONSE:", data);

      login(data.token, data.user);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      console.error("❌ ERROR:", err);
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-1">Create account</h2>
        <p className="text-gray-500 text-sm mb-6">Get started for free</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              placeholder="••••••••"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm((p) => ({ ...p, role: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium"
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Have an account?{' '}
          <Link to="/login" className="text-blue-500 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}