import {
  mergeColumns,
  mergeMaxWidths,
  resolveColumnLayout,
  SELECTION_COLUMN_WIDTH,
  SELECTION_KEY,
} from './column-layout';
import type { TableColumn } from './types';

interface Row {
  a: string;
  b: string;
  c: string;
}

const col = (partial: Partial<TableColumn<Row>> & { dataIndex: string }): TableColumn<Row> => ({
  title: partial.dataIndex,
  ...partial,
});

describe('mergeColumns', () => {
  it('无行选择时原样返回列数组，mergeIntoDataIndex 为 null', () => {
    const columns = [col({ dataIndex: 'a' }), col({ dataIndex: 'b' })];
    const res = mergeColumns(columns, null);
    expect(res.columns).toEqual(columns);
    expect(res.mergeIntoDataIndex).toBeNull();
  });

  it('行选择默认注入为第一列，定宽 48、居中、自动打 fixed:left', () => {
    const { columns } = mergeColumns([col({ dataIndex: 'a' })], { position: 'first' });
    expect(columns[0]).toMatchObject({
      dataIndex: SELECTION_KEY,
      width: SELECTION_COLUMN_WIDTH,
      align: 'center',
      fixed: 'left',
    });
    expect(columns[1].dataIndex).toBe('a');
  });

  it('position 为 last 时选择列注入为最后一列并自动打 fixed:right', () => {
    const { columns } = mergeColumns([col({ dataIndex: 'a' })], { position: 'last' });
    const last = columns[columns.length - 1];
    expect(last.dataIndex).toBe(SELECTION_KEY);
    expect(last.fixed).toBe('right');
  });

  it('选择列 fixed:left 归入最左固定流（排在已有左固定列之后）', () => {
    const { columns } = mergeColumns(
      [col({ dataIndex: 'a', fixed: 'left' }), col({ dataIndex: 'b' })],
      { position: 'first' },
    );
    expect(columns.map((c) => c.dataIndex)).toEqual(['a', SELECTION_KEY, 'b']);
  });

  it('选择列 fixed:right 归入最右固定流（排在已有右固定列之前）', () => {
    const { columns } = mergeColumns(
      [col({ dataIndex: 'a' }), col({ dataIndex: 'b', fixed: 'right' })],
      { position: 'last' },
    );
    expect(columns.map((c) => c.dataIndex)).toEqual(['a', SELECTION_KEY, 'b']);
  });

  it('左固定归位最前、右固定归位最后，各组内保持声明顺序', () => {
    const { columns } = mergeColumns(
      [
        col({ dataIndex: 'a' }),
        col({ dataIndex: 'b', fixed: 'right' }),
        col({ dataIndex: 'c', fixed: 'left' }),
        col({ dataIndex: 'd', fixed: 'left' }),
        col({ dataIndex: 'e' }),
        col({ dataIndex: 'f', fixed: 'right' }),
      ],
      null,
    );
    expect(columns.map((c) => c.dataIndex)).toEqual(['c', 'd', 'a', 'e', 'b', 'f']);
  });

  it('合并模式：不注入选择列，返回宿主 dataIndex', () => {
    const input = [col({ dataIndex: 'a' }), col({ dataIndex: 'b' })];
    const res = mergeColumns(input, { position: 'first', mergeIntoDataIndex: 'b' });
    expect(res.columns.map((c) => c.dataIndex)).toEqual(['a', 'b']);
    expect(res.columns.some((c) => c.dataIndex === SELECTION_KEY)).toBe(false);
    expect(res.mergeIntoDataIndex).toBe('b');
  });

  it('合并模式宿主 dataIndex 不存在时告警并回退为独立选择列', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const res = mergeColumns([col({ dataIndex: 'a' })], {
      position: 'first',
      mergeIntoDataIndex: 'nope',
    });
    expect(res.columns[0].dataIndex).toBe(SELECTION_KEY);
    expect(res.mergeIntoDataIndex).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('mergeMaxWidths', () => {
  it('同列取两表最大值，新列直接并入', () => {
    const merged = mergeMaxWidths({ a: 100, b: 200 }, { a: 150, b: 120, c: 80 });
    expect(merged).toEqual({ a: 150, b: 200, c: 80 });
  });

  it('返回新对象，不修改入参', () => {
    const base = { a: 100 };
    const batch = { a: 150 };
    const merged = mergeMaxWidths(base, batch);
    expect(base).toEqual({ a: 100 });
    expect(merged).not.toBe(base);
  });
});

describe('resolveColumnLayout', () => {
  it('定宽列直接使用 width，不参与弹性分配', () => {
    const { resolved, totalWidth } = resolveColumnLayout(
      [col({ dataIndex: 'a', width: 80 }), col({ dataIndex: 'b', width: 120 })],
      {},
      0,
    );
    expect(resolved.map((c) => c.width)).toEqual([80, 120]);
    expect(totalWidth).toBe(200);
  });

  it('自适应列取测绘宽与 minWidth 的最大值', () => {
    const columns = [col({ dataIndex: 'a', minWidth: 150 }), col({ dataIndex: 'b', minWidth: 60 })];
    const { resolved } = resolveColumnLayout(columns, { 'a#0': 90, 'b#1': 200 }, 0);
    expect(resolved.map((c) => c.width)).toEqual([150, 200]);
  });

  it('未测绘且无 minWidth 的列使用兜底默认宽 100', () => {
    const { resolved } = resolveColumnLayout([col({ dataIndex: 'a' })], {}, 0);
    expect(resolved[0].width).toBe(100);
  });

  it('总宽小于容器宽时剩余空白均分给自适应列，余数补给最后一个弹性列', () => {
    const columns = [
      col({ dataIndex: 'a', width: 100 }),
      col({ dataIndex: 'b' }),
      col({ dataIndex: 'c' }),
    ];
    // 基础宽 100 + 100 + 100 = 300，容器 505：剩余 205，均分 102，余 1 给最后弹性列
    const { resolved, totalWidth } = resolveColumnLayout(
      columns,
      { 'b#1': 100, 'c#2': 100 },
      505,
    );
    expect(resolved.map((c) => c.width)).toEqual([100, 202, 203]);
    expect(totalWidth).toBe(505);
  });

  it('总宽大于等于容器宽时不做任何拉伸压缩', () => {
    const { resolved, totalWidth } = resolveColumnLayout(
      [col({ dataIndex: 'a' }), col({ dataIndex: 'b' })],
      { 'a#0': 300, 'b#1': 300 },
      400,
    );
    expect(resolved.map((c) => c.width)).toEqual([300, 300]);
    expect(totalWidth).toBe(600);
  });

  it('容器宽未测出（0）时不做弹性分配', () => {
    const { totalWidth } = resolveColumnLayout(
      [col({ dataIndex: 'a' })],
      { 'a#0': 100 },
      0,
    );
    expect(totalWidth).toBe(100);
  });

  it('全部为定宽列时即使总宽不足也不拉伸', () => {
    const { resolved, totalWidth } = resolveColumnLayout(
      [col({ dataIndex: 'a', width: 100 }), col({ dataIndex: 'b', width: 100 })],
      {},
      500,
    );
    expect(resolved.map((c) => c.width)).toEqual([100, 100]);
    expect(totalWidth).toBe(200);
  });

  it('左固定列累计 left 偏移，右固定列从最右累计 right 偏移', () => {
    const { resolved } = resolveColumnLayout(
      [
        col({ dataIndex: 'a', width: 80, fixed: 'left' }),
        col({ dataIndex: 'b', width: 100, fixed: 'left' }),
        col({ dataIndex: 'c', width: 200 }),
        col({ dataIndex: 'd', width: 60, fixed: 'right' }),
        col({ dataIndex: 'e', width: 90, fixed: 'right' }),
      ],
      {},
      0,
    );
    expect(resolved.map((c) => ({ left: c.left, right: c.right }))).toEqual([
      { left: 0, right: 0 },
      { left: 80, right: 0 },
      { left: 180, right: 0 },
      { left: 180, right: 90 },
      { left: 180, right: 0 },
    ]);
  });

  it('独立选择列标记 isSelection，普通列不标记', () => {
    const { columns } = mergeColumns([col({ dataIndex: 'a' })], { position: 'first' });
    const { resolved } = resolveColumnLayout(columns, {}, 0);
    expect(resolved.map((c) => c.isSelection)).toEqual([true, false]);
    expect(resolved.map((c) => c.mergesSelection)).toEqual([false, false]);
  });

  it('合并宿主列标记 mergesSelection', () => {
    const { columns, mergeIntoDataIndex } = mergeColumns(
      [col({ dataIndex: 'a' }), col({ dataIndex: 'b' })],
      { position: 'first', mergeIntoDataIndex: 'b' },
    );
    const { resolved } = resolveColumnLayout(columns, {}, 0, mergeIntoDataIndex);
    expect(resolved.map((c) => c.mergesSelection)).toEqual([false, true]);
    expect(resolved.map((c) => c.isSelection)).toEqual([false, false]);
  });
});
