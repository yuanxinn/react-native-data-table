# AGENTS.md

面向 AI 编码代理的项目指令文档。修改本仓库前请先通读本文件。

## 项目概览

`@bestcoder/react-native-data-table` 是一个发布到 npm 的 React Native / Expo 高性能数据表格组件库（TypeScript 编写，MIT 协议）。核心能力：FlashList v2 虚拟化、幽灵测绘自适应列宽、左右固定列、行选择、受控排序、展开行与异步主子表、主题与边框配置，同时支持 App 端与 Web（react-native-web / Expo Web）。

- 包入口：`dist/index.js` / `dist/index.d.ts`（由 `index.ts` 编译产出）
- 仓库地址：https://github.com/yuanxinn/react-native-data-table
- 主文档为中文 `README.md`，英文版 `README.en.md`，变更记录 `CHANGELOG.md`（Keep a Changelog + SemVer）

## 技术栈与环境

| 项 | 说明 |
| --- | --- |
| 语言 | TypeScript（strict 模式），JSX 走 `react-jsx` |
| 运行时 peer 依赖 | `react >=19.2.3 <20`、`react-native >=0.86 <0.87`、`@shopify/flash-list >=2 <3` |
| Node | `>=22.13.0` |
| 构建 | `tsc -p tsconfig.build.json` → 输出 `dist/`（无 bundler，纯 tsc 编译 + 声明文件） |
| Lint | ESLint 9 flat config（`eslint.config.js`，基于 `eslint-config-expo/flat`） |
| 依赖管理 | npm（无 lockfile 提交策略变更前保持现状） |

本包**没有任何运行时 dependencies**，只有 peerDependencies——不要引入新的运行时依赖；如确有必要，须作为 peerDependency 并在 README 兼容性章节说明。

## 目录结构

源码平铺在仓库根目录（没有 `src/`），一个文件一个职责：

```
index.ts               # 唯一公开出口：DataTable、主题、公开类型（全部具名导出）
types.ts               # 全部对外类型定义（Props / Column / Selection / SubTable / Border / Handle）
data-table.tsx         # 主组件与总编排：FlashList、吸顶表头哨兵、ref 命令式句柄
column-layout.ts       # 列布局纯函数：固定列归位、选择列注入/合并、列宽求解与弹性分配
use-column-measure.ts  # 幽灵测绘状态机：首测通道 + 原地重测通道 + 子表宽度并入
ghost-measurer.tsx     # 离屏幽灵渲染测宽（真实渲染单元格内容取最大宽度）
measure.ts             # onLayout 测量工具
cell.tsx / cell-box.tsx# 单元格内容渲染、样式组合、Web 端 CSS sticky 定位
header-row.tsx         # 表头行（排序箭头、全选框）
table-row.tsx          # 数据行
h-scroller.tsx         # Web 端行内横滚器（registry 广播同步）；App 端不经过它
expanded-area.tsx      # 展开区：custom 固定面板 / 加载 / 错误 / 空态
sub-table.tsx          # sub-table 模式子表渲染
use-expandable.ts      # 展开状态 + onExpandFetch 异步与按行 key 缓存
use-row-selection.ts   # 行选择状态（受控 selectedRowKeys）
use-press-guard.ts     # 滚动/按压冲突守卫
checkbox.tsx           # 内置选择框（含半选态）
theme.ts               # 主题定义、深合并、Context 注入
border.ts              # border 配置解析为三类线样式（纯函数）
*.test.ts              # 与被测模块同名共置的单测（仅纯逻辑模块）
dist/                  # tsc 构建产物，已提交进 git
```

## 必须理解的核心架构

修改布局、测宽、滚动相关代码前，务必先理解以下机制：

1. **幽灵测绘（ghost measurement）双通道**（`use-column-measure.ts`）：
   - 首测通道：新数据先进入离屏幽灵区真实渲染测宽，完成后按批放行进 FlashList；
   - 原地重测通道：测绘签名（`remeasureKey` + 选择状态 + 自适应列集合）变化时，快照全量数据分批（`MEASURE_BATCH_SIZE = 200`）离屏重测，**全部完成后一次性替换列宽**——期间行不下屏、纵向滚动位置不变；
   - 批内宽度合并取 max（合并只增不减），列缩窄只能靠整体替换。
