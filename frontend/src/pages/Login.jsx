import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Bus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Errore di connessione. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">
            <Bus size={28} />
          </div>
          <div className="auth-logo-name">ATV Verona</div>
        </div>

        <div className="auth-title">Bentornato!</div>
        <div className="auth-subtitle">Accedi al tuo account per continuare</div>

        <form onSubmit={handleSubmit} className="stack stack-md">
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 40 }}
                type="email"
                placeholder="la-tua@email.it"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 40, paddingRight: 48 }}
                type={showPwd ? 'text' : 'password'}
                placeholder="La tua password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}>
                {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {error && <p className="form-error">⚠️ {error}</p>}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <span className="spinner" style={{ width:20, height:20, borderWidth:2 }} /> : 'Accedi'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'var(--text-muted)' }}>
          Non hai un account?{' '}
          <Link to="/register" style={{ color:'var(--primary)', fontWeight:600 }}>Registrati</Link>
        </p>
      </div>
    </div>
  );
}
