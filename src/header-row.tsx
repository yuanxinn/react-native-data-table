import React, { memo } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import {
  composeHeaderCellStyle,
  renderHeaderContent,
  renderSelectionCell,
  SORT_ICON_WIDTH,
} from './cell';
import { CellBox } from './cell-box';
import { Checkbox } from './checkbox';
import type { ResolvedColumn } from './column-layout';
import { HScroller, HScrollerController } from './h-scroller';
import { useDataTableTheme } from './theme';
import type { RowSelectionConfig, SortParams } from './types';

const IS_WEB = Platform.OS === 'web';

/** 可排序表头：内容 + 上下箭头，点击轮转 null → ascend → descend → null */
function SortableTitle({
  order,
  onPress,
  idleColor,
  activeColor,
  renderSortIcon,
  children,
}: {
  order: 'ascend' | 'descend' | null;
  onPress: () => void;
  idleColor: string;
  activeColor: string;
  renderSortIcon?: (order: 'ascend' | 'descend' | null) => React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Pressable style={styles.sortHeader} hitSlop={6} onPress={onPress}>
      {children}
      {renderSortIcon ? (
        renderSortIcon(order)
      ) : (
        <View style={styles.sortIconBox}>
          <Text style={[styles.sortCaret, { color: order === 'ascend' ? activeColor : idleColor }]}>
            ▲
          </Text>
          <Text style={[styles.sortCaret, { color: order === 'descend' ? activeColor : idleColor }]}>
            ▼
          </Text>
        </View>
      )}
    </Pressable>
  );
}

interface HeaderRowProps<T> {
  resolved: ResolvedColumn<T>[];
  totalWidth: number;
  maxScroll: number;
  nativeScrollX: Animated.Value;
  registry: Set<HScrollerController>;
  offsetRef: React.RefObject<number>;
  activeRef: React.RefObject<HScrollerController | null>;
  headerStyle?: StyleProp<ViewStyle>;
  headerTextStyle?: StyleProp<TextStyle>;
  cellStyle?: StyleProp<ViewStyle>;
  cellBorderStyle?: StyleProp<ViewStyle>;
  rowBorderStyle?: StyleProp<ViewStyle>;
  currentSort?: SortParams;
  onSortPress: (dataIndex: string) => void;
  /** 自定义排序图标（全局，见 DataTableProps.renderSortIcon） */
  renderSortIcon?: (order: 'ascend' | 'descend' | null) => React.ReactNode;
  /** 全选 Checkbox 状态（无行选择时列表中不存在选择列，这些值不被读取） */
  allChecked: boolean;
  someChecked: boolean;
  selectionDisabled: boolean;
  onToggleAll: () => void;
  /** 自定义表头全选框 / 合并对齐（来自 rowSelection） */
  renderHeaderCheckbox?: RowSelectionConfig<T>['renderHeaderCheckbox'];
  checkboxAlign?: 'top' | 'center' | 'bottom';
}

const HeaderRowInner = <T,>({
  resolved,
  totalWidth,
  maxScroll,
  nativeScrollX,
  registry,
  offsetRef,
  activeRef,
  headerStyle,
  headerTextStyle,
  cellStyle,
  cellBorderStyle,
  rowBorderStyle,
  currentSort,
  onSortPress,
  renderSortIcon,
  allChecked,
  someChecked,
  selectionDisabled,
  onToggleAll,
  renderHeaderCheckbox,
  checkboxAlign,
}: HeaderRowProps<T>) => {
  const theme = useDataTableTheme();
  const headerCheckbox = () =>
    renderHeaderCheckbox ? (
      <Pressable disabled={selectionDisabled} hitSlop={8} onPress={onToggleAll}>
        {renderHeaderCheckbox({
          checked: allChecked,
          indeterminate: someChecked,
          disabled: selectionDisabled,
        })}
      </Pressable>
    ) : (
      <Checkbox
        checked={allChecked}
        indeterminate={someChecked}
        disabled={selectionDisabled}
        onPress={onToggleAll}
      />
    );

  // 固定表头格底色跟随 headerStyle 背景（未设时默认主题 headerBg），与非固定格保持一致
  const headerBg =
    (StyleSheet.flatten(headerStyle) as ViewStyle | undefined)?.backgroundColor?.toString() ??
    theme.headerBg;

  const renderHeaderCells = (scrollX: Animated.Value) =>
    resolved.map((rc) => {
      const sortOrder =
        currentSort && currentSort.dataIndex === String(rc.col.dataIndex)
          ? currentSort.order
          : null;

      let inner: React.ReactNode;
      if (rc.isSelection) {
        inner = headerCheckbox();
      } else {
        const content = rc.col.sorter ? (
          <SortableTitle
            order={sortOrder}
            onPress={() => onSortPress(String(rc.col.dataIndex))}
            idleColor={theme.disabled}
            activeColor={theme.primary}
            renderSortIcon={renderSortIcon}
          >
            {renderHeaderContent(rc.col, theme.text, headerTextStyle)}
          </SortableTitle>
        ) : (
          renderHeaderContent(rc.col, theme.text, headerTextStyle)
        );
        inner = rc.mergesSelection
          ? renderSelectionCell({ checkbox: headerCheckbox(), content, align: checkboxAlign })
          : content;
      }

      return (
        <CellBox
          key={rc.key}
          rc={rc}
          scrollX={scrollX}
          maxScroll={maxScroll}
          cellBorderStyle={cellBorderStyle}
          contentStyle={composeHeaderCellStyle({ col: rc.col, cellStyle })}
          isHeader
          fixedBgColor={headerBg}
        >
          {inner}
        </CellBox>
      );
    });

  if (IS_WEB) {
    return (
      <HScroller
        syncKey="__DATA_TABLE_HEADER__"
        totalWidth={totalWidth}
        registry={registry}
        offsetRef={offsetRef}
        activeRef={activeRef}
        contentStyle={[{ backgroundColor: theme.headerBg }, rowBorderStyle, headerStyle]}
      >
        {renderHeaderCells}
      </HScroller>
    );
  }
  return (
    <View
      style={[
        { width: totalWidth, flexDirection: 'row', backgroundColor: theme.headerBg },
        rowBorderStyle,
        headerStyle,
      ]}
    >
      {renderHeaderCells(nativeScrollX)}
    </View>
  );
};

// 泛型组件配合 memo 需要一次类型断言，避免丢失 <T> 推导
export const HeaderRow = memo(HeaderRowInner) as typeof HeaderRowInner;

const styles = StyleSheet.create({
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortIconBox: {
    width: SORT_ICON_WIDTH,
    alignItems: 'center',
  },
  sortCaret: {
    fontSize: 8,
    lineHeight: 9,
  },
});
