# @bestcoder/react-native-data-table

[简体中文](./README.md) | English

[![npm version](https://img.shields.io/npm/v/%40bestcoder%2Freact-native-data-table.svg)](https://www.npmjs.com/package/@bestcoder/react-native-data-table)
[![license](https://img.shields.io/npm/l/%40bestcoder%2Freact-native-data-table.svg)](https://www.npmjs.com/package/@bestcoder/react-native-data-table)
[![npm downloads](https://img.shields.io/npm/dm/%40bestcoder%2Freact-native-data-table.svg)](https://www.npmjs.com/package/@bestcoder/react-native-data-table)

A high-performance, cross-platform data table for React Native, Expo, and React Native Web. Built on FlashList v2, it includes two-axis scrolling, fixed columns, adaptive column widths, row selection, controlled sorting, expandable rows, asynchronous sub-tables, themes, and configurable borders.

## Features

- FlashList v2 virtualization for large data sets.
- Vertical and horizontal scrolling with an optional sticky header.
- Left and right fixed columns through `fixed: 'left' | 'right'`.
- Adaptive column widths measured from rendered content, with `minWidth` and fixed-width columns.
- Controlled row selection, select-all and indeterminate states, disabled rows, custom checkboxes, and checkbox-column merging.
- Controlled three-state sorting: `null → ascend → descend → null`.
- Custom expandable panels or asynchronous linked sub-tables.
- Pull to refresh, infinite loading, empty states, and page-level header and footer content.
- Themes, striped rows, press highlighting, cell styles, and configurable grid borders.
- TypeScript declarations included in the package.

## Compatibility

| Environment | Supported version |
|---|---|
| Expo | SDK 57 |
| React Native | `>=0.86.0 <0.87` |
| React | `>=19.2.3 <20` |
| `@shopify/flash-list` | `>=2.0.0 <3` |
| Node.js | `>=22.13.0` |
| Platforms | iOS / Android / Web |

On the web, the host project must have React Native Web configured. Expo projects include this support by default.

## Installation

### Expo SDK 57

```bash
npx expo install @shopify/flash-list
npm install @bestcoder/react-native-data-table
```

### React Native

```bash
npm install @bestcoder/react-native-data-table @shopify/flash-list
```

This package contains no custom native module. Native requirements are determined by `@shopify/flash-list` and the host React Native project.

## Quick start

`DataTable` uses `flex: 1` by default. Its parent must have a resolvable height, or you can pass `height` or `maxHeight` directly.

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
  { title: 'Order', dataIndex: 'id', width: 110, fixed: 'left' },
  { title: 'Customer', dataIndex: 'customer', minWidth: 120 },
  { title: 'Amount', dataIndex: 'amount', align: 'right', sorter: true },
  { title: 'Status', dataIndex: 'status', minWidth: 100 },
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

## Core usage

### Controlled sorting

The component only reports the requested sort state; it **does not modify `data`**. Sort the data according to `currentSort`, then pass the result back to the table.

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

### Row selection

`rowSelection` is controlled. The selection column is omitted when this prop is not provided.

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

### Expandable rows

`custom` is the default expansion mode. Expanded content fills the current viewport width and does not move with the main table's horizontal scroll.

```tsx
<DataTable
  data={rows}
  columns={columns}
  keyExtractor={(item) => item.id}
  renderExpandedRow={(record) => (
    <View style={{ padding: 16 }}>
      <Text>Order: {record.id}</Text>
    </View>
  )}
/>
```

### Asynchronous sub-tables

In `sub-table` mode, `onExpandFetch` first loads the child data and `getSubTable` then maps it to a sub-table specification. A sub-table has no header, but can share horizontal scrolling, fixed columns, and final column widths with its parent.

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

- `SubColumn.colIndex` follows the parent table's **visual column order**, including the internal selection column and the reordered fixed-column groups.
- `colSpan` can span multiple parent columns.
- Loading, error, and empty panels have defaults and can all be customized.
- `subTableSyncScroll` and `subTableSyncFixedColumns` both default to `true`.

### Theme

`theme` accepts `Partial<DataTableTheme>` and is merged with the built-in theme. Override only the tokens you need.

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

| Token | Purpose |
|---|---|
| `headerBg` | Default background for the header, expanded area, and odd striped rows |
| `rowBg` | Default background for data rows, checkboxes, and even striped rows |
| `text` | Primary text |
| `textSecondary` | Secondary text, error text, and empty-state text |
| `primary` | Checkboxes, active sort state, and loading indicator |
| `primaryLight` | Default row press highlight |
| `onPrimary` | Checkmark and indeterminate mark on the primary color |
| `line` | Default border color |
| `disabled` | Disabled checkbox and inactive sort state |

You can also import `DEFAULT_DATA_TABLE_THEME` as a complete baseline.

### Borders

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

- Omitted `border`: enable the default horizontal separators only.
- `false`: disable all borders.
- `true`: enable the default horizontal separators.
- Object: combine `horizontal`, `vertical`, `outer`, `color`, and `width`.

## API

### `DataTableProps<T, D>`

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `T[]` | required | Source rows |
| `columns` | `TableColumn<T>[]` | required | Column definitions |
| `keyExtractor` | `(item, index) => string` | required | Returns a globally unique, stable row key |
| `remeasureKey` | `string \| number` | — | Remeasures adaptive columns in place when changed |
| `height` | `DimensionValue` | — | Fixed table height; takes precedence over `maxHeight` |
| `maxHeight` | `DimensionValue` | — | Maximum height inside a parent flex layout |
| `striped` | `boolean` | `false` | Enables striped rows |
| `stripeColors` | `[string, string]` | `[theme.rowBg, theme.headerBg]` | Even and odd row backgrounds |
| `highlightOnRowPress` | `boolean` | `false` | Highlights a row while pressed |
| `highlightColor` | `string` | `theme.primaryLight` | Row press highlight color |
| `rowSelection` | `RowSelectionConfig<T>` | — | Controlled row-selection configuration; toggling selection mode or changing the merged host column remeasures widths in place |
| `stickyHeader` | `boolean` | `true` | Enables the sticky header |
| `ref` | `Ref<DataTableHandle>` | — | Imperative `selectAll()` / `clearSelection()` / `scrollToTop()` handle |
| `onSort` | `(params: SortParams) => void` | — | Called when the requested sort state changes |
| `currentSort` | `SortParams` | — | Current controlled sort state |
| `renderSortIcon` | `(order) => ReactNode` | — | Globally customizes the sort icon; keep all three states the same width |
| `refreshing` | `boolean` | — | Pull-to-refresh state |
| `onRefresh` | `() => void` | — | Pull-to-refresh callback |
| `onEndReached` | `() => void` | — | End-reached callback |
| `onEndReachedThreshold` | `number` | — | FlashList end-reached threshold |
| `ListHeaderComponent` | `ComponentType \| ReactElement \| null` | — | Page header that follows vertical scrolling only |
| `ListFooterComponent` | `ComponentType \| ReactElement \| null` | — | Page footer that follows vertical scrolling only |
| `ListEmptyComponent` | `ComponentType \| ReactElement \| null` | — | Rendered when `data` is empty |
| `expandedRowType` | `'custom' \| 'sub-table'` | `'custom'` | Expanded-row mode |
| `expandedRowStyle` | `StyleProp<ViewStyle>` | — | Expanded-area container style |
| `renderExpandedRow` | `(record, index, columnWidths, subData?) => ReactNode` | — | Renders custom expanded content |
| `onExpandFetch` | `(record, index) => Promise<D>` | — | Loads expansion data and caches it by row key |
| `getSubTable` | `(record, index, subData) => SubTableSpec` | — | Converts child data to a sub-table specification |
| `isExpandedDataEmpty` | `(subData) => boolean` | built-in check | Custom child-data empty check |
| `renderExpandedLoading` | `(columnWidths) => ReactNode` | built-in panel | Custom loading panel |
| `renderExpandedError` | `(error, retry, columnWidths) => ReactNode` | retry panel | Custom error panel |
| `renderExpandedEmpty` | `(columnWidths) => ReactNode` | built-in panel | Custom empty panel |
| `subTableSyncScroll` | `boolean` | `true` | Synchronizes horizontal scrolling between parent and sub-table |
| `subTableSyncFixedColumns` | `boolean` | `true` | Synchronizes fixed columns between parent and sub-table |
| `style` | `StyleProp<ViewStyle>` | — | Outermost container style |
| `headerStyle` | `StyleProp<ViewStyle>` | — | Header-row style |
| `headerTextStyle` | `StyleProp<TextStyle>` | — | Global header text style |
| `rowStyle` | `StyleProp<ViewStyle>` | — | Data-row style |
| `cellStyle` | `StyleProp<ViewStyle>` | — | Global base cell style |
| `cellTextStyle` | `StyleProp<TextStyle>` | — | Default cell text style |
| `border` | `boolean \| DataTableBorder` | horizontal separators | Border configuration |
| `theme` | `Partial<DataTableTheme>` | built-in theme | Theme token overrides |

`T` is the parent-row type. `D` is the child-data type returned by `onExpandFetch` and defaults to `unknown`.

### `TableColumn<T>`

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Default header title |
| `dataIndex` | `keyof T \| string` | Reads the cell value when `render` is absent |
| `width` | `number` | Fixed width; skips content measurement and flexible distribution |
| `minWidth` | `number` | Minimum width for an adaptive column |
| `align` | `'left' \| 'center' \| 'right'` | Cell and header alignment; defaults to `left` |
| `fixed` | `'left' \| 'right'` | Fixes the column to the left or right |
| `sorter` | `boolean` | Enables header sorting interaction |
| `cellStyle` | `StyleProp<ViewStyle>` | Column style applied to header and data cells |
| `renderCellStyle` | `(record, index) => StyleProp<ViewStyle>` | Dynamic data-cell style with the highest priority |
| `render` | `(record, index) => ReactNode` | Renders a custom data cell |
| `renderHeader` | `() => ReactNode` | Renders custom header content instead of `title` |
| `headerCellStyle` | `StyleProp<ViewStyle>` | Header-cell-only style |
| `headerTextStyle` | `StyleProp<TextStyle>` | Default header-text-only style |

Style precedence:

- Data cell: built-in base → global `cellStyle` → column `cellStyle` → `renderCellStyle`.
- Header cell: built-in base → global `cellStyle` → column `cellStyle` → `headerCellStyle`.
- Header text: built-in text style → global `headerTextStyle` → column `headerTextStyle`.

### `RowSelectionConfig<T>`

| Field | Type | Default | Description |
|---|---|---|---|
| `selectedRowKeys` | `string[]` | required | Currently selected keys |
| `onChange` | `(keys, rows) => void` | required | Returns keys and rows in `data` order |
| `getCheckboxProps` | `(record) => { disabled?: boolean }` | — | Disables selection by row |
| `position` | `'first' \| 'last'` | `'first'` | Standalone selection-column position; joins the corresponding fixed group |
| `renderCheckbox` | `(selected, record) => ReactNode` | built-in checkbox | Renders custom row-checkbox content |
| `renderHeaderCheckbox` | `({ checked, indeterminate, disabled }) => ReactNode` | built-in checkbox | Renders custom select-all and indeterminate content |
| `mergeIntoDataIndex` | `string` | — | Merges the checkbox into the matching `dataIndex` column |
| `checkboxAlign` | `'top' \| 'center' \| 'bottom'` | `'center'` | Vertical alignment in merged mode |

### `SubColumn<S>` and `SubTableSpec<S>`

`SubColumn<S>`:

| Field | Type | Description |
|---|---|---|
| `colIndex` | `number` | Index in the parent table's visual column order |
| `colSpan` | `number` | Number of parent columns to span; defaults to `1` |
| `dataIndex` | `keyof S \| string` | Reads the child-row field when `render` is absent |
| `align` | `'left' \| 'center' \| 'right'` | Defaults to the matching parent column's alignment |
| `cellStyle` | `StyleProp<ViewStyle>` | Base child-column style |
| `renderCellStyle` | `(row, index) => StyleProp<ViewStyle>` | Dynamic child-cell style |
| `render` | `(row, index) => ReactNode` | Renders a custom child cell |

`SubTableSpec<S>`:

| Field | Type | Description |
|---|---|---|
| `rows` | `S[]` | Child rows |
| `columns` | `SubColumn<S>[]` | Child-column definitions |
| `rowStyle` | `StyleProp<ViewStyle>` | Child-row style |
| `cellStyle` | `StyleProp<ViewStyle>` | Global child-cell style |
| `cellTextStyle` | `StyleProp<TextStyle>` | Default child-cell text style |

### `DataTableBorder`

| Field | Type | Default | Description |
|---|---|---|---|
| `color` | `string` | `theme.line` | Border color |
| `width` | `number` | `StyleSheet.hairlineWidth` | Border width |
| `horizontal` | `boolean` | `true` | Row separators |
| `vertical` | `boolean` | `false` | Column separators |
| `outer` | `boolean` | `false` | Outer table border |

### Other public types

`DataTableHandle`:

| Method | Description |
|---|---|
| `selectAll` | Selects all enabled rows while preserving selected disabled rows |
| `clearSelection` | Clears enabled rows while preserving the selected state of disabled rows |
| `scrollToTop` | Scrolls vertically to the top; useful after filtering to a shorter data set |

`SortParams`:

| Field | Type | Description |
|---|---|---|
| `dataIndex` | `string` | `dataIndex` of the sort column |
| `order` | `'ascend' \| 'descend' \| null` | Requested direction; `null` clears sorting |

## Public exports

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

## Usage notes

- `keyExtractor` must return globally unique, stable strings. Do not use mutable array indexes.
- When neither `height` nor `maxHeight` is provided, the parent container must have an explicit height.
- Sorting and row selection are controlled. The component neither sorts `data` nor persists selection automatically.
- Keep all states of custom `render`, `renderHeader`, and checkbox content dimensionally stable to prevent column-width shifts.
- Adaptive columns mount real content for off-screen measurement. Give expensive custom cells an explicit `width` or simplify their measurement-time rendering.
- `onEndReached` is temporarily suppressed during initial measurement and in-place remeasurement to avoid duplicate pagination.
- A sub-table's `colIndex` uses the parent's final visual column order, which can differ from the original `columns` index.
- Fixed columns on the web depend on React Native Web support for CSS `position: sticky`.

## License

MIT © bestcoder. The full license text is included in [`LICENSE`](./LICENSE); release history is available in [`CHANGELOG.md`](./CHANGELOG.md).
