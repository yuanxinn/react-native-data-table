import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

import { usePressGuard } from './use-press-guard';

const IS_WEB = Platform.OS === 'web';

export interface HScrollerController {
  syncTo: (x: number) => void;
}

/**
 * H5 行内横向滚动器：表头与每一行各自滚动，
 * 通过共享 offsetRef + registry 广播 scrollTo 保持同步；固定列使用 CSS sticky。
 * App 端由 DataTable 外层唯一的横向 ScrollView 统一驱动，不经过此组件。
 */
export function HScroller({
  syncKey,
  totalWidth,
  registry,
  offsetRef,
  activeRef,
  contentStyle,
  onPress,
  onPressIn,
  onPressOut,
  children,
}: {
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
}) {
  const ref = useRef<ScrollView | null>(null);
  const [localScrollX] = useState(() => new Animated.Value(0));
  const pendingSyncXRef = useRef<number | null>(null);
  // 拖动/点击判定：横向拖动不触发行点击
  const pressGuard = usePressGuard();
  const pointerActiveRef = useRef(false);

  const syncTo = useCallback(
    (x: number) => {
      pendingSyncXRef.current = x;
      localScrollX.setValue(x);
      ref.current?.scrollTo({ x, animated: false });
    },
    [localScrollX],
  );

  const controller = useMemo<HScrollerController>(() => ({ syncTo }), [syncTo]);

  // 手指、鼠标或触控板落在哪个滚动器上，哪个就是唯一广播源。
  const claimOwnership = useCallback(() => {
    pendingSyncXRef.current = null;
    activeRef.current = controller;
  }, [activeRef, controller]);

  useEffect(() => {
    registry.add(controller);
    return () => {
      registry.delete(controller);
      if (activeRef.current === controller) activeRef.current = null;
    };
  }, [activeRef, controller, registry]);

  // RN Web 的 ScrollView 没有 begin-drag 回调；在浏览器默认滚动发生前抢占所有权。
  useEffect(() => {
    if (!IS_WEB) return;
    const node = ref.current as unknown as {
      addEventListener?: (
        type: string,
        listener: (event: { clientX?: number; clientY?: number }) => void,
        options?: { passive?: boolean },
      ) => void;
      removeEventListener?: (
        type: string,
        listener: (event: { clientX?: number; clientY?: number }) => void,
      ) => void;
    };
    if (!node.addEventListener || !node.removeEventListener) return;
    const claim = () => claimOwnership();
    const handlePointerDown = (event: { clientX?: number; clientY?: number }) => {
      claimOwnership();
      if (event.clientX == null || event.clientY == null) return;
      pointerActiveRef.current = true;
      pressGuard.begin(event.clientX, event.clientY);
    };
    const handlePointerMove = (event: { clientX?: number; clientY?: number }) => {
      if (!pointerActiveRef.current || event.clientX == null || event.clientY == null) return;
      pressGuard.track(event.clientX, event.clientY);
    };
    const handlePointerEnd = () => {
      pointerActiveRef.current = false;
    };
    node.addEventListener('wheel', claim, { passive: true });
    node.addEventListener('pointerdown', handlePointerDown);
    node.addEventListener('pointermove', handlePointerMove);
    node.addEventListener('pointerup', handlePointerEnd);
    node.addEventListener('pointercancel', handlePointerEnd);
    node.addEventListener('keydown', claim);
    return () => {
      node.removeEventListener?.('wheel', claim);
      node.removeEventListener?.('pointerdown', handlePointerDown);
      node.removeEventListener?.('pointermove', handlePointerMove);
      node.removeEventListener?.('pointerup', handlePointerEnd);
      node.removeEventListener?.('pointercancel', handlePointerEnd);
      node.removeEventListener?.('keydown', claim);
    };
  }, [claimOwnership, pressGuard]);

  // FlashList 复用行、Web DOM 重排都会把 scrollLeft 悄悄归零，挂载与尺寸变化时归位
  const applyOffset = useCallback(() => {
    controller.syncTo(offsetRef.current);
  }, [controller, offsetRef]);

  // FlashList 复用同一个组件实例承载新数据时，布局可能不变，须按数据 key 主动归位。
  useEffect(() => {
    applyOffset();
  }, [applyOffset, syncKey]);

  const broadcast = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      // 跟随者的 scrollTo 回声只能更新自身，不能覆盖更新的全局偏移再反向广播。
      if (activeRef.current !== controller) {
        if (
          pendingSyncXRef.current != null &&
          Math.abs(x - pendingSyncXRef.current) < 0.5
        ) {
          pendingSyncXRef.current = null;
        }
        return;
      }
      pendingSyncXRef.current = null;
      // 兄弟 scrollTo 触发的回声事件偏移相同，跳过以免广播风暴
      if (Math.abs(x - offsetRef.current) < 0.5) return;
      offsetRef.current = x;
      registry.forEach((follower) => {
        if (follower !== controller) follower.syncTo(x);
      });
    },
    [activeRef, controller, offsetRef, registry],
  );

  const handleScroll = useMemo(
    () =>
      // RN 官方 Animated.event 模式：broadcast 内的 ref 只在滚动事件触发时读取，
      // 不会在渲染期被调用，react-hooks/refs 对此为误报
      // eslint-disable-next-line react-hooks/refs
      Animated.event([{ nativeEvent: { contentOffset: { x: localScrollX } } }], {
        // HScroller 仅在 Web 渲染（App 端由外层唯一横向 ScrollView 驱动），恒走 JS 驱动
        useNativeDriver: false,
        listener: broadcast,
      }),
    [localScrollX, broadcast],
  );

  const interactive = onPress != null || onPressIn != null;
  const handleInteractivePress = useCallback(() => {
    if (pressGuard.moved) return;
    onPress?.();
  }, [pressGuard, onPress]);
  const handleInteractivePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (!pointerActiveRef.current) pressGuard.clearMoved();
      onPressIn?.(event);
    },
    [pressGuard, onPressIn],
  );

  return (
    <Animated.ScrollView
      ref={ref as React.Ref<React.ComponentRef<typeof Animated.ScrollView>>}
      horizontal
      bounces={false}
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={handleScroll}
      onTouchStart={claimOwnership}
      onLayout={applyOffset}
      onContentSizeChange={applyOffset}
    >
      {interactive ? (
        <Pressable
          style={[{ width: totalWidth, flexDirection: 'row' }, contentStyle]}
          onPress={onPress ? handleInteractivePress : undefined}
          onPressIn={handleInteractivePressIn}
          onPressOut={onPressOut}
        >
          {children(localScrollX)}
        </Pressable>
      ) : (
        <View style={[{ width: totalWidth, flexDirection: 'row' }, contentStyle]}>
          {children(localScrollX)}
        </View>
      )}
    </Animated.ScrollView>
  );
}
