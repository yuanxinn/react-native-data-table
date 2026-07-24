import { FlashList, FlashListRef, ListRenderItemInfo } from '@shopify/flash-list';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { resolveBorder } from './border';
import { columnKey } from './cell';
import { mergeColumns, resolveColumnLayout } from './column-layout';
import { GhostMeasurer, GhostSelection } from './ghost-measurer';
import { HScrollerController } from './h-scroller';
import { HeaderRow } from './header-row';
import { TableRow } from './table-row';
import { DataTableThemeProvider, resolveTheme } from './theme';
import type {
  DataTableHandle,
  DataTableProps,
  SortParams,
  SubTableSpec,
} from './types';
import { useColumnMeasure } from './use-column-measure';
import { useExpandable } from './use-expandable';
import { useRowSelection } from './use-row-selection';

const IS_WEB = Platform.OS === 'web';

/** 吸顶表头哨兵：注入 FlashList 首位，走 stickyHeaderIndices=[0] 原生吸顶 */
const HEADER_SENTINEL = '__DATA_TABLE_HEADER__';
type ListItem<T> = T | typeof HEADER_SENTINEL;

/** ListHeader/Footer/Empty 兼容「组件类型」与「元素」两种传法 */
function renderNode(node?: React.ComponentType | React.ReactElement | null): React.ReactElement | null {
  if (!node) return null;
  return React.isValidElement(node) ? node : React.createElement(node as React.ComponentType);
}

