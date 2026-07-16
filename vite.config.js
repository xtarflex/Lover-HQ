import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

/* eslint-disable-next-line no-undef -- Node.js global in config file */
const cwd = process.cwd();

// Parse .env file manually in Node to resolve VITE_SUPABASE_URL
// without exporting a callback (fixes Vitest mergeConfig issues).
let supabaseUrl = 'https://oxqpmfdoytdfxmofmeno.supabase.co';
try {
  const envPath = path.resolve(cwd, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^VITE_SUPABASE_URL\s*=\s*(.*)$/m);
    if (match && match[1]) {
      supabaseUrl = match[1].trim();
    }
  }
} catch (_error) {
  console.warn('Could not read .env file for proxy configuration:', _error);
}
// Dynamic DevTools Automatic Workspace Folders setup (M-135+)
const devtoolsWorkspacePlugin = () => {
  const uuidFile = path.resolve(cwd, '.devtools-uuid');
  let uuid;
  try {
    if (fs.existsSync(uuidFile)) {
      uuid = fs.readFileSync(uuidFile, 'utf-8').trim();
    } else {
      uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      fs.writeFileSync(uuidFile, uuid, 'utf-8');
    }
  } catch {
    uuid = '53b029bb-c989-4dca-969b-835fecec3717'; // fallback static uuid if write fails
  }

  return {
    name: 'vite-plugin-devtools-workspace',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/.well-known/appspecific/com.chrome.devtools.json') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(
            JSON.stringify(
              {
                workspace: {
                  root: cwd,
                  uuid: uuid,
                },
              },
              null,
              2
            )
          );
          return;
        }
        next();
      });
    },
  };
};

export default defineConfig({
  plugins: [
    devtoolsWorkspacePlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Lover-HQ',
        short_name: 'LoverHQ',
        description: 'A private digital space for long-distance couples',
        theme_color: '#F59E0B',
        background_color: '#0F172A',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-media-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/storage-proxy': {
        target: `${supabaseUrl}/storage/v1/object/public`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/storage-proxy/, ''),
      },
    },
  },
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.agents/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
  },
});
