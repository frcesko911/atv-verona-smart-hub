import { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { User, MapPin, Bell, LogOut, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Names: letters (incl. accents), spaces, hyphens, apostrophes — no digits/symbols
const NAME_REGEX = /^[\p{L}][\p{L} '-]*$/u;

const STOPS_PREVIEW = [
  { id:'VR_PN_FS', name:'Verona Porta Nuova FS' },
  { id:'VR_BRA',   name:'Piazza Bra' },
  { id:'VR_ERBE',  name:'Piazza Erbe' },
  { id:'VR_BORGO', name:'Borgo Trento - Ospedale' },
  { id:'VR_STADIO',name:'Stadio Bentegodi' },
  { id:'VF_AERO',  name:'Aeroporto Catullo' },
];

export default function Settings() {
  const { user, logout, updateProfile } = useAuth();
  const [settings, setSettings] = useState({ home_stop_id: '', notifications_enabled: true, language: 'it' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    api.get('/api/settings').then(r => {
      setSettings(prev => ({ ...prev, ...(r.data.settings || {}) }));
      setLoading(false);
    });
  }, []);

  async function save() {
    try {
      await api.put('/api/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert('Errore nel salvataggio.'); }
  }

  async function saveProfile() {
    setProfileError('');
    const name = profileName.trim();
    const email = profileEmail.trim();
    if (!NAME_REGEX.test(name) || name.length < 2 || name.length > 101) {
      return setProfileError('Il nome può contenere solo lettere, spazi, trattini e apostrofi (2-101 caratteri).');
    }
    if (!email || !email.includes('@')) {
      return setProfileError('Inserisci un indirizzo email valido.');
    }
    setProfileSaving(true);
    try {
      await updateProfile(name, email);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Errore durante l\'aggiornamento.');
    } finally {
      setProfileSaving(false);
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div className="page-pad stack stack-lg">
      {/* Profile Card */}
      <div className="card card-lg" style={{ background:'linear-gradient(135deg, var(--primary) 0%, #3B82F6 100%)', color:'white' }}>
        <div className="row row-gap-sm" style={{ gap:16 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, flexShrink:0 }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize:19, fontWeight:800 }}>{user?.name}</div>
            <div style={{ fontSize:13, opacity:0.85 }}>{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Personal Data */}
      <div className="card">
        <div className="row row-gap-sm" style={{ marginBottom:14 }}>
          <User size={18} color="var(--primary)"/>
          <span style={{ fontSize:16, fontWeight:700 }}>Dati personali</span>
        </div>
        <div className="form-group" style={{ marginBottom:14 }}>
          <label className="form-label">Nome</label>
          <input className="form-input" type="text"
            placeholder="Il tuo nome"
            value={profileName}
            onChange={e => setProfileName(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom:24 }}>
          <label className="form-label">Email</label>
          <input className="form-input" type="email"
            placeholder="nome@esempio.it"
            value={profileEmail}
            onChange={e => setProfileEmail(e.target.value)} />
        </div>
        {profileError && <p className="form-error" style={{ marginBottom:10 }}>⚠️ {profileError}</p>}
        <button className="btn btn-primary btn-full" onClick={saveProfile} disabled={profileSaving}>
          {profileSaving
            ? <span className="spinner" style={{ width:20, height:20, borderWidth:2 }} />
            : profileSaved
              ? <><Check size={18}/> Salvato!</>
              : 'Salva dati personali'}
        </button>
      </div>

      {/* Home Stop */}
      <div className="card">
        <div className="row row-gap-sm" style={{ marginBottom:14 }}>
          <MapPin size={18} color="var(--primary)"/>
          <span style={{ fontSize:16, fontWeight:700 }}>Fermata preferita</span>
        </div>
        <div className="form-group">
          <select className="form-select" value={settings.home_stop_id || ''}
            onChange={e => setSettings(s => ({...s, home_stop_id: e.target.value}))}>
            <option value="">Seleziona fermata...</option>
            {STOPS_PREVIEW.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:8 }}>
          Verrà mostrata come fermata principale nella Dashboard.
        </p>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="row-between">
          <div className="row row-gap-sm">
            <Bell size={18} color="var(--primary)"/>
            <div>
              <div style={{ fontSize:16, fontWeight:700 }}>Notifiche</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>Ritardi, scadenze biglietti, attività</div>
            </div>
          </div>
          <button
            onClick={() => setSettings(s => ({...s, notifications_enabled: !s.notifications_enabled}))}
            style={{ width:50, height:28, borderRadius:14, background: settings.notifications_enabled ? 'var(--primary)' : 'var(--border)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
            <div style={{ width:22, height:22, borderRadius:'50%', background:'white', position:'absolute', top:3, left: settings.notifications_enabled ? 25 : 3, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
          </button>
        </div>
      </div>

      {/* Save */}
      <button className="btn btn-primary btn-full btn-lg" onClick={save}>
        {saved ? <><Check size={18}/> Salvato!</> : 'Salva impostazioni'}
      </button>

      {/* Logout */}
      <div style={{ paddingTop:8 }}>
        <button className="btn btn-danger btn-full" onClick={() => setShowLogoutConfirm(true)}>
          <LogOut size={16}/> Esci dall'account
        </button>
      </div>

      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Esci dall'account</div>
            <p style={{ fontSize:15, color:'var(--text-secondary)', marginBottom:20 }}>
              Sei sicuro di voler uscire? Dovrai effettuare nuovamente l'accesso.
            </p>
            <div className="row row-gap-sm">
              <button className="btn btn-ghost btn-full" onClick={() => setShowLogoutConfirm(false)}>
                Annulla
              </button>
              <button className="btn btn-danger btn-full" onClick={logout}>
                Sì, esci
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Info */}
      <div style={{ textAlign:'center', paddingBottom:8 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text-secondary)' }}>ATV Verona Smart Hub</div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>v1.0.0 · Powered by ATV Verona</div>
      </div>
    </div>
  );
}
