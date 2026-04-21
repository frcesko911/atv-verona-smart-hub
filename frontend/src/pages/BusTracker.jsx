import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, RefreshCw, MapPin, Navigation } from 'lucide-react';

const STATUS_LABEL = {
  in_orario:  { text: 'In orario',  cls: 'in_orario' },
  in_ritardo: { text: 'In ritardo', cls: 'in_ritardo' },
  in_anticipo:{ text: 'In anticipo',cls: 'in_anticipo' },
};

const SUB_TABS = ['Arrivi', 'Mappa'];

export default function BusTracker() {
  const [stops, setStops] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedStop, setSelectedStop] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [tab, setTab] = useState('Arrivi');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const intervalRef = useRef(null);

  // Load all stops initially
  useEffect(() => {
    axios.get('/api/bus/stops').then(r => setStops(r.data.stops));
  }, []);

  // Filter suggestions
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const filtered = stops.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
    setSuggestions(filtered);
  }, [query, stops]);

  async function fetchArrivals(stop) {
    setLoading(true);
    try {
      const res = await axios.get(`/api/bus/arrivals/${stop.id}`);
      setArrivals(res.data.arrivals);
      setLastUpdate(new Date());
    } catch { setArrivals([]); }
    finally { setLoading(false); }
  }

  function selectStop(stop) {
    setSelectedStop(stop);
    setQuery(stop.name);
    setShowSuggestions(false);
    fetchArrivals(stop);

    // Auto-refresh every 30s
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchArrivals(stop), 30000);
  }

  useEffect(() => () => clearInterval(intervalRef.current), []);

  // Load default stop on mount
  useEffect(() => {
    if (stops.length > 0 && !selectedStop) {
      const def = stops.find(s => s.id === 'VR_PN_FS') || stops[0];
      selectStop(def);
    }
  }, [stops]); // eslint-disable-line

  return (
    <div className="page-pad stack stack-lg">
      {/* Search */}
      <div style={{ position:'relative' }}>
        <div style={{ position:'relative' }}>
          <Search size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
          <input className="form-input" style={{ paddingLeft:42, paddingRight:42 }}
            placeholder="Cerca fermata ATV..."
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
          />
          {selectedStop && (
            <button style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}
              onClick={() => fetchArrivals(selectedStop)}>
              <RefreshCw size={15}/>
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-md)', zIndex:50, overflow:'hidden' }}>
            {suggestions.map(s => (
              <button key={s.id}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'12px 14px', background:'none', border:'none', cursor:'pointer', textAlign:'left', borderBottom:'1px solid var(--border-light)' }}
                onClick={() => selectStop(s)}
                onMouseOver={e => e.currentTarget.style.background='var(--bg-secondary)'}
                onMouseOut={e => e.currentTarget.style.background='none'}>
                <MapPin size={14} color="var(--primary)" />
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{s.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.city}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Stop Info */}
      {selectedStop && (
        <div className="card card-sm" style={{ background:'var(--primary-ghost)', border:'1px solid var(--primary-light)' }}>
          <div className="row row-gap-sm">
            <MapPin size={16} color="var(--primary)" />
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--primary)' }}>{selectedStop.name}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{selectedStop.city} · ID: {selectedStop.id}</div>
            </div>
            <div style={{ marginLeft:'auto' }}>
              <div className="live-dot"><div className="live-dot-inner"/></div>
            </div>
          </div>
        </div>
      )}

      {/* Sub tabs */}
      <div className="tab-bar">
        {SUB_TABS.map(t => (
          <button key={t} className={`tab-item${tab===t?' active':''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Arrivi' && (
        <>
          {loading ? (
            <div className="loading-screen"><div className="spinner"/></div>
          ) : arrivals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚌</div>
              <div className="empty-title">Nessun arrivo</div>
              <div className="empty-subtitle">Seleziona una fermata per vedere i prossimi autobus.</div>
            </div>
          ) : (
            <div className="stack stack-sm">
              {arrivals.map((a, i) => {
                const sl = STATUS_LABEL[a.status] || STATUS_LABEL.in_orario;
                return (
                  <div key={i} className="card animate-in"
                       style={{ display:'flex', alignItems:'center', gap:14, animationDelay: `${i*0.05}s` }}>
                    <div className="bus-line-badge" style={{ background: a.lineColor || 'var(--primary)', flexShrink:0 }}>
                      {a.lineNumber}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {a.destination}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{a.lineName}</div>
                      <div className="row row-gap-sm" style={{ marginTop:6 }}>
                        <span className={`badge badge-${sl.cls}`} style={{ padding:'2px 8px', fontSize:10 }}>{sl.text}</span>
                        {a.delayMinutes > 0 && (
                          <span style={{ fontSize:11, color:'var(--error)', fontWeight:600 }}>
                            +{a.delayMinutes} min ritardo
                          </span>
                        )}
                        {a.delayMinutes < 0 && (
                          <span style={{ fontSize:11, color:'var(--primary)', fontWeight:600 }}>
                            {a.delayMinutes} min anticipo
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div className="eta-time">{a.etaMinutes}'</div>
                      <div className="eta-unit">min</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                        {new Date(a.etaTime).toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {lastUpdate && (
            <p style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginTop:4 }}>
              🔄 Aggiornato alle {lastUpdate.toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit', second:'2-digit' })} · Aggiornamento automatico ogni 30s
            </p>
          )}
        </>
      )}

      {tab === 'Mappa' && selectedStop && (
        <div className="card" style={{ padding:0, overflow:'hidden', borderRadius:'var(--radius-lg)' }}>
          <div style={{ background:'var(--bg-secondary)', padding:'16px 20px', borderBottom:'1px solid var(--border-light)' }}>
            <div style={{ fontSize:14, fontWeight:700 }}>📍 {selectedStop.name}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>
              {selectedStop.lat.toFixed(4)}°N, {selectedStop.lng.toFixed(4)}°E
            </div>
          </div>
          <div style={{ background:'var(--bg-tertiary)', padding:40, textAlign:'center' }}>
            <Navigation size={40} color="var(--primary)" style={{ margin:'0 auto 12px' }} />
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text-secondary)' }}>
              Mappa interattiva
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
              Disponibile con installazione Leaflet
            </div>
            <a href={`https://maps.apple.com/?ll=${selectedStop.lat},${selectedStop.lng}&q=${encodeURIComponent(selectedStop.name)}`}
               target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ marginTop:16, display:'inline-flex' }}>
              Apri in Mappe
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
