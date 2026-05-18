import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('language') || 'it';
  });

  useEffect(() => {
    localStorage.setItem('language', lang);
  }, [lang]);

  const t = (key) => {
    const translations = {
      it: {
        'Home': 'Home',
        'Bus': 'Bus',
        'Biglietti': 'Biglietti',
        'Percorso': 'Percorso',
        'Orari': 'Orari',
        'Impostazioni': 'Impostazioni',
        'Buongiorno': 'Buongiorno',
        'Buon pomeriggio': 'Buon pomeriggio',
        'Buonasera': 'Buonasera',
        'Monitoraggio Bus': 'Monitoraggio Bus',
        'Partenze in tempo reale': 'Partenze in tempo reale',
        'Biglietteria': 'Biglietteria',
        'Acquista e gestisci i biglietti': 'Acquista e gestisci i biglietti',
        'Pianifica percorso': 'Pianifica percorso',
        'Trova il tuo itinerario': 'Trova il tuo itinerario',
        'Orari e linee': 'Orari e linee',
        'Consulta i percorsi ATV': 'Consulta i percorsi ATV',
        'Account e preferenze': 'Account e preferenze'
      },
      en: {
        'Home': 'Home',
        'Bus': 'Bus',
        'Biglietti': 'Tickets',
        'Percorso': 'Journey',
        'Orari': 'Timetables',
        'Impostazioni': 'Settings',
        'Buongiorno': 'Good morning',
        'Buon pomeriggio': 'Good afternoon',
        'Buonasera': 'Good evening',
        'Monitoraggio Bus': 'Bus Tracker',
        'Partenze in tempo reale': 'Real-time departures',
        'Biglietteria': 'Ticket Office',
        'Acquista e gestisci i biglietti': 'Buy and manage tickets',
        'Pianifica percorso': 'Journey Planner',
        'Trova il tuo itinerario': 'Find your route',
        'Orari e linee': 'Timetables & Lines',
        'Consulta i percorsi ATV': 'Check ATV routes',
        'Account e preferenze': 'Account and preferences'
      }
    };
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
