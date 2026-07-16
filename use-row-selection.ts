import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import type { DataTableHandle, RowSelectionConfig } from './types';

/** 遍历未被 getCheckboxProps 禁用的行，按 data 顺序回吐其 key（全选范围） */
function selectableKeysOf<T>(
  data: T[],
  keyExtractor: (item: T, index: number) => string,
  rowSelection: RowSelectionConfig<T> | undefined,
): string[] {
  if (!rowSelection) return [];
  const keys: string[] = [];
  data.forEach((item, i) => {
    if (!rowSelection.getCheckboxProps?.(item)?.disabled) keys.push(keyExtractor(item, i));
  });
  return keys;
}

/** 按 data 顺序回吐选中的 keys/rows，剔除已不在数据源中的残留 key */
function emitSelection<T>(
  data: T[],
  keyExtractor: (item: T, index: number) => string,
  rowSelection: RowSelectionConfig<T>,
  selected: Set<string>,
): void {
  const keys: string[] = [];
  const rows: T[] = [];
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
 * 行选择状态：单行切换、表头全选/反选、命令式 selectAll / clearSelection。
 * 切换回调必须恒稳定（TableRow memo 依赖），最新数据经 selectionStateRef 透传。
 */
export function useRowSelection<T>({
  data,
  keyExtractor,
  rowSelection,
  handleRef,
}: {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  rowSelection?: RowSelectionConfig<T>;
  /** 命令式方法句柄（selectAll / clearSelection） */
  handleRef?: React.Ref<DataTableHandle>;
}) {
  const selectedRowKeys = rowSelection?.selectedRowKeys;
  const selectedSet = useMemo(() => new Set(selectedRowKeys ?? []), [selectedRowKeys]);

  const selectionStateRef = useRef({ data, keyExtractor, rowSelection });
  useEffect(() => {
    selectionStateRef.current = { data, keyExtractor, rowSelection };
  });

  const handleToggleSelect = useCallback((key: string) => {
    const { data: d, keyExtractor: ke, rowSelection: rs } = selectionStateRef.current;
    if (!rs) return;
    const next = new Set(rs.selectedRowKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    emitSelection(d, ke, rs, next);
  }, []);

  // 全选范围 = 未被 getCheckboxProps 禁用的行
  const selectableKeys = useMemo(
    () => selectableKeysOf(data, keyExtractor, rowSelection),
    [data, keyExtractor, rowSelection],
  );

  const allChecked =
    selectableKeys.length > 0 && selectableKeys.every((k) => selectedSet.has(k));
  const someChecked = !allChecked && selectableKeys.some((k) => selectedSet.has(k));

  const handleToggleAll = useCallback(() => {
    if (!rowSelection) return;
    // 全选/反选只翻转可选行，已选中的禁用行保持原状
    const next = new Set(rowSelection.selectedRowKeys);
    if (allChecked) {
      selectableKeys.forEach((k) => next.delete(k));
    } else {
      selectableKeys.forEach((k) => next.add(k));
    }
    emitSelection(data, keyExtractor, rowSelection, next);
  }, [rowSelection, allChecked, selectableKeys, data, keyExtractor]);

  // ---- 命令式方法（ref）：经 selectionStateRef 读最新数据，回调恒稳定 ----
  React.useImperativeHandle(
    handleRef,
    (): DataTableHandle => ({
      selectAll: () => {
        const { data: d, keyExtractor: ke, rowSelection: rs } = selectionStateRef.current;
        if (!rs) return;
        // 全选未禁用行，已选中的禁用行保持原状
        const next = new Set(rs.selectedRowKeys);
        selectableKeysOf(d, ke, rs).forEach((k) => next.add(k));
        emitSelection(d, ke, rs, next);
      },
      clearSelection: () => {
        const { data: d, keyExtractor: ke, rowSelection: rs } = selectionStateRef.current;
        if (!rs) return;
        // 只清可选行，禁用行的已选状态保留
        const next = new Set(rs.selectedRowKeys);
        selectableKeysOf(d, ke, rs).forEach((k) => next.delete(k));
        emitSelection(d, ke, rs, next);
      },
    }),
    [],
  );

  return {
    selectedSet,
    allChecked,
    someChecked,
    /** 可选行数量（0 = 表头全选框禁用） */
    selectableCount: selectableKeys.length,
    handleToggleSelect,
    handleToggleAll,
  };
}
