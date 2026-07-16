/**
 * Tests for scripts/scan-skins.js — focusing on the skill-version-switch
 * feature (buildSkillVersions / loadCharacters) plus the pre-existing pure
 * helpers used by the scan pipeline.
 *
 * Run with: npx vitest run scripts/scan-skins.test.mjs
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  buildSkillVersions,
  loadCharacters,
  parseImageFilename,
  convertAudioToVoices,
  extractPackCategory,
  buildPackData,
  lookupSkinMetadata,
} from './scan-skins.js';

// ============================================================
// buildSkillVersions — the core of the new feature
// (fixture uses the unified Chinese-key format: 版本.经典.技能 / 武将台词)
// ============================================================
describe('buildSkillVersions', () => {
  it('returns all three versions when each has skills or lines', () => {
    const char = {
      姓名: '曹操',
      版本: {
        经典: { 技能: [{ name: '奸雄', description: 'd' }], 武将台词: { 阵亡: ['c1'] } },
        界限突破: { 技能: [{ name: '护驾', description: 'd' }], 武将台词: {} },
        国战: { 技能: [], 武将台词: { 阵亡: ['nw'] } },
      },
    };
    const result = buildSkillVersions(char);
    expect(result).not.toBeNull();
    expect(Object.keys(result).sort()).toEqual(['国战', '界限突破', '经典']);
    expect(result.经典.skills[0].name).toBe('奸雄');
    expect(result.界限突破.skills[0].name).toBe('护驾');
    expect(Object.keys(result.国战.lines)).toEqual(['阵亡']);
  });

  it('includes a version that has only lines (no skills)', () => {
    const char = {
      姓名: 'SP太史慈',
      版本: {
        经典: { 技能: [], 武将台词: { 阵亡: ['刘繇之见'] } },
        界限突破: { 技能: [], 武将台词: {} },
        国战: { 技能: [], 武将台词: {} },
      },
    };
    const result = buildSkillVersions(char);
    expect(result).not.toBeNull();
    expect(Object.keys(result)).toEqual(['经典']);
  });

  it('returns null when every version lacks both skills and lines', () => {
    const char = {
      姓名: 'empty',
      版本: {
        经典: { 技能: [], 武将台词: {} },
        界限突破: { 技能: [], 武将台词: {} },
        国战: { 技能: [], 武将台词: {} },
      },
    };
    expect(buildSkillVersions(char)).toBeNull();
  });

  it('returns null when the character has no 版本 field', () => {
    expect(buildSkillVersions({ 姓名: 'no-versions' })).toBeNull();
    expect(buildSkillVersions({ 姓名: 'null-versions', 版本: null })).toBeNull();
  });

  it('treats a non-array 技能 field as empty (no crash)', () => {
    const char = {
      姓名: 'bad-skills',
      版本: {
        经典: { 技能: 'not-an-array', 武将台词: { 阵亡: ['x'] } },
        界限突破: { 技能: [], 武将台词: {} },
        国战: { 技能: [], 武将台词: {} },
      },
    };
    const result = buildSkillVersions(char);
    expect(result).not.toBeNull();
    expect(result.经典.skills).toEqual([]);
    expect(Object.keys(result)).toEqual(['经典']);
  });

  it('treats a non-object 武将台词 field as empty (no crash)', () => {
    const char = {
      姓名: 'bad-lines',
      版本: {
        经典: { 技能: [{ name: 'a', description: 'd' }], 武将台词: 'oops' },
        界限突破: { 技能: [], 武将台词: {} },
        国战: { 技能: [], 武将台词: {} },
      },
    };
    const result = buildSkillVersions(char);
    expect(result).not.toBeNull();
    expect(result.经典.lines).toEqual({});
    expect(Object.keys(result)).toEqual(['经典']);
  });

  it('preserves skill name/description objects', () => {
    const char = {
      姓名: 'z',
      版本: {
        经典: { 技能: [{ name: '洛神', description: '弃牌摸牌' }], 武将台词: {} },
        界限突破: { 技能: [], 武将台词: {} },
        国战: { 技能: [], 武将台词: {} },
      },
    };
    const result = buildSkillVersions(char);
    expect(result.经典.skills).toEqual([{ name: '洛神', description: '弃牌摸牌' }]);
  });
});

// ============================================================
// loadCharacters — integration of buildSkillVersions into char map
// (fixture uses the unified { characters:[...] } envelope with Chinese keys)
// ============================================================
describe('loadCharacters', () => {
  let tmpDir;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sgs-chars-'));
    const characters = {
      characters: [
        {
          姓名: '曹操',
          称号: '魏武挥鞭',
          版本: {
            经典: { 技能: [{ name: '奸雄', description: 'c' }], 武将台词: { 阵亡: ['cc'] } },
            界限突破: { 技能: [{ name: '护驾', description: 'b' }], 武将台词: {} },
            国战: { 技能: [], 武将台词: {} },
          },
        },
        {
          姓名: '空武将',
          称号: '',
          版本: {
            经典: { 技能: [], 武将台词: {} },
            界限突破: { 技能: [], 武将台词: {} },
            国战: { 技能: [], 武将台词: {} },
          },
        },
      ],
    };
    fs.writeFileSync(path.join(tmpDir, 'characters.json'), JSON.stringify(characters), 'utf-8');
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('attaches skillVersions and top-level classic skills to each entry', () => {
    const map = loadCharacters(tmpDir);
    expect(map.size).toBe(2);

    const cao = map.get('曹操');
    expect(cao).toBeTruthy();
    expect(cao.skills).toEqual([{ name: '奸雄', description: 'c' }]);
    expect(cao.title).toBe('魏武挥鞭');
    expect(cao.skillVersions).not.toBeNull();
    expect(Object.keys(cao.skillVersions).sort()).toEqual(['界限突破', '经典']);
  });

  it('sets skillVersions to null when all versions are empty', () => {
    const map = loadCharacters(tmpDir);
    expect(map.get('空武将').skillVersions).toBeNull();
  });

  it('returns an empty Map (no throw) when characters.json is missing', () => {
    const map = loadCharacters(path.join(os.tmpdir(), 'does-not-exist-' + Date.now()));
    expect(map).toBeInstanceOf(Map);
    expect(map.size).toBe(0);
  });

  it('returns an empty Map (no throw) when characters.json is malformed', () => {
    const badDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sgs-bad-'));
    fs.writeFileSync(path.join(badDir, 'characters.json'), '{not valid json', 'utf-8');
    const map = loadCharacters(badDir);
    expect(map).toBeInstanceOf(Map);
    expect(map.size).toBe(0);
    fs.rmSync(badDir, { recursive: true, force: true });
  });
});

// ============================================================
// parseImageFilename — pre-existing helper
// ============================================================
describe('parseImageFilename', () => {
  it('parses a static skin image', () => {
    expect(parseImageFilename('皮肤A-曹操-静态.png')).toEqual({
      generalName: '曹操',
      skinName: '皮肤A',
      type: 'static',
      ext: '.png',
    });
  });

  it('parses a dynamic gif', () => {
    expect(parseImageFilename('皮肤B-刘备-动态.gif')).toEqual({
      generalName: '刘备',
      skinName: '皮肤B',
      type: 'dynamic',
      ext: '.gif',
    });
  });

  it('parses a large image', () => {
    expect(parseImageFilename('皮肤C-孙权-大图.png').type).toBe('large');
  });

  it('parses a dynamic entrance image', () => {
    expect(parseImageFilename('皮肤D-周瑜-动态登场.png').type).toBe('dynamicEntrance');
  });

  it('returns null for non-image files', () => {
    expect(parseImageFilename('readme.txt')).toBeNull();
  });

  it('returns null when there is no general/skin separator', () => {
    expect(parseImageFilename('noDash.png')).toBeNull();
  });

  it('returns null for a bare filename with no general/skin separator', () => {
    // '经典形象.png' has no dash and no recognised suffix → unparseable
    expect(parseImageFilename('经典形象.png')).toBeNull();
  });

  it('treats a <general>-经典形象 filename as the default portrait', () => {
    const r = parseImageFilename('曹操-经典形象.png');
    expect(r).toEqual({ generalName: '曹操', skinName: '经典形象', type: 'static', ext: '.png' });
  });
});

// ============================================================
// convertAudioToVoices — pre-existing helper
// ============================================================
describe('convertAudioToVoices', () => {
  it('maps 阵亡 to type "dead" and others to "skill"', () => {
    const result = convertAudioToVoices({ 技能名: ['u1'], 阵亡: ['d1'] });
    expect(result).toEqual([
      { skill: '技能名', type: 'skill', label: '技能名', files: ['u1'] },
      { skill: '阵亡', type: 'dead', label: '阵亡', files: ['d1'] },
    ]);
  });

  it('returns [] for null / non-object / empty input', () => {
    expect(convertAudioToVoices(null)).toEqual([]);
    expect(convertAudioToVoices('x')).toEqual([]);
    expect(convertAudioToVoices({})).toEqual([]);
  });

  it('skips entries whose files are not a non-empty array', () => {
    expect(convertAudioToVoices({ 技能名: 'notarray', 阵亡: ['d'] })).toEqual([
      { skill: '阵亡', type: 'dead', label: '阵亡', files: ['d'] },
    ]);
  });
});

// ============================================================
// extractPackCategory — pre-existing helper
// ============================================================
describe('extractPackCategory', () => {
  it('splits on the first dash', () => {
    expect(extractPackCategory('荟萃-千里单骑')).toBe('荟萃');
  });
  it('falls back to 其他 when there is no dash', () => {
    expect(extractPackCategory('标准')).toBe('其他');
  });
  it('falls back to 其他 for empty / falsy input', () => {
    expect(extractPackCategory('')).toBe('其他');
    expect(extractPackCategory(null)).toBe('其他');
  });
});

// ============================================================
// buildPackData — pre-existing helper
// ============================================================
describe('buildPackData', () => {
  it('returns an empty structure for missing data', () => {
    const r = buildPackData(null);
    expect(r.totalCategories).toBe(0);
    expect(r.totalPacks).toBe(0);
    expect(r.categories).toEqual([]);
  });

  it('counts categories and packs', () => {
    const r = buildPackData({
      pack_categories: [
        { category: '荟萃', packs: [{ name: 'a', characters: ['x'] }, { name: 'b', characters: [] }] },
        { category: '标准', packs: [] },
      ],
    });
    expect(r.totalCategories).toBe(2);
    expect(r.totalPacks).toBe(2);
    expect(r.categories[0].packs).toHaveLength(2);
  });
});

// ============================================================
// lookupSkinMetadata — pre-existing helper
// ============================================================
describe('lookupSkinMetadata', () => {
  const meta = {
    '皮肤A*曹操': { story: 's' },
    '曹操*皮肤B': { story: 'b' },
  };

  it('matches the star-separated key', () => {
    expect(lookupSkinMetadata(meta, '皮肤A', '曹操')).toEqual({ story: 's' });
  });

  it('matches the reversed star key', () => {
    expect(lookupSkinMetadata(meta, '皮肤B', '曹操')).toEqual({ story: 'b' });
  });

  it('returns null for a missing entry or null metadata', () => {
    expect(lookupSkinMetadata(meta, '皮肤X', '曹操')).toBeNull();
    expect(lookupSkinMetadata(null, '皮肤A', '曹操')).toBeNull();
  });
});
