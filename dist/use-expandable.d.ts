export type SubStatus = 'loading' | 'error' | 'done';
/** 每行子表异步取数状态 */
export interface AsyncEntry<D> {
    status: SubStatus;
    data?: D;
    error?: unknown;
}
/**
 * 折叠展开行 + 子表异步取数：展开集合、按行 key 缓存的取数状态、重试。
 * 取数/展开决策依赖最新 props，经 ref 透传使回调恒稳定（TableRow memo 友好）。
 */
export declare function useExpandable<T, D>({ expandedRowType, onExpandFetch, data, keyExtractor, onFetchStart, }: {
    expandedRowType: 'custom' | 'sub-table';
    onExpandFetch?: (record: T, index: number) => Promise<D>;
    data: T[];
    keyExtractor: (item: T, index: number) => string;
    /** 每次触发取数时同步回调（父表借此作废该行的子表列宽测量）；须为稳定引用 */
    onFetchStart?: (key: string) => void;
}): {
    expandedKeys: Set<string>;
    asyncState: Record<string, AsyncEntry<D>>;
    handleToggleExpand: (key: string) => void;
    handleRetryFetch: (key: string) => void;
};
