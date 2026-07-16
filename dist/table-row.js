"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableRow = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const cell_1 = require("./cell");
const cell_box_1 = require("./cell-box");
const checkbox_1 = require("./checkbox");
const expanded_area_1 = require("./expanded-area");
const h_scroller_1 = require("./h-scroller");
const theme_1 = require("./theme");
const use_press_guard_1 = require("./use-press-guard");
const IS_WEB = react_native_1.Platform.OS === 'web';
const TableRowInner = (props) => {
    const { item, index, itemKey, resolved, totalWidth, maxScroll, nativeScrollX, registry, offsetRef, activeRef, cellStyle, cellTextStyle, cellBorderStyle, rowBorderStyle, expanded, expandable, onToggleExpand, rowStyle, rowBackground, highlightColor, selected, selectionDisabled, onToggleSelect, renderCheckbox, checkboxAlign, } = props;
    const theme = (0, theme_1.useDataTableTheme)();
    // 拖动/点击判定：横向拖动行时不触发展开
    const pressGuard = (0, use_press_guard_1.usePressGuard)();
    const handlePress = (0, react_1.useCallback)(() => {
        if (pressGuard.moved)
            return;
        onToggleExpand(itemKey);
    }, [pressGuard, onToggleExpand, itemKey]);
    const handleToggleSelect = (0, react_1.useCallback)(() => onToggleSelect(itemKey), [onToggleSelect, itemKey]);
    const [pressed, setPressed] = (0, react_1.useState)(false);
    const highlightable = highlightColor != null;
    const handlePressIn = (0, react_1.useCallback)((event) => {
        pressGuard.begin(event.nativeEvent.pageX, event.nativeEvent.pageY);
        if (highlightable)
            setPressed(true);
    }, [pressGuard, highlightable]);
    const handleGestureMove = (0, react_1.useCallback)((event) => {
        pressGuard.track(event.nativeEvent.pageX, event.nativeEvent.pageY);
    }, [pressGuard]);
    const handlePressOut = (0, react_1.useCallback)(() => setPressed(false), []);
    const effectiveBg = pressed && highlightable ? highlightColor : rowBackground;
    const contentStyle = [
        { backgroundColor: theme.rowBg },
        rowBorderStyle,
        rowStyle,
        effectiveBg ? { backgroundColor: effectiveBg } : null,
    ];
    const rowCheckbox = () => renderCheckbox ? ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { disabled: selectionDisabled, hitSlop: 8, onPress: handleToggleSelect, children: renderCheckbox(selected, item) })) : ((0, jsx_runtime_1.jsx)(checkbox_1.Checkbox, { checked: selected, disabled: selectionDisabled, onPress: handleToggleSelect }));
    const renderCells = (scrollX) => resolved.map((rc) => {
        let inner;
        if (rc.isSelection) {
            inner = rowCheckbox();
        }
        else {
            const content = (0, cell_1.renderCellContent)(rc.col, item, index, theme.text, cellTextStyle);
            inner = rc.mergesSelection
                ? (0, cell_1.renderSelectionCell)({ checkbox: rowCheckbox(), content, align: checkboxAlign })
                : content;
        }
        return ((0, jsx_runtime_1.jsx)(cell_box_1.CellBox, { rc: rc, scrollX: scrollX, maxScroll: maxScroll, fixedBgColor: effectiveBg, cellBorderStyle: cellBorderStyle, contentStyle: (0, cell_1.composeCellStyle)({ col: rc.col, cellStyle, record: { item, index } }), children: inner }, rc.key));
    });
    const scroller = IS_WEB ? ((0, jsx_runtime_1.jsx)(h_scroller_1.HScroller, { syncKey: itemKey, totalWidth: totalWidth, registry: registry, offsetRef: offsetRef, activeRef: activeRef, contentStyle: contentStyle, onPress: expandable ? handlePress : undefined, onPressIn: expandable || highlightable ? handlePressIn : undefined, onPressOut: expandable || highlightable ? handlePressOut : undefined, children: renderCells })) : expandable || highlightable ? ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [{ width: totalWidth, flexDirection: 'row' }, contentStyle], onPress: expandable ? handlePress : undefined, onPressIn: expandable || highlightable ? handlePressIn : undefined, onPressOut: expandable || highlightable ? handlePressOut : undefined, onPressMove: expandable ? handleGestureMove : undefined, children: renderCells(nativeScrollX) })) : ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [{ width: totalWidth, flexDirection: 'row' }, contentStyle], children: renderCells(nativeScrollX) }));
    if (!expandable) {
        return scroller;
    }
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { children: [scroller, expanded ? (0, jsx_runtime_1.jsx)(expanded_area_1.ExpandedArea, { ...props }) : null] }));
};
// 泛型组件配合 memo 需要一次类型断言，避免丢失 <T> 推导
exports.TableRow = (0, react_1.memo)(TableRowInner);
