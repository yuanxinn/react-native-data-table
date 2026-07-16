"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useExpandable = useExpandable;
const react_1 = require("react");
/**
 * 折叠展开行 + 子表异步取数：展开集合、按行 key 缓存的取数状态、重试。
 * 取数/展开决策依赖最新 props，经 ref 透传使回调恒稳定（TableRow memo 友好）。
 */
function useExpandable({ expandedRowType, onExpandFetch, data, keyExtractor, onFetchStart, }) {
    const [expandedKeys, setExpandedKeys] = (0, react_1.useState)(new Set());
    const [asyncState, setAsyncState] = (0, react_1.useState)({});
    const expandedKeysRef = (0, react_1.useRef)(expandedKeys);
    const asyncStateRef = (0, react_1.useRef)(asyncState);
    const expandCfgRef = (0, react_1.useRef)({ expandedRowType, onExpandFetch, data, keyExtractor });
    (0, react_1.useEffect)(() => {
        expandedKeysRef.current = expandedKeys;
        asyncStateRef.current = asyncState;
        expandCfgRef.current = { expandedRowType, onExpandFetch, data, keyExtractor };
    });
    // key → 行下标：首次取数时按当前 data 惰性建表并缓存，data 更换即失效重建
    const keyIndexCacheRef = (0, react_1.useRef)(null);
    const getRowIndex = (0, react_1.useCallback)((key) => {
        var _a;
        const { data: d, keyExtractor: ke } = expandCfgRef.current;
        let cache = keyIndexCacheRef.current;
        if (!cache || cache.data !== d) {
            const map = new Map();
            d.forEach((item, i) => map.set(ke(item, i), i));
            cache = { data: d, map };
            keyIndexCacheRef.current = cache;
        }
        return (_a = cache.map.get(key)) !== null && _a !== void 0 ? _a : -1;
    }, []);
    const fetchSub = (0, react_1.useCallback)((key, record, rowIndex) => {
        const { onExpandFetch: fetch } = expandCfgRef.current;
        if (!fetch)
            return;
        setAsyncState((prev) => ({ ...prev, [key]: { status: 'loading' } }));
        onFetchStart === null || onFetchStart === void 0 ? void 0 : onFetchStart(key);
        fetch(record, rowIndex).then((result) => setAsyncState((prev) => ({ ...prev, [key]: { status: 'done', data: result } })), (error) => setAsyncState((prev) => ({ ...prev, [key]: { status: 'error', error } })));
    }, [onFetchStart]);
    const handleToggleExpand = (0, react_1.useCallback)((key) => {
        const cfg = expandCfgRef.current;
        const wasExpanded = expandedKeysRef.current.has(key);
        setExpandedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key))
                next.delete(key);
            else
                next.add(key);
            return next;
        });
        // 首次展开 sub-table + 配了异步取数 + 无缓存 → 触发取数
        if (!wasExpanded &&
            cfg.expandedRowType === 'sub-table' &&
            cfg.onExpandFetch &&
            !asyncStateRef.current[key]) {
            const idx = getRowIndex(key);
            if (idx >= 0)
                fetchSub(key, cfg.data[idx], idx);
        }
    }, [getRowIndex, fetchSub]);
    const handleRetryFetch = (0, react_1.useCallback)((key) => {
        const cfg = expandCfgRef.current;
        const idx = getRowIndex(key);
        if (idx >= 0)
            fetchSub(key, cfg.data[idx], idx);
    }, [getRowIndex, fetchSub]);
    return { expandedKeys, asyncState, handleToggleExpand, handleRetryFetch };
}