export function DataTable<T, D = unknown>({
  data,
  columns,
  keyExtractor,
  remeasureKey,
  height,
  maxHeight,
  striped,
  stripeColors,
  highlightOnRowPress,
  highlightColor,
  rowSelection,
  stickyHeader = true,
  ref,
  onSort,
  currentSort,
  renderSortIcon,
  refreshing,
  onRefresh,
  onEndReached,
  onEndReachedThreshold,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  expandedRowType = 'custom',
  expandedRowStyle,
  renderExpandedRow,
  onExpandFetch,
  getSubTable,
  isExpandedDataEmpty,
  renderExpandedLoading,
  renderExpandedError,
  renderExpandedEmpty,
  subTableSyncScroll = true,
  subTableSyncFixedColumns = true,
  border,
  theme,
  style,
  headerStyle,
  headerTextStyle,
  rowStyle,
  cellStyle,
  cellTextStyle,
}: DataTableProps<T, D>) {
  // 主题色注入：与内置默认深合并，全部子组件经 Context 读取（解耦项目配色）
  const mergedTheme = useMemo(() => resolveTheme(theme), [theme]);

  // H5 横向同步：所有行/表头的横向 ScrollView 注册于此，任一滚动即广播
  const [registry] = useState(() => new Set<HScrollerController>());
  const offsetRef = useRef(0);
  // H5 当前用户正在操作的滚动器（唯一广播源）
  const activeRef = useRef<HScrollerController | null>(null);
  // App 端整张表只使用一个横向滚动值，固定列不再持有可被 FlashList 复用的行级状态。
  const [nativeScrollX] = useState(() => new Animated.Value(0));
  const handleNativeHorizontalScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: nativeScrollX } } }], {
        useNativeDriver: !IS_WEB,
      }),
    [nativeScrollX],
  );

  const stripePair = useMemo(
    () => stripeColors ?? ([mergedTheme.rowBg, mergedTheme.headerBg] as [string, string]),
    [stripeColors, mergedTheme.rowBg, mergedTheme.headerBg],
  );
  const pressHighlightColor = highlightOnRowPress
    ? (highlightColor ?? mergedTheme.primaryLight)
    : undefined;

  // ---- 弹性容器撑满：动态获取表格可用总宽度 ----
  const [containerWidth, setContainerWidth] = useState(0);
  const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  // ---- 列装配：按行选择诉求注入/合并选择框，左固定归位最前、右固定归位最后 ----
  // 选择模式开关 = rowSelection 传/不传，切换经 selectionSignature 进测绘签名 → 自动走原地重测
  // （独立选择列还会改变列下标；合并模式列 key 不变，全靠签名段触发）
  const hasSelection = rowSelection != null;
  const selectionPosition = rowSelection?.position ?? 'first';
  const mergeIntoDataIndex = rowSelection?.mergeIntoDataIndex;
  const { columns: mergedColumns, mergeIntoDataIndex: mergeHostDataIndex } = useMemo(
    () =>
      mergeColumns(
        columns,
        hasSelection ? { position: selectionPosition, mergeIntoDataIndex } : null,
      ),
    [columns, hasSelection, selectionPosition, mergeIntoDataIndex],
  );

  // ---- 幽灵渲染增量测绘（状态机见 use-column-measure.ts） ----
  const autoColumns = useMemo(
    () =>
      mergedColumns
        .map((col, i) => ({ col, key: columnKey(col, i) }))
        .filter(({ col }) => col.width == null),
    [mergedColumns],
  );

  // 选择状态签名：合并模式的选择框显隐不改列 key，须显式并入测绘签名触发原地重测
  const selectionSignature = hasSelection ? `sel:${mergeHostDataIndex ?? '__column__'}` : 'none';

  const {
    measuredWidths,
    displayData,
    hasPending,
    isRemeasuring,
    pendingGhost,
    remeasureGhost,
    subMeasuredKeys,
    handleSubMeasured,
    invalidateSubMeasured,
  } = useColumnMeasure({ data, keyExtractor, autoColumns, remeasureKey, selectionSignature });

  // ---- 列宽解析（主体只用明确 width 布局，绝不使用 flex 伸展） ----
  const { resolved, totalWidth } = useMemo(
    () => resolveColumnLayout(mergedColumns, measuredWidths, containerWidth, mergeHostDataIndex),
    [mergedColumns, measuredWidths, containerWidth, mergeHostDataIndex],
  );

  // 右固定列钉边所需的最大横向滚动距离；容器未测出前按 0 处理避免首帧漂移
  const maxScroll = containerWidth > 0 ? Math.max(0, totalWidth - containerWidth) : 0;

  // 子表 renderExpandedRow / SubTable 复用的父表最终列宽（视觉顺序，和为 totalWidth）
  const columnWidths = useMemo(() => resolved.map((c) => c.width), [resolved]);

  // ---- 边框：解析为行/单元格/外框三类样式 ----
  const borderStyles = useMemo(
    () => resolveBorder(border, mergedTheme.line),
    [border, mergedTheme.line],
  );

  // ---- 行选择（状态与回调见 use-row-selection.ts） ----
  const {
    selectAll,
    clearSelection,
    selectedSet,
    allChecked,
    someChecked,
    selectableCount,
    handleToggleSelect,
    handleToggleAll,
  } = useRowSelection({ data, keyExtractor, rowSelection });

  // ---- 命令式句柄：行选择方法 + 纵向回顶（数据变短时滚动偏移可能越界留白，切筛选场景用） ----
  const listRef = useRef<FlashListRef<ListItem<T>>>(null);
  React.useImperativeHandle(
    ref,
    (): DataTableHandle => ({
      selectAll,
      clearSelection,
      scrollToTop: () => listRef.current?.scrollToOffset({ offset: 0, animated: false }),
    }),
    [selectAll, clearSelection],
  );

  // ---- 排序：受控轮转 null → ascend → descend → null ----
  const handleSortPress = useCallback(
    (dataIndex: string) => {
      if (!onSort) return;
      const cur = currentSort?.dataIndex === dataIndex ? currentSort.order : null;
      const order: SortParams['order'] =
        cur === null ? 'ascend' : cur === 'ascend' ? 'descend' : null;
      onSort({ dataIndex, order });
    },
    [onSort, currentSort],
  );

  // ---- 折叠展开行 + 子表异步取数（见 use-expandable.ts） ----
  const { expandedKeys, asyncState, handleToggleExpand, handleRetryFetch } = useExpandable<T, D>({
    expandedRowType,
    onExpandFetch,
    data,
    keyExtractor,
    onFetchStart: invalidateSubMeasured,
  });

  const expandable =
    expandedRowType === 'sub-table' ? getSubTable != null : renderExpandedRow != null;

  // getSubTable / isExpandedDataEmpty 以 unknown 收敛给 TableRow（内部按 D 使用）
  const getSubTableForRow = getSubTable as
    | ((record: T, index: number, subData: unknown) => SubTableSpec)
    | undefined;
  const isEmptyForRow = isExpandedDataEmpty as ((subData: unknown) => boolean) | undefined;
  const renderExpandedRowForRow = renderExpandedRow as
    | ((record: T, index: number, columnWidths: number[], subData?: unknown) => React.ReactNode)
    | undefined;

  // ---- FlashList 数据装配：首位注入表头哨兵实现吸顶 ----
  // 行 key 一次性预计算：FlashList 滚动期间高频调 keyExtractor，避免每次都回调用户函数
  const { listData, listKeys } = useMemo(() => {
    const items: ListItem<T>[] = [HEADER_SENTINEL];
    const keys: string[] = [HEADER_SENTINEL];
    displayData.forEach((item, i) => {
      items.push(item);
      keys.push(keyExtractor(item, i));
    });
    return { listData: items, listKeys: keys };
  }, [displayData, keyExtractor]);

  const listKeyExtractor = useCallback(
    (_item: ListItem<T>, index: number) => listKeys[index],
    [listKeys],
  );

  // 表头与数据行结构不同，分池回收
  const getItemType = useCallback(
    (item: ListItem<T>) => (item === HEADER_SENTINEL ? 'header' : 'row'),
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ListItem<T>>) => {
      if (item === HEADER_SENTINEL) {
        return (
          <HeaderRow
            resolved={resolved}
            totalWidth={totalWidth}
            maxScroll={maxScroll}
            nativeScrollX={nativeScrollX}
            registry={registry}
            offsetRef={offsetRef}
            activeRef={activeRef}
            headerStyle={headerStyle}
            headerTextStyle={headerTextStyle}
            cellStyle={cellStyle}
            cellBorderStyle={borderStyles.cell}
            rowBorderStyle={borderStyles.row}
            currentSort={currentSort}
            onSortPress={handleSortPress}
            renderSortIcon={renderSortIcon}
            allChecked={allChecked}
            someChecked={someChecked}
            selectionDisabled={selectableCount === 0}
            onToggleAll={handleToggleAll}
            renderHeaderCheckbox={rowSelection?.renderHeaderCheckbox}
            checkboxAlign={rowSelection?.checkboxAlign}
          />
        );
      }
      const dataIndex = index - 1;
      const record = item as T;
      const key = listKeys[index];
      return (
        <TableRow
          item={record}
          index={dataIndex}
          itemKey={key}
          resolved={resolved}
          columnWidths={columnWidths}
          totalWidth={totalWidth}
          containerWidth={containerWidth}
          maxScroll={maxScroll}
          nativeScrollX={nativeScrollX}
          registry={registry}
          offsetRef={offsetRef}
          activeRef={activeRef}
          cellStyle={cellStyle}
          cellTextStyle={cellTextStyle}
          cellBorderStyle={borderStyles.cell}
          rowBorderStyle={borderStyles.row}
          expanded={expandedKeys.has(key)}
          expandable={expandable}
          onToggleExpand={handleToggleExpand}
          rowStyle={rowStyle}
          rowBackground={striped ? stripePair[dataIndex % 2] : undefined}
          highlightColor={pressHighlightColor}
          selected={hasSelection && selectedSet.has(key)}
          selectionDisabled={
            hasSelection ? rowSelection?.getCheckboxProps?.(record)?.disabled : undefined
          }
          onToggleSelect={handleToggleSelect}
          renderCheckbox={rowSelection?.renderCheckbox}
          checkboxAlign={rowSelection?.checkboxAlign}
          expandedRowType={expandedRowType}
          expandedRowStyle={expandedRowStyle}
          renderExpandedRow={renderExpandedRowForRow}
          getSubTable={getSubTableForRow}
          isExpandedDataEmpty={isEmptyForRow}
          renderExpandedLoading={renderExpandedLoading}
          renderExpandedError={renderExpandedError}
          renderExpandedEmpty={renderExpandedEmpty}
          subTableSyncScroll={subTableSyncScroll}
          subTableSyncFixedColumns={subTableSyncFixedColumns}
          subStatus={asyncState[key]?.status}
          subData={asyncState[key]?.data}
          subError={asyncState[key]?.error}
          subMeasured={subMeasuredKeys.has(key)}
          onSubMeasured={handleSubMeasured}
          onRetryFetch={handleRetryFetch}
        />
      );
    },
    [
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
    ],
  );

  // 幽灵区扣留数据或原地重测期间不触发加载更多，避免重复请求同一页与重测竞态
  const handleEndReached = useCallback(() => {
    if (hasPending || isRemeasuring) return;
    onEndReached?.();
  }, [hasPending, isRemeasuring, onEndReached]);

  // 选中集合、排序状态、斑马纹/高亮配置变化都要让可视区行重新走一遍 renderItem
  // （TableRow memo 会拦下 props 未变的行，万级数据下只有受影响行真正重渲染）
  const extraData = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  // 哨兵行使 listData 恒非空，FlashList 自身空态永不触发，空态注入 footer 区域
  const listFooter = useMemo(() => {
    const emptyNode = data.length === 0 ? renderNode(ListEmptyComponent) : null;
    const footerNode = renderNode(ListFooterComponent);
    if (!emptyNode && !footerNode) return null;
    return (
      <>
        {emptyNode}
        {footerNode}
      </>
    );
  }, [data.length, ListEmptyComponent, ListFooterComponent]);

  // App 端页面级头/尾：随纵向滚动、反向补偿横向滚动 → 占满视口横滑固定不动
  const wrapFixedHorizontal = useCallback(
    (node: React.ReactNode) =>
      node ? (
        <Animated.View
          style={{
            width: containerWidth || totalWidth,
            transform: [{ translateX: nativeScrollX }],
          }}
        >
          {node}
        </Animated.View>
      ) : null,
    [containerWidth, nativeScrollX, totalWidth],
  );

  const nativeListHeader = useMemo(
    () => wrapFixedHorizontal(renderNode(ListHeaderComponent)),
    [wrapFixedHorizontal, ListHeaderComponent],
  );
  const nativeListFooter = useMemo(
    () => wrapFixedHorizontal(listFooter),
    [wrapFixedHorizontal, listFooter],
  );

  // 合并模式下宿主列的选择框须一并进入幽灵测宽
  const ghostSelection = useMemo<GhostSelection<T> | null>(
    () =>
      mergeHostDataIndex != null && rowSelection
        ? {
            mergeIntoDataIndex: mergeHostDataIndex,
            renderCheckbox: rowSelection.renderCheckbox,
            renderHeaderCheckbox: rowSelection.renderHeaderCheckbox,
            checkboxAlign: rowSelection.checkboxAlign,
          }
        : null,
    [mergeHostDataIndex, rowSelection],
  );

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
  const sizeStyle: ViewStyle =
    height != null
      ? { height }
      : maxHeight != null
        ? { maxHeight, flexGrow: 1, flexShrink: 1 }
        : { flex: 1 };

  const tableList = (
    <FlashList
      ref={listRef}
      data={listData}
      renderItem={renderItem}
      keyExtractor={listKeyExtractor}
      getItemType={getItemType}
      stickyHeaderIndices={stickyHeader ? [0] : undefined}
      extraData={extraData}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      nestedScrollEnabled={!IS_WEB}
      ListHeaderComponent={IS_WEB ? ListHeaderComponent : nativeListHeader}
      ListFooterComponent={IS_WEB ? listFooter : nativeListFooter}
    />
  );

  return (
    <DataTableThemeProvider value={mergedTheme}>
      <View
        style={[sizeStyle, styles.container, borderStyles.outer, style]}
        onLayout={handleContainerLayout}
      >
        {IS_WEB ? (
          tableList
        ) : (
          <Animated.ScrollView
            style={styles.nativeHorizontalScroller}
            contentContainerStyle={styles.nativeHorizontalContent}
            horizontal
            bounces={false}
            directionalLockEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleNativeHorizontalScroll}
          >
            <View style={[styles.nativeTableContent, { width: totalWidth }]}>{tableList}</View>
          </Animated.ScrollView>
        )}
        {pendingGhost ? (
          <GhostMeasurer
            key={pendingGhost.key}
            entries={pendingGhost.entries}
            onMeasured={pendingGhost.onMeasured}
            {...ghostShared}
          />
        ) : null}
        {remeasureGhost ? (
          <GhostMeasurer
            key={remeasureGhost.key}
            entries={remeasureGhost.entries}
            onMeasured={remeasureGhost.onMeasured}
            {...ghostShared}
          />
        ) : null}
      </View>
    </DataTableThemeProvider>
  );
}

const styles = StyleSheet.create({
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
