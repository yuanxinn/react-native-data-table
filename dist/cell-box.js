"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CellBox = CellBox;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const theme_1 = require("./theme");
const IS_WEB = react_native_1.Platform.OS === 'web';
const WEB_STICKY_OVERLAP = 1;
const WEB_STICKY_POSITION = 'sticky';
const alignItemsMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
};
/**
 * 单元格外框：负责定宽、对齐与固定列钉住。
 * contentStyle 为 composeCellStyle 合成的样式链；最终列宽最后追加，严禁被覆盖。
 * - App 端左固定：Animated.View + translateX(本行 scrollX) 原生驱动跟随悬浮
 * - App 端右固定：translateX = scrollX - maxScroll（线性插值，原生驱动），
 *   scrollX=0 时整体左移 maxScroll 钉在视口右缘，滚到最右时归位于自然流位置
 * - Web 端固定列：CSS position: sticky, left/right（滚动容器是本行自己的横向 ScrollView）
 */
function CellBox({ rc, scrollX, maxScroll, contentStyle, cellBorderStyle, isHeader, fixedBgColor, children, }) {
    var _a;
    const theme = (0, theme_1.useDataTableTheme)();
    const sized = [
        { alignItems: alignItemsMap[(_a = rc.col.align) !== null && _a !== void 0 ? _a : 'left'] },
        contentStyle,
        cellBorderStyle,
        { width: rc.width },
    ];
    if (!rc.fixed) {
        return (0, jsx_runtime_1.jsx)(react_native_1.View, { style: sized, children: children });
    }
    // 固定列底色（放样式链最前，可被 cellStyle / renderCellStyle 覆盖）：
    // 优先用调用方传入色——表头跟随 headerStyle 背景、数据行跟随斑马纹/按压高亮；
    // 未传时回退主题默认（表头 headerBg / 数据 rowBg）
    const fixedBg = fixedBgColor
        ? { backgroundColor: fixedBgColor }
        : isHeader
            ? { backgroundColor: theme.headerBg }
            : { backgroundColor: theme.rowBg };
    if (IS_WEB) {
        const stick = rc.fixed === 'left' ? { left: rc.left } : { right: rc.right };
        const overlap = rc.fixed === 'left'
            ? { width: rc.width + WEB_STICKY_OVERLAP, marginRight: -WEB_STICKY_OVERLAP }
            : { width: rc.width + WEB_STICKY_OVERLAP, marginLeft: -WEB_STICKY_OVERLAP };
        return (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [fixedBg, sized, overlap, styles.fixedWeb, stick], children: children });
    }
    // 位移补偿把 scrollX 夹在 [0, maxScroll]：内容变窄（字体调小重测）后，横向 ScrollView
    // 的可视偏移会被系统夹到新的 maxScroll，但驱动固定列的 scrollX 可能残留旧的更大偏移；
    // 不夹紧会让固定列过度位移，滚到最右时明显右移脱位。
    const clampMax = Math.max(maxScroll, 1); // 防 maxScroll=0 时 inputRange 非递增
    const translateX = rc.fixed === 'left'
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
    return ((0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [fixedBg, sized, styles.fixedNative, { transform: [{ translateX }] }], children: children }));
}
const styles = react_native_1.StyleSheet.create({
    fixedNative: {
        zIndex: 10,
    },
    fixedWeb: {
        // React Native Web supports CSS sticky positioning, but ViewStyle does not model it.
        position: WEB_STICKY_POSITION,
        zIndex: 10,
    },
});
