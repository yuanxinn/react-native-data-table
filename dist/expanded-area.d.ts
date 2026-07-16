import React from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import type { ResolvedColumn } from './column-layout';
import { HScrollerController } from './h-scroller';
import type { SubTableSpec } from './types';
import type { SubStatus } from './use-expandable';
export interface ExpandedAreaProps<T> {
    item: T;
    index: number;
    itemKey: string;
    resolved: ResolvedColumn<T>[];
    columnWidths: number[];
    totalWidth: number;
    containerWidth: number;
    maxScroll: number;
    nativeScrollX: Animated.Value;
    registry: Set<HScrollerController>;
    offsetRef: React.RefObject<number>;
    activeRef: React.RefObject<HScrollerController | null>;
    cellBorderStyle?: StyleProp<ViewStyle>;
    rowBorderStyle?: StyleProp<ViewStyle>;
    expandedRowType: 'custom' | 'sub-table';
    expandedRowStyle?: StyleProp<ViewStyle>;
    renderExpandedRow?: (record: T, index: number, columnWidths: number[], subData?: unknown) => React.ReactNode;
    getSubTable?: (record: T, index: number, subData: unknown) => SubTableSpec;
    isExpandedDataEmpty?: (subData: unknown) => boolean;
    renderExpandedLoading?: (columnWidths: number[]) => React.ReactNode;
    renderExpandedError?: (error: unknown, retry: () => void, columnWidths: number[]) => React.ReactNode;
    renderExpandedEmpty?: (columnWidths: number[]) => React.ReactNode;
    subTableSyncScroll: boolean;
    subTableSyncFixedColumns: boolean;
    /** 本行异步状态（custom 模式或未配 fetch 时为 undefined，视作同步 done） */
    subStatus?: SubStatus;
    subData?: unknown;
    subError?: unknown;
    /** 子表列宽是否已测（门控：测完才上屏 live 子表） */
    subMeasured: boolean;
    onSubMeasured: (key: string, widths: Record<string, number>) => void;
    onRetryFetch: (key: string) => void;
}
/**
 * 展开区：custom 模式渲染固定详情面板（占满视口宽、横滑不动）；
 * sub-table 模式按取数状态渲染 loading / error / empty 固定面板或联动子表。
 * 仅在行展开时挂载，折叠即卸载（独立横滚状态随之重置）。
 */
export declare function ExpandedArea<T>({ item, index, itemKey, resolved, columnWidths, totalWidth, containerWidth, maxScroll, nativeScrollX, registry, offsetRef, activeRef, cellBorderStyle, rowBorderStyle, expandedRowType, expandedRowStyle, renderExpandedRow, getSubTable, isExpandedDataEmpty, renderExpandedLoading, renderExpandedError, renderExpandedEmpty, subTableSyncScroll, subTableSyncFixedColumns, subStatus, subData, subError, subMeasured, onSubMeasured, onRetryFetch, }: ExpandedAreaProps<T>): React.JSX.Element;
