import { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Calendar, Clock, ArrowRight, Bus, Ticket } from 'lucide-react';

export default function TravelPlanner() {
  const navigate = useNavigate();
  const [stops, setStops] = useState([]);
  const [form, setForm] = useState({ from: '', to: '', fromId: '', toId: '', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0,5) });
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api.get('/api/bus/stops').then(r => setStops(r.data.stops));
  }, []);

  function filterStops(q) {
    if (q.length < 2) return [];
    return stops.filter(s => s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
  }

  async function search(e) {
    e.preventDefault();
    if (!form.fromId || !form.toId) return;
    setLoading(true); setSearched(true);
    try {
      const res = await api.get(`/api/bus/plan?from=${form.fromId}&to=${form.toId}`);
      setRoutes(res.data.routes);
    } catch { setRoutes([]); }
    finally { setLoading(false); }
  }

  function swapStops() {
    setForm(f => ({ ...f, from: f.to, to: f.from, fromId: f.toId, toId: f.fromId }));
    setRoutes([]);
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' });
  }

  function formatDuration(min) {
    if (min < 60) return `${min} min`;
    return `${Math.floor(min/60)}h ${min%60}min`;
  }

  return (
    <div className="page-pad stack stack-lg">
      {/* Search form */}
      <div className="card card-lg">
        <form onSubmit={search} className="stack stack-md">
          {/* From */}
          <div style={{ position:'relative' }}>
            <div style={{ position:'relative' }}>
              <MapPin size={16} color="var(--success)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input className="form-input" style={{ paddingLeft:40 }}
                placeholder="Partenza..."
                value={form.from}
                onChange={e => { setForm(f=>({...f, from:e.target.value, fromId:''})); setFromSuggestions(filterStops(e.target.value)); }}
              />
            </div>
            {fromSuggestions.length > 0 && (
              <div style={{ position:'absolute', top:'calc(100%+4px)', left:0, right:0, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-md)', zIndex:50 }}>
                {fromSuggestions.map(s => (
                  <button key={s.id} type="button" onClick={() => { setForm(f=>({...f,from:s.name,fromId:s.id})); setFromSuggestions([]); }}
                    style={{ display:'block', width:'100%', padding:'10px 14px', textAlign:'left', background:'none', border:'none', cursor:'pointer', fontSize:14, borderBottom:'1px solid var(--border-light)' }}
                    onMouseOver={e => e.currentTarget.style.background='var(--bg-secondary)'}
                    onMouseOut={e => e.currentTarget.style.background='none'}>
                    📍 {s.name} <span style={{ color:'var(--text-muted)', fontSize:12 }}>· {s.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap button */}
          <div style={{ textAlign:'center' }}>
            <button type="button" onClick={swapStops}
              style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'50%', width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform='rotate(180deg)'}
              onMouseOut={e => e.currentTarget.style.transform=''}>
              ↕️
            </button>
          </div>

          {/* To */}
          <div style={{ position:'relative' }}>
            <div style={{ position:'relative' }}>
              <MapPin size={16} color="var(--error)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input className="form-input" style={{ paddingLeft:40 }}
                placeholder="Destinazione..."
                value={form.to}
                onChange={e => { setForm(f=>({...f,to:e.target.value,toId:''})); setToSuggestions(filterStops(e.target.value)); }}
              />
            </div>
            {toSuggestions.length > 0 && (
              <div style={{ position:'absolute', top:'calc(100%+4px)', left:0, right:0, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-md)', zIndex:50 }}>
                {toSuggestions.map(s => (
                  <button key={s.id} type="button" onClick={() => { setForm(f=>({...f,to:s.name,toId:s.id})); setToSuggestions([]); }}
                    style={{ display:'block', width:'100%', padding:'10px 14px', textAlign:'left', background:'none', border:'none', cursor:'pointer', fontSize:14, borderBottom:'1px solid var(--border-light)' }}
                    onMouseOver={e => e.currentTarget.style.background='var(--bg-secondary)'}
                    onMouseOut={e => e.currentTarget.style.background='none'}>
                    📍 {s.name} <span style={{ color:'var(--text-muted)', fontSize:12 }}>· {s.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date / Time — stacked so the native pickers never overlap */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12 }}>
            <div className="form-group">
              <label className="form-label">Data</label>
              <div style={{ position:'relative', minWidth:0 }}>
                <Calendar size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
                <input className="form-input" style={{ paddingLeft:38, width:'100%' }} type="date"
                  value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Ora</label>
              <div style={{ position:'relative', minWidth:0 }}>
                <Clock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
                <input className="form-input" style={{ paddingLeft:38, width:'100%' }} type="time"
                  value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || !form.fromId || !form.toId}>
            {loading ? 'Ricerca...' : <><Navigation size={16}/> Cerca percorso</>}
          </button>
        </form>
      </div>

      {/* Results */}
      {searched && !loading && (
        <div>
          <div className="section-title" style={{ marginBottom:14 }}>
            {routes.length === 0 ? 'Nessun percorso trovato' : `${routes.length} percors${routes.length===1?'o':'i'} trovati`}
          </div>
          <div className="stack stack-md">
            {routes.map((r, i) => (
              <div key={i} className="card card-lg animate-in" style={{ animationDelay:`${i*0.1}s` }}>
                <div className="row-between" style={{ marginBottom:14 }}>
                  <div>
                    <div className="badge" style={{ background: r.type==='diretto' ? 'var(--success-bg)' : 'var(--warning-bg)', color: r.type==='diretto' ? '#059669' : 'var(--warning)', marginBottom:8 }}>
                      {r.type === 'diretto' ? '🟢 Diretto' : '🔄 Con cambio'}
                    </div>
                    <div style={{ fontSize:17, fontWeight:700 }}>{r.lineName}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:22, fontWeight:800, color:'var(--primary)' }}>{formatDuration(r.duration)}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{r.transfers === 0 ? 'Nessun cambio' : `${r.transfers} cambio`}</div>
                  </div>
                </div>

                <div className="row row-gap-sm" style={{ marginBottom:14 }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:17, fontWeight:800 }}>{formatTime(r.departureTime)}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.from.split(' ').slice(0,2).join(' ')}</div>
                  </div>
                  <div style={{ flex:1, display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ flex:1, height:2, background:'var(--border)', borderRadius:1 }} />
                    <Bus size={16} color="var(--primary)" />
                    <div style={{ flex:1, height:2, background:'var(--border)', borderRadius:1 }} />
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:17, fontWeight:800 }}>{formatTime(r.arrivalTime)}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.to.split(' ').slice(0,2).join(' ')}</div>
                  </div>
                </div>

                <div className="divider" />

                <button className="btn btn-accent btn-full btn-sm" onClick={() => navigate('/biglietti')}>
                  <Ticket size={14}/> Acquista biglietto per questo percorso
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
