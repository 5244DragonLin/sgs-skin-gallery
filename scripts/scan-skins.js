/**
 * scan-skins.js — 扫描三国杀皮肤素材目录（BWIKI 数据源），生成 public/skin-data.json
 *
 * 用法: node scripts/scan-skins.js
 *
 * BWIKI 素材目录结构:
 *   皮肤根目录/
 *   ├── 魏/
 *   │   ├── *.png / *.gif   # 图片文件
 *   ├── 蜀/
 *   ├── 吴/
 *   ├── 群/
 *   ├── 神/
 *   └── 未知/
 *   根目录下还有 metadata.json (集中式元数据：故事、台词、语音、画师等)
 *
 * 文件命名: 皮肤名-武将名-类型.扩展名
 *   类型: 静态.png | 大图.png | 动态.gif
 *
 * 元数据 key: 皮肤名*武将名 (metadata.json 中使用 * 分隔)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, getSkinDir, getHerosDir } from './load-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ============================================================
// Configuration — loaded from config.yaml (falls back to config.example.yaml)
// ============================================================

const config = loadConfig();

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--skin-dir' && i + 1 < args.length) {
      options.skinDir = args[++i];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      options.output = args[++i];
    }
  }
  return options;
}

const cliArgs = parseArgs();
const SKIN_ROOT = cliArgs.skinDir || getSkinDir();
const outputDir = path.join(PROJECT_ROOT, config.outputDir || 'public');
const OUTPUT_PATH = cliArgs.output || path.join(outputDir, 'skin-data.json');
const PACK_DATA_PATH = path.join(outputDir, 'pack-data.json');
const HEROS_DIR = getHerosDir(SKIN_ROOT);

const FACTION_ORDER = ['魏', '蜀', '吴', '群', '神', '未知'];

// ============================================================
// BWIKI Metadata Loader
// ============================================================

/**
 * Load the centralized metadata.json from BWIKI data source.
 * The file is structured as:
 *   { "皮肤名*武将名": { story, voice_lines, audio?, quality?, 所属收藏册?, 上线时间?, ... } }
 */
function loadBwikiMetadata(skinRoot) {
  const metaPath = path.join(skinRoot, 'metadata.json');
  if (!fs.existsSync(metaPath)) {
    console.warn('  ⚠ metadata.json 未找到，将不加载故事/台词数据');
    return null;
  }
  try {
    const content = fs.readFileSync(metaPath, 'utf-8');
    const data = JSON.parse(content);
    console.log(`  📖 已加载 metadata.json: ${Object.keys(data).length} 条皮肤元数据`);
    return data;
  } catch (err) {
    console.warn(`  ⚠ metadata.json 解析失败: ${err.message}`);
    return null;
  }
}

/**
 * Look up metadata for a skin using BWIKI key format.
 * BWIKI keys use * as separator: "皮肤名*武将名"
 */
function lookupSkinMetadata(bwikiMeta, skinName, generalName) {
  if (!bwikiMeta) return null;

  // Try exact *-separated key first
  const starKey = `${skinName}*${generalName}`;
  if (bwikiMeta[starKey]) return bwikiMeta[starKey];

  // Try reverse order (some entries might have general*skin)
  const reverseKey = `${generalName}*${skinName}`;
  if (bwikiMeta[reverseKey]) return bwikiMeta[reverseKey];

  // Try fuzzy match: search all keys for a match
  for (const [key, value] of Object.entries(bwikiMeta)) {
    const parts = key.split('*');
    if (parts.length === 2) {
      if (
        (parts[0] === skinName && parts[1] === generalName) ||
        (parts[0] === generalName && parts[1] === skinName)
      ) {
        return value;
      }
    }
  }

  return null;
}

// ============================================================
// Character Data Loader
// ============================================================

/**
 * Load characters.json from the heros directory.
 * Builds a Map<name, {skills, title, position, hallOfFame, gender, pack}>.
 *
 * @param {string} herosDir - Path to the heros directory
 * @returns {Map<string, Object>} Character info map keyed by name
 */
