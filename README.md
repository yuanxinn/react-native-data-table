# @bestcoder/react-native-data-table

简体中文 | [English](./README.en.md)

[![npm version](https://img.shields.io/npm/v/%40bestcoder%2Freact-native-data-table.svg)](https://www.npmjs.com/package/@bestcoder/react-native-data-table)
[![license](https://img.shields.io/npm/l/%40bestcoder%2Freact-native-data-table.svg)](https://www.npmjs.com/package/@bestcoder/react-native-data-table)
[![npm downloads](https://img.shields.io/npm/dm/%40bestcoder%2Freact-native-data-table.svg)](https://www.npmjs.com/package/@bestcoder/react-native-data-table)

基于 FlashList v2 的高性能 React Native 数据表格，支持 iOS、Android 和 Web。内置横纵滚动、固定列、自适应列宽、行选择、受控排序、展开行、异步子表、主题与边框配置。

A high-performance, cross-platform data table for React Native, Expo, and React Native Web.

## 特性

- FlashList v2 虚拟化，适合大数据列表。
- 纵向滚动、横向滚动与可关闭的吸顶表头。
- `fixed: 'left' | 'right'` 左右固定列。
- 按真实渲染内容测量自适应列宽，支持 `minWidth` 和定宽列。
- 受控行选择、全选/半选、禁用行、自定义 Checkbox 及选择列合并。
- 受控三态排序：`null → ascend → descend → null`。
- 自定义展开面板或异步联动子表。
- 下拉刷新、触底加载、空态、页面级头尾内容。
- 可配置主题、斑马纹、按压高亮、单元格样式和网格边框。
- TypeScript 类型声明随包发布。

## 兼容性

| 环境 | 支持范围 |
|---|---|
| Expo | SDK 57 |
| React Native | `>=0.86.0 <0.87` |
| React | `>=19.2.3 <20` |
| `@shopify/flash-list` | `>=2.2.1 <3` |
| Node.js | `>=22.13.0` |
| 平台 | iOS / Android / Web |

Web 端需要宿主项目已正常配置 React Native Web；Expo 项目默认已包含该能力。

## 安装

### Expo SDK 57

```bash
npx expo install @shopify/flash-list
npm install @bestcoder/react-native-data-table
```

### React Native

```bash
npm install @bestcoder/react-native-data-table @shopify/flash-list
```

本包没有自定义原生模块；原生端要求取决于 `@shopify/flash-list` 和宿主 React Native 项目。

## 快速上手

`DataTable` 默认使用 `flex: 1`，父容器必须有可计算的高度；也可直接传入 `height` 或 `maxHeight`。

```tsx
import { Text, View } from 'react-native';
import {
  DataTable,
  type TableColumn,
} from '@bestcoder/react-native-data-table';

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: 'paid' | 'pending';
}

const rows: Order[] = [
  { id: 'SO-001', customer: 'Alice', amount: 1280, status: 'paid' },
  { id: 'SO-002', customer: 'Bob', amount: 860, status: 'pending' },
];

const columns: TableColumn<Order>[] = [
  { title: '订单号', dataIndex: 'id', width: 110, fixed: 'left' },
  { title: '客户', dataIndex: 'customer', minWidth: 120 },
  { title: '金额', dataIndex: 'amount', align: 'right', sorter: true },
  { title: '状态', dataIndex: 'status', minWidth: 100 },
];

export function OrderList() {
  return (
    <View style={{ flex: 1 }}>
      <DataTable
        data={rows}
        columns={columns}
        keyExtractor={(item) => item.id}
        striped
        highlightOnRowPress
      />
    </View>
  );
}
```

## 核心用法

### 受控排序

组件只输出排序意图，**不会修改 `data`**。调用方需根据 `currentSort` 排序数据后再传回。

```tsx
const [sort, setSort] = useState<SortParams>();
const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort]);

<DataTable
  data={sortedRows}
  columns={columns}
  keyExtractor={(item) => item.id}
  currentSort={sort}
  onSort={setSort}
/>
```

### 行选择

`rowSelection` 是受控配置。不传时不渲染选择列。

```tsx
const tableRef = useRef<DataTableHandle>(null);
const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

<DataTable
  ref={tableRef}
  data={rows}
  columns={columns}
  keyExtractor={(item) => item.id}
  rowSelection={{
    selectedRowKeys: selectedKeys,
    onChange: (keys) => setSelectedKeys(keys),
    getCheckboxProps: (record) => ({ disabled: record.status === 'paid' }),
    position: 'first',
  }}
/>

tableRef.current?.selectAll();
tableRef.current?.clearSelection();
tableRef.current?.scrollToTop();
```

### 展开行

`custom` 是默认模式。展开内容占满当前视口宽度，不跟随主表横向滚动。

```tsx
<DataTable
  data={rows}
  columns={columns}
  keyExtractor={(item) => item.id}
  renderExpandedRow={(record) => (
    <View style={{ padding: 16 }}>
      <Text>订单：{record.id}</Text>
    </View>
  )}
/>
```

### 异步子表

`sub-table` 模式先通过 `onExpandFetch` 获取子数据，再由 `getSubTable` 返回子表规格。子表没有表头，但可与父表共享横向滚动、固定列和最终列宽。

```tsx
<DataTable<Order, LineItem[]>
  data={rows}
  columns={columns}
  keyExtractor={(item) => item.id}
  expandedRowType="sub-table"
  onExpandFetch={(order) => fetchLineItems(order.id)}
  getSubTable={(_order, _index, items) => ({
    rows: items,
    columns: [
      { colIndex: 0, dataIndex: 'sku' },
      { colIndex: 1, dataIndex: 'name' },
      { colIndex: 2, dataIndex: 'quantity', align: 'right' },
    ],
  })}
/>
```

- `SubColumn.colIndex` 按父表**视觉列顺序**对齐，包含内部选择列和固定列归位后的顺序。
- `colSpan` 可横跨多个父列。
- Loading、Error 和 Empty 有默认面板，均可自定义。
- `subTableSyncScroll` 和 `subTableSyncFixedColumns` 默认都为 `true`。

### 主题

`theme` 接受 `Partial<DataTableTheme>`，与内置主题合并。只需覆盖要修改的 token。

```tsx
<DataTable
  data={rows}
  columns={columns}
  keyExtractor={(item) => item.id}
  theme={{
    primary: '#6D5EF7',
    primaryLight: '#EFEDFF',
    headerBg: '#F8F7FF',
  }}
/>
```

| Token | 用途 |
|---|---|
| `headerBg` | 表头、展开区和斑马纹奇数行默认背景 |
| `rowBg` | 数据行、Checkbox 和斑马纹偶数行默认背景 |
| `text` | 主文字 |
| `textSecondary` | 次级文字、错误和空态 |
| `primary` | Checkbox、排序激活态和 Loading |
| `primaryLight` | 默认行按压高亮 |
| `onPrimary` | 主色上的对勾/半选标记 |
| `line` | 默认边框颜色 |
| `disabled` | Checkbox 和排序禁用/未激活态 |

也可导入 `DEFAULT_DATA_TABLE_THEME` 作为完整基线。

### 边框

```tsx
<DataTable
  data={rows}
  columns={columns}
  keyExtractor={(item) => item.id}
  border={{
    horizontal: true,
    vertical: true,
    outer: true,
    color: '#D7D9E0',
    width: 1,
  }}
/>
```

- 省略 `border`：只开启默认横向分隔线。
- `false`：关闭全部边框。
- `true`：开启默认横向分隔线。
- 对象：通过 `horizontal`、`vertical`、`outer`、`color` 和 `width` 组合配置。

## API

### `DataTableProps<T, D>`

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `data` | `T[]` | 必填 | 原始数据源 |
| `columns` | `TableColumn<T>[]` | 必填 | 列配置 |
| `keyExtractor` | `(item, index) => string` | 必填 | 返回全局唯一且稳定的行 key |
| `remeasureKey` | `string \| number` | — | 变化时原地重新测量自适应列 |
| `height` | `DimensionValue` | — | 固定表格高度，优先于 `maxHeight` |
| `maxHeight` | `DimensionValue` | — | 父 flex 布局中的最大高度 |
| `striped` | `boolean` | `false` | 开启斑马纹 |
| `stripeColors` | `[string, string]` | `[theme.rowBg, theme.headerBg]` | 偶数/奇数行背景 |
| `highlightOnRowPress` | `boolean` | `false` | 按下行时高亮 |
| `highlightColor` | `string` | `theme.primaryLight` | 行按压高亮色 |
| `rowSelection` | `RowSelectionConfig<T>` | — | 受控行选择配置；开关选择模式或切换合并宿主列时会自动原地重测列宽 |
| `stickyHeader` | `boolean` | `true` | 表头吸顶开关 |
| `ref` | `Ref<DataTableHandle>` | — | `selectAll()` / `clearSelection()` / `scrollToTop()` 命令式句柄 |
| `onSort` | `(params: SortParams) => void` | — | 排序状态变化回调 |
| `currentSort` | `SortParams` | — | 当前受控排序状态 |
| `renderSortIcon` | `(order) => ReactNode` | — | 全局自定义排序图标，三态宽度应保持一致 |
| `refreshing` | `boolean` | — | 下拉刷新状态 |
| `onRefresh` | `() => void` | — | 下拉刷新回调 |
| `onEndReached` | `() => void` | — | 触底加载回调 |
| `onEndReachedThreshold` | `number` | — | FlashList 触底阈值 |
| `ListHeaderComponent` | `ComponentType \| ReactElement \| null` | — | 只跟随纵向滚动的页面级头部 |
| `ListFooterComponent` | `ComponentType \| ReactElement \| null` | — | 只跟随纵向滚动的页面级尾部 |
| `ListEmptyComponent` | `ComponentType \| ReactElement \| null` | — | `data` 为空时渲染 |
| `expandedRowType` | `'custom' \| 'sub-table'` | `'custom'` | 展开行模式 |
| `expandedRowStyle` | `StyleProp<ViewStyle>` | — | 展开区容器样式 |
| `renderExpandedRow` | `(record, index, columnWidths, subData?) => ReactNode` | — | 自定义展开内容 |
| `onExpandFetch` | `(record, index) => Promise<D>` | — | 展开时异步获取数据，按行 key 缓存 |
| `getSubTable` | `(record, index, subData) => SubTableSpec` | — | 将子数据转换为子表规格 |
| `isExpandedDataEmpty` | `(subData) => boolean` | 内置判空 | 自定义子数据判空 |
| `renderExpandedLoading` | `(columnWidths) => ReactNode` | 内置 Loading | 自定义加载面板 |
| `renderExpandedError` | `(error, retry, columnWidths) => ReactNode` | 内置可重试错误面板 | 自定义错误面板 |
| `renderExpandedEmpty` | `(columnWidths) => ReactNode` | 内置空面板 | 自定义空数据面板 |
| `subTableSyncScroll` | `boolean` | `true` | 子表与父表横向滚动联动 |
| `subTableSyncFixedColumns` | `boolean` | `true` | 子表同步父表固定列 |
| `style` | `StyleProp<ViewStyle>` | — | 最外层容器样式 |
| `headerStyle` | `StyleProp<ViewStyle>` | — | 表头行样式 |
| `headerTextStyle` | `StyleProp<TextStyle>` | — | 全局表头文字样式 |
| `rowStyle` | `StyleProp<ViewStyle>` | — | 数据行样式 |
| `cellStyle` | `StyleProp<ViewStyle>` | — | 全局单元格基础样式 |
| `cellTextStyle` | `StyleProp<TextStyle>` | — | 默认单元格文字样式 |
| `border` | `boolean \| DataTableBorder` | 横向分隔线 | 边框配置 |
| `theme` | `Partial<DataTableTheme>` | 内置主题 | 覆盖主题 token |

`T` 是父行数据类型，`D` 是 `onExpandFetch` 返回的子数据类型，默认为 `unknown`。

### `TableColumn<T>`

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | `string` | 默认表头标题 |
| `dataIndex` | `keyof T \| string` | 无 `render` 时用于读取单元格值 |
| `width` | `number` | 固定列宽，跳过内容测量和弹性分配 |
| `minWidth` | `number` | 自适应列的最小宽度 |
| `align` | `'left' \| 'center' \| 'right'` | 单元格和表头对齐，默认 `left` |
| `fixed` | `'left' \| 'right'` | 左/右固定列 |
| `sorter` | `boolean` | 启用表头排序交互 |
| `cellStyle` | `StyleProp<ViewStyle>` | 列样式，同时影响表头和数据单元格 |
| `renderCellStyle` | `(record, index) => StyleProp<ViewStyle>` | 数据单元格动态样式，优先级最高 |
| `render` | `(record, index) => ReactNode` | 自定义数据单元格 |
| `renderHeader` | `() => ReactNode` | 自定义表头内容，优先于 `title` |
| `headerCellStyle` | `StyleProp<ViewStyle>` | 仅表头单元格样式 |
| `headerTextStyle` | `StyleProp<TextStyle>` | 仅默认表头文字样式 |

样式优先级：

- 数据单元格：内置基础样式 → 全局 `cellStyle` → 列 `cellStyle` → `renderCellStyle`。
- 表头单元格：内置基础样式 → 全局 `cellStyle` → 列 `cellStyle` → `headerCellStyle`。
- 表头文字：内置文字样式 → 全局 `headerTextStyle` → 列 `headerTextStyle`。

### `RowSelectionConfig<T>`

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `selectedRowKeys` | `string[]` | 必填 | 当前选中 key |
| `onChange` | `(keys, rows) => void` | 必填 | 按 `data` 顺序返回 key 和行数据 |
| `getCheckboxProps` | `(record) => { disabled?: boolean }` | — | 按行禁用选择 |
| `position` | `'first' \| 'last'` | `'first'` | 独立选择列位置，自动归入对应固定列组 |
| `renderCheckbox` | `(selected, record) => ReactNode` | 内置 Checkbox | 自定义行选择框内容 |
| `renderHeaderCheckbox` | `({ checked, indeterminate, disabled }) => ReactNode` | 内置 Checkbox | 自定义全选/半选内容 |
| `mergeIntoDataIndex` | `string` | — | 将选择框合并进指定 `dataIndex` 列 |
| `checkboxAlign` | `'top' \| 'center' \| 'bottom'` | `'center'` | 合并模式的垂直对齐 |

### `SubColumn<S>` 与 `SubTableSpec<S>`

`SubColumn<S>`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `colIndex` | `number` | 对齐父表视觉列顺序的下标 |
| `colSpan` | `number` | 横跨父列数，默认 `1` |
| `dataIndex` | `keyof S \| string` | 无 `render` 时读取子行字段 |
| `align` | `'left' \| 'center' \| 'right'` | 默认继承对应父列 |
| `cellStyle` | `StyleProp<ViewStyle>` | 子列基础样式 |
| `renderCellStyle` | `(row, index) => StyleProp<ViewStyle>` | 子单元格动态样式 |
| `render` | `(row, index) => ReactNode` | 自定义子单元格 |

`SubTableSpec<S>`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `rows` | `S[]` | 子表行数据 |
| `columns` | `SubColumn<S>[]` | 子列配置 |
| `rowStyle` | `StyleProp<ViewStyle>` | 子表行样式 |
| `cellStyle` | `StyleProp<ViewStyle>` | 全局子单元格样式 |
| `cellTextStyle` | `StyleProp<TextStyle>` | 默认子单元格文字样式 |

### `DataTableBorder`

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `color` | `string` | `theme.line` | 边框颜色 |
| `width` | `number` | `StyleSheet.hairlineWidth` | 边框宽度 |
| `horizontal` | `boolean` | `true` | 行分隔线 |
| `vertical` | `boolean` | `false` | 列分隔线 |
| `outer` | `boolean` | `false` | 表格外边框 |

### 其他公开类型

`DataTableHandle`：

| 方法 | 说明 |
|---|---|
| `selectAll` | 全选所有未禁用行；已选中的禁用行保持不变 |
| `clearSelection` | 清空可选行；禁用行的已选状态保留 |
| `scrollToTop` | 纵向滚动回顶部；适用于筛选后数据变短导致滚动偏移越界的场景 |

`SortParams`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `dataIndex` | `string` | 排序列的 `dataIndex` |
| `order` | `'ascend' \| 'descend' \| null` | 目标排序方向；`null` 表示取消排序 |

## 公开导出

```ts
export { DataTable, DEFAULT_DATA_TABLE_THEME };
export type {
  DataTableBorder,
  DataTableHandle,
  DataTableProps,
  DataTableTheme,
  RowSelectionConfig,
  SortParams,
  SubColumn,
  SubTableSpec,
  TableColumn,
};
```

## 使用注意事项

- `keyExtractor` 必须返回全局唯一、稳定的字符串，不要使用可变数组下标。
- 未传 `height` / `maxHeight` 时，父容器必须有明确高度。
- 排序、行选择均为受控能力，组件不会自动排序 `data` 或持久化选中状态。
- 自定义 `render`、`renderHeader` 和 Checkbox 的各个状态应尽量保持稳定尺寸，避免列宽抖动。
- 自适应列会真实挂载内容进行离屏测量；高成本自定义单元格建议设置明确 `width` 或简化测量期渲染。
- `onEndReached` 在首次测量或原地重测期间会被暂时屏蔽，以避免重复翻页。
- 子表的 `colIndex` 是父表最终视觉列顺序，不一定等于原始 `columns` 下标。
- Web 端的固定列依赖 React Native Web 对 CSS `position: sticky` 的支持。

## License

MIT © bestcoder。标准许可证文本已包含在 npm 包的 `LICENSE` 文件中；版本变化参见 [CHANGELOG.md](./CHANGELOG.md)。
