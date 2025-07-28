import { WhiteLabelConfig, getConfigByDomain } from '../config/whiteLabel.config';
import { generateManifest } from './dynamicMeta';

const fallbackConfig: WhiteLabelConfig = {
  id: 'default',
  name: "Admin Web3",
  supportWhatsapp: "",
  colors: {
    primary: "#ffffff",
    secondary: "#000000",
    accent: "#007bff",
    background: "#ffffff",
    backgroundSecondary: "#f1f5f9",
    text: "#000000",
    primaryHover: "#e0e0e0",
    secondaryHover: "#c0c0c0",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b"
  },
  fonts: {
    main: "Arial, sans-serif",
    headings: "Arial, sans-serif"
  },
  logo: {
    simple: "/web-app-manifest-192x192.png",
    large: "/web-app-manifest-512x512.png"
  },
  urls: {
    website: "",
    tutorials: "",
    management: "",
    support: ""
  }
};

export function generateDynamicManifest(): string {
  if (typeof window === 'undefined') {
    return generateManifest(fallbackConfig);
  }

  const domain = window.location.hostname;
  let config: WhiteLabelConfig | undefined = getConfigByDomain(domain);

  if (!config) {
    config = fallbackConfig;
  }

  return generateManifest(config);
}

export function createDynamicManifestBlob(config: WhiteLabelConfig): string {
  const manifestContent = generateManifest(config);
  const blob = new Blob([manifestContent], { type: 'application/json' });
  return URL.createObjectURL(blob);
}

export function updateManifestLink(config: WhiteLabelConfig): void {
  if (typeof document === 'undefined') return;

  const manifestLinks = Array.from(document.querySelectorAll('link[rel="manifest"]')) as HTMLLinkElement[];
  manifestLinks.forEach((link, idx) => {
    if (link.href.startsWith('blob:')) {
      URL.revokeObjectURL(link.href);
    }
    if (idx > 0) link.parentNode?.removeChild(link);
  });

  let manifestLink = manifestLinks[0];
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }

  const dynamicManifestUrl = createDynamicManifestBlob(config);
  manifestLink.href = dynamicManifestUrl;

 }

export function observeManifestAutoUpdate(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let lastDomain = window.location.hostname;
  let lastConfig: WhiteLabelConfig | undefined = getConfigByDomain(lastDomain);

  const update = () => {
    const currentDomain = window.location.hostname;
    let currentConfig: WhiteLabelConfig | undefined = getConfigByDomain(currentDomain);
    if (!currentConfig) currentConfig = fallbackConfig;

    if (currentDomain !== lastDomain || JSON.stringify(currentConfig) !== JSON.stringify(lastConfig)) {
      updateManifestLink(currentConfig);
      lastDomain = currentDomain;
      lastConfig = currentConfig;
    }
  };

  setInterval(update, 2000);
}
 