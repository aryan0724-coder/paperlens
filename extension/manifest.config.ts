import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

/**
 * Host permissions:
 * - Paper sources we extract from (arXiv, PubMed, bioRxiv, common journals).
 * - The backend origin is added at build time via VITE_BACKEND_ORIGIN when set;
 *   during development the side panel talks to Supabase Edge Functions whose
 *   origin should be added here for production (see README).
 */
const PAPER_HOSTS = [
  'https://arxiv.org/*',
  'https://*.arxiv.org/*',
  'https://pubmed.ncbi.nlm.nih.gov/*',
  'https://www.ncbi.nlm.nih.gov/*',
  'https://www.biorxiv.org/*',
  'https://www.medrxiv.org/*',
  'https://*.sciencedirect.com/*',
  'https://link.springer.com/*',
  'https://*.nature.com/*',
  'https://dl.acm.org/*',
  'https://ieeexplore.ieee.org/*',
  'https://openreview.net/*',
];

export default defineManifest({
  manifest_version: 3,
  name: 'PaperLens - Research Paper Summarizer',
  version: pkg.version,
  description:
    'One-click AI summaries of research papers and academic PDFs (arXiv, PubMed, journals) in a side panel.',
  icons: {
    '16': 'public/icons/icon-16.png',
    '32': 'public/icons/icon-32.png',
    '48': 'public/icons/icon-48.png',
    '128': 'public/icons/icon-128.png',
  },
  action: {
    default_title: 'Open PaperLens',
    default_icon: {
      '16': 'public/icons/icon-16.png',
      '32': 'public/icons/icon-32.png',
      '48': 'public/icons/icon-48.png',
      '128': 'public/icons/icon-128.png',
    },
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  options_page: 'src/options/index.html',
  content_scripts: [
    {
      matches: PAPER_HOSTS,
      js: ['src/content/content-script.ts'],
      run_at: 'document_idle',
    },
    {
      // Enables ExtPay.onPaid callbacks after a successful payment/login.
      matches: ['https://extensionpay.com/*'],
      js: ['src/content/extpay-content.ts'],
      run_at: 'document_start',
    },
  ],
  permissions: ['sidePanel', 'storage', 'activeTab', 'scripting', 'offscreen', 'tabs'],
  host_permissions: PAPER_HOSTS,
  web_accessible_resources: [
    {
      resources: ['src/offscreen/offscreen.html', 'assets/*'],
      matches: ['<all_urls>'],
    },
  ],
});
