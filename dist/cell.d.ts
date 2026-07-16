import React from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { SubColumn, TableColumn } from './types';
/** 列既无 width、无 minWidth、又尚未测绘完成时的兜底宽度 */
export declare const DEFAULT_COLUMN_WIDTH = 100;
/** 排序箭头区占宽：真实表头与幽灵测绘必须使用同一值，否则 sorter 列测宽偏小导致换行 */
export declare const SORT_ICON_WIDTH = 16;
/** 列的稳定标识，用作测绘宽度缓存的 key */
export declare function columnKey<T>(col: TableColumn<T>, index: number): string;
/**
 * 合成单元格样式链，优先级从低到高：
 * 内置基础样式 → 全局 cellStyle → 列 cellStyle → renderCellStyle(record, index)。
 * 幽灵测绘区与真实单元格必须共用此函数，padding / 边框等宽度影响才会被测算在内。
 * 注意：返回值不含 width —— 真实单元格由外层追加最终列宽，幽灵区保持自然宽度。
 */
export declare function composeCellStyle<T>(opts: {
    col: TableColumn<T>;
    cellStyle?: StyleProp<ViewStyle>;
    /** 传入则应用 renderCellStyle（表头单元格不传） */
    record?: {
        item: T;
        index: number;
    };
}): StyleProp<ViewStyle>;
/**
 * 合成表头单元格样式链，优先级从低到高：
 * 内置基础样式 → 全局 cellStyle → 列 cellStyle（与数据单元格共享）→ 列 headerCellStyle（表头独有）。
 * 与 composeCellStyle 并列，供真实表头与幽灵测绘共用，确保表头列宽测算一致。
 */
export declare function composeHeaderCellStyle<T>(opts: {
    col: TableColumn<T>;
    cellStyle?: StyleProp<ViewStyle>;
}): StyleProp<ViewStyle>;
/**
 * 渲染单元格内容：优先走列的自定义 render，否则按 dataIndex 取值渲染为文本。
 * 注意：不使用 numberOfLines 截断，宽度由幽灵测绘保证。
 */
export declare function renderCellContent<T>(col: TableColumn<T>, record: T, index: number, textColor: string, cellTextStyle?: StyleProp<TextStyle>): React.ReactNode;
/**
 * 渲染表头单元格内容：优先走列的自定义 renderHeader，否则默认标题文本。
 * 真实表头与幽灵测绘共用此函数，保证自定义表头的测算宽度与实际渲染一致。
 * 文字样式链：headerTextBase → 全局 headerTextStyle → 列 headerTextStyle（仅默认文本渲染时生效）。
 */
export declare function renderHeaderContent<T>(col: TableColumn<T>, textColor: string, headerTextStyle?: StyleProp<TextStyle>): React.ReactNode;
/**
 * 子表单元格样式链，优先级从低到高：
 * 内置基础样式 → 子表全局 cellStyle → 子列 cellStyle → renderCellStyle(row, index)。
 * 与父表 composeCellStyle 对称，供子表真实单元格与子测量区共用。
 */
export declare function composeSubCellStyle<S>(opts: {
    col: SubColumn<S>;
    cellStyle?: StyleProp<ViewStyle>;
    row?: {
        item: S;
        index: number;
    };
}): StyleProp<ViewStyle>;
/** 渲染子表单元格内容：优先 render，否则按 dataIndex 取值渲染文本 */
export declare function renderSubCellContent<S>(col: SubColumn<S>, row: S, index: number, textColor: string, cellTextStyle?: StyleProp<TextStyle>): React.ReactNode;
/**
 * 合并模式下选择框与原内容的组合渲染：[选择框][原内容] 横向排布。
 * 供行单元格、表头单元格、幽灵测绘三处共用——checkbox 一并进入测宽，列宽不会被挤爆。
 */
export declare function renderSelectionCell({ checkbox, content, align, }: {
    checkbox: React.ReactNode;
    content: React.ReactNode;
    align?: 'top' | 'center' | 'bottom';
}): React.ReactNode;
/** 表头文字基础样式：真实表头与幽灵测绘必须共用同一份，否则字号/字重不一致导致测宽偏差 */
export declare const headerTextBase: {
    fontSize: number;
    fontWeight: "600";
};
