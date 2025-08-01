import { useState, useEffect } from 'react';
import { getCurrentConfig, applyWhiteLabelTheme } from '../config/whiteLabel.config';

type Theme = 'light' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Verifica se o sistema prefere o tema escuro
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove a classe antiga
    root.classList.remove('light', 'dark');
    
    // Adiciona a nova classe
    root.classList.add(theme);
    
    // Salva no localStorage
    localStorage.setItem('theme', theme);
    
    // Aplica as cores do whitelabel de acordo com o tema atual
    const config = getCurrentConfig();
    applyWhiteLabelTheme(config);
  }, [theme]);

  return { theme, setTheme };
};
