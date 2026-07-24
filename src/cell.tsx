import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import type { SubColumn, TableColumn } from './types';

/** 列既无 width、无 minWidth、又尚未测绘完成时的兜底宽度 */
export const DEFAULT_COLUMN_WIDTH = 100;

/** 排序箭头区占宽：真实表头与幽灵测绘必须使用同一值，否则 sorter 列测宽偏小导致换行 */
export const SORT_ICON_WIDTH = 16;

/** 列的稳定标识，用作测绘宽度缓存的 key */
export function columnKey<T>(col: TableColumn<T>, index: number): string {
  return `${String(col.dataIndex)}#${index}`;
}

/**
 * 合成单元格样式链，优先级从低到高：
 * 内置基础样式 → 全局 cellStyle → 列 cellStyle → renderCellStyle(record, index)。
 * 幽灵测绘区与真实单元格必须共用此函数，padding / 边框等宽度影响才会被测算在内。
 * 注意：返回值不含 width —— 真实单元格由外层追加最终列宽，幽灵区保持自然宽度。
 */
export function composeCellStyle<T>(opts: {
  col: TableColumn<T>;
  cellStyle?: StyleProp<ViewStyle>;
  /** 传入则应用 renderCellStyle（表头单元格不传） */
  record?: { item: T; index: number };
}): StyleProp<ViewStyle> {
  const { col, cellStyle, record } = opts;
  return [
    styles.cellBase,
    cellStyle,
    col.cellStyle,
    record && col.renderCellStyle
      ? col.renderCellStyle(record.item, record.index)
      : undefined,
  ];
}

/**
 * 合成表头单元格样式链，优先级从低到高：
 * 内置基础样式 → 全局 cellStyle → 列 cellStyle（与数据单元格共享）→ 列 headerCellStyle（表头独有）。
 * 与 composeCellStyle 并列，供真实表头与幽灵测绘共用，确保表头列宽测算一致。
 */
export function composeHeaderCellStyle<T>(opts: {
  col: TableColumn<T>;
  cellStyle?: StyleProp<ViewStyle>;
}): StyleProp<ViewStyle> {
  const { col, cellStyle } = opts;
  return [styles.cellBase, cellStyle, col.cellStyle, col.headerCellStyle];
}

/**
 * 渲染单元格内容：优先走列的自定义 render，否则按 dataIndex 取值渲染为文本。
 * 注意：不使用 numberOfLines 截断，宽度由幽灵测绘保证。
 */
export function renderCellContent<T>(
  col: TableColumn<T>,
  record: T,
  index: number,
  textColor: string,
  cellTextStyle?: StyleProp<TextStyle>,
): React.ReactNode {
  if (col.render) {
    return col.render(record, index);
  }
  const value = (record as Record<string, unknown>)[col.dataIndex as string];
  return (
    <Text style={[styles.cellText, { color: textColor }, cellTextStyle]}>
      {value == null ? '' : String(value)}
    </Text>
  );
}

/**
 * 渲染表头单元格内容：优先走列的自定义 renderHeader，否则默认标题文本。
 * 真实表头与幽灵测绘共用此函数，保证自定义表头的测算宽度与实际渲染一致。
 * 文字样式链：headerTextBase → 全局 headerTextStyle → 列 headerTextStyle（仅默认文本渲染时生效）。
 */
export function renderHeaderContent<T>(
  col: TableColumn<T>,
  textColor: string,
  headerTextStyle?: StyleProp<TextStyle>,
): React.ReactNode {
  if (col.renderHeader) {
    return col.renderHeader();
  }
  return (
    <Text style={[headerTextBase, { color: textColor }, headerTextStyle, col.headerTextStyle]}>
      {col.title}
    </Text>
  );
}

/**
 * 子表单元格样式链，优先级从低到高：
 * 内置基础样式 → 子表全局 cellStyle → 子列 cellStyle → renderCellStyle(row, index)。
 * 与父表 composeCellStyle 对称，供子表真实单元格与子测量区共用。
 */
export function composeSubCellStyle<S>(opts: {
  col: SubColumn<S>;
  cellStyle?: StyleProp<ViewStyle>;
  row?: { item: S; index: number };
}): StyleProp<ViewStyle> {
  const { col, cellStyle, row } = opts;
  return [
    styles.cellBase,
    cellStyle,
    col.cellStyle,
    row && col.renderCellStyle ? col.renderCellStyle(row.item, row.index) : undefined,
  ];
}

/** 渲染子表单元格内容：优先 render，否则按 dataIndex 取值渲染文本 */
export function renderSubCellContent<S>(
  col: SubColumn<S>,
  row: S,
  index: number,
  textColor: string,
  cellTextStyle?: StyleProp<TextStyle>,
): React.ReactNode {
  if (col.render) {
    return col.render(row, index);
  }
  if (col.dataIndex == null) return null;
  const value = (row as Record<string, unknown>)[col.dataIndex as string];
  return (
    <Text style={[styles.cellText, { color: textColor }, cellTextStyle]}>
      {value == null ? '' : String(value)}
    </Text>
  );
}

const selectionAlignMap = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
} as const;

/**
 * 合并模式下选择框与原内容的组合渲染：[选择框][原内容] 横向排布。
 * 供行单元格、表头单元格、幽灵测绘三处共用——checkbox 一并进入测宽，列宽不会被挤爆。
 */
export function renderSelectionCell({
  checkbox,
  content,
  align = 'center',
}: {
  checkbox: React.ReactNode;
  content: React.ReactNode;
  align?: 'top' | 'center' | 'bottom';
}): React.ReactNode {
  return (
    <View style={[styles.selectionMergeRow, { alignItems: selectionAlignMap[align] }]}>
      {checkbox}
      <View style={styles.selectionMergeContent}>{content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  cellBase: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  // 文字颜色由调用方经 textColor 注入（主题解耦），此处只定尺寸/字重
  cellText: {
    fontSize: 14,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectionMergeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectionMergeContent: {
    flexShrink: 1,
  },
});

/** 表头文字基础样式：真实表头与幽灵测绘必须共用同一份，否则字号/字重不一致导致测宽偏差 */
export const headerTextBase = styles.headerText;
