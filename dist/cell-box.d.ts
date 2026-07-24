import React from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import type { ResolvedColumn } from './column-layout';
/** React Native ViewStyle 不声明 CSS sticky；仅在 Web 分支的单一边界做类型适配。 */
export declare const WEB_STICKY_STYLE: {
    readonly position: "sticky";
    readonly zIndex: 10;
};
/**
 * 单元格外框：负责定宽、对齐与固定列钉住。
 * contentStyle 为 composeCellStyle 合成的样式链；最终列宽最后追加，严禁被覆盖。
 * - App 端左固定：Animated.View + translateX(本行 scrollX) 原生驱动跟随悬浮
 * - App 端右固定：translateX = scrollX - maxScroll（线性插值，原生驱动），
 *   scrollX=0 时整体左移 maxScroll 钉在视口右缘，滚到最右时归位于自然流位置
 * - Web 端固定列：CSS position: sticky, left/right（滚动容器是本行自己的横向 ScrollView）
 */
export declare function CellBox<T>({ rc, scrollX, maxScroll, contentStyle, cellBorderStyle, isHeader, fixedBgColor, children, }: {
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
}): React.JSX.Element;
