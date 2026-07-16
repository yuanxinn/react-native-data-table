"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpandedArea = ExpandedArea;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const h_scroller_1 = require("./h-scroller");
const sub_table_1 = require("./sub-table");
const theme_1 = require("./theme");
const IS_WEB = react_native_1.Platform.OS === 'web';
function isEmptyDefault(subData) {
    return subData == null || (Array.isArray(subData) && subData.length === 0);
}
/**
 * 展开区：custom 模式渲染固定详情面板（占满视口宽、横滑不动）；
 * sub-table 模式按取数状态渲染 loading / error / empty 固定面板或联动子表。
 * 仅在行展开时挂载，折叠即卸载（独立横滚状态随之重置）。
 */
function ExpandedArea({ item, index, itemKey, resolved, columnWidths, totalWidth, containerWidth, maxScroll, nativeScrollX, registry, offsetRef, activeRef, cellBorderStyle, rowBorderStyle, expandedRowType, expandedRowStyle, renderExpandedRow, getSubTable, isExpandedDataEmpty, renderExpandedLoading, renderExpandedError, renderExpandedEmpty, subTableSyncScroll, subTableSyncFixedColumns, subStatus, subData, subError, subMeasured, onSubMeasured, onRetryFetch, }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const theme = (0, theme_1.useDataTableTheme)();
    // 独立横滚（subTableSyncScroll=false）用：Web 私有 registry / Native 独立 scrollX
    const [independentRegistry] = (0, react_1.useState)(() => new Set());
    const independentOffsetRef = (0, react_1.useRef)(0);
    const independentActiveRef = (0, react_1.useRef)(null);
    const [independentScrollX] = (0, react_1.useState)(() => new react_native_1.Animated.Value(0));
    const [handleIndependentScroll] = (0, react_1.useState)(() => react_native_1.Animated.event([{ nativeEvent: { contentOffset: { x: independentScrollX } } }], {
        useNativeDriver: !IS_WEB,
    }));
    const expandedBase = [
        { backgroundColor: theme.headerBg },
        rowBorderStyle,
        expandedRowStyle,
    ];
    const expandedBg = (_c = (_b = (_a = react_native_1.StyleSheet.flatten(expandedRowStyle)) === null || _a === void 0 ? void 0 : _a.backgroundColor) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _c !== void 0 ? _c : theme.headerBg;
    // 固定面板：占满视口宽、横滑不动（custom 模式 & sub-table 的 loading/error/empty）
    const fixedPanel = (node) => IS_WEB ? ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [expandedBase, { width: containerWidth || totalWidth }], children: node })) : ((0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [
            expandedBase,
            { width: containerWidth || totalWidth, transform: [{ translateX: nativeScrollX }] },
        ], children: node }));
    if (expandedRowType === 'custom') {
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: fixedPanel(renderExpandedRow === null || renderExpandedRow === void 0 ? void 0 : renderExpandedRow(item, index, columnWidths, subData)) });
    }
    // ---- sub-table 模式 ----
    if (subStatus === 'loading') {
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: fixedPanel((_d = renderExpandedLoading === null || renderExpandedLoading === void 0 ? void 0 : renderExpandedLoading(columnWidths)) !== null && _d !== void 0 ? _d : (0, jsx_runtime_1.jsx)(DefaultLoading, {})) });
    }
    if (subStatus === 'error') {
        return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: fixedPanel((_e = renderExpandedError === null || renderExpandedError === void 0 ? void 0 : renderExpandedError(subError, () => onRetryFetch(itemKey), columnWidths)) !== null && _e !== void 0 ? _e : ((0, jsx_runtime_1.jsx)(DefaultError, { onRetry: () => onRetryFetch(itemKey) }))) }));
    }
    const spec = getSubTable === null || getSubTable === void 0 ? void 0 : getSubTable(item, index, subData);
    const empty = !spec ||
        spec.rows.length === 0 ||
        (isExpandedDataEmpty ? isExpandedDataEmpty(subData) : isEmptyDefault(subData));
    if (empty) {
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: fixedPanel((_f = renderExpandedEmpty === null || renderExpandedEmpty === void 0 ? void 0 : renderExpandedEmpty(columnWidths)) !== null && _f !== void 0 ? _f : (0, jsx_runtime_1.jsx)(DefaultEmpty, {})) });
    }
    // 门控：子格宽度测完再上屏，避免列宽闪跳
    if (!subMeasured) {
        return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [fixedPanel((_g = renderExpandedLoading === null || renderExpandedLoading === void 0 ? void 0 : renderExpandedLoading(columnWidths)) !== null && _g !== void 0 ? _g : (0, jsx_runtime_1.jsx)(DefaultLoading, {})), (0, jsx_runtime_1.jsx)(sub_table_1.SubTableMeasurer, { spec: spec, resolved: resolved, cellStyle: spec.cellStyle, cellBorderStyle: cellBorderStyle, onMeasured: (w) => onSubMeasured(itemKey, w) })] }));
    }
    // done + measured → 联动子表
    const subNode = (scrollX) => ((0, jsx_runtime_1.jsx)(sub_table_1.SubTable, { spec: spec, resolved: resolved, totalWidth: totalWidth, scrollX: scrollX, maxScroll: maxScroll, syncFixedColumns: subTableSyncFixedColumns, fixedBg: expandedBg, cellBorderStyle: cellBorderStyle, rowBorderStyle: rowBorderStyle }));
    if (subTableSyncScroll) {
        // 与父表联动
        return IS_WEB ? ((0, jsx_runtime_1.jsx)(h_scroller_1.HScroller, { syncKey: `${itemKey}__exp`, totalWidth: totalWidth, registry: registry, offsetRef: offsetRef, activeRef: activeRef, contentStyle: expandedBase, children: (sx) => subNode(sx) })) : ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [expandedBase, { width: totalWidth }], children: subNode(nativeScrollX) }));
    }
    // 独立横滚
    return IS_WEB ? ((0, jsx_runtime_1.jsx)(h_scroller_1.HScroller, { syncKey: `${itemKey}__exp`, totalWidth: totalWidth, registry: independentRegistry, offsetRef: independentOffsetRef, activeRef: independentActiveRef, contentStyle: expandedBase, children: (sx) => subNode(sx) })) : ((0, jsx_runtime_1.jsx)(react_native_1.Animated.ScrollView, { style: expandedBase, horizontal: true, bounces: false, directionalLockEnabled: true, nestedScrollEnabled: true, showsHorizontalScrollIndicator: false, scrollEventThrottle: 16, onScroll: handleIndependentScroll, children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: { width: totalWidth }, children: subNode(independentScrollX) }) }));
}
function DefaultLoading() {
    const theme = (0, theme_1.useDataTableTheme)();
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.panelCenter, children: (0, jsx_runtime_1.jsx)(react_native_1.ActivityIndicator, { color: theme.primary }) }));
}
function DefaultError({ onRetry }) {
    const theme = (0, theme_1.useDataTableTheme)();
    return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.panelCenter, onPress: onRetry, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.panelText, { color: theme.textSecondary }], children: "\u52A0\u8F7D\u5931\u8D25\uFF0C\u70B9\u51FB\u91CD\u8BD5" }) }));
}
function DefaultEmpty() {
    const theme = (0, theme_1.useDataTableTheme)();
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.panelCenter, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.panelText, { color: theme.textSecondary }], children: "\u6682\u65E0\u6570\u636E" }) }));
}
const styles = react_native_1.StyleSheet.create({
    panelCenter: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    panelText: {
        fontSize: 13,
    },
});
