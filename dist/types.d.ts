import React from 'react';
import { DimensionValue, StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { DataTableTheme } from './theme';
export interface TableColumn<T> {
    title: string;
    dataIndex: keyof T | string;
    width?: number;
    minWidth?: number;
    align?: 'left' | 'center' | 'right';
    fixed?: 'left' | 'right';
    /** 该列可点击排序：表头展示排序箭头，点击触发 onSort 回调（组件自身不排序数据） */
    sorter?: boolean;
    /** 单列自定义单元格样式（如固定 padding），优先级高于全局 cellStyle；同时作用于表头与数据单元格 */
    cellStyle?: StyleProp<ViewStyle>;
    /** 根据数据内容动态返回一个样式对象（如背景色、边框）。优先级最高（仅数据单元格） */
    renderCellStyle?: (record: T, index: number) => StyleProp<ViewStyle>;
    /** 必须支持极其复杂的自定义渲染 */
    render?: (record: T, index: number) => React.ReactNode;
    /** 自定义表头单元格内容（优先于 title 文本渲染）；同样参与幽灵测宽 */
    renderHeader?: () => React.ReactNode;
    /** 表头单元格独立样式（不影响该列数据单元格），优先级高于 col.cellStyle */
    headerCellStyle?: StyleProp<ViewStyle>;
    /** 列级表头文字样式（覆盖全局 headerTextStyle），仅作用于默认标题文本渲染 */
    headerTextStyle?: StyleProp<TextStyle>;
}
export interface RowSelectionConfig<T> {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
    getCheckboxProps?: (record: T) => {
        disabled?: boolean;
    };
    /**
     * 不合并时选择列位置：'first' 自动归入最左固定列流、'last' 归入最右固定列流，默认 'first'。
     * 设置 mergeIntoDataIndex 后本项被忽略。
     */
    position?: 'first' | 'last';
    /** 自定义行选择框 UI（纯展示，按压由组件包裹处理）。选中/未选两态宽度须一致，否则列宽抖动 */
    renderCheckbox?: (selected: boolean, record: T) => React.ReactNode;
    /** 自定义表头全选框 UI（与行级 renderCheckbox 对称，含半选态）。纯展示，按压由组件处理 */
    renderHeaderCheckbox?: (state: {
        checked: boolean;
        indeterminate: boolean;
        disabled: boolean;
    }) => React.ReactNode;
    /** 将选择框合并进指定 dataIndex 的现有列，而非独立建列；设置后忽略 position */
    mergeIntoDataIndex?: string;
    /** 合并模式下选择框在单元格内的垂直对齐，默认 'center' */
    checkboxAlign?: 'top' | 'center' | 'bottom';
}
/** 组件对外暴露的命令式方法（通过 ref 调用） */
export interface DataTableHandle {
    /** 全选所有未禁用行（已选中的禁用行保持原状） */
    selectAll: () => void;
    /** 清空可选行的选中（禁用行的已选状态保留） */
    clearSelection: () => void;
}
export interface SortParams {
    dataIndex: string;
    order: 'ascend' | 'descend' | null;
}
/**
 * 子表列定义：字段/结构与父表完全独立，靠 colIndex 对齐到父表「视觉列序」的某列，
 * 复用其最终列宽与固定钉住。渲染/样式能力与父表 TableColumn 对齐。
 */
export interface SubColumn<S> {
    /** 对齐到父表视觉列序的第几列（含内部注入的选择列 / 固定列归位后的顺序） */
    colIndex: number;
    /** 跨列（默认 1），宽度取 colIndex..colIndex+colSpan-1 的父列宽之和 */
    colSpan?: number;
    /** 取值字段；无 render 时按此字段渲染文本 */
    dataIndex?: keyof S | string;
    /** 对齐，默认继承父列 align */
    align?: 'left' | 'center' | 'right';
    /** 列级子单元格样式 */
    cellStyle?: StyleProp<ViewStyle>;
    /** 按子行数据动态返回样式（优先级最高） */
    renderCellStyle?: (row: S, index: number) => StyleProp<ViewStyle>;
    /** 单元格内容完全自定义（参数为子行数据与下标） */
    render?: (row: S, index: number) => React.ReactNode;
}
/** 子表规格：由 fetch 到的数据产出，行数据与列定义均与父表独立 */
export interface SubTableSpec<S = any> {
    /** 子表行数据 */
    rows: S[];
    /** 子表列定义（可稀疏，只定义关心的列，其余父列自动填等宽空占位保持对齐） */
    columns: SubColumn<S>[];
    /** 子行样式 */
    rowStyle?: StyleProp<ViewStyle>;
    /** 全局子单元格样式 */
    cellStyle?: StyleProp<ViewStyle>;
    /** 全局子单元格默认文字样式（fontSize/color 等）；仅作用于未走子列 render 的默认文本 */
    cellTextStyle?: StyleProp<TextStyle>;
}
/**
 * 边框配置。省略 = 仅横向行分隔线（当前默认行为）；false = 全关；true = 开启默认横线；
 * 对象 = 三类线独立开关，共用 color / width。
 */
export interface DataTableBorder {
    /** 线色，默认取主题 theme.line */
    color?: string;
    /** 线宽 px，默认 StyleSheet.hairlineWidth */
    width?: number;
    /** 行分隔线（行间 + 表头/表体分隔），默认 true */
    horizontal?: boolean;
    /** 列分隔线（单元格竖线，参与幽灵测宽），默认 false */
    vertical?: boolean;
    /** 表格外边框，默认 false */
    outer?: boolean;
}
export interface DataTableProps<T, D = unknown> {
    data: T[];
    columns: TableColumn<T>[];
    keyExtractor: (item: T, index: number) => string;
    /**
     * 重测信号：值变化时对当前数据整体重新幽灵测绘并替换列宽。
     * 原地进行——行不下屏、纵向滚动位置不变；典型用法是传入全局字体缩放倍率，
     * 字体设置变化后列宽自动跟随（组件只提供触发机制，何时触发由调用方决定）。
     */
    remeasureKey?: string | number;
    /** 固定整体高度。设置后优先于 maxHeight / flex 撑高 */
    height?: DimensionValue;
    /** 最大高度：在父 flex 布局内自然撑高但不超过此值 */
    maxHeight?: DimensionValue;
    /** 斑马纹开关 */
    striped?: boolean;
    /** 自定义斑马纹交替背景色（偶数行、奇数行），默认 ['#ffffff', '#f8f8f8'] */
    stripeColors?: [string, string];
    /** 行按压时是否高亮 */
    highlightOnRowPress?: boolean;
    /** 自定义行按压高亮色 */
    highlightColor?: string;
    /** 行选择配置；不传则不渲染选择列 */
    rowSelection?: RowSelectionConfig<T>;
    /** 表头是否吸顶，默认 true；false 时表头随内容纵向滚走（横向仍与行同步） */
    stickyHeader?: boolean;
    /** 命令式方法句柄（selectAll / clearSelection） */
    ref?: React.Ref<DataTableHandle>;
    /** 表头排序点击回调（组件不排序数据，由调用方处理后回传排好序的 data） */
    onSort?: (params: SortParams) => void;
    /** 当前排序状态（受控），驱动表头箭头 UI 与下一次点击的轮转 */
    currentSort?: SortParams;
    /**
     * 自定义排序图标（全局，所有 sorter 列共用）；不传用内置 ▲▼（按 theme.primary/disabled 上色）。
     * order 为该列当前排序态。注意：三态图标宽度须一致，否则切换排序时列宽抖动/换行。
     */
    renderSortIcon?: (order: 'ascend' | 'descend' | null) => React.ReactNode;
    refreshing?: boolean;
    onRefresh?: () => void;
    onEndReached?: () => void;
    onEndReachedThreshold?: number;
    /** 页面级头部：只随表格纵向滚动，不随横向滚动 */
    ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
    /** 页面级尾部（如底部 Loading）：只随表格纵向滚动，不随横向滚动 */
    ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
    /** 展开模式：'custom' 固定详情面板（默认）；'sub-table' 异步联动子表 */
    expandedRowType?: 'custom' | 'sub-table';
    /** 展开区容器样式 */
    expandedRowStyle?: StyleProp<ViewStyle>;
    /**
     * custom 模式：自定义详情面板内容，占满视口宽、横滑固定不动。
     * 第三参 columnWidths 为父表最终列宽像素数组（视觉顺序，和为 totalWidth）；
     * 第四参 subData 为 onExpandFetch 的返回（未配置时为 undefined）。
     */
    renderExpandedRow?: (record: T, index: number, columnWidths: number[], subData?: D) => React.ReactNode;
    /** 展开时异步获取子表数据；返回值作为 getSubTable / renderExpandedRow 的 subData，按行 key 缓存 */
    onExpandFetch?: (record: T, index: number) => Promise<D>;
    /** sub-table 模式：由子数据产出子表规格（行数据 + 列定义） */
    getSubTable?: (record: T, index: number, subData: D) => SubTableSpec;
    /** 判空：返回 true 时展示空态面板。默认：null/undefined 或空数组视为空 */
    isExpandedDataEmpty?: (subData: D) => boolean;
    /** 加载中面板，默认居中转圈（固定面板，占满视口宽） */
    renderExpandedLoading?: (columnWidths: number[]) => React.ReactNode;
    /** 加载失败面板，默认「加载失败，点击重试」（固定面板） */
    renderExpandedError?: (error: unknown, retry: () => void, columnWidths: number[]) => React.ReactNode;
    /** 空数据面板，默认「暂无数据」（固定面板） */
    renderExpandedEmpty?: (columnWidths: number[]) => React.ReactNode;
    /** sub-table：子表横滚是否与父表联动，默认 true；false=子表独立横滚 */
    subTableSyncScroll?: boolean;
    /** sub-table：子表是否同步父表固定列钉住，默认 true；false=子表列不钉、随内容滑 */
    subTableSyncFixedColumns?: boolean;
    style?: StyleProp<ViewStyle>;
    headerStyle?: StyleProp<ViewStyle>;
    headerTextStyle?: StyleProp<TextStyle>;
    rowStyle?: StyleProp<ViewStyle>;
    /** 全局单元格基础样式（可统一设置 padding），可被列级 cellStyle / renderCellStyle 覆盖 */
    cellStyle?: StyleProp<ViewStyle>;
    /** 全局单元格默认文字样式（fontSize/color 等），仅作用于未走 col.render 的默认文本；与 headerTextStyle 对称 */
    cellTextStyle?: StyleProp<TextStyle>;
    /** 边框配置：boolean 或对象，见 DataTableBorder。省略=仅横向行分隔线 */
    border?: boolean | DataTableBorder;
    /** 主题色注入（Partial，与 DEFAULT_DATA_TABLE_THEME 深合并，只覆盖传入的键）；不传用内置默认 */
    theme?: Partial<DataTableTheme>;
    ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}
