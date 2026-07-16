"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.headerTextBase = exports.SORT_ICON_WIDTH = exports.DEFAULT_COLUMN_WIDTH = void 0;
exports.columnKey = columnKey;
exports.composeCellStyle = composeCellStyle;
exports.composeHeaderCellStyle = composeHeaderCellStyle;
exports.renderCellContent = renderCellContent;
exports.renderHeaderContent = renderHeaderContent;
exports.composeSubCellStyle = composeSubCellStyle;
exports.renderSubCellContent = renderSubCellContent;
exports.renderSelectionCell = renderSelectionCell;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
/** 列既无 width、无 minWidth、又尚未测绘完成时的兜底宽度 */
exports.DEFAULT_COLUMN_WIDTH = 100;
/** 排序箭头区占宽：真实表头与幽灵测绘必须使用同一值，否则 sorter 列测宽偏小导致换行 */
exports.SORT_ICON_WIDTH = 16;
/** 列的稳定标识，用作测绘宽度缓存的 key */
function columnKey(col, index) {
    return `${String(col.dataIndex)}#${index}`;
}
/**
 * 合成单元格样式链，优先级从低到高：
 * 内置基础样式 → 全局 cellStyle → 列 cellStyle → renderCellStyle(record, index)。
 * 幽灵测绘区与真实单元格必须共用此函数，padding / 边框等宽度影响才会被测算在内。
 * 注意：返回值不含 width —— 真实单元格由外层追加最终列宽，幽灵区保持自然宽度。
 */
function composeCellStyle(opts) {
    const { col, cellStyle, record } = opts;
    return [
        styles.cellBase,
        cellStyle,
        col.cellStyle,
        record && col.renderCellStyle
            ? col.renderCellStyle(record.item, record.index)
            : undefined,
    ];
}
/**
 * 合成表头单元格样式链，优先级从低到高：
 * 内置基础样式 → 全局 cellStyle → 列 cellStyle（与数据单元格共享）→ 列 headerCellStyle（表头独有）。
 * 与 composeCellStyle 并列，供真实表头与幽灵测绘共用，确保表头列宽测算一致。
 */
function composeHeaderCellStyle(opts) {
    const { col, cellStyle } = opts;
    return [styles.cellBase, cellStyle, col.cellStyle, col.headerCellStyle];
}
/**
 * 渲染单元格内容：优先走列的自定义 render，否则按 dataIndex 取值渲染为文本。
 * 注意：不使用 numberOfLines 截断，宽度由幽灵测绘保证。
 */
function renderCellContent(col, record, index, textColor, cellTextStyle) {
    if (col.render) {
        return col.render(record, index);
    }
    const value = record[col.dataIndex];
    return ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.cellText, { color: textColor }, cellTextStyle], children: value == null ? '' : String(value) }));
}
/**
 * 渲染表头单元格内容：优先走列的自定义 renderHeader，否则默认标题文本。
 * 真实表头与幽灵测绘共用此函数，保证自定义表头的测算宽度与实际渲染一致。
 * 文字样式链：headerTextBase → 全局 headerTextStyle → 列 headerTextStyle（仅默认文本渲染时生效）。
 */
function renderHeaderContent(col, textColor, headerTextStyle) {
    if (col.renderHeader) {
        return col.renderHeader();
    }
    return ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [exports.headerTextBase, { color: textColor }, headerTextStyle, col.headerTextStyle], children: col.title }));
}
/**
 * 子表单元格样式链，优先级从低到高：
 * 内置基础样式 → 子表全局 cellStyle → 子列 cellStyle → renderCellStyle(row, index)。
 * 与父表 composeCellStyle 对称，供子表真实单元格与子测量区共用。
 */
function composeSubCellStyle(opts) {
    const { col, cellStyle, row } = opts;
    return [
        styles.cellBase,
        cellStyle,
        col.cellStyle,
        row && col.renderCellStyle ? col.renderCellStyle(row.item, row.index) : undefined,
    ];
}
/** 渲染子表单元格内容：优先 render，否则按 dataIndex 取值渲染文本 */
function renderSubCellContent(col, row, index, textColor, cellTextStyle) {
    if (col.render) {
        return col.render(row, index);
    }
    if (col.dataIndex == null)
        return null;
    const value = row[col.dataIndex];
    return ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.cellText, { color: textColor }, cellTextStyle], children: value == null ? '' : String(value) }));
}
const selectionAlignMap = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
};
/**
 * 合并模式下选择框与原内容的组合渲染：[选择框][原内容] 横向排布。
 * 供行单元格、表头单元格、幽灵测绘三处共用——checkbox 一并进入测宽，列宽不会被挤爆。
 */
function renderSelectionCell({ checkbox, content, align = 'center', }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: [styles.selectionMergeRow, { alignItems: selectionAlignMap[align] }], children: [checkbox, (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.selectionMergeContent, children: content })] }));
}
const styles = react_native_1.StyleSheet.create({
    cellBase: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    // 文字颜色由调用方经 textColor 注入（主题解耦），此处只定尺寸/字重
    cellText: {
        fontSize: 14,
    },
    headerText: {
        fontSize: 14,
        fontWeight: '600',
    },
    selectionMergeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    selectionMergeContent: {
        flexShrink: 1,
    },
});
/** 表头文字基础样式：真实表头与幽灵测绘必须共用同一份，否则字号/字重不一致导致测宽偏差 */
exports.headerTextBase = styles.headerText;
