import type { RowSelectionConfig } from './types';
/**
 * 行选择状态：单行切换、表头全选/反选、selectAll / clearSelection
 * （命令式句柄由 data-table 统一组装）。
 * 切换回调必须恒稳定（TableRow memo 依赖），最新数据经 selectionStateRef 透传。
 */
export declare function useRowSelection<T>({ data, keyExtractor, rowSelection, }: {
    data: T[];
    keyExtractor: (item: T, index: number) => string;
    rowSelection?: RowSelectionConfig<T>;
}): {
    selectAll: () => void;
    clearSelection: () => void;
    selectedSet: Set<string>;
    allChecked: boolean;
    someChecked: boolean;
    /** 可选行数量（0 = 表头全选框禁用） */
    selectableCount: number;
    handleToggleSelect: (key: string) => void;
    handleToggleAll: () => void;
};
