/**
 * load-config.js — 从 gallery.config.yaml 读取配置
 * 供 vite.config.js 和 scan-skins.js 共用
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { load as yamlLoad } from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'gallery.config.yaml');

/** 默认配置 */
const DEFAULT_CONFIG = {
  skinDir: null,  // null 表示需要自动检测或由环境变量指定
  herosDir: null,
  port: 3000,
  outputDir: 'public',
};

/**
 * 读取并解析 gallery.config.yaml
 * @returns {Object} 配置对象（合并默认值）
 */
export function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.warn(`  ⚠ 配置文件不存在: ${CONFIG_PATH}，使用默认配置`);
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = yamlLoad(raw);
    if (!parsed || typeof parsed !== 'object') {
      console.warn('  ⚠ 配置文件格式无效，使用默认配置');
      return { ...DEFAULT_CONFIG };
    }
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (err) {
    console.warn(`  ⚠ 配置文件解析失败: ${err.message}，使用默认配置`);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * 获取皮肤素材目录路径（优先级：环境变量 > 配置文件 > 自动检测）
 * @returns {string} 皮肤素材目录绝对路径
 */
export function getSkinDir() {
  if (process.env.SKINS_DIR) return process.env.SKINS_DIR;
  const cfg = loadConfig();
  if (cfg.skinDir) return cfg.skinDir;
  // 自动检测
  for (const dir of [
    'D:/BaiduSyncdisk/其他/三国杀皮肤/BWIKI',
    'E:/BaiduSyncdisk/其他/三国杀皮肤/BWIKI',
  ]) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

/**
 * 获取武将数据目录路径（优先级：环境变量 > 配置文件 > 自动检测）
 * @returns {string} 武将数据目录绝对路径
 */
export function getHerosDir(skinRoot) {
  if (process.env.HEROS_DIR) return process.env.HEROS_DIR;
  const cfg = loadConfig();
  if (cfg.herosDir) return cfg.herosDir;
  // 自动检测
  for (const dir of [
    'D:/BaiduSyncdisk/其他/三国杀皮肤/heros',
    'E:/BaiduSyncdisk/其他/三国杀皮肤/heros',
    path.resolve(skinRoot, '../heros'),
  ]) {
    if (fs.existsSync(path.join(dir, 'characters.json'))) return dir;
  }
  return null;
}

export { PROJECT_ROOT, CONFIG_PATH };
