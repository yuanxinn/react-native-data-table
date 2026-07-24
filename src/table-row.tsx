import React, { memo, useCallback, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { composeCellStyle, renderCellContent, renderSelectionCell } from './cell';
import { CellBox } from './cell-box';
import { Checkbox } from './checkbox';
import { ExpandedArea, ExpandedAreaProps } from './expanded-area';
import { HScroller } from './h-scroller';
import { useDataTableTheme } from './theme';
import type { RowSelectionConfig } from './types';
import { usePressGuard } from './use-press-guard';

const IS_WEB = Platform.OS === 'web';

interface RowProps<T> extends ExpandedAreaProps<T> {
  cellStyle?: StyleProp<ViewStyle>;
  cellTextStyle?: StyleProp<TextStyle>;
  expanded: boolean;
  expandable: boolean;
  onToggleExpand: (key: string) => void;
  rowStyle?: StyleProp<ViewStyle>;
  rowBackground?: string;
  highlightColor?: string;
  selected: boolean;
  selectionDisabled?: boolean;
  onToggleSelect: (key: string) => void;
  renderCheckbox?: RowSelectionConfig<T>['renderCheckbox'];
  checkboxAlign?: 'top' | 'center' | 'bottom';
}

const TableRowInner = <T,>(props: RowProps<T>) => {
  const {
    item,
    index,
    itemKey,
    resolved,
    totalWidth,
    maxScroll,
    nativeScrollX,
    registry,
    offsetRef,
    activeRef,
    cellStyle,
    cellTextStyle,
    cellBorderStyle,
    rowBorderStyle,
    expanded,
    expandable,
    onToggleExpand,
    rowStyle,
    rowBackground,
    highlightColor,
    selected,
    selectionDisabled,
    onToggleSelect,
    renderCheckbox,
    checkboxAlign,
  } = props;

  const theme = useDataTableTheme();

  // 拖动/点击判定：横向拖动行时不触发展开
  const pressGuard = usePressGuard();
  const handlePress = useCallback(() => {
    if (pressGuard.moved) return;
    onToggleExpand(itemKey);
  }, [pressGuard, onToggleExpand, itemKey]);
  const handleToggleSelect = useCallback(() => onToggleSelect(itemKey), [onToggleSelect, itemKey]);

  const [pressed, setPressed] = useState(false);
  const highlightable = highlightColor != null;
  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      pressGuard.begin(event.nativeEvent.pageX, event.nativeEvent.pageY);
      if (highlightable) setPressed(true);
    },
    [pressGuard, highlightable],
  );
  const handleGestureMove = useCallback(
    (event: GestureResponderEvent) => {
      pressGuard.track(event.nativeEvent.pageX, event.nativeEvent.pageY);
    },
    [pressGuard],
  );
  const handlePressOut = useCallback(() => setPressed(false), []);

  const effectiveBg = pressed && highlightable ? highlightColor : rowBackground;
  const contentStyle: StyleProp<ViewStyle> = [
    { backgroundColor: theme.rowBg },
    rowBorderStyle,
    rowStyle,
    effectiveBg ? { backgroundColor: effectiveBg } : null,
  ];

  const rowCheckbox = () =>
    renderCheckbox ? (
      <Pressable disabled={selectionDisabled} hitSlop={8} onPress={handleToggleSelect}>
        {renderCheckbox(selected, item)}
      </Pressable>
    ) : (
      <Checkbox checked={selected} disabled={selectionDisabled} onPress={handleToggleSelect} />
    );

  const renderCells = (scrollX: Animated.Value) =>
    resolved.map((rc) => {
      let inner: React.ReactNode;
      if (rc.isSelection) {
        inner = rowCheckbox();
      } else {
        const content = renderCellContent(rc.col, item, index, theme.text, cellTextStyle);
        inner = rc.mergesSelection
          ? renderSelectionCell({ checkbox: rowCheckbox(), content, align: checkboxAlign })
          : content;
      }
      return (
        <CellBox
          key={rc.key}
          rc={rc}
          scrollX={scrollX}
          maxScroll={maxScroll}
          fixedBgColor={effectiveBg}
          cellBorderStyle={cellBorderStyle}
          contentStyle={composeCellStyle({ col: rc.col, cellStyle, record: { item, index } })}
        >
          {inner}
        </CellBox>
      );
    });

  const scroller = IS_WEB ? (
    <HScroller
      syncKey={itemKey}
      totalWidth={totalWidth}
      registry={registry}
      offsetRef={offsetRef}
      activeRef={activeRef}
      contentStyle={contentStyle}
      onPress={expandable ? handlePress : undefined}
      onPressIn={expandable || highlightable ? handlePressIn : undefined}
      onPressOut={expandable || highlightable ? handlePressOut : undefined}
    >
      {renderCells}
    </HScroller>
  ) : expandable || highlightable ? (
    <Pressable
      style={[{ width: totalWidth, flexDirection: 'row' }, contentStyle]}
      onPress={expandable ? handlePress : undefined}
      onPressIn={expandable || highlightable ? handlePressIn : undefined}
      onPressOut={expandable || highlightable ? handlePressOut : undefined}
      onPressMove={expandable ? handleGestureMove : undefined}
    >
      {renderCells(nativeScrollX)}
    </Pressable>
  ) : (
    <View style={[{ width: totalWidth, flexDirection: 'row' }, contentStyle]}>
      {renderCells(nativeScrollX)}
    </View>
  );

  if (!expandable) {
    return scroller;
  }

  return (
    <View>
      {scroller}
      {/* RowProps 是 ExpandedAreaProps 的超集，直接透传（多余 props 被忽略） */}
      {expanded ? <ExpandedArea {...props} /> : null}
    </View>
  );
};

// 泛型组件配合 memo 需要一次类型断言，避免丢失 <T> 推导
export const TableRow = memo(TableRowInner) as typeof TableRowInner;
