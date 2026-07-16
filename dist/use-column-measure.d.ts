import type { GhostEntry } from './ghost-measurer';
import type { TableColumn } from './types';
/** 待送 GhostMeasurer 的一批离屏测绘任务；key 作 React key，换批次整体重挂载 */
export interface GhostBatch<T> {
    key: string;
    entries: GhostEntry<T>[];
    onMeasured: (widths: Record<string, number>) => void;
}
/**
 * 幽灵测绘全链路状态机：
 * - 首测通道（pendingGhost）：新数据先进幽灵区，测绘完成后按批放行进入 FlashList；
 * - 原地重测通道（remeasureGhost）：测绘签名（remeasureKey + 自适应列集合）变化时
 *   快照全量数据分批重测，完成后一次性替换列宽，行不下屏；
 * - 子表宽度并入（handleSubMeasured）：展开行子表测宽后并入 measuredWidths 撑宽自适应列，
 *   subMeasuredKeys 门控子表测完再上屏，列宽体系重算时整体作废。
 */
export declare function useColumnMeasure<T>({ data, keyExtractor, autoColumns, remeasureKey, }: {
    data: T[];
    keyExtractor: (item: T, index: number) => string;
    /** 仅需自适应测绘的列（未配置 width 的列），附带列缓存 key */
    autoColumns: {
        col: TableColumn<T>;
        key: string;
    }[];
    remeasureKey?: string | number;
}): {
    /** 各列历史最大测绘宽度，供 resolveColumnLayout 使用 */
    measuredWidths: Record<string, number>;
    /** 已测绘放行、可进入 FlashList 的数据 */
    displayData: T[];
    /** 幽灵区仍扣留数据（测绘中），期间应屏蔽 onEndReached 防重复取页 */
    hasPending: boolean;
    /** 原地重测进行中，期间同样屏蔽 onEndReached 防竞态 */
    isRemeasuring: boolean;
    /** 首测通道当前批次；null 表示无待测数据 */
    pendingGhost: GhostBatch<T> | null;
    /** 重测通道当前批次；null 表示未在重测 */
    remeasureGhost: GhostBatch<T> | null;
    subMeasuredKeys: ReadonlySet<string>;
    handleSubMeasured: (key: string, widths: Record<string, number>) => void;
    invalidateSubMeasured: (key: string) => void;
};
