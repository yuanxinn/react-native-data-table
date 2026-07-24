import React, { useMemo } from 'react';
import { Animated, StyleProp, View, ViewStyle } from 'react-native';

import { composeSubCellStyle, renderSubCellContent } from './cell';
import { CellBox } from './cell-box';
import type { ResolvedColumn } from './column-layout';
import { measureStyles, useMeasure } from './measure';
import { useDataTableTheme } from './theme';
import type { SubColumn, SubTableSpec } from './types';

/** 取某个父列位置起 span 个列宽之和（colSpan 用） */
function spanWidth<T>(resolved: ResolvedColumn<T>[], start: number, span: number): number {
  let w = 0;
  for (let i = start; i < start + span && i < resolved.length; i += 1) w += resolved[i].width;
  return w;
}

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
function SubTableInner<T>({
  spec,
  resolved,
  totalWidth,
  scrollX,
  maxScroll,
  syncFixedColumns,
  fixedBg,
  cellBorderStyle,
  rowBorderStyle,
}: SubTableProps<T>) {
  const theme = useDataTableTheme();
  // 子列按 colIndex 建表，避免每行每列线性查找；重复 colIndex 以先声明者为准（与 find 语义一致）
  const colByIndex = useMemo(() => {
    const m = new Map<number, SubColumn<unknown>>();
    spec.columns.forEach((c) => {
      if (!m.has(c.colIndex)) m.set(c.colIndex, c as SubColumn<unknown>);
    });
    return m;
  }, [spec.columns]);
  const renderRow = (row: unknown, rowIndex: number) => {
    const cells: React.ReactNode[] = [];
    let i = 0;
    while (i < resolved.length) {
      const subCol = colByIndex.get(i);
      const span = subCol ? Math.max(1, subCol.colSpan ?? 1) : 1;
      const base = resolved[i];
      // 合成一个供 CellBox 使用的解析列：宽度取 span 之和、对齐可被子列覆盖、固定可被开关剥离
      const rc: ResolvedColumn<T> = {
        ...base,
        width: span > 1 ? spanWidth(resolved, i, span) : base.width,
        fixed: syncFixedColumns ? base.fixed : undefined,
        col: { ...base.col, align: subCol?.align ?? base.col.align },
      };
      const effectiveCol: SubColumn<unknown> = subCol ?? { colIndex: i };
      cells.push(
        <CellBox
          key={i}
          rc={rc}
          scrollX={scrollX}
          maxScroll={maxScroll}
          fixedBgColor={fixedBg}
          cellBorderStyle={cellBorderStyle}
          contentStyle={composeSubCellStyle({
            col: effectiveCol,
            cellStyle: spec.cellStyle,
            row: { item: row, index: rowIndex },
          })}
        >
          {subCol
            ? renderSubCellContent(effectiveCol, row, rowIndex, theme.text, spec.cellTextStyle)
            : null}
        </CellBox>,
      );
      i += span;
    }
    return (
      <View
        key={rowIndex}
        style={[{ width: totalWidth, flexDirection: 'row' }, rowBorderStyle, spec.rowStyle]}
      >
        {cells}
      </View>
    );
  };

  return <View style={{ width: totalWidth }}>{spec.rows.map(renderRow)}</View>;
}

export const SubTable = SubTableInner as typeof SubTableInner;

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
function SubTableMeasurerInner<T>({
  spec,
  resolved,
  cellStyle,
  cellBorderStyle,
  onMeasured,
}: SubTableMeasurerProps<T>) {
  const theme = useDataTableTheme();
  // 仅测 colSpan=1 且父列为自适应（width==null）的子列
  const targets = spec.columns.filter(
    (c) => (c.colSpan ?? 1) === 1 && resolved[c.colIndex]?.col.width == null,
  );
  const expected = targets.length * spec.rows.length;
  const collect = useMeasure(expected, onMeasured);

  return (
    <View style={measureStyles.ghost} pointerEvents="none">
      {targets.map((subCol) => {
        const base = resolved[subCol.colIndex];
        const colKey = base.key;
        return (
          <View key={colKey} style={measureStyles.columnStack}>
            {spec.rows.map((row, ri) => (
              <View
                key={ri}
                style={[
                  composeSubCellStyle({
                    col: subCol as SubColumn<unknown>,
                    cellStyle,
                    row: { item: row, index: ri },
                  }),
                  cellBorderStyle,
                ]}
                onLayout={(e) => collect(colKey, `${colKey}:${ri}`, e)}
              >
                {renderSubCellContent(subCol as SubColumn<unknown>, row, ri, theme.text, spec.cellTextStyle)}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

export const SubTableMeasurer = SubTableMeasurerInner as typeof SubTableMeasurerInner;
