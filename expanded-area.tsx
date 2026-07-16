import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import type { ResolvedColumn } from './column-layout';
import { HScroller, HScrollerController } from './h-scroller';
import { SubTable, SubTableMeasurer } from './sub-table';
import { useDataTableTheme } from './theme';
import type { SubTableSpec } from './types';
import type { SubStatus } from './use-expandable';

const IS_WEB = Platform.OS === 'web';

function isEmptyDefault(subData: unknown): boolean {
  return subData == null || (Array.isArray(subData) && subData.length === 0);
}

export interface ExpandedAreaProps<T> {
  item: T;
  index: number;
  itemKey: string;
  resolved: ResolvedColumn<T>[];
  columnWidths: number[];
  totalWidth: number;
  containerWidth: number;
  maxScroll: number;
  nativeScrollX: Animated.Value;
  registry: Set<HScrollerController>;
  offsetRef: React.RefObject<number>;
  activeRef: React.RefObject<HScrollerController | null>;
  cellBorderStyle?: StyleProp<ViewStyle>;
  rowBorderStyle?: StyleProp<ViewStyle>;
  expandedRowType: 'custom' | 'sub-table';
  expandedRowStyle?: StyleProp<ViewStyle>;
  renderExpandedRow?: (
    record: T,
    index: number,
    columnWidths: number[],
    subData?: unknown,
  ) => React.ReactNode;
  getSubTable?: (record: T, index: number, subData: unknown) => SubTableSpec;
  isExpandedDataEmpty?: (subData: unknown) => boolean;
  renderExpandedLoading?: (columnWidths: number[]) => React.ReactNode;
  renderExpandedError?: (
    error: unknown,
    retry: () => void,
    columnWidths: number[],
  ) => React.ReactNode;
  renderExpandedEmpty?: (columnWidths: number[]) => React.ReactNode;
  subTableSyncScroll: boolean;
  subTableSyncFixedColumns: boolean;
  /** 本行异步状态（custom 模式或未配 fetch 时为 undefined，视作同步 done） */
  subStatus?: SubStatus;
  subData?: unknown;
  subError?: unknown;
  /** 子表列宽是否已测（门控：测完才上屏 live 子表） */
  subMeasured: boolean;
  onSubMeasured: (key: string, widths: Record<string, number>) => void;
  onRetryFetch: (key: string) => void;
}

/**
 * 展开区：custom 模式渲染固定详情面板（占满视口宽、横滑不动）；
 * sub-table 模式按取数状态渲染 loading / error / empty 固定面板或联动子表。
 * 仅在行展开时挂载，折叠即卸载（独立横滚状态随之重置）。
 */
