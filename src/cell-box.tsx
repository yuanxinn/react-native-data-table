import React from 'react';
import { Animated, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import type { ResolvedColumn } from './column-layout';
import { useDataTableTheme } from './theme';

const IS_WEB = Platform.OS === 'web';
const WEB_STICKY_OVERLAP = 1;

/** React Native ViewStyle 不声明 CSS sticky；仅在 Web 分支的单一边界做类型适配。 */
export const WEB_STICKY_STYLE = { position: 'sticky', zIndex: 10 } as const;
const WEB_STICKY_VIEW_STYLE = WEB_STICKY_STYLE as unknown as ViewStyle;

const alignItemsMap = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
} as const;

/**
 * 单元格外框：负责定宽、对齐与固定列钉住。
 * contentStyle 为 composeCellStyle 合成的样式链；最终列宽最后追加，严禁被覆盖。
 * - App 端左固定：Animated.View + translateX(本行 scrollX) 原生驱动跟随悬浮
 * - App 端右固定：translateX = scrollX - maxScroll（线性插值，原生驱动），
 *   scrollX=0 时整体左移 maxScroll 钉在视口右缘，滚到最右时归位于自然流位置
 * - Web 端固定列：CSS position: sticky, left/right（滚动容器是本行自己的横向 ScrollView）
 */
export function CellBox<T>({
  rc,
  scrollX,
  maxScroll,
  contentStyle,
  cellBorderStyle,
  isHeader,
  fixedBgColor,
  children,
}: {
  rc: ResolvedColumn<T>;
  scrollX: Animated.Value;
  maxScroll: number;
  contentStyle: StyleProp<ViewStyle>;
  /** 列分隔竖线（border 配置注入，参与幽灵测宽），置于宽度之前 */
  cellBorderStyle?: StyleProp<ViewStyle>;
  isHeader?: boolean;
  /** 行背景色（斑马纹/按压高亮），固定列须同底色否则滑动露馅 */
  fixedBgColor?: string;
  children: React.ReactNode;
}) {
  const theme = useDataTableTheme();
  const sized: StyleProp<ViewStyle> = [
    { alignItems: alignItemsMap[rc.col.align ?? 'left'] },
    contentStyle,
    cellBorderStyle,
    { width: rc.width },
  ];
  if (!rc.fixed) {
    return <View style={sized}>{children}</View>;
  }
  // 固定列底色（放样式链最前，可被 cellStyle / renderCellStyle 覆盖）：
  // 优先用调用方传入色——表头跟随 headerStyle 背景、数据行跟随斑马纹/按压高亮；
  // 未传时回退主题默认（表头 headerBg / 数据 rowBg）
  const fixedBg: StyleProp<ViewStyle> = fixedBgColor
    ? { backgroundColor: fixedBgColor }
    : isHeader
      ? { backgroundColor: theme.headerBg }
      : { backgroundColor: theme.rowBg };
  if (IS_WEB) {
    const stick: ViewStyle =
      rc.fixed === 'left' ? ({ left: rc.left } as ViewStyle) : ({ right: rc.right } as ViewStyle);
    const overlap: ViewStyle =
      rc.fixed === 'left'
        ? { width: rc.width + WEB_STICKY_OVERLAP, marginRight: -WEB_STICKY_OVERLAP }
        : { width: rc.width + WEB_STICKY_OVERLAP, marginLeft: -WEB_STICKY_OVERLAP };
    return <View style={[fixedBg, sized, overlap, WEB_STICKY_VIEW_STYLE, stick]}>{children}</View>;
  }
  // 位移补偿把 scrollX 夹在 [0, maxScroll]：内容变窄（字体调小重测）后，横向 ScrollView
  // 的可视偏移会被系统夹到新的 maxScroll，但驱动固定列的 scrollX 可能残留旧的更大偏移；
  // 不夹紧会让固定列过度位移，滚到最右时明显右移脱位。
  const clampMax = Math.max(maxScroll, 1); // 防 maxScroll=0 时 inputRange 非递增
  const translateX =
    rc.fixed === 'left'
      ? scrollX.interpolate({
          inputRange: [0, clampMax],
          outputRange: [0, clampMax],
          extrapolate: 'clamp',
        })
      : scrollX.interpolate({
          inputRange: [0, clampMax],
          outputRange: [-maxScroll, clampMax - maxScroll],
          extrapolate: 'clamp',
        });
  return (
    <Animated.View style={[fixedBg, sized, styles.fixedNative, { transform: [{ translateX }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fixedNative: {
    zIndex: 10,
  },
});
