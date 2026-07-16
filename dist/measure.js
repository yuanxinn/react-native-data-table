"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.measureStyles = void 0;
exports.createCollectState = createCollectState;
exports.collectCellWidth = collectCellWidth;
exports.useMeasure = useMeasure;
const react_1 = require("react");
const react_native_1 = require("react-native");
function createCollectState() {
    return { widths: {}, measured: new Set(), done: false };
}
/**
 * 单格收集步骤（纯逻辑）：按 cellId 去重，宽度向上取整并加 1px 余量
 * （避免小数宽度导致真实渲染时换行——这条不变式收敛于此），同列取最大值。
 * 测满 expected 格时置 done 并返回 true（调用方应触发完成回调），其余情况返回 false。
 */
function collectCellWidth(state, colKey, cellId, rawWidth, expected) {
    var _a;
    if (state.done || state.measured.has(cellId))
        return false;
    state.measured.add(cellId);
    const width = Math.ceil(rawWidth) + 1;
    if (width > ((_a = state.widths[colKey]) !== null && _a !== void 0 ? _a : 0))
        state.widths[colKey] = width;
    if (state.measured.size >= expected) {
        state.done = true;
        return true;
    }
    return false;
}
/**
 * 离屏测量收集器：父表幽灵测绘（ghost-measurer）与子表测量（sub-table）共用。
 * 逐格 onLayout 收集各列真实渲染宽度，测满 expected 格后一次性回调。
 * expected 为本次待测格总数（含表头/子行）；为 0 时立即放行，避免门控卡住。
 */
function useMeasure(expected, onMeasured) {
    const stateRef = (0, react_1.useRef)(createCollectState());
    (0, react_1.useEffect)(() => {
        if (expected === 0 && !stateRef.current.done) {
            stateRef.current.done = true;
            onMeasured({});
        }
        // onMeasured 为父层稳定回调；仅需在 expected 变化时判断一次
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expected]);
    return (colKey, cellId, e) => {
        if (collectCellWidth(stateRef.current, colKey, cellId, e.nativeEvent.layout.width, expected)) {
            onMeasured(stateRef.current.widths);
        }
    };
}
/** 离屏测量容器样式：肉眼不可见（left:-9999 + opacity:0），各格按内容自然宽收缩 */
exports.measureStyles = react_native_1.StyleSheet.create({
    ghost: {
        position: 'absolute',
        left: -9999,
        top: 0,
        opacity: 0,
        flexDirection: 'row',
    },
    columnStack: {
        alignItems: 'flex-start',
    },
});