export function ExpandedArea<T>({
  item,
  index,
  itemKey,
  resolved,
  columnWidths,
  totalWidth,
  containerWidth,
  maxScroll,
  nativeScrollX,
  registry,
  offsetRef,
  activeRef,
  cellBorderStyle,
  rowBorderStyle,
  expandedRowType,
  expandedRowStyle,
  renderExpandedRow,
  getSubTable,
  isExpandedDataEmpty,
  renderExpandedLoading,
  renderExpandedError,
  renderExpandedEmpty,
  subTableSyncScroll,
  subTableSyncFixedColumns,
  subStatus,
  subData,
  subError,
  subMeasured,
  onSubMeasured,
  onRetryFetch,
}: ExpandedAreaProps<T>) {
  const theme = useDataTableTheme();

  // 独立横滚（subTableSyncScroll=false）用：Web 私有 registry / Native 独立 scrollX
  const [independentRegistry] = useState(() => new Set<HScrollerController>());
  const independentOffsetRef = useRef(0);
  const independentActiveRef = useRef<HScrollerController | null>(null);
  const [independentScrollX] = useState(() => new Animated.Value(0));
  const [handleIndependentScroll] = useState(() =>
    Animated.event([{ nativeEvent: { contentOffset: { x: independentScrollX } } }], {
      useNativeDriver: !IS_WEB,
    }),
  );

  const expandedBase: StyleProp<ViewStyle> = [
    { backgroundColor: theme.headerBg },
    rowBorderStyle,
    expandedRowStyle,
  ];
  const expandedBg =
    (StyleSheet.flatten(expandedRowStyle) as ViewStyle | undefined)?.backgroundColor?.toString() ??
    theme.headerBg;

  // 固定面板：占满视口宽、横滑不动（custom 模式 & sub-table 的 loading/error/empty）
  const fixedPanel = (node: React.ReactNode) =>
    IS_WEB ? (
      <View style={[expandedBase, { width: containerWidth || totalWidth }]}>{node}</View>
    ) : (
      <Animated.View
        style={[
          expandedBase,
          { width: containerWidth || totalWidth, transform: [{ translateX: nativeScrollX }] },
        ]}
      >
        {node}
      </Animated.View>
    );

  if (expandedRowType === 'custom') {
    return <>{fixedPanel(renderExpandedRow?.(item, index, columnWidths, subData))}</>;
  }

  // ---- sub-table 模式 ----
  if (subStatus === 'loading') {
    return <>{fixedPanel(renderExpandedLoading?.(columnWidths) ?? <DefaultLoading />)}</>;
  }
  if (subStatus === 'error') {
    return (
      <>
        {fixedPanel(
          renderExpandedError?.(subError, () => onRetryFetch(itemKey), columnWidths) ?? (
            <DefaultError onRetry={() => onRetryFetch(itemKey)} />
          ),
        )}
      </>
    );
  }

  const spec = getSubTable?.(item, index, subData);
  const empty =
    !spec ||
    spec.rows.length === 0 ||
    (isExpandedDataEmpty ? isExpandedDataEmpty(subData) : isEmptyDefault(subData));
  if (empty) {
    return <>{fixedPanel(renderExpandedEmpty?.(columnWidths) ?? <DefaultEmpty />)}</>;
  }

  // 门控：子格宽度测完再上屏，避免列宽闪跳
  if (!subMeasured) {
    return (
      <>
        {fixedPanel(renderExpandedLoading?.(columnWidths) ?? <DefaultLoading />)}
        <SubTableMeasurer
          spec={spec}
          resolved={resolved}
          cellStyle={spec.cellStyle}
          cellBorderStyle={cellBorderStyle}
          onMeasured={(w) => onSubMeasured(itemKey, w)}
        />
      </>
    );
  }

  // done + measured → 联动子表
  const subNode = (scrollX: Animated.Value) => (
    <SubTable
      spec={spec}
      resolved={resolved}
      totalWidth={totalWidth}
      scrollX={scrollX}
      maxScroll={maxScroll}
      syncFixedColumns={subTableSyncFixedColumns}
      fixedBg={expandedBg}
      cellBorderStyle={cellBorderStyle}
      rowBorderStyle={rowBorderStyle}
    />
  );

  if (subTableSyncScroll) {
    // 与父表联动
    return IS_WEB ? (
      <HScroller
        syncKey={`${itemKey}__exp`}
        totalWidth={totalWidth}
        registry={registry}
        offsetRef={offsetRef}
        activeRef={activeRef}
        contentStyle={expandedBase}
      >
        {(sx) => subNode(sx)}
      </HScroller>
    ) : (
      <View style={[expandedBase, { width: totalWidth }]}>{subNode(nativeScrollX)}</View>
    );
  }

  // 独立横滚
  return IS_WEB ? (
    <HScroller
      syncKey={`${itemKey}__exp`}
      totalWidth={totalWidth}
      registry={independentRegistry}
      offsetRef={independentOffsetRef}
      activeRef={independentActiveRef}
      contentStyle={expandedBase}
    >
      {(sx) => subNode(sx)}
    </HScroller>
  ) : (
    <Animated.ScrollView
      style={expandedBase}
      horizontal
      bounces={false}
      directionalLockEnabled
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={handleIndependentScroll}
    >
      <View style={{ width: totalWidth }}>{subNode(independentScrollX)}</View>
    </Animated.ScrollView>
  );
}

function DefaultLoading() {
  const theme = useDataTableTheme();
  return (
    <View style={styles.panelCenter}>
      <ActivityIndicator color={theme.primary} />
    </View>
  );
}
function DefaultError({ onRetry }: { onRetry: () => void }) {
  const theme = useDataTableTheme();
  return (
    <Pressable style={styles.panelCenter} onPress={onRetry}>
      <Text style={[styles.panelText, { color: theme.textSecondary }]}>加载失败，点击重试</Text>
    </Pressable>
  );
}
function DefaultEmpty() {
  const theme = useDataTableTheme();
  return (
    <View style={styles.panelCenter}>
      <Text style={[styles.panelText, { color: theme.textSecondary }]}>暂无数据</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panelCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  panelText: {
    fontSize: 13,
  },
});
