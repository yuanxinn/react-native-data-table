import React from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import type { ResolvedColumn } from './column-layout';
import type { SubTableSpec } from './types';
interface SubTableProps<T> {
    spec: SubTableSpec;
    /** 父表解析后的列（提供宽度 / 固定 / align / 缓存 key） */
    resolved: ResolvedColumn<T>[];
    totalWidth: number;
    scrollX: Animated.Value;
    maxScroll: number;
    /** 是否同步父表固定列钉住 */
    syncFixedColumns: boolean;
    /** 固定子格底色（覆盖滑动格不露馅），取展开区底色 */
    fixedBg?: string;
    /** 列分隔竖线（border.vertical） */
    cellBorderStyle?: StyleProp<ViewStyle>;
    /** 子行底横线（border.horizontal） */
    rowBorderStyle?: StyleProp<ViewStyle>;
}
/**
 * 子表实体渲染：按父表「视觉列序」铺子行——命中的子列走 CellBox（复用父列宽/固定钉住），
 * 未定义的父列填等宽空占位保持对齐。字段/结构与父表独立，逐格 render / 样式可自定义。
 */
declare function SubTableInner<T>({ spec, resolved, totalWidth, scrollX, maxScroll, syncFixedColumns, fixedBg, cellBorderStyle, rowBorderStyle, }: SubTableProps<T>): React.JSX.Element;
export declare const SubTable: typeof SubTableInner;
interface SubTableMeasurerProps<T> {
    spec: SubTableSpec;
    resolved: ResolvedColumn<T>[];
    cellStyle?: StyleProp<ViewStyle>;
    cellBorderStyle?: StyleProp<ViewStyle>;
    /** 测完回调，widths 键为父列缓存 key（并入父表 measuredWidths 撑宽自适应列） */
    onMeasured: (widths: Record<string, number>) => void;
}
/**
 * 子表离屏测量：把子格内容按自然宽度渲染在离屏区，onLayout 收集，
 * 并入父表 measuredWidths（取 max）撑宽对应自适应列。仅测 colSpan=1 且父列为自适应（width==null）的子列。
 */
declare function SubTableMeasurerInner<T>({ spec, resolved, cellStyle, cellBorderStyle, onMeasured, }: SubTableMeasurerProps<T>): React.JSX.Element;
export declare const SubTableMeasurer: typeof SubTableMeasurerInner;
export {};
