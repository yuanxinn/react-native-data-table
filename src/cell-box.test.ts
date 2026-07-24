import { WEB_STICKY_STYLE } from './cell-box';

describe('CellBox web sticky style', () => {
  it('在 Web 边界保留 CSS sticky 定位', () => {
    expect(WEB_STICKY_STYLE).toEqual({ position: 'sticky', zIndex: 10 });
  });
});