2. **列布局归位**（`column-layout.ts`）：左固定列连续归位到最前、右固定列归位到最后；行选择列由内部注入（独立列定宽 48，或 `mergeIntoDataIndex` 合并进宿主列）。子表 `SubColumn.colIndex` 对齐的是**归位后的视觉列序**（含注入的选择列）。
3. **Web / App 双端滚动模型分叉**（`Platform.OS === 'web'` 分支）：
   - App 端：DataTable 外层唯一横向 ScrollView 统一驱动，固定列用绝对定位钉住；
   - Web 端：表头与每一行是各自独立的 `HScroller`，靠共享 `offsetRef` + registry 广播 `scrollTo` 同步，固定列用 CSS `position: sticky`（见 `cell-box.tsx` 的 `WEB_STICKY_STYLE`）。
   - 改动滚动/固定列逻辑时两端都要考虑并分别验证。
4. **吸顶表头哨兵**：表头作为 `HEADER_SENTINEL` 注入 FlashList 数据首位，走 `stickyHeaderIndices=[0]` 原生吸顶。
5. **受控组件哲学**：组件自身**不排序数据**（`onSort` 回调 + `currentSort` 受控）、行选择由 `selectedRowKeys` 受控。新增功能优先沿用「组件只提供机制、调用方决定策略」的设计。

## 常用命令

```bash
npm install          # 安装依赖
npm run build        # tsc 编译到 dist/（发布前 prepack 自动执行）
npm run lint         # ESLint 检查
```

- **测试**：`*.test.ts` 为 Jest 风格（`describe/it/expect`）共置单测，仅覆盖纯逻辑模块（`border`、`column-layout`、`measure` 等）。当前 `package.json` 未配置 test script 也未安装测试运行器——新增纯函数逻辑时请照样补共置测试文件，但不要假设 `npm test` 可用；验证以 `npm run build` + `npm run lint` 通过为准。
- 测试文件被 `tsconfig.build.json` 的 `exclude` 排除，不会进入构建产物。

## 编码约定

- **注释与文档字符串用中文**，与现有代码保持一致；对外 API 的 JSDoc 注释要写清行为边界（如宽度稳定性要求、优先级顺序）。
- 全部使用**具名导出**；新增公开 API 必须同时在 `index.ts` 导出、在 `types.ts` 定义类型。
- 纯逻辑（可单测）与渲染组件分文件：布局/解析类逻辑写成纯函数（参考 `border.ts`、`column-layout.ts`），不要埋进组件内。
- 样式优先级链条是既定契约，勿打乱：全局 `cellStyle` < 列级 `col.cellStyle` < `renderCellStyle`（数据单元格）；表头为 `col.cellStyle` < `headerCellStyle`。
- 涉及宽度的自定义渲染（排序图标、选择框）要求**多态等宽**，否则列宽抖动——新增类似 API 时在 JSDoc 中同样注明。
- 不使用 `any` 逃逸（`SubTableSpec<S = any>` 为历史特例）；泛型 `<T, D>` 贯穿主组件。

## 构建产物与提交

- **`dist/` 已提交进 git**：修改任何 `.ts`/`.tsx` 源码后，提交前必须运行 `npm run build` 并把 `dist/` 的变更一并提交，保持源码与产物同步。
- 不要手改 `dist/` 内的文件。

## 文档同步要求

对外行为有任何变化时，同一次提交内同步更新：

1. `README.md`（中文，主文档）与 `README.en.md`（英文，内容对齐）——尤其是 API 表格与「公开导出」「使用注意事项」章节；
2. `CHANGELOG.md` 的 `## Unreleased` 段落，按 Added / Changed / Fixed 分类，英文书写（与现有条目一致）。

## 版本与发布

- SemVer。发布流程：更新 `package.json` 版本 → CHANGELOG 把 Unreleased 落为版本号 → 提交 → 在 GitHub 创建 `v<version>` release。
- `.github/workflows/publish.yml` 在 release 发布时自动走 npm trusted publishing（OIDC，无 token）：校验 tag 与 `package.json` 版本一致 → lint → build → `npm publish`。tag 不匹配会直接失败。
- 根目录的 `*.tgz` 是历史打包残留，不要引用或更新。

## 常见陷阱

- 改列宽相关逻辑时注意：测绘期间旧列宽仍在上屏渲染，任何会让「测绘签名」变化的新状态都要接入 `use-column-measure.ts` 的重测通道，否则列宽不会跟随。
- 选择列注入后所有基于列下标的逻辑（`SubColumn.colIndex`、`columnWidths` 数组）都会偏移，改动列注入顺序属于破坏性变更。
- Web 端每行独立横滚器的同步依赖 registry 广播，新增会横向滚动的行类型（如新面板）须接入同一 registry，否则滚动脱节。
- peer 依赖版本范围收得很窄（RN 0.86.x、React 19.2.x、FlashList 2.x），升级范围属于破坏性变更，需在 README 兼容性章节与 CHANGELOG 同步说明。
