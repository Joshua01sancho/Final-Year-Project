import React, { createContext, useContext } from 'react';
import { create } from 'zustand';

const defaultLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸', isRTL: false },
  { code: 'fr', name: 'Français', flag: '🇫🇷', isRTL: false },
  { code: 'es', name: 'Español', flag: '🇪🇸', isRTL: false },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', isRTL: false },
];

const useLanguageStore = create((set, get) => ({
  currentLanguage: 'en',
  languages: defaultLanguages,

  setLanguage: (code) => {
    set({ currentLanguage: code });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', code);
      
      // Update document direction for RTL languages
      const language = get().languages.find(lang => lang.code === code);
      if (language?.isRTL) {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
    }
  },

  getCurrentLanguage: () => {
    const { currentLanguage, languages } = get();
    return languages.find(lang => lang.code === currentLanguage);
  },
}));

const LanguageContext = createContext(undefined);

export const LanguageProvider = ({ children }) => {
  const language = useLanguageStore();

  // Initialize language from localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferred-language');
      if (saved && language.languages.some(lang => lang.code === saved)) {
        language.setLanguage(saved);
      }
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context.language;
};

export default useLanguageStore; 