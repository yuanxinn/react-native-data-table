"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRowSelection = useRowSelection;
const react_1 = require("react");
/** 遍历未被 getCheckboxProps 禁用的行，按 data 顺序回吐其 key（全选范围） */
function selectableKeysOf(data, keyExtractor, rowSelection) {
    if (!rowSelection)
        return [];
    const keys = [];
    data.forEach((item, i) => {
        var _a, _b;
        if (!((_b = (_a = rowSelection.getCheckboxProps) === null || _a === void 0 ? void 0 : _a.call(rowSelection, item)) === null || _b === void 0 ? void 0 : _b.disabled))
            keys.push(keyExtractor(item, i));
    });
    return keys;
}
/** 按 data 顺序回吐选中的 keys/rows，剔除已不在数据源中的残留 key */
function emitSelection(data, keyExtractor, rowSelection, selected) {
    const keys = [];
    const rows = [];
    data.forEach((item, i) => {
        const k = keyExtractor(item, i);
        if (selected.has(k)) {
            keys.push(k);
            rows.push(item);
        }
    });
    rowSelection.onChange(keys, rows);
}
/**
 * 行选择状态：单行切换、表头全选/反选、selectAll / clearSelection
 * （命令式句柄由 data-table 统一组装）。
 * 切换回调必须恒稳定（TableRow memo 依赖），最新数据经 selectionStateRef 透传。
 */
function useRowSelection({ data, keyExtractor, rowSelection, }) {
    const selectedRowKeys = rowSelection === null || rowSelection === void 0 ? void 0 : rowSelection.selectedRowKeys;
    const selectedSet = (0, react_1.useMemo)(() => new Set(selectedRowKeys !== null && selectedRowKeys !== void 0 ? selectedRowKeys : []), [selectedRowKeys]);
    const selectionStateRef = (0, react_1.useRef)({ data, keyExtractor, rowSelection });
    (0, react_1.useEffect)(() => {
        selectionStateRef.current = { data, keyExtractor, rowSelection };
    });
    const handleToggleSelect = (0, react_1.useCallback)((key) => {
        const { data: d, keyExtractor: ke, rowSelection: rs } = selectionStateRef.current;
        if (!rs)
            return;
        const next = new Set(rs.selectedRowKeys);
        if (next.has(key)) {
            next.delete(key);
        }
        else {
            next.add(key);
        }
        emitSelection(d, ke, rs, next);
    }, []);
    // 全选范围 = 未被 getCheckboxProps 禁用的行
    const selectableKeys = (0, react_1.useMemo)(() => selectableKeysOf(data, keyExtractor, rowSelection), [data, keyExtractor, rowSelection]);
    const allChecked = selectableKeys.length > 0 && selectableKeys.every((k) => selectedSet.has(k));
    const someChecked = !allChecked && selectableKeys.some((k) => selectedSet.has(k));
    const handleToggleAll = (0, react_1.useCallback)(() => {
        if (!rowSelection)
            return;
        // 全选/反选只翻转可选行，已选中的禁用行保持原状
        const next = new Set(rowSelection.selectedRowKeys);
        if (allChecked) {
            selectableKeys.forEach((k) => next.delete(k));
        }
        else {
            selectableKeys.forEach((k) => next.add(k));
        }
        emitSelection(data, keyExtractor, rowSelection, next);
    }, [rowSelection, allChecked, selectableKeys, data, keyExtractor]);
    // ---- 命令式方法：经 selectionStateRef 读最新数据，回调恒稳定（由 data-table 装进 ref 句柄） ----
    const selectAll = (0, react_1.useCallback)(() => {
        const { data: d, keyExtractor: ke, rowSelection: rs } = selectionStateRef.current;
        if (!rs)
            return;
        // 全选未禁用行，已选中的禁用行保持原状
        const next = new Set(rs.selectedRowKeys);
        selectableKeysOf(d, ke, rs).forEach((k) => next.add(k));
        emitSelection(d, ke, rs, next);
    }, []);
    const clearSelection = (0, react_1.useCallback)(() => {
        const { data: d, keyExtractor: ke, rowSelection: rs } = selectionStateRef.current;
        if (!rs)
            return;
        // 只清可选行，禁用行的已选状态保留
        const next = new Set(rs.selectedRowKeys);
        selectableKeysOf(d, ke, rs).forEach((k) => next.delete(k));
        emitSelection(d, ke, rs, next);
    }, []);
    return {
        selectAll,
        clearSelection,
        selectedSet,
        allChecked,
        someChecked,
        /** 可选行数量（0 = 表头全选框禁用） */
        selectableCount: selectableKeys.length,
        handleToggleSelect,
        handleToggleAll,
    };
}
