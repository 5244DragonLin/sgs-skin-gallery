# sgs-skin-gallery

三国杀皮肤画廊。基于 Vite + React 18 + Tailwind CSS 构建的 Web 应用，将本地皮肤素材转化为一本具有古董收藏册质感的在线画廊，支持势力/卡包/收藏册/名将堂/性别/品质筛选、武将搜索、皮肤详情浏览、武将技能展示、语音在线播放与收藏功能。

配合 [sgs_bwiki_skins](https://github.com/username/sgs_bwiki_skins) 下载素材、[sgs_bwiki_heros](https://github.com/username/sgs_bwiki_heros) 获取武将结构化数据，构建完整数据管线。

## 📸 项目预览

![屏幕截图 2026-07-07 000737](./screenshots/屏幕截图 2026-07-07 000737.png)

![屏幕截图 2026-07-07 000902](./screenshots/屏幕截图 2026-07-07 000902.png)

![屏幕截图 2026-07-07 000911](./screenshots/屏幕截图 2026-07-07 000911.png)

## 为什么需要这个工具？

- 三国杀皮肤极具美感，具有收藏价值和审美属性
- 收藏了 1700+ 皮肤后，翻文件夹就像翻垃圾堆，完全没有"收藏"的感觉
- Windows 自带的图片浏览器每次只显示一张，无法按势力筛选

**sgs-skin-gallery 解决这些问题**：把文件夹变成一本精美的古董收藏册——按势力翻页、按武将检索、点击查看大图和动态效果、浏览皮肤故事和台词、还能收藏心仪的皮肤。

## ⭐ 亮点

- **古董收藏册风格**：深棕底色 + 金色镶边 + 朱红点缀 + 宣纸纹理背景，打开就像翻开一本泛黄的古籍
- **势力筛选**：魏蜀吴群神五势力一键切换，势力标签采用经典配色
- **卡包筛选**：10大分类×91卡包，两级行内展开式标签，精准定位特定卡包的武将皮肤
- **收藏册筛选**：75种收藏册主题分组，全部按钮+下拉选择，呼应古董收藏册定位
- **名将堂筛选**：25种名将堂分类，同样按钮+下拉模式，快速定位名将池武将
- **武将搜索**：输入武将名，实时过滤，支持 590+ 位武将
- **多维度筛选**：势力 + 卡包分类 + 卡包 + 收藏册 + 名将堂 + 性别 + 品质 + 搜索，8 层筛选链交叉过滤
- **武将技能展示**：详情页展示技能名称、效果描述和对应台词
- **语音播放直连**：技能台词左侧嵌入语音按钮，点击即播对应技能语音，无需跳转到语音列表
- **四种皮肤展示**：静态图快速预览、大图沉浸浏览、动态 GIF 展示特效，动态登场 GIF 展示特效
- **皮肤故事与台词**：浏览每件皮肤的专属故事文字和技能台词（数据来自 BWIKI）
- **武将信息丰富**：称号、定位、名将堂、画师、上线时间、获取方式等元信息一览
- **本地收藏夹**：心形收藏按钮，localStorage 持久化，支持筛选"已收藏"
- **图片懒加载**：IntersectionObserver + 200px 预加载阈值，1800 张图不卡首屏
- **响应式布局**：桌面 6 列 → 平板 4 列 → 手机 2 列，自适应网格
- **YAML 配置**：通过 `gallery.config.yaml` 统一配置素材路径、武将数据和端口
- **增量更新友好**：素材目录变更后只需 `npm run scan` 重新生成数据，无需改代码

## 🚀 快速开始

### 前置条件

需要先运行 [sgs_bwiki_skins](https://github.com/username/sgs_bwiki_skins) 下载皮肤素材至指定目录，确保素材目录符合以下结构：

```
BWIKI/
├── 魏/
│   ├── *.png           # 皮肤图片（静态/大图）
│   └── *.gif           # 动态皮肤
├── 蜀/
├── 吴/
├── 群/
├── 神/
└── metadata.json       # 皮肤元数据（故事、台词）
```

### 1. 克隆项目

```bash
# Gitee 镜像（国内访问快）
git clone https://gitee.com/yhl5244/sgs-skin-gallery.git

# GitHub 原仓库
git clone https://github.com/5244DragonLin/sgs-skin-gallery.git

cd sgs-skin-gallery
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置素材目录

编辑 `gallery.config.yaml`，修改 `skinDir` 指向你的 BWIKI 素材目录：

```yaml
# gallery.config.yaml
skinDir: D:/BaiduSyncdisk/其他/三国杀皮肤/BWIKI  # 改成你的路径
port: 3000
```

### 4. 生成数据文件

```bash
npm run scan
```

扫描脚本会解析素材目录的文件名和 metadata.json，生成 `public/skin-data.json`。

### 5. 启动画廊

```bash
npm run dev
```

浏览器自动打开 `http://localhost:3000`。

## ⌨️ CLI 模式

`scan-skins.js` 支持命令行参数，可独立运行：

```
node scripts/scan-skins.js [--skin-dir <path>] [--output <path>]
```

### 输入选项

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--skin-dir <path>` | 皮肤素材目录路径 | 读 `gallery.config.yaml` |
| `--output <path>` | 输出 JSON 文件路径 | `public/skin-data.json` |

### 示例

```bash
# 使用默认路径
npm run scan

# 指定自定义素材目录
node scripts/scan-skins.js --skin-dir "D:/MySkins"

# 指定输出路径
node scripts/scan-skins.js --output "public/custom-data.json"
```

## 📁 项目结构

```
sgs-skin-gallery/
├── gallery.config.yaml           # YAML 配置文件（皮肤路径/端口等）
├── index.html                    # 入口 HTML（Tailwind CDN + Noto Serif SC）
├── package.json                  # Vite + React 18
├── vite.config.js                # 从 YAML 读取配置 + 自定义 /skins/ 代理中间件
├── .gitignore
├── LICENSE
├── scripts/
│   ├── scan-skins.js             # 数据扫描脚本 → public/skin-data.json
│   └── load-config.js            # YAML 配置读取器
├── public/
│   ├── gender-map.json           # 武将性别映射（约 270 条）
│   ├── skin-data.json            # 生成的数据文件（已 gitignore）
│   └── pack-data.json            # 卡包分类结构数据（已 gitignore）
└── src/
    ├── main.jsx                  # React 入口
    ├── App.jsx                   # 主组件（loading/gallery/detail/error 四视图）
    ├── components/
    │   ├── Header.jsx            # 标题栏 + 收藏夹入口
    │   ├── FilterBar.jsx         # 势力/卡包/收藏册/名将堂/性别/品质筛选 + 搜索
    │   ├── SkinGrid.jsx          # 响应式皮肤卡片网格
    │   ├── SkinCard.jsx          # 单个皮肤卡片（懒加载 + 动态登场指示器 + 名将堂徽标）
    │   ├── SkinDetail.jsx        # 皮肤详情模态框（Tab 切换 + 技能+台词+语音播放）
    │   ├── VoicePlayer.jsx       # 语音播放组件
    │   └── CollectionBadge.jsx   # 收藏心形按钮（心跳动画）
    ├── hooks/
    │   └── useFavorites.js       # localStorage 收藏夹 Hook
    └── styles/
        └── index.css             # 古董收藏册全局样式（宣纸纹理/动画）
```

## 配置说明

| 配置项 | 位置 | 说明 | 默认值 |
|--------|------|------|--------|
| `skinDir` | `gallery.config.yaml` | 皮肤素材根目录路径 | `D:/BaiduSyncdisk/其他/三国杀皮肤/BWIKI` |
| `herosDir` | `gallery.config.yaml` | 武将结构化数据目录 | `E:/sgs_bwiki_heros/output` |
| `port` | `gallery.config.yaml` | 开发服务器端口 | `3000` |
| `outputDir` | `gallery.config.yaml` | 扫描结果输出目录 | `public` |
| `gender-map.json` | `public/gender-map.json` | 武将性别映射表 | 约 270 条预置数据 |
| Tailwind 主题色 | `index.html` 内 `<script>` | 古董风格配色 | 深棕/暗金/朱红/象牙白 |

## ❓️ FAQ

**必须先运行 sgs_bwiki_skins 吗？**

不必须。只要你的素材目录符合文件命名规则（`皮肤名-武将名-类型.ext`）并按势力分目录，且根目录下有 `metadata.json`，即可直接使用。没有 metadata.json 也能运行，只是皮肤详情页不会显示故事和台词。

**支持哪些图片格式？**

PNG、JPG、JPEG、GIF、WebP。动态皮肤建议使用 GIF。

**关于皮肤品质（quality）**

当前 BWIKI 数据源的 metadata.json 已包含品质信息，支持 原画/普通/稀有/史诗/传说/限定/绝版 等品质筛选。限定与限定&amp;至臻合并为限定。品质色块统一配色：普通→绿、稀有→紫、史诗→金、传说→红、限定/绝版→金红渐变。

**如何新增武将性别？**

编辑 `public/gender-map.json`，添加 `"武将名": "男"` 或 `"女"`，然后刷新页面即可。

**素材更新后如何刷新画廊？**

重新运行 `npm run scan` 生成新的 `skin-data.json`，刷新页面即可。

**语音播放不了怎么办？**

语音文件存储在游卡服务器（web.sanguosha.com），需联网。如遇跨域问题，应用会自动回退到 /voice/ 代理。当前语音已整合到技能台词左侧，点击小喇叭直接播放对应技能语音。

**为什么大图/动态图显示不了？**

检查素材目录中是否存在对应文件。详情页三个 Tab（大图/静态/动态）只会显示实际存在的类型，不存在的 Tab 会自动隐藏。动态登场（BWIKI 动画.gif）有独立 ◈ 指示器。

## 📝 已知问题 / 待改进点

- [ ] 皮肤详情页支持键盘翻页（上一个/下一个皮肤）
- [ ] 添加暗色/亮色主题切换
- [ ] 技能版本切换（经典/界限突破/国战）
- [ ] 画师作品集浏览
- [ ] 部分技能台词和语音匹配错误

## 🤝 贡献

欢迎提 Issue 和 PR！

### 贡献流程

1. Fork 本项目
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add your feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

## 📋 更新日志

### v0.2

- **YAML 配置**：新增 `gallery.config.yaml` 统一管理皮肤路径、武将数据路径和端口，替代硬编码
- **名将堂筛选**：新增名将堂独立筛选行，全部按钮+下拉列表模式，支持25种名将堂分类
- **动态登场独立标识**：BWIKI 动态登场动画与常规动态 GIF 分离，卡片上用 ◈ 菱形指示器区分
- **语音按钮嵌入台词**：技能台词左侧添加小喇叭播放按钮，点击即播对应技能语音，无需跳转语音列表
- **收藏册交互升级**：改为全部按钮+下拉列表模式，精简6行显示，点击外部自动收起
- **蜀红吴绿配色**：蜀势力红（#c4554a）、吴势力绿（#5a9e6f），符合传统文化认知
- **品质色块统一配色**：品质徽章统一配色方案——普通绿/稀有紫/史诗金/传说红/限定金红渐变
- **品质筛选按钮同步配色**：选中态颜色匹配对应品质色块
- **大图图标简化**：🖼 → L，更简洁的视觉提示
- **详情面板布局优化**：去除右侧面板 maxHeight 限制，自适应高度，消除双滚动条和闪烁问题
- 优化已知 Bug 和提升性能

### v0.1

- 首个测试版本

## 🔗 关联项目

- [**sgs_bwiki_skins**](https://github.com/username/sgs_bwiki_skins) — 从 BWIKI 下载皮肤图片和元数据，本项目的主数据源
  - https://github.com/5244DragonLin/sgs_bwiki_skins
  - https://gitee.com/yhl5244/sgs_bwiki_skins

- [**sgs_bwiki_heros**](https://github.com/username/sgs_bwiki_heros) — 从 BWIKI 爬取武将结构化数据（技能/卡包/称号/定位等），本项目的武将信息数据源
  - https://github.com/5244DragonLin/sgs_bwiki_heros
  - https://gitee.com/yhl5244/sys_bwiki_heros


## ⚠️ 免责声明

本项目中所有皮肤素材、武将数据、故事文字及台词等版权均归杭州游卡网络技术有限公司（三国杀）及相关创作者所有。本工具仅供学习交流使用，不得用于任何商业用途或侵犯第三方权益的行为。因使用本工具产生的一切后果由使用者自行承担，作者不承担任何法律责任。

## ☕ 捐赠

如果这个项目对你有帮助，可以请我喝杯咖啡~

| 支付宝 | 微信 |
|--------|------|
| ![支付宝](./assets/donate_alipay.jpg) | ![微信](./assets/donate_wechat.jpg) |

## 📃 许可证

[MIT](./LICENSE)
