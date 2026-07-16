import { collectCellWidth, createCollectState } from './measure';

describe('collectCellWidth', () => {
  it('宽度向上取整并加 1px 余量，同列取最大值', () => {
    const state = createCollectState();
    collectCellWidth(state, 'a', 'a:1', 100.2, 3);
    collectCellWidth(state, 'a', 'a:2', 88, 3);
    // 100.2 → ceil 101 + 1 = 102；88 → 89 不超过已有最大值
    expect(state.widths.a).toBe(102);
  });

  it('重复 cellId 去重：同格重复 onLayout 不重复计入进度', () => {
    const state = createCollectState();
    expect(collectCellWidth(state, 'a', 'a:1', 100, 2)).toBe(false);
    expect(collectCellWidth(state, 'a', 'a:1', 200, 2)).toBe(false);
    expect(state.measured.size).toBe(1);
    // 重复上报的更大宽度也不生效（该格已收集）
    expect(state.widths.a).toBe(101);
  });

  it('测满 expected 格时返回 true 并置 done', () => {
    const state = createCollectState();
    expect(collectCellWidth(state, 'a', 'a:1', 100, 2)).toBe(false);
    expect(collectCellWidth(state, 'b', 'b:1', 50, 2)).toBe(true);
    expect(state.done).toBe(true);
    expect(state.widths).toEqual({ a: 101, b: 51 });
  });

  it('done 之后继续收集被忽略，宽度不再变化', () => {
    const state = createCollectState();
    collectCellWidth(state, 'a', 'a:1', 100, 1);
    expect(state.done).toBe(true);
    expect(collectCellWidth(state, 'a', 'a:2', 500, 1)).toBe(false);
    expect(state.widths).toEqual({ a: 101 });
  });

  it('未测满 expected 时始终返回 false（重复 key 导致凑不齐即门控卡住的根源）', () => {
    const state = createCollectState();
    expect(collectCellWidth(state, 'a', 'a:1', 100, 3)).toBe(false);
    expect(collectCellWidth(state, 'b', 'b:1', 100, 3)).toBe(false);
    expect(state.done).toBe(false);
  });
});
