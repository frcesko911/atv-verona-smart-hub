import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, ShoppingCart, Clock, CheckCircle, X, ChevronRight, Wallet } from 'lucide-react';

const ZONE_LABELS = {
  urbano: 'Urbano', suburbano_1:'Zona 1', suburbano_2:'Zona 2', suburbano_3:'Zona 3',
  suburbano_4:'Zona 4', suburbano_5:'Zona 5', aeroporto:'Aeroporto', rete_completa:'Rete Completa'
};

function TicketCatalogCard({ ticket, onBuy }) {
  return (
    <div className="card" style={{ cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s' }}
         onClick={() => onBuy(ticket)}
         onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
         onMouseOut={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
      <div className="row-between">
        <div className="row row-gap-sm">
          <span style={{ fontSize:22 }}>{ticket.icon}</span>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{ticket.name}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{ticket.description}</div>
          </div>
        </div>
        <ChevronRight size={16} color="var(--text-muted)" />
      </div>
      <div className="row-between" style={{ marginTop:12 }}>
        <span className="badge" style={{ background:'var(--primary-light)', color:'var(--primary)', fontSize:11 }}>
          {ZONE_LABELS[ticket.zone] || ticket.zone}
        </span>
        <span style={{ fontSize:20, fontWeight:800, color:'var(--primary)' }}>
          €{ticket.price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function QRModal({ ticket, onClose }) {
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(ticket.status === 'validato');
  const isExpired = ticket.valid_until && new Date(ticket.valid_until) < new Date();

  async function validate() {
    setValidating(true);
    try {
      await axios.put(`/api/tickets/${ticket.id}/validate`);
      setValidated(true);
    } catch { } finally { setValidating(false); }
  }

  const qrValue = typeof ticket.qr_data === 'string' ? ticket.qr_data : JSON.stringify(ticket.qr_data);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="row-between" style={{ marginBottom:20 }}>
          <div className="modal-title" style={{ margin:0 }}>{ticket.ticket_name}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}>
            <X size={20}/>
          </button>
        </div>

        {/* QR Code */}
        <div className="qr-container">
          {validated || isExpired ? (
            <div style={{ textAlign:'center', padding:20 }}>
              <CheckCircle size={64} color={validated ? 'var(--success)' : 'var(--text-muted)'} style={{ margin:'0 auto 12px' }} />
              <div style={{ fontSize:17, fontWeight:700, color: validated ? 'var(--success)' : 'var(--text-muted)' }}>
                {validated ? 'Biglietto validato' : 'Biglietto scaduto'}
              </div>
            </div>
          ) : (
            <QRCodeSVG value={qrValue} size={200} level="H" includeMargin={true} />
          )}
        </div>

        {/* Ticket details */}
        <div className="card-ghost card card-sm" style={{ margin:'16px 0' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { label:'Prezzo', val: `€${ticket.price.toFixed(2)}` },
              { label:'Stato', val: validated ? '✅ Validato' : isExpired ? '❌ Scaduto' : '🟢 Attivo' },
              { label:'Acquistato', val: new Date(ticket.purchased_at).toLocaleDateString('it-IT') },
              ticket.valid_until && { label:'Scade', val: new Date(ticket.valid_until).toLocaleString('it-IT', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) },
            ].filter(Boolean).map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginTop:2 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {!validated && !isExpired && (
          <button className="btn btn-primary btn-full" onClick={validate} disabled={validating}>
            {validating ? 'Validazione...' : '✅ Valida biglietto'}
          </button>
        )}
      </div>
    </div>
  );
}

function PurchaseModal({ ticket, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle"/>
        <div className="modal-title">Conferma acquisto</div>
        <div className="ticket-card" style={{ marginBottom:20 }}>
          <div style={{ fontSize:24, marginBottom:8 }}>{ticket.icon}</div>
          <div style={{ fontSize:17, fontWeight:700 }}>{ticket.name}</div>
          <div style={{ fontSize:13, opacity:0.85, marginTop:4 }}>{ticket.description}</div>
          <div style={{ fontSize:28, fontWeight:800, marginTop:12 }}>€{ticket.price.toFixed(2)}</div>
        </div>

        <div className="card-ghost card card-sm" style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.7 }}>
            <strong>ℹ️ Informazioni</strong><br/>
            {ticket.validityMinutes
              ? `Validità: ${ticket.validityMinutes >= 1440 ? `${ticket.validityMinutes/1440} giorn${ticket.validityMinutes/1440>1?'i':'o'}` : `${ticket.validityMinutes} minuti`} dalla prima validazione.`
              : 'Carnet ricaricabile — valido per 10 corse.'}
            <br/>Il QR code verrà generato dopo l'acquisto.
          </div>
        </div>

        <div className="row row-gap-sm">
          <button className="btn btn-ghost btn-full" onClick={onCancel}>Annulla</button>
          <button className="btn btn-primary btn-full" onClick={onConfirm} disabled={loading}>
            {loading ? 'Acquisto...' : <><ShoppingCart size={16}/> Acquista</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Tickets() {
  const [catalog, setCatalog] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [tab, setTab] = useState('Catalogo');
  const [buyingTicket, setBuyingTicket] = useState(null);
  const [viewTicket, setViewTicket] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogRes, ticketsRes] = await Promise.all([
        axios.get('/api/tickets/catalog'),
        axios.get('/api/tickets'),
      ]);
      setCatalog(catalogRes.data.catalog);
      setMyTickets(ticketsRes.data.tickets);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function doPurchase() {
    setPurchasing(true);
    try {
      await axios.post('/api/tickets', { ticket_type: buyingTicket.type });
      setBuyingTicket(null);
      setTab('Portafoglio');
      loadData();
    } catch (e) {
      alert(e.response?.data?.error || 'Errore durante l\'acquisto.');
    } finally { setPurchasing(false); }
  }

  const activeTickets = myTickets.filter(t => t.status === 'attivo');
  const usedTickets   = myTickets.filter(t => t.status !== 'attivo');

  return (
    <div className="page-pad stack stack-lg">
      <div className="tab-bar">
        {['Catalogo', 'Portafoglio'].map(t => (
          <button key={t} className={`tab-item${tab===t?' active':''}`} onClick={() => setTab(t)}>
            {t === 'Portafoglio' && activeTickets.length > 0
              ? `${t} (${activeTickets.length})`
              : t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner"/></div>
      ) : tab === 'Catalogo' ? (
        <div className="stack stack-sm">
          {catalog.map(t => (
            <TicketCatalogCard key={t.type} ticket={t} onBuy={setBuyingTicket} />
          ))}
        </div>
      ) : (
        <div className="stack stack-lg">
          {activeTickets.length === 0 && usedTickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎟️</div>
              <div className="empty-title">Nessun biglietto</div>
              <div className="empty-subtitle">Acquista il tuo primo biglietto dal catalogo!</div>
              <button className="btn btn-primary" onClick={() => setTab('Catalogo')}>
                <Ticket size={16}/> Vai al catalogo
              </button>
            </div>
          ) : (
            <>
              {activeTickets.length > 0 && (
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>
                    🟢 Biglietti attivi
                  </div>
                  <div className="stack stack-sm">
                    {activeTickets.map(t => (
                      <button key={t.id} className="ticket-card" style={{ width:'100%', textAlign:'left', cursor:'pointer', border:'none' }}
                              onClick={() => setViewTicket(t)}>
                        <div className="row-between">
                          <div>
                            <div style={{ fontSize:16, fontWeight:700 }}>{t.ticket_name}</div>
                            <div style={{ fontSize:13, opacity:0.85, marginTop:4 }}>
                              Tappa: {new Date(t.purchased_at).toLocaleDateString('it-IT')}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize:22, fontWeight:800 }}>€{t.price.toFixed(2)}</div>
                            <div style={{ fontSize:11, opacity:0.8, textAlign:'right' }}>Tappa per QR</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {usedTickets.length > 0 && (
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>
                    Storico
                  </div>
                  <div className="stack stack-sm">
                    {usedTickets.map(t => (
                      <div key={t.id} className="card card-sm" style={{ display:'flex', alignItems:'center', gap:12, opacity:0.7 }}>
                        <CheckCircle size={20} color={t.status==='validato' ? 'var(--success)' : 'var(--text-muted)'} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:600 }}>{t.ticket_name}</div>
                          <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                            {t.status === 'validato' ? 'Validato' : 'Scaduto'} · {new Date(t.purchased_at).toLocaleDateString('it-IT')}
                          </div>
                        </div>
                        <span style={{ fontSize:14, fontWeight:700, color:'var(--text-muted)' }}>€{t.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {buyingTicket && (
        <PurchaseModal ticket={buyingTicket} onConfirm={doPurchase}
          onCancel={() => setBuyingTicket(null)} loading={purchasing} />
      )}

      {viewTicket && (
        <QRModal ticket={viewTicket} onClose={() => { setViewTicket(null); loadData(); }} />
      )}
    </div>
  );
}
