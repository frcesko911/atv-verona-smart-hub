import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, CheckSquare, Bus, Ticket, Navigation, Clock, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/',           label: 'Home',     icon: Home },
  { path: '/attivita',   label: 'Attività', icon: CheckSquare },
  { path: '/bus',        label: 'Bus',      icon: Bus },
  { path: '/biglietti',  label: 'Biglietti',icon: Ticket },
  { path: '/percorso',   label: 'Percorso', icon: Navigation },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buongiorno';
    if (h < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  }

  const pageTitle = () => {
    const p = location.pathname;
    if (p === '/')           return { title: `${getGreeting()}, ${user?.name?.split(' ')[0] || ''} 👋`, sub: new Date().toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long' }) };
    if (p === '/attivita')   return { title: 'Le mie attività', sub: 'Organizza le tue giornate' };
    if (p === '/bus')        return { title: 'Monitoraggio Bus', sub: 'Partenze in tempo reale' };
    if (p === '/biglietti')  return { title: 'Biglietteria', sub: 'Acquista e gestisci i biglietti' };
    if (p === '/percorso')   return { title: 'Pianifica percorso', sub: 'Trova il tuo itinerario' };
    if (p === '/orari')      return { title: 'Orari e linee', sub: 'Consulta i percorsi ATV' };
    if (p === '/impostazioni') return { title: 'Impostazioni', sub: 'Account e preferenze' };
    return { title: 'ATV Verona', sub: '' };
  };

  const { title, sub } = pageTitle();

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-mark">ATV</div>
          <div>
            <div className="header-title" style={{ fontSize: '14px', lineHeight: '1.2' }}>{title}</div>
            {sub && <div className="header-subtitle">{sub}</div>}
          </div>
        </div>
        <button className="header-action" onClick={() => navigate('/impostazioni')} aria-label="Impostazioni">
          <Settings size={18} />
        </button>
      </header>

      {/* Page Content */}
      <main className="page-content">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              className={`nav-item${active ? ' active' : ''}`}
              onClick={() => navigate(path)}
              aria-label={label}
            >
              <div className="nav-icon">
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className="nav-label">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
