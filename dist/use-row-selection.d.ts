import React from 'react';
import type { DataTableHandle, RowSelectionConfig } from './types';
/**
 * 行选择状态：单行切换、表头全选/反选、命令式 selectAll / clearSelection。
 * 切换回调必须恒稳定（TableRow memo 依赖），最新数据经 selectionStateRef 透传。
 */
export declare function useRowSelection<T>({ data, keyExtractor, rowSelection, handleRef, }: {
    data: T[];
    keyExtractor: (item: T, index: number) => string;
    rowSelection?: RowSelectionConfig<T>;
    /** 命令式方法句柄（selectAll / clearSelection） */
    handleRef?: React.Ref<DataTableHandle>;
}): {
    selectedSet: Set<string>;
    allChecked: boolean;
    someChecked: boolean;
    /** 可选行数量（0 = 表头全选框禁用） */
    selectableCount: number;
    handleToggleSelect: (key: string) => void;
    handleToggleAll: () => void;
};
