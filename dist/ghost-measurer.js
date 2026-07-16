"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhostMeasurer = GhostMeasurer;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const cell_1 = require("./cell");
const checkbox_1 = require("./checkbox");
const measure_1 = require("./measure");
const theme_1 = require("./theme");
const noop = () => { };
/**
 * 幽灵测绘区：肉眼不可见的离屏容器，真实挂载增量数据的单元格，
 * 通过 onLayout 收集各列的真实渲染宽度（含 cellStyle / renderCellStyle
 * 引入的 padding、边框等宽度影响，及合并模式的选择框宽度）。父组件用批次签名作
 * React key，换批次时整体重挂载，内部无需处理复用状态。
 */
function GhostMeasurer({ entries, columns, headerTextStyle, cellStyle, selection, cellBorderStyle, cellTextStyle, renderSortIcon, onMeasured, }) {
    const theme = (0, theme_1.useDataTableTheme)();
    // 每列多测一个表头标题，保证列宽不小于表头
    const expected = columns.length * (entries.length + 1);
    const collect = (0, measure_1.useMeasure)(expected, onMeasured);
    const headerCheckboxNode = (selection === null || selection === void 0 ? void 0 : selection.renderHeaderCheckbox) ? (selection.renderHeaderCheckbox({ checked: false, indeterminate: false, disabled: false })) : ((0, jsx_runtime_1.jsx)(checkbox_1.Checkbox, { checked: false, onPress: noop }));
    const rowCheckboxNode = (item) => (selection === null || selection === void 0 ? void 0 : selection.renderCheckbox) ? (selection.renderCheckbox(false, item)) : ((0, jsx_runtime_1.jsx)(checkbox_1.Checkbox, { checked: false, onPress: noop }));
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: measure_1.measureStyles.ghost, pointerEvents: "none", children: columns.map(({ col, key: colKey }) => {
            const isHost = selection != null && String(col.dataIndex) === selection.mergeIntoDataIndex;
            // sorter 列真实表头带排序箭头区，测宽时用相同图标（自定义则用其 null 态真实宽，否则等宽占位）补齐
            const headerContent = ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.headerContentRow, children: [(0, cell_1.renderHeaderContent)(col, theme.text, headerTextStyle), col.sorter
                        ? renderSortIcon
                            ? renderSortIcon(null)
                            : (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.sortIconPlaceholder })
                        : null] }));
            return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: measure_1.measureStyles.columnStack, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [(0, cell_1.composeHeaderCellStyle)({ col, cellStyle }), cellBorderStyle], onLayout: (e) => collect(colKey, `${colKey}:__header__`, e), children: isHost
                            ? (0, cell_1.renderSelectionCell)({
                                checkbox: headerCheckboxNode,
                                content: headerContent,
                                align: selection === null || selection === void 0 ? void 0 : selection.checkboxAlign,
                            })
                            : headerContent }), entries.map(({ item, index, key }) => {
                        const content = (0, cell_1.renderCellContent)(col, item, index, theme.text, cellTextStyle);
                        return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [(0, cell_1.composeCellStyle)({ col, cellStyle, record: { item, index } }), cellBorderStyle], onLayout: (e) => collect(colKey, `${colKey}:${key}`, e), children: isHost
                                ? (0, cell_1.renderSelectionCell)({
                                    checkbox: rowCheckboxNode(item),
                                    content,
                                    align: selection === null || selection === void 0 ? void 0 : selection.checkboxAlign,
                                })
                                : content }, key));
                    })] }, colKey));
        }) }));
}
const styles = react_native_1.StyleSheet.create({
    headerContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sortIconPlaceholder: {
        width: cell_1.SORT_ICON_WIDTH,
    },
});
