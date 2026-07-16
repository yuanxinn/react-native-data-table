import { ViewStyle } from 'react-native';
import type { DataTableBorder } from './types';
export interface ResolvedBorder {
    /** 行底横线（表头/数据行/展开区），null=不画 */
    row: ViewStyle | null;
    /** 单元格竖线（右分隔，参与幽灵测宽），null=不画 */
    cell: ViewStyle | null;
    /** 外框，null=不画 */
    outer: ViewStyle | null;
}
/**
 * 解析 border 配置为三类具体样式。纯函数：
 * - 省略（undefined）→ 仅横向行分隔线（兼容历史默认）
 * - false → 全关
 * - true → 开启默认横线
 * - 对象 → 三类线独立开关，共用 color / width（默认 hairline / defaultLineColor）
 * defaultLineColor 由调用方从主题注入（theme.line）。
 */
export declare function resolveBorder(border: boolean | DataTableBorder | undefined, defaultLineColor: string): ResolvedBorder;
