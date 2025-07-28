import React from 'react';
import paguebitConfigJson from './whiteLabels/paguebit.config.json';
import paguepayConfigJson from './whiteLabels/paguepay.config.json';
import { updateDynamicMeta } from '../utils/dynamicMeta';

export function generateContactLink(contact: string): string {
  if (contact.startsWith('+') || /^\d+$/.test(contact.replace(/\D/g, ''))) {
    const cleanNumber = contact.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}`;
  } else {
    const username = contact.startsWith('@') ? contact.substring(1) : contact;
    return `https://t.me/${username}`;
  }
}

export interface WhiteLabelConfig {
  id: string;
  name: string;
  supportWhatsapp: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundSecondary: string;
    text: string;
    primaryHover: string;
    secondaryHover: string;
    success: string;
    error: string;
    warning: string;
    dark?: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      backgroundSecondary: string;
      text: string;
      primaryHover: string;
      secondaryHover: string;
      success: string;
      error: string;
      warning: string;
    }
  };
  fonts: {
    main: string;
    headings: string;
  };
  logo: {
    simple: string;
    large: string; 
    simpleDark?: string;
    largeDark?: string;
  };
  urls: {
    website: string;
    tutorials: string;
    management: string;
    support: string;
  };
}

const paguebitConfig: WhiteLabelConfig = paguebitConfigJson as unknown as WhiteLabelConfig;
const paguepayConfig: WhiteLabelConfig = paguepayConfigJson as unknown as WhiteLabelConfig;

export const domainConfigs: Record<string, WhiteLabelConfig> = {
  'paguebit.com': paguebitConfig,
  'www.paguebit.com': paguebitConfig,
  'admin.paguebit.com': paguebitConfig,
  'paguepay.com': paguepayConfig,
  'www.paguepay.com': paguepayConfig,
  'admin.paguepay.com': paguepayConfig,
  'localhost': paguepayConfig,
  '127.0.0.1': paguepayConfig,
};

export function getConfigByDomain(domain: string): WhiteLabelConfig {
  const exactConfig = domainConfigs[domain];
  if (exactConfig) return exactConfig;

  const cleanDomain = domain.replace(/^www\./, '');
  const cleanConfig = domainConfigs[cleanDomain];
  if (cleanConfig) return cleanConfig;

  for (const [configDomain, config] of Object.entries(domainConfigs)) {
    if (domain.includes(configDomain) || configDomain.includes(domain)) {
      return config;
    }
  }

  return paguebitConfig;
}

export function getCurrentConfig(): WhiteLabelConfig {
  if (typeof window === 'undefined') return paguebitConfig;
  const domain = window.location.hostname;
  return getConfigByDomain(domain);
}

export function applyWhiteLabelTheme(config: WhiteLabelConfig): void {
  if (typeof document === 'undefined') return;
  
  const isDarkMode = document.documentElement.classList.contains('dark');
  const colors = isDarkMode && config.colors.dark ? config.colors.dark : config.colors;
  
  const root = document.documentElement;
  
  // Converta as cores hex para HSL e aplique nas variáveis CSS
  const convertHexToHSL = (hex: string) => {
    // Remover o '#' se existir
    hex = hex.replace(/^#/, '');
    
    // Converta o hex para RGB
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    
    // Encontre os valores mínimos e máximos para determinar o brilho
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Calcule a luminosidade
    let l = (max + min) / 2;
    
    // Valores iniciais para saturação e matiz
    let s = 0;
    let h = 0;
    
    if (max !== min) {
      // Calcule a saturação
      s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
      
      // Calcule o matiz
      if (max === r) {
        h = ((g - b) / (max - min)) + (g < b ? 6 : 0);
      } else if (max === g) {
        h = ((b - r) / (max - min)) + 2;
      } else {
        h = ((r - g) / (max - min)) + 4;
      }
      
      h /= 6;
    }
    
    // Converta para os formatos usados no CSS
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
  };
  
  // Aplicar cores primárias do tema
  root.style.setProperty('--primary', convertHexToHSL(colors.primary));
  root.style.setProperty('--secondary', convertHexToHSL(colors.secondary));
  root.style.setProperty('--accent', convertHexToHSL(colors.accent));
  root.style.setProperty('--background', convertHexToHSL(colors.background));
  root.style.setProperty('--foreground', convertHexToHSL(colors.text));
  
  // Outras propriedades CSS
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-background-secondary', colors.backgroundSecondary);
  root.style.setProperty('--color-text', colors.text);
  root.style.setProperty('--color-primary-hover', colors.primaryHover);
  root.style.setProperty('--color-secondary-hover', colors.secondaryHover);
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-warning', colors.warning);

  root.style.setProperty('--font-main', config.fonts.main);
  root.style.setProperty('--font-headings', config.fonts.headings);
  
  document.body.style.fontFamily = config.fonts.main;
  
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after {
      font-family: ${config.fonts.main} !important;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: ${config.fonts.headings} !important;
    }
    input, textarea, select, button {
      font-family: ${config.fonts.main} !important;
    }
  `;
  
  const existingStyle = document.getElementById('white-label-fonts');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  style.id = 'white-label-fonts';
  document.head.appendChild(style);

  updateDynamicMeta(config);
}

export function useWhiteLabelConfig(): WhiteLabelConfig {
  const [config, setConfig] = React.useState<WhiteLabelConfig>(getCurrentConfig);

  React.useEffect(() => {
    const handleDomainChange = () => {
      const newConfig = getCurrentConfig();
      setConfig(newConfig);
      applyWhiteLabelTheme(newConfig);
    };

    applyWhiteLabelTheme(config);

    window.addEventListener('popstate', handleDomainChange);
    
    return () => {
      window.removeEventListener('popstate', handleDomainChange);
    };
  }, [config]);

  return config;
}

export { paguebitConfig, paguepayConfig };