function loadCharacters(herosDir) {
  const charPath = path.join(herosDir, 'characters.json');
  if (!fs.existsSync(charPath)) {
    console.warn(`  ⚠ characters.json 未找到于 ${herosDir}，武将技能等信息将不可用`);
    return new Map();
  }
  try {
    const content = fs.readFileSync(charPath, 'utf-8');
    const data = JSON.parse(content);
    const characters = data.characters || [];
    console.log(`  📋 已加载 characters.json: ${characters.length} 个武将`);

    const charMap = new Map();
    for (const char of characters) {
      // Extract skills from versions.classic.skills (array of {name, description})
      const skills = char.versions?.classic?.skills || [];
      charMap.set(char.name, {
        skills: skills,
        title: char.title || '',
        position: char.position || '',
        hallOfFame: char.hall_of_fame || '',
        gender: char.gender || '',
        pack: char.pack || '',
      });
    }
    return charMap;
  } catch (err) {
    console.warn(`  ⚠ characters.json 解析失败: ${err.message}`);
    return new Map();
  }
}

/**
 * Load pack_character_map.json from the heros directory.
 * Builds a Map<character_name, {pack, category}>.
 *
 * @param {string} herosDir - Path to the heros directory
 * @returns {Object} { packMap: Map<name, {pack, category}>, raw: originalData }
 */
function loadPackCharacterMap(herosDir) {
  const pcmPath = path.join(herosDir, 'pack_character_map.json');
  if (!fs.existsSync(pcmPath)) {
    console.warn(`  ⚠ pack_character_map.json 未找到于 ${herosDir}，卡包分类信息将不可用`);
    return { packMap: new Map(), raw: null };
  }
  try {
    const content = fs.readFileSync(pcmPath, 'utf-8');
    const data = JSON.parse(content);
    console.log(`  📦 已加载 pack_character_map.json: ${data.pack_categories?.length || 0} 个分类`);

    const packMap = new Map();
    if (data.pack_categories) {
      for (const cat of data.pack_categories) {
        const category = cat.category;
        if (cat.packs) {
          for (const pack of cat.packs) {
            const packName = pack.name;
            if (pack.characters) {
              for (const charName of pack.characters) {
                packMap.set(charName, { pack: packName, category: category });
              }
            }
          }
        }
      }
    }
    return { packMap, raw: data };
  } catch (err) {
    console.warn(`  ⚠ pack_character_map.json 解析失败: ${err.message}`);
    return { packMap: new Map(), raw: null };
  }
}

/**
 * Load general_factions.json from the skin root directory.
 * Returns a Map<name, faction>.
 *
 * @param {string} skinRoot - Path to the BWIKI skin root
 * @returns {Map<string, string>} Faction map keyed by general name
 */
function loadGeneralFactions(skinRoot) {
  const gfPath = path.join(skinRoot, 'general_factions.json');
  if (!fs.existsSync(gfPath)) {
    console.warn(`  ⚠ general_factions.json 未找到于 ${skinRoot}`);
    return new Map();
  }
  try {
    const content = fs.readFileSync(gfPath, 'utf-8');
    const data = JSON.parse(content);
    console.log(`  ⚔ 已加载 general_factions.json: ${Object.keys(data).length} 个武将势力`);
    return new Map(Object.entries(data));
  } catch (err) {
    console.warn(`  ⚠ general_factions.json 解析失败: ${err.message}`);
    return new Map();
  }
}

// ============================================================
// Audio / Voice Helpers
// ============================================================

/**
 * Convert BWIKI audio object to the gallery voices format.
 *
 * Input:  { "技能名": ["url1", "url2"], "阵亡": ["url"] }
 * Output: [{ skill: "技能名", type: "skill", label: "技能名", files: ["url1", "url2"] }, ...]
 *
 * @param {Object} audio - Audio data from metadata
 * @returns {Array} Array of voice group objects
 */
function convertAudioToVoices(audio) {
  if (!audio || typeof audio !== 'object') return [];

  const voices = [];
  for (const [key, files] of Object.entries(audio)) {
    if (!files || !Array.isArray(files) || files.length === 0) continue;
    const type = key === '阵亡' ? 'dead' : 'skill';
    voices.push({
      skill: key,
      type: type,
      label: key,
      files: files,
    });
  }
  return voices;
}

