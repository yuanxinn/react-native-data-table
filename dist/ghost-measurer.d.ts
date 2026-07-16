import React from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { RowSelectionConfig, TableColumn } from './types';
export interface GhostEntry<T> {
    item: T;
    index: number;
    key: string;
}
/** 合并模式测宽信息：宿主列的选择框须一并进入测算，否则列宽被挤爆导致换行 */
export interface GhostSelection<T> {
    mergeIntoDataIndex: string;
    renderCheckbox?: RowSelectionConfig<T>['renderCheckbox'];
    renderHeaderCheckbox?: RowSelectionConfig<T>['renderHeaderCheckbox'];
    checkboxAlign?: 'top' | 'center' | 'bottom';
}
interface GhostMeasurerProps<T> {
    /** 待测绘的增量数据批次 */
    entries: GhostEntry<T>[];
    /** 仅需自适应测绘的列（未配置 width 的列），附带列缓存 key */
    columns: {
        col: TableColumn<T>;
        key: string;
    }[];
    headerTextStyle?: StyleProp<TextStyle>;
    /** 全局单元格样式，必须与真实单元格同链合成，padding/边框才会计入测宽 */
    cellStyle?: StyleProp<ViewStyle>;
    /** 合并模式下的选择框测宽信息（宿主列带框测量） */
    selection?: GhostSelection<T> | null;
    /** 列分隔竖线样式（border.vertical），须与真实单元格一致计入测宽 */
    cellBorderStyle?: StyleProp<ViewStyle>;
    /** 全局单元格默认文字样式，须与真实单元格一致（fontSize 影响测宽） */
    cellTextStyle?: StyleProp<TextStyle>;
    /** 自定义排序图标；sorter 列用其 null 态真实宽度测宽（替代固定占位），避免换宽图标后换行 */
    renderSortIcon?: (order: 'ascend' | 'descend' | null) => React.ReactNode;
    /** 本批次全部测绘完成后回调，widths 为每列本批次的最大像素宽度 */
    onMeasured: (widths: Record<string, number>) => void;
}
/**
 * 幽灵测绘区：肉眼不可见的离屏容器，真实挂载增量数据的单元格，
 * 通过 onLayout 收集各列的真实渲染宽度（含 cellStyle / renderCellStyle
 * 引入的 padding、边框等宽度影响，及合并模式的选择框宽度）。父组件用批次签名作
 * React key，换批次时整体重挂载，内部无需处理复用状态。
 */
export declare function GhostMeasurer<T>({ entries, columns, headerTextStyle, cellStyle, selection, cellBorderStyle, cellTextStyle, renderSortIcon, onMeasured, }: GhostMeasurerProps<T>): React.JSX.Element;
export {};
