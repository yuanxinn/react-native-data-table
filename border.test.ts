import { StyleSheet } from 'react-native';

import { resolveBorder } from './border';

const LINE = '#EEEFF3';

describe('resolveBorder', () => {
  it('省略配置时仅开启行分隔横线（历史默认行为），竖线与外框不画', () => {
    const res = resolveBorder(undefined, LINE);
    expect(res.row).toEqual({
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: LINE,
    });
    expect(res.cell).toBeNull();
    expect(res.outer).toBeNull();
  });

  it('false 时三类线全部关闭', () => {
    expect(resolveBorder(false, LINE)).toEqual({ row: null, cell: null, outer: null });
  });

  it('true 时等同省略：开启默认横线', () => {
    expect(resolveBorder(true, LINE)).toEqual(resolveBorder(undefined, LINE));
  });

  it('对象配置三类线独立开关，共用自定义 color 与 width', () => {
    const res = resolveBorder(
      { color: '#FF0000', width: 2, horizontal: true, vertical: true, outer: true },
      LINE,
    );
    expect(res.row).toEqual({ borderBottomWidth: 2, borderBottomColor: '#FF0000' });
    expect(res.cell).toEqual({ borderRightWidth: 2, borderRightColor: '#FF0000' });
    expect(res.outer).toEqual({ borderWidth: 2, borderColor: '#FF0000' });
  });

  it('对象配置可单独关闭横线、开启竖线，未传色宽时用默认 hairline 与注入线色', () => {
    const res = resolveBorder({ horizontal: false, vertical: true }, LINE);
    expect(res.row).toBeNull();
    expect(res.cell).toEqual({
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: LINE,
    });
    expect(res.outer).toBeNull();
  });
});
