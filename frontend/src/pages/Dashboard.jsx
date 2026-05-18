import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { Bus, Ticket, Navigation, Clock, RefreshCw, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STOPS = [
  { id: 'VR_PN_FS', name: 'Porta Nuova FS' },
  { id: 'VR_BRA',   name: 'Piazza Bra' },
  { id: 'VR_ERBE',  name: 'Piazza Erbe' },
  { id: 'VR_BORGO', name: 'Borgo Trento - Osp.' },
  { id: 'VR_STADIO',name: 'Stadio Bentegodi' },
];

function statusLabel(s) {
  if (s === 'in_orario')  return { text: 'In orario',  cls: 'in_orario' };
  if (s === 'in_ritardo') return { text: 'In ritardo', cls: 'in_ritardo' };
  return { text: 'In anticipo', cls: 'in_anticipo' };
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [arrivals, setArrivals] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedStop, setSelectedStop] = useState('VR_PN_FS');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [favLines, setFavLines] = useState([]);
  const [favLoading, setFavLoading] = useState(true);

  // Refresh arrivals in place — no full-page loading state, so the layout
  // never reflows on the 30s auto-refresh (only the cards' content updates).
  async function fetchArrivals(stopId) {
    try {
      const res = await api.get(`/api/bus/arrivals/${stopId}`);
      setArrivals(res.data.arrivals.slice(0, 4));
      setLastUpdate(new Date());
    } catch {
      setArrivals([]);
    } finally {
      setInitialLoad(false);
    }
  }

  async function fetchFavourites() {
    try {
      const res = await api.get('/api/favourites/lines');
      setFavLines(res.data.lines);
    } catch {
      setFavLines([]);
    } finally {
      setFavLoading(false);
    }
  }

  async function removeFavourite(lineId, e) {
    e.stopPropagation();
    try {
      const res = await api.delete(`/api/favourites/lines/${lineId}`);
      setFavLines(res.data.lines);
    } catch {
      // keep the current list on error
    }
  }

  useEffect(() => {
    fetchArrivals(selectedStop);
    const interval = setInterval(() => fetchArrivals(selectedStop), 30000);
    return () => clearInterval(interval);
  }, [selectedStop]);

  // Favourite lines load once on mount — independent of the stop selector.
  useEffect(() => { fetchFavourites(); }, []);

  return (
    <div>
      {/* Hero */}
      <div className="hero-banner">
        <div className="row row-between" style={{ marginBottom: 16 }}>
          <div>
            <div className="hero-greeting">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Ciao'} 👋
            </div>
            <div className="hero-date">
              {new Date().toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </div>
          </div>
          <div className="live-dot" style={{ marginTop: 4 }}>
            <div className="live-dot-inner" />
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
          {[
            { icon: Ticket,     label: 'Acquista',  path: '/biglietti', color:'var(--accent)', textColor:'var(--text)' },
            { icon: Navigation, label: 'Percorso',  path: '/percorso',  color:'rgba(255,255,255,0.2)', textColor:'white' },
            { icon: Clock,      label: 'Orari',     path: '/orari',     color:'rgba(255,255,255,0.2)', textColor:'white' },
          ].map(({ icon: Icon, label, path, color, textColor }) => (
            <button key={path} onClick={() => navigate(path)}
              style={{ background: color, border:'none', borderRadius: 'var(--radius-md)',
                       padding:'12px 8px', display:'flex', flexDirection:'column', alignItems:'center',
                       gap:6, cursor:'pointer', transition:'transform 0.15s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              <Icon size={20} color={textColor} />
              <span style={{ fontSize:12, fontWeight:700, color: textColor }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="page-pad stack stack-lg">
        {/* Bus Widget */}
        <div>
          <div className="section-header">
            <div className="row row-gap-sm">
              <div className="live-dot"><div className="live-dot-inner" /></div>
              <span className="section-title">Prossime partenze</span>
            </div>
            <button onClick={() => fetchArrivals(selectedStop)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Stop selector */}
          <div className="tab-bar" style={{ marginBottom:12 }}>
            {STOPS.map(s => (
              <button key={s.id} className={`tab-item${selectedStop === s.id ? ' active':''}`}
                      onClick={() => setSelectedStop(s.id)}>
                {s.name}
              </button>
            ))}
          </div>

          {/* Fixed min-height keeps the page stable while the list refreshes */}
          <div style={{ minHeight: 280 }}>
          {initialLoad ? (
            <div className="loading-screen"><div className="spinner" /></div>
          ) : arrivals.length === 0 ? (
            <div className="empty-state" style={{ padding:'24px 0' }}>
              <span className="empty-icon">🚌</span>
              <span className="empty-subtitle">Nessuna partenza trovata per questa fermata.</span>
            </div>
          ) : (
            <div className="stack stack-sm">
              {arrivals.map((a, i) => {
                const sl = statusLabel(a.status);
                return (
                  <div key={i} className="card card-sm" style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div className="bus-line-badge" style={{ background: a.lineColor || 'var(--primary)' }}>
                      {a.lineNumber}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {a.destination}
                      </div>
                      <div className="row row-gap-sm" style={{ marginTop:3 }}>
                        <span className={`badge badge-${sl.cls}`} style={{ padding:'2px 8px', fontSize:10 }}>
                          {sl.text}
                        </span>
                        {a.delayMinutes > 0 && (
                          <span style={{ fontSize:11, color:'var(--error)' }}>+{a.delayMinutes} min</span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div className="eta-time">{a.etaMinutes}'</div>
                      <div className="eta-unit">min</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>

          {lastUpdate && (
            <p style={{ fontSize:11, color:'var(--text-muted)', textAlign:'right', marginTop:8 }}>
              Aggiornato: {lastUpdate.toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' })}
            </p>
          )}
        </div>

        {/* Navigate to full bus section */}
        <button className="btn btn-outline btn-full" onClick={() => navigate('/bus')}>
          <Bus size={16} /> Vedi tutte le partenze
        </button>

        {/* Favourite lines */}
        <div>
          <div className="section-header">
            <div className="row row-gap-sm">
              <Star size={16} fill="var(--accent)" color="var(--accent-dark)" />
              <span className="section-title">Linee preferite</span>
            </div>
          </div>

          {favLoading ? null : favLines.length === 0 ? (
            <div className="card card-ghost" onClick={() => navigate('/orari')}
                 style={{ cursor:'pointer', textAlign:'center', padding:'22px 16px' }}>
              <div style={{ fontSize:30, marginBottom:6 }}>⭐</div>
              <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.5 }}>
                Non hai ancora linee preferite.<br/>
                Tocca la stella su una linea in <strong style={{ color:'var(--text-secondary)' }}>Orari</strong> per ritrovarla qui.
              </div>
            </div>
          ) : (
            <div className="stack stack-sm">
              {favLines.map(line => (
                <div key={line.id} className="card card-sm"
                     onClick={() => navigate('/orari', { state: { lineId: line.id } })}
                     style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
                  <div className="bus-line-badge" style={{ background: line.color || 'var(--primary)', flexShrink:0 }}>
                    {line.number}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {line.name}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:2 }}>
                      {line.description}
                    </div>
                  </div>
                  <span onClick={e => removeFavourite(line.id, e)}
                    style={{ display:'flex', alignItems:'center', padding:6, margin:-6, flexShrink:0, cursor:'pointer' }}>
                    <Star size={18} fill="var(--accent)" color="var(--accent-dark)" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}
