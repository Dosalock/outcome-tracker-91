import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'sv';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Header
    'call-tracker': 'Call Tracker',
    'track-performance': 'Track your call outcomes and performance',
    'new-session': 'New Session',
    
    // Statistics
    'total-calls': 'Total Calls',
    'confirmed-sales': 'Confirmed Sales',
    'yes-ratio': 'Yes Ratio',
    'engagement-ratio': 'Engagement Ratio',
    
    // Call logging
    'log-call-outcome': 'Log Call Outcome',
    'notes-optional': 'Notes (Optional)',
    'add-notes-placeholder': 'Add any additional notes about this call...',
    
    // Call history
    'call-history': 'Call History',
    'no-calls-yet': 'No calls logged yet. Start making calls!',
    'edit-call': 'Edit Call',
    'notes-placeholder': 'Notes...',
    
    // Call outcomes
    'yes-needs-confirmation': 'Yes (Needs Confirmation)',
    'confirmed-sale': 'Confirmed Sale',
    'no': 'No',
    'absolutely-no': 'Absolutely No',
    'hangup': 'Hangup',
    'call-later': 'Call Later',
    'call-in-2-months': 'Call in 2 Months',
    'sickness-medicine': 'Sickness/Medicine',
    'already-customer': 'Already a Customer',
    'not-enough-money': 'Not Enough Money',
    'language-difficulties': 'Language Difficulties',
    'wrong-number': 'Wrong Number',
    'dnc': 'DNC (Do Not Call)',
    
    // Charts
    'yes-vs-no': 'Yes vs No',
    'engagement': 'Engagement',
    'yes': 'Yes',
    'engaged': 'Engaged',
    'not-engaged': 'Not Engaged',
    
    // Export
    'export-csv': 'Export CSV',
    
    // Activity Grid
    'call-activity': 'Call Activity',
    'less': 'Less',
    'more': 'More'
  },
  sv: {
    // Header
    'call-tracker': 'Samtalsspårare',
    'track-performance': 'Spåra dina samtalsresultat och prestanda',
    'new-session': 'Ny Session',
    
    // Statistics
    'total-calls': 'Totala Samtal',
    'confirmed-sales': 'Bekräftade Försäljningar',
    'yes-ratio': 'Ja-kvot',
    'engagement-ratio': 'Engagemang-kvot',
    
    // Call logging
    'log-call-outcome': 'Logga Samtalsresultat',
    'notes-optional': 'Anteckningar (Valfritt)',
    'add-notes-placeholder': 'Lägg till eventuella ytterligare anteckningar om detta samtal...',
    
    // Call history
    'call-history': 'Samtalshistorik',
    'no-calls-yet': 'Inga samtal loggade än. Börja ringa samtal!',
    'edit-call': 'Redigera Samtal',
    'notes-placeholder': 'Anteckningar...',
    
    // Call outcomes
    'yes-needs-confirmation': 'Ja (Behöver Bekräftelse)',
    'confirmed-sale': 'Bekräftad Försäljning',
    'no': 'Nej',
    'absolutely-no': 'Absolut Nej',
    'hangup': 'Lade På',
    'call-later': 'Ring Senare',
    'call-in-2-months': 'Ring om 2 Månader',
    'sickness-medicine': 'Sjukdom/Medicin',
    'already-customer': 'Redan Kund',
    'not-enough-money': 'Inte Tillräckligt med Pengar',
    'language-difficulties': 'Språksvårigheter',
    'wrong-number': 'Fel Nummer',
    'dnc': 'Ring Ej (Do Not Call)',
    
    // Charts
    'yes-vs-no': 'Ja vs Nej',
    'engagement': 'Engagemang',
    'yes': 'Ja',
    'engaged': 'Engagerad',
    'not-engaged': 'Inte Engagerad',
    
    // Export
    'export-csv': 'Exportera CSV',
    
    // Activity Grid
    'call-activity': 'Samtalsaktivitet',
    'less': 'Mindre',
    'more': 'Mer'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('sv');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('call-tracker-language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'sv')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('call-tracker-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};