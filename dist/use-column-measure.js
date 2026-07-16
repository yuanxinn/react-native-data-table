"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useColumnMeasure = useColumnMeasure;
const react_1 = require("react");
const column_layout_1 = require("./column-layout");
/** 幽灵测绘单批上限：超过则分批离屏挂载，避免大数据量一次性重帧 */
const MEASURE_BATCH_SIZE = 200;
/**
 * 幽灵测绘全链路状态机：
 * - 首测通道（pendingGhost）：新数据先进幽灵区，测绘完成后按批放行进入 FlashList；
 * - 原地重测通道（remeasureGhost）：测绘签名（remeasureKey + 选择状态 + 自适应列集合）变化时
 *   快照全量数据分批重测，完成后一次性替换列宽，行不下屏；
 * - 子表宽度并入（handleSubMeasured）：展开行子表测宽后并入 measuredWidths 撑宽自适应列，
 *   subMeasuredKeys 门控子表测完再上屏，列宽体系重算时整体作废。
 */
function useColumnMeasure({ data, keyExtractor, autoColumns, remeasureKey, selectionSignature, }) {
    const needsMeasure = autoColumns.length > 0;
    // __DEV__ 下检测重复行 key：重复 key 会让幽灵测绘门控永远测不满（onLayout 按 cellId 去重，
    // expected 凑不齐 → 行永远不上屏且无任何报错），FlashList 复用也会错乱。仅数据变化时检查一次。
    (0, react_1.useEffect)(() => {
        if (!__DEV__)
            return;
        const seen = new Set();
        const dups = new Set();
        data.forEach((item, i) => {
            const k = keyExtractor(item, i);
            if (seen.has(k))
                dups.add(k);
            else
                seen.add(k);
        });
        if (dups.size > 0) {
            console.warn(`[DataTable] keyExtractor 返回重复 key：${[...dups].map((k) => `"${k}"`).join('、')}。` +
                '重复 key 会导致测绘门控卡住（对应行永远不上屏），请保证行 key 唯一。');
        }
    }, [data, keyExtractor]);
    // 各列历史最大测绘宽度缓存
    const [measuredWidths, setMeasuredWidths] = (0, react_1.useState)({});
    // 已完成测绘、获准进入主列表的数据 key 集合
    const [measuredKeys, setMeasuredKeys] = (0, react_1.useState)(new Set());
    // 子表列宽已测的行 key（门控：测完再上屏 live 子表；列宽体系重算时作废）
    const [subMeasuredKeys, setSubMeasuredKeys] = (0, react_1.useState)(new Set());
    // 原地重测通道；null 表示未在重测
    const [remeasure, setRemeasure] = (0, react_1.useState)(null);
    // 以下两段为 React 认可的「渲染期随 props 派生 state」模式，不会渲染中间态。
    // ① 数据整体更换（如下拉刷新换新 key）后清理已不在数据源中的测绘 key，避免集合无限增长
    const [prevData, setPrevData] = (0, react_1.useState)(data);
    if (prevData !== data) {
        setPrevData(data);
        if (needsMeasure && measuredKeys.size > 0) {
            const current = new Set();
            data.forEach((item, i) => current.add(keyExtractor(item, i)));
            let changed = false;
            const next = new Set();
            measuredKeys.forEach((k) => {
                if (current.has(k)) {
                    next.add(k);
                }
                else {
                    changed = true;
                }
            });
            if (changed)
                setMeasuredKeys(next);
        }
    }
    // ② 测绘签名 = remeasureKey + 选择状态 + 自适应列集合。签名变化（字体档位调整、
    //    列增删/顺序变动、选择框显隐/合并宿主变更）时：
    //    已有行上屏则走原地重测通道——行保持旧列宽显示，快照全量数据分批离屏重测，
    //    完成后一次性替换列宽（不清 measuredKeys，行不下屏、纵向滚动不回顶）；
    //    尚无行上屏则直接作废缓存，走首次测绘流程。置于 ① 之后：同渲染同时触发时以本段为准。
    const autoKeysSignature = `${remeasureKey !== null && remeasureKey !== void 0 ? remeasureKey : ''}§${selectionSignature !== null && selectionSignature !== void 0 ? selectionSignature : ''}§${autoColumns.map((c) => c.key).join('|')}`;
    const [prevAutoKeysSignature, setPrevAutoKeysSignature] = (0, react_1.useState)(autoKeysSignature);
    if (prevAutoKeysSignature !== autoKeysSignature) {
        setPrevAutoKeysSignature(autoKeysSignature);
        // 列宽体系重算 → 子表列宽测量作废，展开的子表重新测量后再上屏
        setSubMeasuredKeys((prev) => (prev.size > 0 ? new Set() : prev));
        if (needsMeasure && measuredKeys.size > 0) {
            setRemeasure({
                entries: data.map((item, i) => ({ item, index: i, key: keyExtractor(item, i) })),
                cursor: 0,
                widths: {},
            });
        }
        else {
            setMeasuredWidths({});
            setMeasuredKeys(new Set());
            setRemeasure(null);
        }
    }
    // 增量拦截：新数据先进幽灵区，测绘完成后才放行进入 FlashList 数据源
    const { displayData, pending } = (0, react_1.useMemo)(() => {
        if (!needsMeasure) {
            return { displayData: data, pending: [] };
        }
        const display = [];
        const pend = [];
        data.forEach((item, i) => {
            const key = keyExtractor(item, i);
            if (measuredKeys.has(key)) {
                display.push(item);
            }
            else {
                pend.push({ item, index: i, key });
            }
        });
        return { displayData: display, pending: pend };
    }, [data, keyExtractor, needsMeasure, measuredKeys]);
    // 幽灵区单批切片：测完放行本批，pending 缩短后下一批自动进入，行分波上屏
    const pendingBatch = (0, react_1.useMemo)(() => pending.slice(0, MEASURE_BATCH_SIZE), [pending]);
    const handleMeasured = (0, react_1.useCallback)((batchWidths) => {
        // 对比合并：本批最大宽 vs 历史缓存最大宽，取最大值
        setMeasuredWidths((prev) => (0, column_layout_1.mergeMaxWidths)(prev, batchWidths));
        // 放行渲染：销毁幽灵区数据，正式追加进主列表
        setMeasuredKeys((prev) => {
            const next = new Set(prev);
            pendingBatch.forEach((entry) => next.add(entry.key));
            return next;
        });
        // 原地重测进行中：新上屏行的宽度同步并入重测累加器，最终整体替换时不丢失
        setRemeasure((prev) => prev ? { ...prev, widths: (0, column_layout_1.mergeMaxWidths)(prev.widths, batchWidths) } : prev);
    }, [pendingBatch]);
    // 重测批次完成：累入本批宽度并推进游标；全部完成则一次性替换列宽、关闭通道
    const handleRemeasured = (0, react_1.useCallback)((batchWidths) => {
        if (!remeasure)
            return;
        const widths = (0, column_layout_1.mergeMaxWidths)(remeasure.widths, batchWidths);
        const nextCursor = remeasure.cursor + MEASURE_BATCH_SIZE;
        if (nextCursor >= remeasure.entries.length) {
            // 整体替换而非合并：字体调小后列宽才缩得回去
            setMeasuredWidths(widths);
            setRemeasure(null);
        }
        else {
            setRemeasure({ entries: remeasure.entries, cursor: nextCursor, widths });
        }
    }, [remeasure]);
    // 子表测宽并入父表缓存，并放行该行的 live 子表
    const handleSubMeasured = (0, react_1.useCallback)((key, widths) => {
        setMeasuredWidths((prev) => (0, column_layout_1.mergeMaxWidths)(prev, widths));
        setSubMeasuredKeys((prev) => {
            if (prev.has(key))
                return prev;
            const next = new Set(prev);
            next.add(key);
            return next;
        });
    }, []);
    // 重新取数前作废该行子表测量（新数据须重测后再上屏）
    const invalidateSubMeasured = (0, react_1.useCallback)((key) => {
        setSubMeasuredKeys((prev) => {
            if (!prev.has(key))
                return prev;
            const next = new Set(prev);
            next.delete(key);
            return next;
        });
    }, []);
    const pendingGhost = (0, react_1.useMemo)(() => pendingBatch.length > 0
        ? {
            key: pendingBatch.map((entry) => entry.key).join('|'),
            entries: pendingBatch,
            onMeasured: handleMeasured,
        }
        : null, [pendingBatch, handleMeasured]);
    const remeasureGhost = (0, react_1.useMemo)(() => remeasure
        ? {
            key: `remeasure§${autoKeysSignature}§${remeasure.cursor}`,
            entries: remeasure.entries.slice(remeasure.cursor, remeasure.cursor + MEASURE_BATCH_SIZE),
            onMeasured: handleRemeasured,
        }
        : null, [remeasure, autoKeysSignature, handleRemeasured]);
    return {
        /** 各列历史最大测绘宽度，供 resolveColumnLayout 使用 */
        measuredWidths,
        /** 已测绘放行、可进入 FlashList 的数据 */
        displayData,
        /** 幽灵区仍扣留数据（测绘中），期间应屏蔽 onEndReached 防重复取页 */
        hasPending: pending.length > 0,
        /** 原地重测进行中，期间同样屏蔽 onEndReached 防竞态 */
        isRemeasuring: remeasure != null,
        /** 首测通道当前批次；null 表示无待测数据 */
        pendingGhost,
        /** 重测通道当前批次；null 表示未在重测 */
        remeasureGhost,
        subMeasuredKeys,
        handleSubMeasured,
        invalidateSubMeasured,
    };
}
