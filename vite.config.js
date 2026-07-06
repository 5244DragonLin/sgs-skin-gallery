import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';

/**
 * Custom plugin to serve skin assets from the external BWIKI directory.
 * Maps /skins/* requests to the skin root directory.
 * Also proxies /voice/* requests to external audio URLs as a CORS fallback.
 * Configure via SKINS_DIR env variable or modify SKIN_ROOT below.
 */
function skinAssetsPlugin() {
  const SKIN_ROOT = process.env.SKINS_DIR || 'D:/BaiduSyncdisk/其他/三国杀皮肤/BWIKI';

  /**
   * Handle a /voice/ proxy request — fetches external audio URL and pipes to response.
   * @param {object} req - HTTP request
   * @param {object} res - HTTP response
   */
  function handleVoiceProxy(req, res) {
    const targetUrl = decodeURIComponent(req.url.replace('/voice/', ''));
    const protocol = targetUrl.startsWith('https') ? https : http;
    protocol.get(targetUrl, (proxyRes) => {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Access-Control-Allow-Origin', '*');
      proxyRes.pipe(res);
    }).on('error', () => {
      res.statusCode = 502;
      res.end('Audio proxy error');
    });
  }

  /**
   * Handle a /skins/ asset request — serves local image/audio files from the skin root.
   * @param {string} url - Request URL
   * @param {object} res - HTTP response
   */
  function handleSkinAsset(url, res) {
    const decodedPath = decodeURIComponent(url.slice('/skins/'.length));
    const filePath = path.join(SKIN_ROOT, decodedPath);

    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.mp3': 'audio/mpeg',
          '.wav': 'audio/wav',
          '.ogg': 'audio/ogg',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
        stream.on('error', () => {
          res.statusCode = 500;
          res.end('Internal Server Error');
        });
      } else {
        res.statusCode = 404;
        res.end('Not Found');
      }
    } catch (err) {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }

  return {
    name: 'skin-assets',
    configureServer(server) {
      // Serve skin asset files and voice proxy via a global middleware
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // /voice/ proxy — external audio URL CORS fallback
        if (url.startsWith('/voice/')) {
          handleVoiceProxy(req, res);
          return;
        }

        // Only handle /skins/* (asset files), not /skins.json (which is now /skin-data.json)
        if (url.startsWith('/skins/')) {
          handleSkinAsset(url, res);
          return;
        }

        // Not our concern — pass to next middleware (Vite handles /skin-data.json from public/)
        next();
      });
    },
    configurePreviewServer(server) {
      // Same middleware for preview mode
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // /voice/ proxy — external audio URL CORS fallback
        if (url.startsWith('/voice/')) {
          handleVoiceProxy(req, res);
          return;
        }

        if (url.startsWith('/skins/')) {
          handleSkinAsset(url, res);
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), skinAssetsPlugin()],
  server: {
    port: 3000,
    open: true,
    fs: {
      // Allow serving files from the skin directory
      allow: ['..', 'D:/BaiduSyncdisk/其他/三国杀皮肤/BWIKI'],
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