// ============================================================
// Pack Data Helpers
// ============================================================

/**
 * Extract the pack category from a pack name.
 * e.g. "荟萃-千里单骑" → "荟萃", "标准" → "其他"
 *
 * @param {string} packName - Full pack name
 * @returns {string} Category name
 */
function extractPackCategory(packName) {
  if (!packName) return '其他';
  const dashIndex = packName.indexOf('-');
  if (dashIndex === -1) return '其他';
  return packName.slice(0, dashIndex);
}

/**
 * Build the pack-data.json structure from pack_character_map.json raw data.
 *
 * @param {Object} pcmData - Raw pack_character_map.json data
 * @returns {Object} Structured pack data for the gallery
 */
function buildPackData(pcmData) {
  if (!pcmData || !pcmData.pack_categories) {
    return {
      generatedAt: new Date().toISOString(),
      totalCategories: 0,
      totalPacks: 0,
      categories: [],
    };
  }

  const categories = [];
  let totalPacks = 0;

  for (const cat of pcmData.pack_categories) {
    const packs = [];
    if (cat.packs) {
      for (const pack of cat.packs) {
        totalPacks++;
        packs.push({
          name: pack.name,
          icon: pack.icon || '',
          count: pack.count || (pack.characters ? pack.characters.length : 0),
          characters: pack.characters || [],
        });
      }
    }
    categories.push({
      category: cat.category,
      packs: packs,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    totalCategories: categories.length,
    totalPacks: totalPacks,
    categories: categories,
  };
}

// ============================================================
// Helpers
// ============================================================

/**
 * Parse a skin image filename into components.
 * Pattern: {skinName}-{generalName}-{type}.{ext}
 */
function parseImageFilename(filename) {
  const basename = path.basename(filename);

  const extMatch = basename.match(/\.(png|gif|jpg|jpeg|webp)$/i);
  if (!extMatch) return null;
  const ext = extMatch[0].toLowerCase();
  const nameWithoutExt = basename.slice(0, -ext.length);

  // Recognised type suffixes, ordered by priority (longer/more specific first)
  // BWIKI uses non-standard suffixes like '-动态登场', '-动态(S37)', '-静态(S19)', etc.
  const typeSuffixes = [
    '-动态登场(S52)', '-动态登场(S37)', '-动态登场(S19)', '-动态登场',
    '-动态(S52)', '-动态(S37)', '-动态(S19)',
    '-静态(S52)', '-静态(S40)', '-静态(S37)', '-静态(S19)', '-静态(S9)', '-静态(S8)',
    '-大图(S52)', '-大图(S40)',
    '-动态', '-静态', '-大图', '-经典形象',
  ];
  let detectedType = null;
  let coreName = nameWithoutExt;

  for (const suffix of typeSuffixes) {
    if (coreName.endsWith(suffix)) {
      const suffixNoDash = suffix.startsWith('-') ? suffix.slice(1) : suffix;
      // Map non-standard BWIKI suffixes to canonical types
      const typeMap = {
        '动态登场(S52)': 'dynamicEntrance',
        '动态登场(S37)': 'dynamicEntrance',
        '动态登场(S19)': 'dynamicEntrance',
        '动态登场': 'dynamicEntrance',
        '动态(S52)': 'dynamic',
        '动态(S37)': 'dynamic',
        '动态(S19)': 'dynamic',
        '静态(S52)': 'static',
        '静态(S40)': 'static',
        '静态(S37)': 'static',
        '静态(S19)': 'static',
        '静态(S9)': 'static',
        '静态(S8)': 'static',
        '大图(S52)': 'large',
        '大图(S40)': 'large',
        '动态': 'dynamic',
        '静态': 'static',
        '大图': 'large',
        '经典形象': 'static',
      };
      detectedType = typeMap[suffixNoDash] || 'static';
      coreName = coreName.slice(0, -suffix.length);
      break;
    }
  }

  if (!detectedType) {
    const lastDash = coreName.lastIndexOf('-');
    if (lastDash === -1) return null;
    const generalName = coreName.slice(lastDash + 1);
    const skinName = coreName.slice(0, lastDash);
    return { generalName, skinName, type: 'static', ext };
  }

  const lastDash = coreName.lastIndexOf('-');
  if (lastDash === -1) {
    // No skin name — this is a "经典形象" default portrait
    return { generalName: coreName, skinName: '经典形象', type: detectedType || 'static', ext };
  }

  const generalName = coreName.slice(lastDash + 1);
  const skinName = coreName.slice(0, lastDash);

  return { generalName, skinName, type: detectedType || 'static', ext };
}

// ============================================================
// Main Scan Logic
// ============================================================

function scanSkins() {
  console.log('🔍 扫描三国杀皮肤目录 (BWIKI)...');
  console.log(`  素材目录: ${SKIN_ROOT}\n`);

  if (!fs.existsSync(SKIN_ROOT)) {
    console.error(`❌ 素材目录不存在: ${SKIN_ROOT}`);
    process.exit(1);
  }

  // Load BWIKI metadata
  const bwikiMeta = loadBwikiMetadata(SKIN_ROOT);

  // Load character data (skills, title, position, etc.)
  const charMap = loadCharacters(HEROS_DIR);

  // Load pack character map (pack, category per character)
  const { packMap, raw: pcmData } = loadPackCharacterMap(HEROS_DIR);

  // Load general factions map (name → faction)
  const factionMap = loadGeneralFactions(SKIN_ROOT);

  const factions = fs.readdirSync(SKIN_ROOT).filter((name) => {
    const fullPath = path.join(SKIN_ROOT, name);
    return fs.statSync(fullPath).isDirectory() && name !== 'voice' && !name.startsWith('.');
  });

  console.log(`  发现 ${factions.length} 个势力目录: ${factions.join(', ')}\n`);

  // Sort factions by predefined order
  factions.sort((a, b) => {
    const ai = FACTION_ORDER.indexOf(a);
    const bi = FACTION_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const allGenerals = [];

  for (const faction of factions) {
    const factionDir = path.join(SKIN_ROOT, faction);
    console.log(`📁 处理势力: ${faction}`);

    // Get all image files
    const allFiles = fs.readdirSync(factionDir).filter((f) => {
      const fullPath = path.join(factionDir, f);
      return fs.statSync(fullPath).isFile() && /\.(png|gif|jpg|jpeg|webp)$/i.test(f);
    });

    // Parse image files and group by skin-general
    const skinMap = new Map();

    for (const file of allFiles) {
      const parsed = parseImageFilename(file);
      if (!parsed) {
        console.warn(`  ⚠ 无法解析文件名: ${file}`);
        continue;
      }

      const key = `${parsed.skinName}-${parsed.generalName}`;
      if (!skinMap.has(key)) {
        skinMap.set(key, {
          skinName: parsed.skinName,
          generalName: parsed.generalName,
          static: null,
          large: null,
          dynamic: null,
          dynamicEntrance: null,
        });
      }

      const entry = skinMap.get(key);
      const filePath = `${faction}/${file}`;

      switch (parsed.type) {
        case 'static':
          entry.static = filePath;
          break;
        case 'large':
          entry.large = filePath;
          break;
        case 'dynamic':
          entry.dynamic = filePath;
          break;
        case 'dynamicEntrance':
          entry.dynamicEntrance = filePath;
          break;
      }
    }

    // Group skins by general
    const generalMap = new Map();

    for (const [key, skinData] of skinMap) {
      const generalName = skinData.generalName;
      if (!generalMap.has(generalName)) {
        generalMap.set(generalName, []);
      }
      generalMap.get(generalName).push(skinData);
    }

    // Build final structure with metadata from BWIKI and character data
    for (const [generalName, skins] of generalMap) {
      const skinList = [];

      for (const skinData of skins) {
        // Look up metadata from BWIKI metadata.json
        const meta = lookupSkinMetadata(bwikiMeta, skinData.skinName, skinData.generalName);

        // Convert BWIKI voice_lines to the expected quotes format
        let quotes = null;
        if (meta && meta.voice_lines) {
          quotes = {};
          for (const [skill, lines] of Object.entries(meta.voice_lines)) {
            quotes[skill] = lines.join('\n');
          }
        }

        // Convert audio to voices format (replaces the empty array)
        const voices = meta && meta.audio ? convertAudioToVoices(meta.audio) : [];

        // Extract additional metadata fields
        const collection = meta ? (meta['所属收藏册'] || null) : null;
        const artist = meta ? (meta['画师'] || null) : null;
        const releaseTime = meta ? (meta['上线时间'] || null) : null;
        const staticAcquisition = meta ? (meta['静态获取方式'] || null) : null;
        const dynamicAcquisition = meta ? (meta['动态获取方式'] || null) : null;

        // Decode HTML entities in string values (e.g. '限定&amp;至臻' → '限定&至臻')
        const decodeHtmlEntities = (str) => {
          if (!str) return str;
          return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        };

        const safeStr = (val) => val ? decodeHtmlEntities(String(val)) : null;

        skinList.push({
          id: skinData.skinName,
          name: skinData.skinName,
          quality: meta && meta.quality ? decodeHtmlEntities(meta.quality).replace('限定&至臻', '限定') : null,
          story: meta ? safeStr(meta.story) : null,
          quotes: quotes,
          static: skinData.static,
          large: skinData.large,
          dynamic: skinData.dynamic,
          dynamicEntrance: skinData.dynamicEntrance,
          voices: voices,
          collection: safeStr(collection),
          artist: safeStr(artist),
          releaseTime: safeStr(releaseTime),
          staticAcquisition: safeStr(staticAcquisition),
          dynamicAcquisition: safeStr(dynamicAcquisition),
        });
      }

      // Merge character data (skills, title, position, etc.)
      const charInfo = charMap.get(generalName) || {};
      const packInfo = packMap.get(generalName) || {};

      // Determine pack and packCategory
      let pack = packInfo.pack || charInfo.pack || '未知';
      let packCategory = packInfo.category || extractPackCategory(pack);

      // Determine gender
      const gender = charInfo.gender || '';

      allGenerals.push({
        id: generalName,
        name: generalName,
        faction: faction,
        skins: skinList,
        skills: charInfo.skills || [],
        title: charInfo.title || '',
        position: charInfo.position || '',
        hallOfFame: charInfo.hallOfFame || '',
        gender: gender,
        pack: pack,
        packCategory: packCategory,
      });
    }

    console.log(`  ✅ ${faction}: ${generalMap.size} 武将, ${allFiles.length} 图片文件`);
  }

  // Sort generals by faction, then by name
  allGenerals.sort((a, b) => {
    const ai = FACTION_ORDER.indexOf(a.faction);
    const bi = FACTION_ORDER.indexOf(b.faction);
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name, 'zh');
  });

  // Compute stats
  const totalSkins = allGenerals.reduce((sum, g) => sum + g.skins.length, 0);

  const output = {
    generatedAt: new Date().toISOString(),
    sourceDir: SKIN_ROOT,
    stats: {
      totalGenerals: allGenerals.length,
      totalSkins: totalSkins,
      factions: Object.fromEntries(
        factions.map((f) => [f, allGenerals.filter((g) => g.faction === f).length])
      ),
    },
    generals: allGenerals,
  };

  // Write main output
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n📄 输出文件: ${OUTPUT_PATH}`);
  console.log(`📊 统计: ${allGenerals.length} 武将, ${totalSkins} 皮肤`);

  // Build and write pack-data.json
  const packData = buildPackData(pcmData);
  fs.writeFileSync(PACK_DATA_PATH, JSON.stringify(packData, null, 2), 'utf-8');
  console.log(`📦 卡包数据: ${PACK_DATA_PATH}`);
  console.log(`   ${packData.totalCategories} 分类, ${packData.totalPacks} 卡包`);

  console.log('✨ 扫描完成！');
}

scanSkins();
