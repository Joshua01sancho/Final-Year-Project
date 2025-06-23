import React, { createContext, useContext, useEffect } from 'react';
import { create } from 'zustand';

const useAccessibilityStore = create((set, get) => ({
  highContrast: false,
  fontSize: 'medium',
  screenReader: false,
  keyboardNavigation: true,

  toggleHighContrast: () => {
    const current = get().highContrast;
    set({ highContrast: !current });
    
    if (typeof window !== 'undefined') {
      if (!current) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    }
  },

  setFontSize: (size) => {
    set({ fontSize: size });
    
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('text-small', 'text-medium', 'text-large');
      document.documentElement.classList.add(`text-${size}`);
    }
  },

  toggleScreenReader: () => {
    const current = get().screenReader;
    set({ screenReader: !current });
  },

  toggleKeyboardNavigation: () => {
    const current = get().keyboardNavigation;
    set({ keyboardNavigation: !current });
  },

  resetSettings: () => {
    set({
      highContrast: false,
      fontSize: 'medium',
      screenReader: false,
      keyboardNavigation: true,
    });
    
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('high-contrast', 'text-small', 'text-medium', 'text-large');
    }
  },
}));

const AccessibilityContext = createContext(undefined);

export const AccessibilityProvider = ({ children }) => {
  const accessibility = useAccessibilityStore();

  useEffect(() => {
    // Load saved settings from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          accessibility.setFontSize(settings.fontSize || 'medium');
          if (settings.highContrast) {
            accessibility.toggleHighContrast();
          }
          if (settings.screenReader) {
            accessibility.toggleScreenReader();
          }
        } catch (error) {
          console.error('Failed to load accessibility settings:', error);
        }
      }
    }
  }, []);

  return (
    <AccessibilityContext.Provider value={{ accessibility }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context.accessibility;
};

export default useAccessibilityStore; 