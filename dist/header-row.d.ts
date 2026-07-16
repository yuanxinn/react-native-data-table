import React from 'react';
import { Animated, StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { ResolvedColumn } from './column-layout';
import { HScrollerController } from './h-scroller';
import type { RowSelectionConfig, SortParams } from './types';
interface HeaderRowProps<T> {
    resolved: ResolvedColumn<T>[];
    totalWidth: number;
    maxScroll: number;
    nativeScrollX: Animated.Value;
    registry: Set<HScrollerController>;
    offsetRef: React.RefObject<number>;
    activeRef: React.RefObject<HScrollerController | null>;
    headerStyle?: StyleProp<ViewStyle>;
    headerTextStyle?: StyleProp<TextStyle>;
    cellStyle?: StyleProp<ViewStyle>;
    cellBorderStyle?: StyleProp<ViewStyle>;
    rowBorderStyle?: StyleProp<ViewStyle>;
    currentSort?: SortParams;
    onSortPress: (dataIndex: string) => void;
    /** 自定义排序图标（全局，见 DataTableProps.renderSortIcon） */
    renderSortIcon?: (order: 'ascend' | 'descend' | null) => React.ReactNode;
    /** 全选 Checkbox 状态（无行选择时列表中不存在选择列，这些值不被读取） */
    allChecked: boolean;
    someChecked: boolean;
    selectionDisabled: boolean;
    onToggleAll: () => void;
    /** 自定义表头全选框 / 合并对齐（来自 rowSelection） */
    renderHeaderCheckbox?: RowSelectionConfig<T>['renderHeaderCheckbox'];
    checkboxAlign?: 'top' | 'center' | 'bottom';
}
declare const HeaderRowInner: <T>({ resolved, totalWidth, maxScroll, nativeScrollX, registry, offsetRef, activeRef, headerStyle, headerTextStyle, cellStyle, cellBorderStyle, rowBorderStyle, currentSort, onSortPress, renderSortIcon, allChecked, someChecked, selectionDisabled, onToggleAll, renderHeaderCheckbox, checkboxAlign, }: HeaderRowProps<T>) => React.JSX.Element;
export declare const HeaderRow: typeof HeaderRowInner;
export {};
