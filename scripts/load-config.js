/**
 * load-config.js — 从 config.yaml 读取配置（读不到自动回退 config.example.yaml）
 * 供 vite.config.js 和 scan-skins.js 共用
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { load as yamlLoad } from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'config.yaml');
const EXAMPLE_CONFIG_PATH = path.join(PROJECT_ROOT, 'config.example.yaml');

/** 选择配置文件路径：优先本地 config.yaml，读不到回退 config.example.yaml */
function resolveConfigPath() {
  return fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : EXAMPLE_CONFIG_PATH;
}

/** 默认配置 */
const DEFAULT_CONFIG = {
  skinDir: null,  // null 表示需要自动检测或由环境变量指定
  herosDir: null,
  port: 3000,
  outputDir: 'public',
};

/**
 * 读取并解析 config.example.yaml
 * @returns {Object} 配置对象（合并默认值）
 */
export function loadConfig() {
  const cfgPath = resolveConfigPath();
  if (!fs.existsSync(cfgPath)) {
    console.warn(`  ⚠ 配置文件不存在: ${EXAMPLE_CONFIG_PATH}，使用默认配置`);
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = fs.readFileSync(cfgPath, 'utf-8');
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
