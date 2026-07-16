"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderRow = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const cell_1 = require("./cell");
const cell_box_1 = require("./cell-box");
const checkbox_1 = require("./checkbox");
const h_scroller_1 = require("./h-scroller");
const theme_1 = require("./theme");
const IS_WEB = react_native_1.Platform.OS === 'web';
/** 可排序表头：内容 + 上下箭头，点击轮转 null → ascend → descend → null */
function SortableTitle({ order, onPress, idleColor, activeColor, renderSortIcon, children, }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.sortHeader, hitSlop: 6, onPress: onPress, children: [children, renderSortIcon ? (renderSortIcon(order)) : ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.sortIconBox, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.sortCaret, { color: order === 'ascend' ? activeColor : idleColor }], children: "\u25B2" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.sortCaret, { color: order === 'descend' ? activeColor : idleColor }], children: "\u25BC" })] }))] }));
}
const HeaderRowInner = ({ resolved, totalWidth, maxScroll, nativeScrollX, registry, offsetRef, activeRef, headerStyle, headerTextStyle, cellStyle, cellBorderStyle, rowBorderStyle, currentSort, onSortPress, renderSortIcon, allChecked, someChecked, selectionDisabled, onToggleAll, renderHeaderCheckbox, checkboxAlign, }) => {
    var _a, _b, _c;
    const theme = (0, theme_1.useDataTableTheme)();
    const headerCheckbox = () => renderHeaderCheckbox ? ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { disabled: selectionDisabled, hitSlop: 8, onPress: onToggleAll, children: renderHeaderCheckbox({
            checked: allChecked,
            indeterminate: someChecked,
            disabled: selectionDisabled,
        }) })) : ((0, jsx_runtime_1.jsx)(checkbox_1.Checkbox, { checked: allChecked, indeterminate: someChecked, disabled: selectionDisabled, onPress: onToggleAll }));
    // 固定表头格底色跟随 headerStyle 背景（未设时默认主题 headerBg），与非固定格保持一致
    const headerBg = (_c = (_b = (_a = react_native_1.StyleSheet.flatten(headerStyle)) === null || _a === void 0 ? void 0 : _a.backgroundColor) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _c !== void 0 ? _c : theme.headerBg;
    const renderHeaderCells = (scrollX) => resolved.map((rc) => {
        const sortOrder = currentSort && currentSort.dataIndex === String(rc.col.dataIndex)
            ? currentSort.order
            : null;
        let inner;
        if (rc.isSelection) {
            inner = headerCheckbox();
        }
        else {
            const content = rc.col.sorter ? ((0, jsx_runtime_1.jsx)(SortableTitle, { order: sortOrder, onPress: () => onSortPress(String(rc.col.dataIndex)), idleColor: theme.disabled, activeColor: theme.primary, renderSortIcon: renderSortIcon, children: (0, cell_1.renderHeaderContent)(rc.col, theme.text, headerTextStyle) })) : ((0, cell_1.renderHeaderContent)(rc.col, theme.text, headerTextStyle));
            inner = rc.mergesSelection
                ? (0, cell_1.renderSelectionCell)({ checkbox: headerCheckbox(), content, align: checkboxAlign })
                : content;
        }
        return ((0, jsx_runtime_1.jsx)(cell_box_1.CellBox, { rc: rc, scrollX: scrollX, maxScroll: maxScroll, cellBorderStyle: cellBorderStyle, contentStyle: (0, cell_1.composeHeaderCellStyle)({ col: rc.col, cellStyle }), isHeader: true, fixedBgColor: headerBg, children: inner }, rc.key));
    });
    if (IS_WEB) {
        return ((0, jsx_runtime_1.jsx)(h_scroller_1.HScroller, { syncKey: "__DATA_TABLE_HEADER__", totalWidth: totalWidth, registry: registry, offsetRef: offsetRef, activeRef: activeRef, contentStyle: [{ backgroundColor: theme.headerBg }, rowBorderStyle, headerStyle], children: renderHeaderCells }));
    }
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
            { width: totalWidth, flexDirection: 'row', backgroundColor: theme.headerBg },
            rowBorderStyle,
            headerStyle,
        ], children: renderHeaderCells(nativeScrollX) }));
};
// 泛型组件配合 memo 需要一次类型断言，避免丢失 <T> 推导
exports.HeaderRow = (0, react_1.memo)(HeaderRowInner);
const styles = react_native_1.StyleSheet.create({
    sortHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sortIconBox: {
        width: cell_1.SORT_ICON_WIDTH,
        alignItems: 'center',
    },
    sortCaret: {
        fontSize: 8,
        lineHeight: 9,
    },
});
