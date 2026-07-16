/** 按下后位移超过该阈值即视为拖动，不再触发行点击 */
export declare const ROW_PRESS_MOVE_THRESHOLD = 5;
/**
 * 拖动/点击判定：行 Pressable（RN 手势 pageX/pageY）与 H5 横向滚动器
 * （DOM pointer 事件 clientX/clientY）共用同一套阈值语义。
 * 返回的 guard 引用恒稳定，方法可安全用于事件监听器与稳定回调。
 */
export declare function usePressGuard(): {
    /** 按下：记录起点并清除拖动标记 */
    begin(x: number, y: number): void;
    /** 移动：起点到当前位移超过阈值即标记为拖动（一旦标记不再回退） */
    track(x: number, y: number): void;
    /** 单独清除拖动标记（不重置起点） */
    clearMoved(): void;
    readonly moved: boolean;
};
