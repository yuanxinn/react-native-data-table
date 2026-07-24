import { useCallback, useEffect, useRef, useState } from 'react';

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
export function useExpandable<T, D>({
  expandedRowType,
  onExpandFetch,
  data,
  keyExtractor,
  onFetchStart,
}: {
  expandedRowType: 'custom' | 'sub-table';
  onExpandFetch?: (record: T, index: number) => Promise<D>;
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  /** 每次触发取数时同步回调（父表借此作废该行的子表列宽测量）；须为稳定引用 */
  onFetchStart?: (key: string) => void;
}) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [asyncState, setAsyncState] = useState<Record<string, AsyncEntry<D>>>({});

  const expandedKeysRef = useRef(expandedKeys);
  const asyncStateRef = useRef(asyncState);
  const expandCfgRef = useRef({ expandedRowType, onExpandFetch, data, keyExtractor });
  useEffect(() => {
    expandedKeysRef.current = expandedKeys;
    asyncStateRef.current = asyncState;
    expandCfgRef.current = { expandedRowType, onExpandFetch, data, keyExtractor };
  });

  // key → 行下标：首次取数时按当前 data 惰性建表并缓存，data 更换即失效重建
  const keyIndexCacheRef = useRef<{ data: T[]; map: Map<string, number> } | null>(null);
  const getRowIndex = useCallback((key: string): number => {
    const { data: d, keyExtractor: ke } = expandCfgRef.current;
    let cache = keyIndexCacheRef.current;
    if (!cache || cache.data !== d) {
      const map = new Map<string, number>();
      d.forEach((item, i) => map.set(ke(item, i), i));
      cache = { data: d, map };
      keyIndexCacheRef.current = cache;
    }
    return cache.map.get(key) ?? -1;
  }, []);

  const fetchSub = useCallback(
    (key: string, record: T, rowIndex: number) => {
      const { onExpandFetch: fetch } = expandCfgRef.current;
      if (!fetch) return;
      setAsyncState((prev) => ({ ...prev, [key]: { status: 'loading' } }));
      onFetchStart?.(key);
      fetch(record, rowIndex).then(
        (result) => setAsyncState((prev) => ({ ...prev, [key]: { status: 'done', data: result } })),
        (error) => setAsyncState((prev) => ({ ...prev, [key]: { status: 'error', error } })),
      );
    },
    [onFetchStart],
  );

  const handleToggleExpand = useCallback(
    (key: string) => {
      const cfg = expandCfgRef.current;
      const wasExpanded = expandedKeysRef.current.has(key);
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      // 首次展开 sub-table + 配了异步取数 + 无缓存 → 触发取数
      if (
        !wasExpanded &&
        cfg.expandedRowType === 'sub-table' &&
        cfg.onExpandFetch &&
        !asyncStateRef.current[key]
      ) {
        const idx = getRowIndex(key);
        if (idx >= 0) fetchSub(key, cfg.data[idx], idx);
      }
    },
    [getRowIndex, fetchSub],
  );

  const handleRetryFetch = useCallback(
    (key: string) => {
      const cfg = expandCfgRef.current;
      const idx = getRowIndex(key);
      if (idx >= 0) fetchSub(key, cfg.data[idx], idx);
    },
    [getRowIndex, fetchSub],
  );

  return { expandedKeys, asyncState, handleToggleExpand, handleRetryFetch };
}
