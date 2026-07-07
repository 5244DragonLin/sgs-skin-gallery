import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { load as yamlLoad } from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname);
const CONFIG_PATH = path.join(PROJECT_ROOT, 'config.yaml');
const EXAMPLE_CONFIG_PATH = path.join(PROJECT_ROOT, 'config.example.yaml');

/**
 * 读取 config.yaml（读不到自动回退 config.example.yaml）
 */
function loadConfig() {
  const cfgPath = fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : EXAMPLE_CONFIG_PATH;
  if (!fs.existsSync(cfgPath)) return {};
  try {
    return yamlLoad(fs.readFileSync(cfgPath, 'utf-8')) || {};
  } catch {
    return {};
  }
}

const config = loadConfig();
const SKIN_ROOT = config.skinDir ? path.resolve(PROJECT_ROOT, config.skinDir) : (process.env.SKINS_DIR || 'D:/BaiduSyncdisk/其他/三国杀皮肤/BWIKI');
const PORT = config.port || 3000;

/**
 * Custom plugin to serve skin assets from the external BWIKI directory.
 */
function skinAssetsPlugin() {
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
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/voice/')) {
          handleVoiceProxy(req, res); return;
        }
        if (url.startsWith('/skins/')) {
          handleSkinAsset(url, res); return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/voice/')) {
          handleVoiceProxy(req, res); return;
        }
        if (url.startsWith('/skins/')) {
          handleSkinAsset(url, res); return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), skinAssetsPlugin()],
  server: {
    port: PORT,
    open: true,
    fs: {
      allow: ['..', SKIN_ROOT],
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
