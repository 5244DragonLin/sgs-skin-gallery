/**
 * scan-skins.test.mjs — 集成测试：针对「技能版本切换」特性（经典/界限突破/国战）
 *
 * 通过子进程真实运行 scripts/scan-skins.js（指向 mock 素材目录 + mock 武将数据目录），
 * 校验生成的 public/skin-data.json 中 skillVersions / skills / 文件名解析是否正确。
 *
 * 运行: node --test scripts/__tests__/scan-skins.test.mjs
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'scan-skins.js');
const PUBLIC_PACK_DATA = path.join(PROJECT_ROOT, 'public', 'pack-data.json');

// ---- Mock fixtures -------------------------------------------------------
let mockRoot;
let skinDir;
let herosDir;
let outputPath;
let packDataBackup = undefined; // 备份真实 public/pack-data.json
let packDataExisted = false;

const CHARACTERS = {
  meta: { total: 6 },
  characters: [
    {
      姓名: '全能武将',
      称号: '测试·全能',
      定位: '测试定位',
      名将堂: '不在内',
      性别: '男',
      武将包: '测试包',
      版本: {
        经典: {
          技能: [{ name: '技能A', description: '经典描述A' }],
          武将台词: { 技能A: ['经典台词A1/经典台词A2'], 阵亡: ['经典阵亡'] },
        },
        界限突破: {
          技能: [{ name: '技能B', description: '突破描述B' }],
          武将台词: { 技能B: ['突破台词B'], 阵亡: ['突破阵亡'] },
        },
        国战: {
          技能: [{ name: '技能C', description: '国战描述C' }],
          武将台词: { 技能C: ['国战台词C'] },
        },
      },
    },
    {
      姓名: '仅经典',
      称号: '测试·仅经典',
      版本: {
        经典: {
          技能: [{ name: '技能X', description: 'X描述' }],
          武将台词: { 技能X: ['X台词'] },
        },
      },
    },
    {
      姓名: '只有阵亡台词',
      称号: '测试·空技能有台词',
      版本: {
        经典: { 技能: [], 武将台词: { 阵亡: ['仅阵亡台词'] } },
        界限突破: { 技能: [], 武将台词: { 阵亡: ['突破也只阵亡'] } },
      },
    },
    {
      姓名: '全空版本',
      称号: '测试·全空',
      版本: {
        经典: { 技能: [], 武将台词: {} },
        界限突破: { 技能: [], 武将台词: {} },
        国战: { 技能: [], 武将台词: {} },
      },
    },
    {
      姓名: '无versions字段',
      称号: '测试·无versions',
    },
    {
      姓名: '缺经典有突破',
      称号: '测试·缺经典',
      版本: {
        界限突破: {
          技能: [{ name: '技能D', description: 'D描述' }],
          武将台词: { 技能D: ['D台词'] },
        },
        国战: {
          技能: [{ name: '技能E', description: 'E描述' }],
          武将台词: { 技能E: ['E台词'] },
        },
      },
    },
  ],
};

const METADATA = {
  '测试皮*全能武将': {
    品质: '限定',
    皮肤故事: '测试故事',
    皮肤台词: { 技能A: ['元数据台词A'] },
    语音地址: { 技能A: ['http://example.com/a.mp3'] },
  },
};

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf-8');
}

function buildFixtures() {
  mockRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sgs-scan-'));
  skinDir = path.join(mockRoot, 'skins');
  herosDir = path.join(mockRoot, 'heros');
  const weiDir = path.join(skinDir, '魏');
  fs.mkdirSync(weiDir, { recursive: true });
  fs.mkdirSync(herosDir, { recursive: true });

  // --- Image files: one per general so every general appears in output ---
  const generals = ['全能武将', '仅经典', '只有阵亡台词', '全空版本', '无versions字段', '缺经典有突破'];
  for (const g of generals) {
    fs.writeFileSync(path.join(weiDir, `测试皮-${g}-静态.png`), '');
  }

  // --- Filename-parsing coverage for 全能武将 (distinct skin names) ---
  fs.writeFileSync(path.join(weiDir, '动态皮-全能武将-动态.gif'), '');
  fs.writeFileSync(path.join(weiDir, '大图皮-全能武将-大图.png'), '');
  fs.writeFileSync(path.join(weiDir, '登场皮-全能武将-动态登场.png'), '');
  fs.writeFileSync(path.join(weiDir, '限定皮-全能武将-静态(S19).png'), '');

  // --- Mock heros data ---
  writeFile(path.join(herosDir, 'characters.json'), JSON.stringify(CHARACTERS, null, 2));

  // --- Mock BWIKI metadata (optional path) ---
  writeFile(path.join(skinDir, 'metadata.json'), JSON.stringify(METADATA, null, 2));

  outputPath = path.join(mockRoot, 'out', 'skin-data.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function runScan() {
  execFileSync(
    'node',
    [SCRIPT_PATH, '--skin-dir', skinDir, '--output', outputPath],
    {
      env: { ...process.env, SKINS_DIR: skinDir, HEROS_DIR: herosDir },
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  return JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
}

function findGeneral(data, name) {
  return data.generals.find((g) => g.name === name);
}

function findSkin(general, id) {
  return general.skins.find((s) => s.id === id);
}

// ---- Setup / Teardown ----------------------------------------------------
before(() => {
  // Backup real pack-data.json (script always writes it to public/)
  if (fs.existsSync(PUBLIC_PACK_DATA)) {
    packDataBackup = fs.readFileSync(PUBLIC_PACK_DATA, 'utf-8');
    packDataExisted = true;
  }
  buildFixtures();
});

after(() => {
  // Restore real pack-data.json
  if (packDataExisted && packDataBackup !== undefined) {
    fs.writeFileSync(PUBLIC_PACK_DATA, packDataBackup, 'utf-8');
  } else if (!packDataExisted && fs.existsSync(PUBLIC_PACK_DATA)) {
    fs.unlinkSync(PUBLIC_PACK_DATA);
  }
  // Clean temp fixtures
  if (mockRoot && fs.existsSync(mockRoot)) {
    fs.rmSync(mockRoot, { recursive: true, force: true });
  }
});

// ---- Tests ---------------------------------------------------------------
describe('scan-skins.js — 技能版本切换 (skillVersions)', () => {
  let data;

  // Run the scan once for all assertions in this describe block.
  // (node:test runs hooks per-test by default; we use a shared module-level cache.)
  let cached = null;
  function getOutput() {
    if (!cached) cached = runScan();
    return cached;
  }

  test('全三版本武将 → skillVersions 含 经典/界限突破/国战 且内容正确', () => {
    data = getOutput();
    const g = findGeneral(data, '全能武将');
    assert.ok(g, '全能武将 应出现在输出中');
    assert.ok(g.skillVersions, 'skillVersions 不应为 null');

    for (const ver of ['经典', '界限突破', '国战']) {
      assert.ok(g.skillVersions[ver], `应包含版本 ${ver}`);
    }
    assert.strictEqual(g.skillVersions.经典.skills[0].name, '技能A');
    assert.strictEqual(g.skillVersions.经典.skills[0].description, '经典描述A');
    assert.deepStrictEqual(g.skillVersions.经典.lines['技能A'], ['经典台词A1/经典台词A2']);
    assert.deepStrictEqual(g.skillVersions.界限突破.lines['技能B'], ['突破台词B']);
    assert.deepStrictEqual(g.skillVersions.国战.lines['技能C'], ['国战台词C']);
  });

  test('顶层 skills 字段 = 经典.skills', () => {
    data = getOutput();
    const g = findGeneral(data, '全能武将');
    assert.deepStrictEqual(g.skills, [{ name: '技能A', description: '经典描述A' }]);
  });

  test('仅经典武将 → skillVersions 只含 经典', () => {
    data = getOutput();
    const g = findGeneral(data, '仅经典');
    assert.ok(g.skillVersions, 'skillVersions 不应为 null');
    assert.ok(g.skillVersions.经典, '应含 经典');
    assert.strictEqual(g.skillVersions.界限突破, undefined, '不应含 界限突破');
    assert.strictEqual(g.skillVersions.国战, undefined, '不应含 国战');
    assert.deepStrictEqual(g.skills, [{ name: '技能X', description: 'X描述' }]);
  });

  test('空技能只有阵亡台词 → 两个版本都保留（按 lines 判定）', () => {
    data = getOutput();
    const g = findGeneral(data, '只有阵亡台词');
    assert.ok(g.skillVersions, '有 lines 时应非 null');
    assert.ok(g.skillVersions.经典, '应含 经典（仅阵亡台词）');
    assert.ok(g.skillVersions.界限突破, '应含 界限突破（仅阵亡台词）');
    assert.strictEqual(g.skillVersions.经典.skills.length, 0, '经典 skills 应为空');
    assert.deepStrictEqual(g.skillVersions.经典.lines['阵亡'], ['仅阵亡台词']);
    assert.deepStrictEqual(g.skillVersions.界限突破.lines['阵亡'], ['突破也只阵亡']);
    assert.strictEqual(g.skills.length, 0, '顶层 skills 应为空（经典无技能）');
  });

  test('全空版本武将 → skillVersions 为 null', () => {
    data = getOutput();
    const g = findGeneral(data, '全空版本');
    assert.strictEqual(g.skillVersions, null, '所有版本均无技能/台词时应返回 null');
    assert.strictEqual(g.skills.length, 0);
  });

  test('无 版本 字段武将 → skillVersions 为 null', () => {
    data = getOutput();
    const g = findGeneral(data, '无versions字段');
    assert.strictEqual(g.skillVersions, null, '缺少 版本 字段时应返回 null');
  });

  test('缺少 经典 但有突破/国战 → skillVersions 仅含实际存在的版本', () => {
    data = getOutput();
    const g = findGeneral(data, '缺经典有突破');
    assert.ok(g.skillVersions, '应非 null');
    assert.strictEqual(g.skillVersions.经典, undefined, '不应含 经典');
    assert.ok(g.skillVersions.界限突破, '应含 界限突破');
    assert.ok(g.skillVersions.国战, '应含 国战');
    assert.deepStrictEqual(g.skills, [], '无 经典 时顶层 skills 应为空数组');
  });
});

describe('scan-skins.js — 文件名解析 (parseImageFilename 行为)', () => {
  let cached = null;
  function getOutput() {
    if (!cached) cached = runScan();
    return cached;
  }

  test('静态/动态/大图/动态登场 后缀正确归类', () => {
    const data = getOutput();
    const g = findGeneral(data, '全能武将');

    const dyn = findSkin(g, '动态皮');
    assert.ok(dyn, '动态皮 应存在');
    assert.match(dyn.dynamic, /动态\.gif$/, '动态皮.dynamic 应指向 .gif');
    assert.strictEqual(dyn.static, null, '动态皮.static 应为 null');

    const large = findSkin(g, '大图皮');
    assert.ok(large, '大图皮 应存在');
    assert.match(large.large, /大图\.png$/, '大图皮.large 应指向 大图.png');
    assert.strictEqual(large.static, null);

    const entrance = findSkin(g, '登场皮');
    assert.ok(entrance, '登场皮 应存在');
    assert.match(entrance.dynamicEntrance, /动态登场\.png$/, '登场皮.dynamicEntrance 应指向 动态登场.png');

    const limited = findSkin(g, '限定皮');
    assert.ok(limited, '限定皮 应存在');
    assert.match(limited.static, /静态\(S19\)\.png$/, '限定皮.static 应保留 -静态(S19) 后缀');
  });

  test('普通静态皮肤正常解析', () => {
    const data = getOutput();
    const g = findGeneral(data, '仅经典');
    const skin = findSkin(g, '测试皮');
    assert.ok(skin, '测试皮 应存在');
    assert.match(skin.static, /测试皮-仅经典-静态\.png$/, 'static 路径应正确');
    assert.strictEqual(skin.dynamic, null);
    assert.strictEqual(skin.large, null);
    assert.strictEqual(skin.dynamicEntrance, null);
  });
});

describe('scan-skins.js — BWIKI 元数据合并（回归保护）', () => {
  let cached = null;
  function getOutput() {
    if (!cached) cached = runScan();
    return cached;
  }

  test('metadata.json 的 品质/皮肤故事/皮肤台词/语音地址 正确流入皮肤', () => {
    const data = getOutput();
    const g = findGeneral(data, '全能武将');
    const skin = findSkin(g, '测试皮');
    assert.strictEqual(skin.quality, '限定', 'quality 应来自 metadata.品质');
    assert.strictEqual(skin.story, '测试故事', 'story 应来自 metadata.皮肤故事');
    assert.strictEqual(skin.quotes['技能A'], '元数据台词A', 'quotes 应来自 metadata.皮肤台词');
    assert.strictEqual(skin.voices.length, 1, 'voices 应来自 metadata.语音地址');
    assert.strictEqual(skin.voices[0].skill, '技能A');
    assert.deepStrictEqual(skin.voices[0].files, ['http://example.com/a.mp3']);
  });

  test('输出 JSON 结构完整（stats / factions）', () => {
    const data = getOutput();
    assert.ok(data.generatedAt, '应有 generatedAt');
    assert.strictEqual(data.stats.totalGenerals, 6, '应有 6 个武将');
    assert.ok(data.stats.factions['魏'] >= 6, '魏 下应至少有 6 个武将');
  });
});
