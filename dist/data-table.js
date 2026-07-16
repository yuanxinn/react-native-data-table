"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTable = DataTable;
const jsx_runtime_1 = require("react/jsx-runtime");
const flash_list_1 = require("@shopify/flash-list");
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const border_1 = require("./border");
const cell_1 = require("./cell");
const column_layout_1 = require("./column-layout");
const ghost_measurer_1 = require("./ghost-measurer");
const header_row_1 = require("./header-row");
const table_row_1 = require("./table-row");
const theme_1 = require("./theme");
const use_column_measure_1 = require("./use-column-measure");
const use_expandable_1 = require("./use-expandable");
const use_row_selection_1 = require("./use-row-selection");
const IS_WEB = react_native_1.Platform.OS === 'web';
/** 吸顶表头哨兵：注入 FlashList 首位，走 stickyHeaderIndices=[0] 原生吸顶 */
const HEADER_SENTINEL = '__DATA_TABLE_HEADER__';
/** ListHeader/Footer/Empty 兼容「组件类型」与「元素」两种传法 */
function renderNode(node) {
    if (!node)
        return null;
    return react_1.default.isValidElement(node) ? node : react_1.default.createElement(node);
}
function DataTable({ data, columns, keyExtractor, remeasureKey, height, maxHeight, striped, stripeColors, highlightOnRowPress, highlightColor, rowSelection, stickyHeader = true, ref, onSort, currentSort, renderSortIcon, refreshing, onRefresh, onEndReached, onEndReachedThreshold, ListHeaderComponent, ListFooterComponent, ListEmptyComponent, expandedRowType = 'custom', expandedRowStyle, renderExpandedRow, onExpandFetch, getSubTable, isExpandedDataEmpty, renderExpandedLoading, renderExpandedError, renderExpandedEmpty, subTableSyncScroll = true, subTableSyncFixedColumns = true, border, theme, style, headerStyle, headerTextStyle, rowStyle, cellStyle, cellTextStyle, }) {
    var _a;
    // 主题色注入：与内置默认深合并，全部子组件经 Context 读取（解耦项目配色）
    const mergedTheme = (0, react_1.useMemo)(() => (0, theme_1.resolveTheme)(theme), [theme]);
    // H5 横向同步：所有行/表头的横向 ScrollView 注册于此，任一滚动即广播
    const [registry] = (0, react_1.useState)(() => new Set());
    const offsetRef = (0, react_1.useRef)(0);
    // H5 当前用户正在操作的滚动器（唯一广播源）
    const activeRef = (0, react_1.useRef)(null);
    // App 端整张表只使用一个横向滚动值，固定列不再持有可被 FlashList 复用的行级状态。
    const [nativeScrollX] = (0, react_1.useState)(() => new react_native_1.Animated.Value(0));
    const handleNativeHorizontalScroll = (0, react_1.useMemo)(() => react_native_1.Animated.event([{ nativeEvent: { contentOffset: { x: nativeScrollX } } }], {
        useNativeDriver: !IS_WEB,
    }), [nativeScrollX]);
    const stripePair = (0, react_1.useMemo)(() => stripeColors !== null && stripeColors !== void 0 ? stripeColors : [mergedTheme.rowBg, mergedTheme.headerBg], [stripeColors, mergedTheme.rowBg, mergedTheme.headerBg]);
    const pressHighlightColor = highlightOnRowPress
        ? (highlightColor !== null && highlightColor !== void 0 ? highlightColor : mergedTheme.primaryLight)
        : undefined;
    // ---- 弹性容器撑满：动态获取表格可用总宽度 ----
    const [containerWidth, setContainerWidth] = (0, react_1.useState)(0);
    const handleContainerLayout = (0, react_1.useCallback)((e) => {
        setContainerWidth(e.nativeEvent.layout.width);
    }, []);
    // ---- 列装配：按行选择诉求注入/合并选择框，左固定归位最前、右固定归位最后 ----
    // 选择模式开关 = rowSelection 传/不传，切换经 selectionSignature 进测绘签名 → 自动走原地重测
    // （独立选择列还会改变列下标；合并模式列 key 不变，全靠签名段触发）
    const hasSelection = rowSelection != null;
    const selectionPosition = (_a = rowSelection === null || rowSelection === void 0 ? void 0 : rowSelection.position) !== null && _a !== void 0 ? _a : 'first';
    const mergeIntoDataIndex = rowSelection === null || rowSelection === void 0 ? void 0 : rowSelection.mergeIntoDataIndex;
    const { columns: mergedColumns, mergeIntoDataIndex: mergeHostDataIndex } = (0, react_1.useMemo)(() => (0, column_layout_1.mergeColumns)(columns, hasSelection ? { position: selectionPosition, mergeIntoDataIndex } : null), [columns, hasSelection, selectionPosition, mergeIntoDataIndex]);
    // ---- 幽灵渲染增量测绘（状态机见 use-column-measure.ts） ----
    const autoColumns = (0, react_1.useMemo)(() => mergedColumns
        .map((col, i) => ({ col, key: (0, cell_1.columnKey)(col, i) }))
        .filter(({ col }) => col.width == null), [mergedColumns]);
    // 选择状态签名：合并模式的选择框显隐不改列 key，须显式并入测绘签名触发原地重测
    const selectionSignature = hasSelection ? `sel:${mergeHostDataIndex !== null && mergeHostDataIndex !== void 0 ? mergeHostDataIndex : '__column__'}` : 'none';
    const { measuredWidths, displayData, hasPending, isRemeasuring, pendingGhost, remeasureGhost, subMeasuredKeys, handleSubMeasured, invalidateSubMeasured, } = (0, use_column_measure_1.useColumnMeasure)({ data, keyExtractor, autoColumns, remeasureKey, selectionSignature });
    // ---- 列宽解析（主体只用明确 width 布局，绝不使用 flex 伸展） ----
    const { resolved, totalWidth } = (0, react_1.useMemo)(() => (0, column_layout_1.resolveColumnLayout)(mergedColumns, measuredWidths, containerWidth, mergeHostDataIndex), [mergedColumns, measuredWidths, containerWidth, mergeHostDataIndex]);
    // 右固定列钉边所需的最大横向滚动距离；容器未测出前按 0 处理避免首帧漂移
    const maxScroll = containerWidth > 0 ? Math.max(0, totalWidth - containerWidth) : 0;
    // 子表 renderExpandedRow / SubTable 复用的父表最终列宽（视觉顺序，和为 totalWidth）
    const columnWidths = (0, react_1.useMemo)(() => resolved.map((c) => c.width), [resolved]);
    // ---- 边框：解析为行/单元格/外框三类样式 ----
    const borderStyles = (0, react_1.useMemo)(() => (0, border_1.resolveBorder)(border, mergedTheme.line), [border, mergedTheme.line]);
    // ---- 行选择（状态与回调见 use-row-selection.ts） ----
    const { selectAll, clearSelection, selectedSet, allChecked, someChecked, selectableCount, handleToggleSelect, handleToggleAll, } = (0, use_row_selection_1.useRowSelection)({ data, keyExtractor, rowSelection });
    // ---- 命令式句柄：行选择方法 + 纵向回顶（数据变短时滚动偏移可能越界留白，切筛选场景用） ----
    const listRef = (0, react_1.useRef)(null);
    react_1.default.useImperativeHandle(ref, () => ({
        selectAll,
        clearSelection,
        scrollToTop: () => { var _a; return (_a = listRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({ offset: 0, animated: false }); },
    }), [selectAll, clearSelection]);
    // ---- 排序：受控轮转 null → ascend → descend → null ----
    const handleSortPress = (0, react_1.useCallback)((dataIndex) => {
        if (!onSort)
            return;
        const cur = (currentSort === null || currentSort === void 0 ? void 0 : currentSort.dataIndex) === dataIndex ? currentSort.order : null;
        const order = cur === null ? 'ascend' : cur === 'ascend' ? 'descend' : null;
        onSort({ dataIndex, order });
    }, [onSort, currentSort]);
    // ---- 折叠展开行 + 子表异步取数（见 use-expandable.ts） ----
    const { expandedKeys, asyncState, handleToggleExpand, handleRetryFetch } = (0, use_expandable_1.useExpandable)({
        expandedRowType,
        onExpandFetch,
        data,
        keyExtractor,
        onFetchStart: invalidateSubMeasured,
    });
    const expandable = expandedRowType === 'sub-table' ? getSubTable != null : renderExpandedRow != null;
    // getSubTable / isExpandedDataEmpty 以 unknown 收敛给 TableRow（内部按 D 使用）
    const getSubTableForRow = getSubTable;
    const isEmptyForRow = isExpandedDataEmpty;
    const renderExpandedRowForRow = renderExpandedRow;
    // ---- FlashList 数据装配：首位注入表头哨兵实现吸顶 ----
    // 行 key 一次性预计算：FlashList 滚动期间高频调 keyExtractor，避免每次都回调用户函数
    const { listData, listKeys } = (0, react_1.useMemo)(() => {
        const items = [HEADER_SENTINEL];
        const keys = [HEADER_SENTINEL];
        displayData.forEach((item, i) => {
            items.push(item);
            keys.push(keyExtractor(item, i));
        });
        return { listData: items, listKeys: keys };
    }, [displayData, keyExtractor]);
    const listKeyExtractor = (0, react_1.useCallback)((_item, index) => listKeys[index], [listKeys]);
    // 表头与数据行结构不同，分池回收
    const getItemType = (0, react_1.useCallback)((item) => (item === HEADER_SENTINEL ? 'header' : 'row'), []);
    const renderItem = (0, react_1.useCallback)(({ item, index }) => {
        var _a, _b, _c, _d, _e;
        if (item === HEADER_SENTINEL) {
            return ((0, jsx_runtime_1.jsx)(header_row_1.HeaderRow, { resolved: resolved, totalWidth: totalWidth, maxScroll: maxScroll, nativeScrollX: nativeScrollX, registry: registry, offsetRef: offsetRef, activeRef: activeRef, headerStyle: headerStyle, headerTextStyle: headerTextStyle, cellStyle: cellStyle, cellBorderStyle: borderStyles.cell, rowBorderStyle: borderStyles.row, currentSort: currentSort, onSortPress: handleSortPress, renderSortIcon: renderSortIcon, allChecked: allChecked, someChecked: someChecked, selectionDisabled: selectableCount === 0, onToggleAll: handleToggleAll, renderHeaderCheckbox: rowSelection === null || rowSelection === void 0 ? void 0 : rowSelection.renderHeaderCheckbox, checkboxAlign: rowSelection === null || rowSelection === void 0 ? void 0 : rowSelection.checkboxAlign }));
        }
        const dataIndex = index - 1;
        const record = item;
        const key = listKeys[index];
        return ((0, jsx_runtime_1.jsx)(table_row_1.TableRow, { item: record, index: dataIndex, itemKey: key, resolved: resolved, columnWidths: columnWidths, totalWidth: totalWidth, containerWidth: containerWidth, maxScroll: maxScroll, nativeScrollX: nativeScrollX, registry: registry, offsetRef: offsetRef, activeRef: activeRef, cellStyle: cellStyle, cellTextStyle: cellTextStyle, cellBorderStyle: borderStyles.cell, rowBorderStyle: borderStyles.row, expanded: expandedKeys.has(key), expandable: expandable, onToggleExpand: handleToggleExpand, rowStyle: rowStyle, rowBackground: striped ? stripePair[dataIndex % 2] : undefined, highlightColor: pressHighlightColor, selected: hasSelection && selectedSet.has(key), selectionDisabled: hasSelection ? (_b = (_a = rowSelection === null || rowSelection === void 0 ? void 0 : rowSelection.getCheckboxProps) === null || _a === void 0 ? void 0 : _a.call(rowSelection, record)) === null || _b === void 0 ? void 0 : _b.disabled : undefined, onToggleSelect: handleToggleSelect, renderCheckbox: rowSelection === null || rowSelection === void 0 ? void 0 : rowSelection.renderCheckbox, checkboxAlign: rowSelection === null || rowSelection === void 0 ? void 0 : rowSelection.checkboxAlign, expandedRowType: expandedRowType, expandedRowStyle: expandedRowStyle, renderExpandedRow: renderExpandedRowForRow, getSubTable: getSubTableForRow, isExpandedDataEmpty: isEmptyForRow, renderExpandedLoading: renderExpandedLoading, renderExpandedError: renderExpandedError, renderExpandedEmpty: renderExpandedEmpty, subTableSyncScroll: subTableSyncScroll, subTableSyncFixedColumns: subTableSyncFixedColumns, subStatus: (_c = asyncState[key]) === null || _c === void 0 ? void 0 : _c.status, subData: (_d = asyncState[key]) === null || _d === void 0 ? void 0 : _d.data, subError: (_e = asyncState[key]) === null || _e === void 0 ? void 0 : _e.error, subMeasured: subMeasuredKeys.has(key), onSubMeasured: handleSubMeasured, onRetryFetch: handleRetryFetch }));
    }, [
        totalWidth,
        containerWidth,
        maxScroll,
        resolved,
        nativeScrollX,
        registry,
        headerStyle,
        headerTextStyle,
        cellStyle,
        cellTextStyle,
        borderStyles,
        columnWidths,
        listKeys,
        expandedKeys,
        expandable,
        handleToggleExpand,
        rowStyle,
        striped,
        stripePair,
        pressHighlightColor,
        hasSelection,
        selectedSet,
        rowSelection,
        handleToggleSelect,
        allChecked,
        someChecked,
        selectableCount,
        handleToggleAll,
        currentSort,
        handleSortPress,
        renderSortIcon,
        expandedRowType,
        expandedRowStyle,
        renderExpandedRowForRow,
        getSubTableForRow,
        isEmptyForRow,
        renderExpandedLoading,
        renderExpandedError,
        renderExpandedEmpty,
        subTableSyncScroll,
        subTableSyncFixedColumns,
        asyncState,
        subMeasuredKeys,
        handleSubMeasured,
        handleRetryFetch,
    ]);
    // 幽灵区扣留数据或原地重测期间不触发加载更多，避免重复请求同一页与重测竞态
    const handleEndReached = (0, react_1.useCallback)(() => {
        if (hasPending || isRemeasuring)
            return;
        onEndReached === null || onEndReached === void 0 ? void 0 : onEndReached();
    }, [hasPending, isRemeasuring, onEndReached]);
    // 选中集合、排序状态、斑马纹/高亮配置变化都要让可视区行重新走一遍 renderItem
    // （TableRow memo 会拦下 props 未变的行，万级数据下只有受影响行真正重渲染）
    const extraData = (0, react_1.useMemo)(() => ({
        resolved,
        expandedKeys,
        cellStyle,
        cellTextStyle,
        maxScroll,
        selectedSet,
        currentSort,
        renderSortIcon,
        striped,
        stripePair,
        pressHighlightColor,
        borderStyles,
        asyncState,
        subMeasuredKeys,
    }), [
        resolved,
        expandedKeys,
        cellStyle,
        cellTextStyle,
        maxScroll,
        selectedSet,
        currentSort,
        renderSortIcon,
        striped,
        stripePair,
        pressHighlightColor,
        borderStyles,
        asyncState,
        subMeasuredKeys,
    ]);
    // 哨兵行使 listData 恒非空，FlashList 自身空态永不触发，空态注入 footer 区域
    const listFooter = (0, react_1.useMemo)(() => {
        const emptyNode = data.length === 0 ? renderNode(ListEmptyComponent) : null;
        const footerNode = renderNode(ListFooterComponent);
        if (!emptyNode && !footerNode)
            return null;
        return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [emptyNode, footerNode] }));
    }, [data.length, ListEmptyComponent, ListFooterComponent]);
    // App 端页面级头/尾：随纵向滚动、反向补偿横向滚动 → 占满视口横滑固定不动
    const wrapFixedHorizontal = (0, react_1.useCallback)((node) => node ? ((0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: {
            width: containerWidth || totalWidth,
            transform: [{ translateX: nativeScrollX }],
        }, children: node })) : null, [containerWidth, nativeScrollX, totalWidth]);
    const nativeListHeader = (0, react_1.useMemo)(() => wrapFixedHorizontal(renderNode(ListHeaderComponent)), [wrapFixedHorizontal, ListHeaderComponent]);
    const nativeListFooter = (0, react_1.useMemo)(() => wrapFixedHorizontal(listFooter), [wrapFixedHorizontal, listFooter]);
    // 合并模式下宿主列的选择框须一并进入幽灵测宽
    const ghostSelection = (0, react_1.useMemo)(() => mergeHostDataIndex != null && rowSelection
        ? {
            mergeIntoDataIndex: mergeHostDataIndex,
            renderCheckbox: rowSelection.renderCheckbox,
            renderHeaderCheckbox: rowSelection.renderHeaderCheckbox,
            checkboxAlign: rowSelection.checkboxAlign,
        }
        : null, [mergeHostDataIndex, rowSelection]);
    // 首测/重测两条通道共用的测绘环境（批次数据与回调由各自 GhostBatch 提供）
    const ghostShared = {
        columns: autoColumns,
        headerTextStyle,
        cellStyle,
        cellTextStyle,
        renderSortIcon,
        selection: ghostSelection,
        cellBorderStyle: borderStyles.cell,
    };
    // 高度策略：height 定死 > maxHeight 内自然撑高 > 默认随父 flex 撑满
    const sizeStyle = height != null
        ? { height }
        : maxHeight != null
            ? { maxHeight, flexGrow: 1, flexShrink: 1 }
            : { flex: 1 };
    const tableList = ((0, jsx_runtime_1.jsx)(flash_list_1.FlashList, { ref: listRef, data: listData, renderItem: renderItem, keyExtractor: listKeyExtractor, getItemType: getItemType, stickyHeaderIndices: stickyHeader ? [0] : undefined, extraData: extraData, refreshing: refreshing, onRefresh: onRefresh, onEndReached: handleEndReached, onEndReachedThreshold: onEndReachedThreshold, nestedScrollEnabled: !IS_WEB, ListHeaderComponent: IS_WEB ? ListHeaderComponent : nativeListHeader, ListFooterComponent: IS_WEB ? listFooter : nativeListFooter }));
    return ((0, jsx_runtime_1.jsx)(theme_1.DataTableThemeProvider, { value: mergedTheme, children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: [sizeStyle, styles.container, borderStyles.outer, style], onLayout: handleContainerLayout, children: [IS_WEB ? (tableList) : ((0, jsx_runtime_1.jsx)(react_native_1.Animated.ScrollView, { style: styles.nativeHorizontalScroller, contentContainerStyle: styles.nativeHorizontalContent, horizontal: true, bounces: false, directionalLockEnabled: true, nestedScrollEnabled: true, showsHorizontalScrollIndicator: false, scrollEventThrottle: 16, onScroll: handleNativeHorizontalScroll, children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.nativeTableContent, { width: totalWidth }], children: tableList }) })), pendingGhost ? ((0, jsx_runtime_1.jsx)(ghost_measurer_1.GhostMeasurer, { entries: pendingGhost.entries, onMeasured: pendingGhost.onMeasured, ...ghostShared }, pendingGhost.key)) : null, remeasureGhost ? ((0, jsx_runtime_1.jsx)(ghost_measurer_1.GhostMeasurer, { entries: remeasureGhost.entries, onMeasured: remeasureGhost.onMeasured, ...ghostShared }, remeasureGhost.key)) : null] }) }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    nativeHorizontalScroller: {
        flex: 1,
    },
    nativeHorizontalContent: {
        height: '100%',
    },
    nativeTableContent: {
        height: '100%',
    },
});
