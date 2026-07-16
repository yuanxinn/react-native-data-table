import React from 'react';
import { Animated, GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
export interface HScrollerController {
    syncTo: (x: number) => void;
}
/**
 * H5 行内横向滚动器：表头与每一行各自滚动，
 * 通过共享 offsetRef + registry 广播 scrollTo 保持同步；固定列使用 CSS sticky。
 * App 端由 DataTable 外层唯一的横向 ScrollView 统一驱动，不经过此组件。
 */
export declare function HScroller({ syncKey, totalWidth, registry, offsetRef, activeRef, contentStyle, onPress, onPressIn, onPressOut, children, }: {
    syncKey: string;
    totalWidth: number;
    registry: Set<HScrollerController>;
    offsetRef: React.RefObject<number>;
    activeRef: React.RefObject<HScrollerController | null>;
    contentStyle?: StyleProp<ViewStyle>;
    /**
     * 行点击回调。必须由本组件渲染成「滚动内容容器」上的 Pressable，而不能在外层包 Pressable：
     * Fabric iOS 的 RCTScrollViewComponentView 只要发现任一祖先是 JS responder
     * （Pressable 按下即成为，且 blockNativeResponder 被忽略）就禁用滚动手势，
     * 表现为行内横向 ScrollView 无法拖动；Pressable 作为内容（子孙）则不受影响。
     */
    onPress?: () => void;
    /** 行按压高亮：与 onPress 同容器，按下/抬起切换行背景 */
    onPressIn?: (event: GestureResponderEvent) => void;
    onPressOut?: () => void;
    children: (localScrollX: Animated.Value) => React.ReactNode;
}): React.JSX.Element;
