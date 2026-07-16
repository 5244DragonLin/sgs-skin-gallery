/**
 * SkinDetail.versionSwitch.test.jsx — 针对「技能版本切换」UI 的组件测试
 *
 * 覆盖：版本切换按钮渲染、切换后技能更新、单版本隐藏切换器、旧 skills 回退、
 *      台词 '/' 归一化、版本台词优先于皮肤台词、阵亡台词、语音按钮。
 *
 * 运行: npx vitest run src/components/__tests__/SkinDetail.versionSwitch.test.jsx
 */

import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SkinDetail from '../SkinDetail';

afterEach(cleanup);

// ---- Fixtures ------------------------------------------------------------
const baseSkin = {
  id: '测试皮',
  name: '测试皮',
  quality: null,
  story: null,
  quotes: {},
  static: null,
  large: null,
  dynamic: null,
  dynamicEntrance: null,
  voices: [],
  collection: null,
  artist: null,
  releaseTime: null,
  staticAcquisition: null,
  dynamicAcquisition: null,
};

function makeGeneral(overrides = {}) {
  return {
    id: '全能武将',
    name: '全能武将',
    faction: '魏',
    skins: [],
    skills: [],
    skillVersions: null,
    title: '测试·全能',
    position: '测试定位',
    hallOfFame: '',
    gender: '男',
    pack: '未知',
    packCategory: '其他',
    ...overrides,
  };
}

function renderDetail(general, skin = baseSkin, extraProps = {}) {
  return render(
    <SkinDetail
      general={general}
      skin={skin}
      fullData={null}
      onClose={() => {}}
      isFavorite={false}
      onToggleFavorite={() => {}}
      {...extraProps}
    />
  );
}

// 三版本完整武将
const THREE_VERSION_GENERAL = makeGeneral({
  skillVersions: {
    经典: {
      skills: [{ name: '技能A', description: '经典描述A' }],
      lines: { 技能A: ['经典台词A1/经典台词A2'], 阵亡: ['经典阵亡'] },
    },
    界限突破: {
      skills: [{ name: '技能B', description: '突破描述B' }],
      lines: { 技能B: ['突破台词B'], 阵亡: ['突破阵亡'] },
    },
    国战: {
      skills: [{ name: '技能C', description: '国战描述C' }],
      lines: { 技能C: ['国战台词C'] },
    },
  },
});

// ---- Tests ---------------------------------------------------------------
describe('SkinDetail — 技能版本切换 UI', () => {
  it('三版本武将：渲染三个版本按钮，初始显示经典技能', () => {
    renderDetail(THREE_VERSION_GENERAL);

    // 版本切换按钮
    expect(screen.getByText('经典')).toBeTruthy();
    expect(screen.getByText('界限突破')).toBeTruthy();
    expect(screen.getByText('国战')).toBeTruthy();

    // 初始为 classic
    expect(screen.getByText('经典描述A')).toBeTruthy();
    expect(screen.getByText('技能A')).toBeTruthy();
    expect(screen.queryByText('突破描述B')).toBeNull();
  });

  it('点击「界限突破」→ 显示突破技能，隐藏经典技能', () => {
    renderDetail(THREE_VERSION_GENERAL);

    fireEvent.click(screen.getByText('界限突破'));

    expect(screen.getByText('突破描述B')).toBeTruthy();
    expect(screen.getByText('技能B')).toBeTruthy();
    expect(screen.queryByText('经典描述A')).toBeNull();
    expect(screen.queryByText('国战描述C')).toBeNull();
  });

  it('点击「国战」→ 显示国战技能', () => {
    renderDetail(THREE_VERSION_GENERAL);

    fireEvent.click(screen.getByText('国战'));

    expect(screen.getByText('国战描述C')).toBeTruthy();
    expect(screen.getByText('技能C')).toBeTruthy();
    expect(screen.queryByText('经典描述A')).toBeNull();
  });

  it('仅单版本武将：不显示切换器，直接显示经典技能', () => {
    const general = makeGeneral({
      skillVersions: {
        经典: {
          skills: [{ name: '技能X', description: 'X描述' }],
          lines: { 技能X: ['X台词'] },
        },
      },
    });
    renderDetail(general);

    // 只有一个可用版本 → 不应出现切换按钮
    expect(screen.queryByText('界限突破')).toBeNull();
    expect(screen.queryByText('国战')).toBeNull();
    expect(screen.getByText('X描述')).toBeTruthy();
  });

  it('skillVersions 为 null 但有旧 skills：不显示切换器，显示固定技能', () => {
    const general = makeGeneral({
      skillVersions: null,
      skills: [{ name: '旧技能', description: '旧描述' }],
    });
    renderDetail(general);

    expect(screen.queryByText('界限突破')).toBeNull();
    expect(screen.getByText('旧描述')).toBeTruthy();
    expect(screen.getByText('旧技能')).toBeTruthy();
  });

  it('台词含 "/" → 归一化为多行独立台词', () => {
    const general = makeGeneral({
      skillVersions: {
        经典: {
          skills: [{ name: '技能A', description: '经典描述A' }],
          lines: { 技能A: ['台词甲/台词乙'] },
        },
      },
    });
    renderDetail(general);

    expect(screen.getByText('「台词甲」')).toBeTruthy();
    expect(screen.getByText('「台词乙」')).toBeTruthy();
    // 不应出现还带着 "/" 的原始串
    expect(screen.queryByText('台词甲/台词乙')).toBeNull();
  });

  it('版本台词优先于皮肤台词 (skinQuotes)', () => {
    const general = makeGeneral({
      skillVersions: {
        经典: {
          skills: [{ name: '技能A', description: '经典描述A' }],
          lines: { 技能A: ['版本台词'] },
        },
      },
    });
    const skin = { ...baseSkin, quotes: { 技能A: '元数据台词' } };
    renderDetail(general, skin);

    expect(screen.getByText('「版本台词」')).toBeTruthy();
    expect(screen.queryByText('「元数据台词」')).toBeNull();
  });

  it('阵亡台词独立于技能块渲染（💀 阵亡）', () => {
    const general = makeGeneral({
      skillVersions: {
        经典: {
          skills: [{ name: '技能A', description: '经典描述A' }],
          lines: { 技能A: ['经典台词A'], 阵亡: ['我死啦'] },
        },
      },
    });
    renderDetail(general);

    expect(screen.getByText('「我死啦」')).toBeTruthy();
    expect(screen.getAllByText(/阵亡/).length).toBeGreaterThan(0);
  });

  it('技能匹配 voices 时渲染语音播放按钮', () => {
    const general = makeGeneral({
      skillVersions: {
        经典: {
          skills: [{ name: '技能A', description: '经典描述A' }],
          lines: { 技能A: ['经典台词A'] },
        },
      },
    });
    const skin = {
      ...baseSkin,
      voices: [{ skill: '技能A', type: 'skill', label: '技能A', files: ['http://example.com/a.mp3'] }],
    };
    renderDetail(general, skin);

    // 找到播放按钮（title 含 "播放 <台词>"，label 取自台词行），不点击以免触发 Audio
    const playBtn = screen.getByTitle('播放 经典台词A');
    expect(playBtn).toBeTruthy();
  });
});

