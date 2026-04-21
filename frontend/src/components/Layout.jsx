import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Bus, Ticket, Navigation, Clock, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const NAV_ITEMS = [
  { path: '/',           label: 'Home',     icon: Home },
  { path: '/bus',        label: 'Bus',      icon: Bus },
  { path: '/biglietti',  label: 'Biglietti',icon: Ticket, isCenter: true },
  { path: '/percorso',   label: 'Percorso', icon: Navigation },
  { path: '/orari',      label: 'Orari',    icon: Clock },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang, setLang } = useLanguage();

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buongiorno';
    if (h < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  }

  const pageTitle = () => {
    const p = location.pathname;
    if (p === '/')           return { title: `${t(getGreeting())}, ${user?.name?.split(' ')[0] || ''} 👋`, sub: new Date().toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { weekday:'long', day:'numeric', month:'long' }) };
    if (p === '/bus')        return { title: t('Monitoraggio Bus'), sub: t('Partenze in tempo reale') };
    if (p === '/biglietti')  return { title: t('Biglietteria'), sub: t('Acquista e gestisci i biglietti') };
    if (p === '/percorso')   return { title: t('Pianifica percorso'), sub: t('Trova il tuo itinerario') };
    if (p === '/orari')      return { title: t('Orari e linee'), sub: t('Consulta i percorsi ATV') };
    if (p === '/impostazioni') return { title: t('Impostazioni'), sub: t('Account e preferenze') };
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="lang-toggle" onClick={() => setLang(lang === 'it' ? 'en' : 'it')}>
            <div className={`lang-slider ${lang === 'en' ? 'en' : ''}`} />
            <span className={lang === 'it' ? 'active' : ''}>IT</span>
            <span className={lang === 'en' ? 'active' : ''}>EN</span>
          </div>
          <button className="header-action" onClick={() => navigate('/impostazioni')} aria-label={t('Impostazioni')}>
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="page-content">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ path, label, icon: Icon, isCenter }) => {
          const active = location.pathname === path;
          
          if (isCenter) {
            return (
              <div key={path} className="nav-center-wrapper">
                <button
                  className={`nav-center-btn ${active ? 'active' : ''}`}
                  onClick={() => navigate(path)}
                  aria-label={t(label)}
                >
                  <Icon size={26} strokeWidth={active ? 2.5 : 2} />
                </button>
                <span className="nav-label">{t(label)}</span>
              </div>
            );
          }

          return (
            <button
              key={path}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(path)}
              aria-label={t(label)}
            >
              <div className="nav-icon">
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className="nav-label">{t(label)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
