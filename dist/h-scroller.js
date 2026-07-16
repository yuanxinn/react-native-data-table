"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HScroller = HScroller;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const use_press_guard_1 = require("./use-press-guard");
const IS_WEB = react_native_1.Platform.OS === 'web';
/**
 * H5 行内横向滚动器：表头与每一行各自滚动，
 * 通过共享 offsetRef + registry 广播 scrollTo 保持同步；固定列使用 CSS sticky。
 * App 端由 DataTable 外层唯一的横向 ScrollView 统一驱动，不经过此组件。
 */
function HScroller({ syncKey, totalWidth, registry, offsetRef, activeRef, contentStyle, onPress, onPressIn, onPressOut, children, }) {
    const ref = (0, react_1.useRef)(null);
    const [localScrollX] = (0, react_1.useState)(() => new react_native_1.Animated.Value(0));
    const pendingSyncXRef = (0, react_1.useRef)(null);
    // 拖动/点击判定：横向拖动不触发行点击
    const pressGuard = (0, use_press_guard_1.usePressGuard)();
    const pointerActiveRef = (0, react_1.useRef)(false);
    const syncTo = (0, react_1.useCallback)((x) => {
        var _a;
        pendingSyncXRef.current = x;
        localScrollX.setValue(x);
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.scrollTo({ x, animated: false });
    }, [localScrollX]);
    const controller = (0, react_1.useMemo)(() => ({ syncTo }), [syncTo]);
    // 手指、鼠标或触控板落在哪个滚动器上，哪个就是唯一广播源。
    const claimOwnership = (0, react_1.useCallback)(() => {
        pendingSyncXRef.current = null;
        activeRef.current = controller;
    }, [activeRef, controller]);
    (0, react_1.useEffect)(() => {
        registry.add(controller);
        return () => {
            registry.delete(controller);
            if (activeRef.current === controller)
                activeRef.current = null;
        };
    }, [activeRef, controller, registry]);
    // RN Web 的 ScrollView 没有 begin-drag 回调；在浏览器默认滚动发生前抢占所有权。
    (0, react_1.useEffect)(() => {
        if (!IS_WEB)
            return;
        const node = ref.current;
        if (!node.addEventListener || !node.removeEventListener)
            return;
        const claim = () => claimOwnership();
        const handlePointerDown = (event) => {
            claimOwnership();
            if (event.clientX == null || event.clientY == null)
                return;
            pointerActiveRef.current = true;
            pressGuard.begin(event.clientX, event.clientY);
        };
        const handlePointerMove = (event) => {
            if (!pointerActiveRef.current || event.clientX == null || event.clientY == null)
                return;
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
            var _a, _b, _c, _d, _e, _f;
            (_a = node.removeEventListener) === null || _a === void 0 ? void 0 : _a.call(node, 'wheel', claim);
            (_b = node.removeEventListener) === null || _b === void 0 ? void 0 : _b.call(node, 'pointerdown', handlePointerDown);
            (_c = node.removeEventListener) === null || _c === void 0 ? void 0 : _c.call(node, 'pointermove', handlePointerMove);
            (_d = node.removeEventListener) === null || _d === void 0 ? void 0 : _d.call(node, 'pointerup', handlePointerEnd);
            (_e = node.removeEventListener) === null || _e === void 0 ? void 0 : _e.call(node, 'pointercancel', handlePointerEnd);
            (_f = node.removeEventListener) === null || _f === void 0 ? void 0 : _f.call(node, 'keydown', claim);
        };
    }, [claimOwnership, pressGuard]);
    // FlashList 复用行、Web DOM 重排都会把 scrollLeft 悄悄归零，挂载与尺寸变化时归位
    const applyOffset = (0, react_1.useCallback)(() => {
        controller.syncTo(offsetRef.current);
    }, [controller, offsetRef]);
    // FlashList 复用同一个组件实例承载新数据时，布局可能不变，须按数据 key 主动归位。
    (0, react_1.useEffect)(() => {
        applyOffset();
    }, [applyOffset, syncKey]);
    const broadcast = (0, react_1.useCallback)((e) => {
        const x = e.nativeEvent.contentOffset.x;
        // 跟随者的 scrollTo 回声只能更新自身，不能覆盖更新的全局偏移再反向广播。
        if (activeRef.current !== controller) {
            if (pendingSyncXRef.current != null &&
                Math.abs(x - pendingSyncXRef.current) < 0.5) {
                pendingSyncXRef.current = null;
            }
            return;
        }
        pendingSyncXRef.current = null;
        // 兄弟 scrollTo 触发的回声事件偏移相同，跳过以免广播风暴
        if (Math.abs(x - offsetRef.current) < 0.5)
            return;
        offsetRef.current = x;
        registry.forEach((follower) => {
            if (follower !== controller)
                follower.syncTo(x);
        });
    }, [activeRef, controller, offsetRef, registry]);
    const handleScroll = (0, react_1.useMemo)(() => 
    // RN 官方 Animated.event 模式：broadcast 内的 ref 只在滚动事件触发时读取，
    // 不会在渲染期被调用，react-hooks/refs 对此为误报
    // eslint-disable-next-line react-hooks/refs
    react_native_1.Animated.event([{ nativeEvent: { contentOffset: { x: localScrollX } } }], {
        // HScroller 仅在 Web 渲染（App 端由外层唯一横向 ScrollView 驱动），恒走 JS 驱动
        useNativeDriver: false,
        listener: broadcast,
    }), [localScrollX, broadcast]);
    const interactive = onPress != null || onPressIn != null;
    const handleInteractivePress = (0, react_1.useCallback)(() => {
        if (pressGuard.moved)
            return;
        onPress === null || onPress === void 0 ? void 0 : onPress();
    }, [pressGuard, onPress]);
    const handleInteractivePressIn = (0, react_1.useCallback)((event) => {
        if (!pointerActiveRef.current)
            pressGuard.clearMoved();
        onPressIn === null || onPressIn === void 0 ? void 0 : onPressIn(event);
    }, [pressGuard, onPressIn]);
    return ((0, jsx_runtime_1.jsx)(react_native_1.Animated.ScrollView, { ref: ref, horizontal: true, bounces: false, nestedScrollEnabled: true, showsHorizontalScrollIndicator: false, scrollEventThrottle: 16, onScroll: handleScroll, onTouchStart: claimOwnership, onLayout: applyOffset, onContentSizeChange: applyOffset, children: interactive ? ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [{ width: totalWidth, flexDirection: 'row' }, contentStyle], onPress: onPress ? handleInteractivePress : undefined, onPressIn: handleInteractivePressIn, onPressOut: onPressOut, children: children(localScrollX) })) : ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [{ width: totalWidth, flexDirection: 'row' }, contentStyle], children: children(localScrollX) })) }));
}
