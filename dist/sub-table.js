"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubTableMeasurer = exports.SubTable = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const cell_1 = require("./cell");
const cell_box_1 = require("./cell-box");
const measure_1 = require("./measure");
const theme_1 = require("./theme");
/** 取某个父列位置起 span 个列宽之和（colSpan 用） */
function spanWidth(resolved, start, span) {
    let w = 0;
    for (let i = start; i < start + span && i < resolved.length; i += 1)
        w += resolved[i].width;
    return w;
}
/**
 * 子表实体渲染：按父表「视觉列序」铺子行——命中的子列走 CellBox（复用父列宽/固定钉住），
 * 未定义的父列填等宽空占位保持对齐。字段/结构与父表独立，逐格 render / 样式可自定义。
 */
function SubTableInner({ spec, resolved, totalWidth, scrollX, maxScroll, syncFixedColumns, fixedBg, cellBorderStyle, rowBorderStyle, }) {
    const theme = (0, theme_1.useDataTableTheme)();
    // 子列按 colIndex 建表，避免每行每列线性查找；重复 colIndex 以先声明者为准（与 find 语义一致）
    const colByIndex = (0, react_1.useMemo)(() => {
        const m = new Map();
        spec.columns.forEach((c) => {
            if (!m.has(c.colIndex))
                m.set(c.colIndex, c);
        });
        return m;
    }, [spec.columns]);
    const renderRow = (row, rowIndex) => {
        var _a, _b;
        const cells = [];
        let i = 0;
        while (i < resolved.length) {
            const subCol = colByIndex.get(i);
            const span = subCol ? Math.max(1, (_a = subCol.colSpan) !== null && _a !== void 0 ? _a : 1) : 1;
            const base = resolved[i];
            // 合成一个供 CellBox 使用的解析列：宽度取 span 之和、对齐可被子列覆盖、固定可被开关剥离
            const rc = {
                ...base,
                width: span > 1 ? spanWidth(resolved, i, span) : base.width,
                fixed: syncFixedColumns ? base.fixed : undefined,
                col: { ...base.col, align: (_b = subCol === null || subCol === void 0 ? void 0 : subCol.align) !== null && _b !== void 0 ? _b : base.col.align },
            };
            const effectiveCol = subCol !== null && subCol !== void 0 ? subCol : { colIndex: i };
            cells.push((0, jsx_runtime_1.jsx)(cell_box_1.CellBox, { rc: rc, scrollX: scrollX, maxScroll: maxScroll, fixedBgColor: fixedBg, cellBorderStyle: cellBorderStyle, contentStyle: (0, cell_1.composeSubCellStyle)({
                    col: effectiveCol,
                    cellStyle: spec.cellStyle,
                    row: { item: row, index: rowIndex },
                }), children: subCol
                    ? (0, cell_1.renderSubCellContent)(effectiveCol, row, rowIndex, theme.text, spec.cellTextStyle)
                    : null }, i));
            i += span;
        }
        return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [{ width: totalWidth, flexDirection: 'row' }, rowBorderStyle, spec.rowStyle], children: cells }, rowIndex));
    };
    return (0, jsx_runtime_1.jsx)(react_native_1.View, { style: { width: totalWidth }, children: spec.rows.map(renderRow) });
}
exports.SubTable = SubTableInner;
/**
 * 子表离屏测量：把子格内容按自然宽度渲染在离屏区，onLayout 收集，
 * 并入父表 measuredWidths（取 max）撑宽对应自适应列。仅测 colSpan=1 且父列为自适应（width==null）的子列。
 */
function SubTableMeasurerInner({ spec, resolved, cellStyle, cellBorderStyle, onMeasured, }) {
    const theme = (0, theme_1.useDataTableTheme)();
    // 仅测 colSpan=1 且父列为自适应（width==null）的子列
    const targets = spec.columns.filter((c) => { var _a, _b; return ((_a = c.colSpan) !== null && _a !== void 0 ? _a : 1) === 1 && ((_b = resolved[c.colIndex]) === null || _b === void 0 ? void 0 : _b.col.width) == null; });
    const expected = targets.length * spec.rows.length;
    const collect = (0, measure_1.useMeasure)(expected, onMeasured);
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: measure_1.measureStyles.ghost, pointerEvents: "none", children: targets.map((subCol) => {
            const base = resolved[subCol.colIndex];
            const colKey = base.key;
            return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: measure_1.measureStyles.columnStack, children: spec.rows.map((row, ri) => ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                        (0, cell_1.composeSubCellStyle)({
                            col: subCol,
                            cellStyle,
                            row: { item: row, index: ri },
                        }),
                        cellBorderStyle,
                    ], onLayout: (e) => collect(colKey, `${colKey}:${ri}`, e), children: (0, cell_1.renderSubCellContent)(subCol, row, ri, theme.text, spec.cellTextStyle) }, ri))) }, colKey));
        }) }));
}
exports.SubTableMeasurer = SubTableMeasurerInner;
