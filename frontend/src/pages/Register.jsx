import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Bus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      return setError('Le password non corrispondono.');
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Errore durante la registrazione.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark"><Bus size={28} /></div>
          <div className="auth-logo-name">ATV Verona</div>
        </div>

        <div className="auth-title">Crea il tuo account</div>
        <div className="auth-subtitle">Unisciti alla smart mobility di Verona</div>

        <form onSubmit={handleSubmit} className="stack stack-md">
          <div className="form-group">
            <label className="form-label">Nome completo</label>
            <div style={{ position:'relative' }}>
              <User size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft:40 }} type="text"
                placeholder="Mario Rossi" value={form.name}
                onChange={e => setForm(f => ({...f, name: e.target.value}))}
                required minLength={2} maxLength={50} autoComplete="name" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position:'relative' }}>
              <Mail size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft:40 }} type="email"
                placeholder="mario@esempio.it" value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))}
                required autoComplete="email" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position:'relative' }}>
              <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft:40, paddingRight:48 }}
                type={showPwd ? 'text' : 'password'}
                placeholder="Min. 8 caratteri, maiuscola e numero"
                value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                required minLength={8} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}>
                {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Conferma password</label>
            <div style={{ position:'relative' }}>
              <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft:40 }}
                type={showPwd ? 'text' : 'password'}
                placeholder="Ripeti la password"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({...f, confirmPassword: e.target.value}))}
                required autoComplete="new-password" />
            </div>
          </div>

          {error && <p className="form-error">⚠️ {error}</p>}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <span className="spinner" style={{ width:20, height:20, borderWidth:2 }} /> : 'Crea account'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'var(--text-muted)' }}>
          Hai già un account?{' '}
          <Link to="/login" style={{ color:'var(--primary)', fontWeight:600 }}>Accedi</Link>
        </p>
      </div>
    </div>
  );
}
