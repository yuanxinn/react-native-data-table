"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBorder = resolveBorder;
const react_native_1 = require("react-native");
/**
 * 解析 border 配置为三类具体样式。纯函数：
 * - 省略（undefined）→ 仅横向行分隔线（兼容历史默认）
 * - false → 全关
 * - true → 开启默认横线
 * - 对象 → 三类线独立开关，共用 color / width（默认 hairline / defaultLineColor）
 * defaultLineColor 由调用方从主题注入（theme.line）。
 */
function resolveBorder(border, defaultLineColor) {
    var _a, _b, _c, _d, _e;
    if (border === false) {
        return { row: null, cell: null, outer: null };
    }
    const cfg = border == null || border === true ? {} : border;
    const color = (_a = cfg.color) !== null && _a !== void 0 ? _a : defaultLineColor;
    const width = (_b = cfg.width) !== null && _b !== void 0 ? _b : react_native_1.StyleSheet.hairlineWidth;
    const horizontal = (_c = cfg.horizontal) !== null && _c !== void 0 ? _c : true;
    const vertical = (_d = cfg.vertical) !== null && _d !== void 0 ? _d : false;
    const outer = (_e = cfg.outer) !== null && _e !== void 0 ? _e : false;
    return {
        row: horizontal ? { borderBottomWidth: width, borderBottomColor: color } : null,
        cell: vertical ? { borderRightWidth: width, borderRightColor: color } : null,
        outer: outer ? { borderWidth: width, borderColor: color } : null,
    };
}
