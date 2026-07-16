import { LayoutChangeEvent } from 'react-native';
/** 一次离屏测量的收集状态（同一批次内跨渲染持久） */
export interface CollectState {
    widths: Record<string, number>;
    measured: Set<string>;
    done: boolean;
}
export declare function createCollectState(): CollectState;
/**
 * 单格收集步骤（纯逻辑）：按 cellId 去重，宽度向上取整并加 1px 余量
 * （避免小数宽度导致真实渲染时换行——这条不变式收敛于此），同列取最大值。
 * 测满 expected 格时置 done 并返回 true（调用方应触发完成回调），其余情况返回 false。
 */
export declare function collectCellWidth(state: CollectState, colKey: string, cellId: string, rawWidth: number, expected: number): boolean;
/**
 * 离屏测量收集器：父表幽灵测绘（ghost-measurer）与子表测量（sub-table）共用。
 * 逐格 onLayout 收集各列真实渲染宽度，测满 expected 格后一次性回调。
 * expected 为本次待测格总数（含表头/子行）；为 0 时立即放行，避免门控卡住。
 */
export declare function useMeasure(expected: number, onMeasured: (widths: Record<string, number>) => void): (colKey: string, cellId: string, e: LayoutChangeEvent) => void;
/** 离屏测量容器样式：肉眼不可见（left:-9999 + opacity:0），各格按内容自然宽收缩 */
export declare const measureStyles: {
    ghost: {
        position: "absolute";
        left: number;
        top: number;
        opacity: number;
        flexDirection: "row";
    };
    columnStack: {
        alignItems: "flex-start";
    };
};
