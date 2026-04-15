import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = '/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { lang, changeLang, t } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) { setError(t.usernameRequired); return; }
    if (!password) { setError(t.passwordRequired); return; }
    if (password !== confirmPassword) { setError(t.passwordMismatch); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Lang': lang },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        alert(t.registerSuccess);
        navigate('/login');
      }
    } catch (err) {
      setError(t.registerError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🧋</div>
          <h1 className="text-2xl font-bold text-gray-800">{t.registerTitle}</h1>
          <p className="text-gray-500 text-sm mt-2">{t.registerSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              className="input"
              placeholder={t.username}
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              className="input"
              type="password"
              placeholder={t.password}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              className="input"
              type="password"
              placeholder={t.confirmPassword}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-danger text-sm text-center">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? t.registering : t.register}
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-indigo-600 hover:underline"
            >
              {t.goToLogin}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