// ---- 键盘操作：↑↓ 切皮肤 / ←→ 切形式 -------------------------------------
describe('SkinDetail — 键盘操作（↑↓ 切皮肤 / ←→ 切形式）', () => {
  const navGeneral = makeGeneral({
    skins: [
      { id: '皮A', name: '皮A' },
      { id: '皮B', name: '皮B' },
      { id: '皮C', name: '皮C' },
    ],
  });
  const navSkin = { ...baseSkin, id: '皮B', name: '皮B' };

  it('ArrowDown → 调用 onNavigateSkin("next")', () => {
    const onNavigateSkin = vi.fn();
    renderDetail(navGeneral, navSkin, { onNavigateSkin });
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(onNavigateSkin).toHaveBeenCalledWith('next');
  });

  it('ArrowUp → 调用 onNavigateSkin("prev")', () => {
    const onNavigateSkin = vi.fn();
    renderDetail(navGeneral, navSkin, { onNavigateSkin });
    fireEvent.keyDown(document, { key: 'ArrowUp' });
    expect(onNavigateSkin).toHaveBeenCalledWith('prev');
  });

  it('全屏看图时，方向键不触发翻页（先按 Esc 退出大图）', () => {
    const onNavigateSkin = vi.fn();
    const skinWithImg = { ...navSkin, large: '皮B.png' };
    renderDetail(navGeneral, skinWithImg, { onNavigateSkin });
    // 打开大图
    fireEvent.click(screen.getByAltText('皮B - 全能武将'));
    expect(screen.getByLabelText('关闭大图')).toBeTruthy();
    // 此时按方向键不应翻页
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(onNavigateSkin).not.toHaveBeenCalled();
  });

  it('仅一个皮肤（canNavigateSkin=false）时，↑↓ 不触发翻页', () => {
    const onNavigateSkin = vi.fn();
    const singleGeneral = makeGeneral({ skins: [{ id: '唯一皮', name: '唯一皮' }] });
    const singleSkin = { ...baseSkin, id: '唯一皮', name: '唯一皮' };
    renderDetail(singleGeneral, singleSkin, { onNavigateSkin });
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(onNavigateSkin).not.toHaveBeenCalled();
  });

  // 形式切换：需皮肤带多个图片形式（大图 / 静态 / 动态）
  const multiFormSkin = { ...baseSkin, id: '皮B', name: '皮B', large: 'b.png', static: 'b-s.png', dynamic: 'b-d.gif' };

  const getActiveTabLabel = () => {
    // 激活的表单按钮带 bg-antique-gold/30 样式（未激活为 bg-black/40）
    const active = screen.getAllByRole('button')
      .find((b) => b.className.includes('bg-antique-gold/30'));
    return active ? active.textContent : null;
  };

  it('初始形式为大图，ArrowRight 依次切到 静态 → 动态 GIF → 回环大图', () => {
    renderDetail(navGeneral, multiFormSkin);
    expect(getActiveTabLabel()).toBe('大图');
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(getActiveTabLabel()).toBe('静态');
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(getActiveTabLabel()).toBe('动态 GIF');
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(getActiveTabLabel()).toBe('大图');
  });

  it('ArrowLeft 回环：大图 → 动态 GIF', () => {
    renderDetail(navGeneral, multiFormSkin);
    expect(getActiveTabLabel()).toBe('大图');
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(getActiveTabLabel()).toBe('动态 GIF');
  });

  it('全屏看图时，← → 不切换形式', () => {
    renderDetail(navGeneral, multiFormSkin);
    fireEvent.click(screen.getByAltText('皮B - 全能武将'));
    expect(screen.getByLabelText('关闭大图')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(getActiveTabLabel()).toBe('大图');
  });
});
