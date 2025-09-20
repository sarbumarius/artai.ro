// src/components/RegisterPage.tsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Eroare la înregistrare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Înregistrare</h1>
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-200 px-3 py-2 rounded mb-4 text-sm">{error}</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Username</label>
            <input
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-600"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-600"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Parola</label>
            <input
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-600"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="parola"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded font-medium"
          >
            {loading ? 'Se înregistrează...' : 'Înregistrare'}
          </button>
        </form>
        <div className="text-center text-sm text-gray-400 mt-4">
          Ai deja cont? <Link className="text-purple-400 hover:underline" to="/login">Autentifică-te</Link>
        </div>
      </div>
    </div>
  );
}
