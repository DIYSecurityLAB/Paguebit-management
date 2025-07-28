import { WhiteLabelConfig } from '../config/whiteLabel.config';
import { updateManifestLink } from './dynamicManifest';

export interface DynamicMetaConfig {
  title: string;
  description: string;
  keywords: string;
  themeColor: string;
  appleTouchIcon: string;
  favicon: string;
  webManifest: string;
}

export function updateDynamicMeta(config: WhiteLabelConfig): void {
  if (typeof document === 'undefined') return;

  const metaConfig: DynamicMetaConfig = {
    title: `${config.name} | ADMINISTRAÇÃO WEB3`,
    description: `${config.name} - Plataforma de gerenciamento Web3 para pagamentos e transações em criptomoedas`,
    keywords: `${config.name.toLowerCase()}, criptomoedas, web3, bitcoin, pagamentos, transações, administração`,
    themeColor: config.colors.primary,
    appleTouchIcon: `/${config.id}/apple-touch-icon.png`,
    favicon: `/${config.id}/favicon.svg`,
    webManifest: `/${config.id}/site.webmanifest`
  };

  document.title = metaConfig.title;

  const updateMetaTag = (name: string, content: string, property?: boolean) => {
    const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    let metaTag = document.querySelector(selector) as HTMLMetaElement;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      if (property) {
        metaTag.setAttribute('property', name);
      } else {
        metaTag.setAttribute('name', name);
      }
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', content);
  };

  const updateLinkTag = (rel: string, href: string, type?: string, sizes?: string) => {
    let linkTag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
    if (!linkTag) {
      linkTag = document.createElement('link');
      linkTag.setAttribute('rel', rel);
      document.head.appendChild(linkTag);
    }
    linkTag.setAttribute('href', href);
    if (type) linkTag.setAttribute('type', type);
    if (sizes) linkTag.setAttribute('sizes', sizes);
  };

  updateMetaTag('description', metaConfig.description);
  updateMetaTag('keywords', metaConfig.keywords);
  updateMetaTag('theme-color', metaConfig.themeColor);
  updateMetaTag('apple-mobile-web-app-title', config.name);

  updateMetaTag('og:title', metaConfig.title, true);
  updateMetaTag('og:description', metaConfig.description, true);
  updateMetaTag('og:site_name', config.name, true);
  updateMetaTag('og:type', 'website', true);
  updateMetaTag('og:image', config.logo.large, true);
  updateMetaTag('og:url', config.urls.website, true);

  updateMetaTag('twitter:card', 'summary_large_image');
  updateMetaTag('twitter:title', metaConfig.title);
  updateMetaTag('twitter:description', metaConfig.description);
  updateMetaTag('twitter:image', config.logo.large);

  updateLinkTag('icon', metaConfig.favicon, 'image/svg+xml');
  updateLinkTag('shortcut icon', `/${config.id}/favicon.ico`);
  updateLinkTag('apple-touch-icon', metaConfig.appleTouchIcon, undefined, '180x180');

  const faviconPng = document.querySelector('link[rel="icon"][type="image/png"]') as HTMLLinkElement;
  if (faviconPng) {
    faviconPng.href = `/${config.id}/favicon-96x96.png`;
  }

  updateManifestLink(config);

 }

export function generateManifest(config: WhiteLabelConfig): string {
  const manifest = {
    name: `${config.name} Admin`,
    short_name: config.name,
    icons: [
      {
        src: `/${config.id}/web-app-manifest-192x192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: `/${config.id}/web-app-manifest-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    theme_color: config.colors.primary,
    background_color: config.colors.background,
    display: "standalone",
    start_url: "/",
    scope: "/",
    description: `${config.name} - Administração de pagamentos Web3`
  };

  return JSON.stringify(manifest, null, 2);
}
    