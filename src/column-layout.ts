import { columnKey, DEFAULT_COLUMN_WIDTH } from './cell';
import type { TableColumn } from './types';

/** 行选择列的内部标识与固定宽度（定宽列不参与幽灵测绘与弹性分配） */
export const SELECTION_KEY = '__DATA_TABLE_SELECTION__';
export const SELECTION_COLUMN_WIDTH = 48;

export interface ResolvedColumn<T> {
  col: TableColumn<T>;
  key: string;
  width: number;
  /** 左固定列在表格中的横向偏移（Web 端 sticky left 用） */
  left: number;
  /** 右固定列距表格右缘的偏移（Web 端 sticky right 用） */
  right: number;
  fixed?: 'left' | 'right';
  /** 独立注入的行选择 Checkbox 列 */
  isSelection: boolean;
  /** 合并宿主列：在原内容基础上组合渲染选择框 */
  mergesSelection: boolean;
}

/** 行选择在列布局中的诉求；null 表示未开启（或 visible=false 隐藏） */
export interface SelectionLayout {
  position: 'first' | 'last';
  mergeIntoDataIndex?: string;
}

/** 固定列归位：左固定连续在最前、右固定连续在最后，各组内保持声明顺序 */
function reorderFixed<T>(cols: TableColumn<T>[]): TableColumn<T>[] {
  const lefts = cols.filter((c) => c.fixed === 'left');
  const mids = cols.filter((c) => c.fixed !== 'left' && c.fixed !== 'right');
  const rights = cols.filter((c) => c.fixed === 'right');
  return [...lefts, ...mids, ...rights];
}

/**
 * 列装配：按行选择诉求注入/合并选择框，并把左固定归位最前、右固定归位最后。
 * - 独立选择列：按 position 注入并自动打 fixed（'first'→left、'last'→right），归入对应固定流；
 * - 合并模式：不注入新列，返回的 mergeIntoDataIndex 标记宿主列（由 resolveColumnLayout 落到 ResolvedColumn）；
 *   宿主 dataIndex 不存在时 __DEV__ 告警并回退为独立选择列。
 */
export function mergeColumns<T>(
  columns: TableColumn<T>[],
  selection: SelectionLayout | null,
): { columns: TableColumn<T>[]; mergeIntoDataIndex: string | null } {
  if (!selection) {
    return { columns: reorderFixed(columns), mergeIntoDataIndex: null };
  }

  const { position, mergeIntoDataIndex } = selection;

  if (mergeIntoDataIndex != null) {
    const hostExists = columns.some((c) => String(c.dataIndex) === mergeIntoDataIndex);
    if (hostExists) {
      return { columns: reorderFixed(columns), mergeIntoDataIndex };
    }
    if (__DEV__) {
      console.warn(
        `[DataTable] rowSelection.mergeIntoDataIndex="${mergeIntoDataIndex}" 未匹配到任何列，回退为独立选择列`,
      );
    }
  }

  const selCol: TableColumn<T> = {
    title: '',
    dataIndex: SELECTION_KEY,
    width: SELECTION_COLUMN_WIDTH,
    align: 'center',
    fixed: position === 'last' ? 'right' : 'left',
  };
  const base = reorderFixed(columns);
  const insertionIndex = base.findIndex((column) =>
    position === 'first' ? column.fixed !== 'left' : column.fixed === 'right',
  );
  const index = insertionIndex === -1 ? base.length : insertionIndex;
  return {
    columns: [...base.slice(0, index), selCol, ...base.slice(index)],
    mergeIntoDataIndex: null,
  };
}

/** 批次测绘宽度并入累计表：同列取最大值，返回新对象（不改入参） */
export function mergeMaxWidths(
  base: Record<string, number>,
  batch: Record<string, number>,
): Record<string, number> {
  const next = { ...base };
  for (const [key, width] of Object.entries(batch)) {
    next[key] = Math.max(next[key] ?? 0, width);
  }
  return next;
}

/**
 * 列宽解析（主体只用明确 width 布局，绝不使用 flex 伸展）：
 * 1. 各列基础宽度 = 固定 width，或 max(测绘宽, minWidth)，兜底默认宽；
 * 2. 弹性撑满：总宽 < 容器宽时剩余空白均分给自适应列（取整余数补给最后一个
 *    弹性列，保证总宽严格等于容器宽）；总宽 >= 容器宽时不做任何拉伸/压缩，
 *    按真实测量宽横向滚动；
 * 3. 生成最终列配置与固定列偏移（左固定累计 left，右固定从末尾累计 right）。
 */
export function resolveColumnLayout<T>(
  mergedColumns: TableColumn<T>[],
  measuredWidths: Record<string, number>,
  containerWidth: number,
  mergeIntoDataIndex?: string | null,
): { resolved: ResolvedColumn<T>[]; totalWidth: number } {
  const baseWidths: number[] = [];
  const elasticIdx: number[] = [];
  let baseTotal = 0;
  for (let i = 0; i < mergedColumns.length; i += 1) {
    const col = mergedColumns[i];
    let width: number;
    if (col.width != null) {
      width = col.width;
    } else {
      const base = Math.max(measuredWidths[columnKey(col, i)] ?? 0, col.minWidth ?? 0);
      width = base > 0 ? base : DEFAULT_COLUMN_WIDTH;
      elasticIdx.push(i);
    }
    baseWidths.push(width);
    baseTotal += width;
  }

  if (containerWidth > 0 && baseTotal < containerWidth && elasticIdx.length > 0) {
    const remaining = containerWidth - baseTotal;
    const share = Math.floor(remaining / elasticIdx.length);
    elasticIdx.forEach((i) => {
      baseWidths[i] += share;
    });
    baseWidths[elasticIdx[elasticIdx.length - 1]] += remaining - share * elasticIdx.length;
    baseTotal = containerWidth;
  }

  const cols: ResolvedColumn<T>[] = [];
  let left = 0;
  for (let i = 0; i < mergedColumns.length; i += 1) {
    const col = mergedColumns[i];
    const fixed = col.fixed === 'left' || col.fixed === 'right' ? col.fixed : undefined;
    cols.push({
      col,
      key: columnKey(col, i),
      width: baseWidths[i],
      left,
      right: 0,
      fixed,
      isSelection: col.dataIndex === SELECTION_KEY,
      mergesSelection: mergeIntoDataIndex != null && String(col.dataIndex) === mergeIntoDataIndex,
    });
    if (fixed === 'left') left += baseWidths[i];
  }
  let right = 0;
  for (let i = cols.length - 1; i >= 0; i -= 1) {
    if (cols[i].fixed === 'right') {
      cols[i].right = right;
      right += cols[i].width;
    }
  }
  return { resolved: cols, totalWidth: baseTotal };
}
