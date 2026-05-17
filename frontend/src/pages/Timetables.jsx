import { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { Search, MapPin, ChevronRight, Clock } from 'lucide-react';

export default function Timetables() {
  const [lines, setLines] = useState([]);
  const [stops, setStops] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [lineStops, setLineStops] = useState([]);
  const [tab, setTab] = useState('Linee');
  const [loading, setLoading] = useState(true);
  const [arrivals, setArrivals] = useState({});
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/bus/lines'),
      api.get('/api/bus/stops'),
    ]).then(([linesRes, stopsRes]) => {
      setLines(linesRes.data.lines);
      setStops(stopsRes.data.stops);
      setLoading(false);
    });
  }, []);

  async function selectLine(line) {
    setSelectedLine(line);
    setTab('Fermate');
    const res = await api.get(`/api/bus/line/${line.id}/stops`);
    setLineStops(res.data.stops);

    // Fetch arrivals for first stop
    if (res.data.stops.length > 0) {
      const arrRes = await api.get(`/api/bus/arrivals/${res.data.stops[0].id}`);
      const a = {};
      arrRes.data.arrivals.filter(arr => arr.lineId === line.id).forEach((arr, i) => {
        if (i < 5) a[i] = arr;
      });
      setArrivals(a);
    }
  }

  const LINE_TYPES = { urbano:'Urbano', extraurbano:'Extraurbano', aeroporto:'Aeroporto' };
  const TYPE_ORDER = [
    { key:'urbano',      label:'🚌 Linee urbane' },
    { key:'extraurbano', label:'🚍 Linee extraurbane' },
    { key:'aeroporto',   label:'✈️ Linee aeroporto' },
  ];

  const tabs = ['Linee', selectedLine ? 'Fermate' : null].filter(Boolean);

  // Filter lines by number, name or destination
  const q = query.trim().toLowerCase();
  const visibleLines = q
    ? lines.filter(l =>
        l.number.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q))
    : lines;

  return (
    <div className="page-pad stack stack-lg">
      {/* Only show the tab bar once there is more than one tab to switch between */}
      {tabs.length > 1 && (
        <div className="tab-bar">
          {tabs.map(t => (
            <button key={t} className={`tab-item${tab===t?' active':''}`}
              style={{ flex:1 }} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading-screen"><div className="spinner"/></div>
      ) : tab === 'Linee' ? (
        <div className="stack stack-lg">
          {/* Search */}
          <div style={{ position:'relative' }}>
            <Search size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
            <input className="form-input" style={{ paddingLeft:42 }}
              placeholder="Cerca linea (numero o destinazione)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {visibleLines.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">Nessuna linea trovata</div>
              <div className="empty-subtitle">Prova con un altro numero o destinazione.</div>
            </div>
          ) : TYPE_ORDER.map(group => {
            const groupLines = visibleLines.filter(l => l.type === group.key);
            if (groupLines.length === 0) return null;
            return (
              <div key={group.key}>
                <div className="section-title" style={{ marginBottom:12 }}>{group.label}</div>
                <div className="stack stack-sm">
                  {groupLines.map(line => (
                    <button key={line.id} className="card" style={{ width:'100%', textAlign:'left', cursor:'pointer', border:'none', display:'flex', alignItems:'center', gap:14 }}
                      onClick={() => selectLine(line)}
                      onMouseOver={e => e.currentTarget.style.transform='translateX(4px)'}
                      onMouseOut={e => e.currentTarget.style.transform=''}>
                      <div className="bus-line-badge" style={{ background: line.color, flexShrink:0 }}>
                        {line.number}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:15, fontWeight:700 }}>{line.name}</div>
                        <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3 }}>{line.description}</div>
                        <div className="row row-gap-sm" style={{ marginTop:6 }}>
                          <span className="badge" style={{ background:'var(--bg-secondary)', color:'var(--text-secondary)', fontSize:11 }}>
                            {LINE_TYPES[line.type] || line.type}
                          </span>
                          <span style={{ fontSize:12, color:'var(--text-muted)' }}>
                            <Clock size={11} style={{ display:'inline', marginRight:3 }}/>
                            ogni {line.frequency} min
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)"/>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : selectedLine && (
        <div className="stack stack-lg">
          {/* Line header */}
          <div className="card card-sm" style={{ background: selectedLine.color, color:'white' }}>
            <div className="row row-gap-sm">
              <div style={{ width:44, height:44, background:'rgba(255,255,255,0.2)', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18 }}>
                {selectedLine.number}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>{selectedLine.name}</div>
                <div style={{ fontSize:13, opacity:0.85 }}>{selectedLine.description}</div>
              </div>
            </div>
          </div>

          {/* Next departures */}
          <div>
            <div className="section-title" style={{ marginBottom:12 }}>🕐 Prossime partenze</div>
            <div className="stack stack-sm">
              {Object.values(arrivals).length === 0 ? (
                <div style={{ textAlign:'center', padding:'16px', color:'var(--text-muted)', fontSize:14 }}>
                  Calcolo partenze in corso...
                </div>
              ) : Object.values(arrivals).map((a, i) => (
                <div key={i} className="card card-sm" style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div className="eta-time">{a.etaMinutes}'</div>
                  <div className="eta-unit" style={{ marginRight:4 }}>min</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600 }}>{a.destination}</div>
                    <span className={`badge badge-${a.status}`} style={{ fontSize:10, padding:'1px 7px' }}>
                      {a.status === 'in_orario' ? 'In orario' : a.status === 'in_ritardo' ? 'In ritardo' : 'In anticipo'}
                    </span>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text-muted)' }}>
                    {new Date(a.etaTime).toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All stops */}
          <div>
            <div className="section-title" style={{ marginBottom:12 }}>📍 Tutte le fermate</div>
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              {lineStops.map((stop, i) => (
                <div key={stop.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom: i < lineStops.length-1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                    <div style={{ width:12, height:12, borderRadius:'50%', background: i===0 || i===lineStops.length-1 ? selectedLine.color : 'white', border: `2.5px solid ${selectedLine.color}` }} />
                    {i < lineStops.length-1 && <div style={{ width:2, height:24, background: selectedLine.color, opacity:0.3, marginTop:2 }}/>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight: (i===0||i===lineStops.length-1) ? 700 : 500, color:'var(--text)' }}>
                      {stop.name}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{stop.city}</div>
                  </div>
                  {(i===0 || i===lineStops.length-1) && (
                    <span style={{ fontSize:11, fontWeight:600, color: selectedLine.color }}>
                      {i===0 ? 'Capolinea' : 'Terminale'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
