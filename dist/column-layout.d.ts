import type { TableColumn } from './types';
/** 行选择列的内部标识与固定宽度（定宽列不参与幽灵测绘与弹性分配） */
export declare const SELECTION_KEY = "__DATA_TABLE_SELECTION__";
export declare const SELECTION_COLUMN_WIDTH = 48;
export interface ResolvedColumn<T> {
    col: TableColumn<T>;
    key: string;
    width: number;
    /** 左固定列在表格中的横向偏移（Web 端 sticky left 用） */
    left: number;
    /** 右固定列距表格右缘的偏移（Web 端 sticky right 用） */
    right: number;
    fixed?: 'left' | 'right';
    /** 独立注入的行选择 Checkbox 列 */
    isSelection: boolean;
    /** 合并宿主列：在原内容基础上组合渲染选择框 */
    mergesSelection: boolean;
}
/** 行选择在列布局中的诉求；null 表示未开启（或 visible=false 隐藏） */
export interface SelectionLayout {
    position: 'first' | 'last';
    mergeIntoDataIndex?: string;
}
/**
 * 列装配：按行选择诉求注入/合并选择框，并把左固定归位最前、右固定归位最后。
 * - 独立选择列：按 position 注入并自动打 fixed（'first'→left、'last'→right），归入对应固定流；
 * - 合并模式：不注入新列，返回的 mergeIntoDataIndex 标记宿主列（由 resolveColumnLayout 落到 ResolvedColumn）；
 *   宿主 dataIndex 不存在时 __DEV__ 告警并回退为独立选择列。
 */
export declare function mergeColumns<T>(columns: TableColumn<T>[], selection: SelectionLayout | null): {
    columns: TableColumn<T>[];
    mergeIntoDataIndex: string | null;
};
/** 批次测绘宽度并入累计表：同列取最大值，返回新对象（不改入参） */
export declare function mergeMaxWidths(base: Record<string, number>, batch: Record<string, number>): Record<string, number>;
/**
 * 列宽解析（主体只用明确 width 布局，绝不使用 flex 伸展）：
 * 1. 各列基础宽度 = 固定 width，或 max(测绘宽, minWidth)，兜底默认宽；
 * 2. 弹性撑满：总宽 < 容器宽时剩余空白均分给自适应列（取整余数补给最后一个
 *    弹性列，保证总宽严格等于容器宽）；总宽 >= 容器宽时不做任何拉伸/压缩，
 *    按真实测量宽横向滚动；
 * 3. 生成最终列配置与固定列偏移（左固定累计 left，右固定从末尾累计 right）。
 */
export declare function resolveColumnLayout<T>(mergedColumns: TableColumn<T>[], measuredWidths: Record<string, number>, containerWidth: number, mergeIntoDataIndex?: string | null): {
    resolved: ResolvedColumn<T>[];
    totalWidth: number;
};
