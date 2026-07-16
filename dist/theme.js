"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTableThemeProvider = exports.DEFAULT_DATA_TABLE_THEME = void 0;
exports.resolveTheme = resolveTheme;
exports.useDataTableTheme = useDataTableTheme;
const react_1 = require("react");
/**
 * 内置默认主题：组件零配置即有合理外观，不依赖项目任何文件。
 * 色值为通用浅色设计系统，项目可经 `theme` prop 覆盖为品牌配色。
 */
exports.DEFAULT_DATA_TABLE_THEME = {
    headerBg: '#F5F6FA',
    rowBg: '#FFFFFF',
    text: '#1A1C22',
    textSecondary: '#717682',
    primary: '#2E62EB',
    primaryLight: '#E8EEFF',
    onPrimary: '#FFFFFF',
    line: '#EEEFF3',
    disabled: '#C4C8D2',
};
/** 合并注入主题与默认主题（浅合并即可，主题为扁平色值表） */
function resolveTheme(theme) {
    return theme ? { ...exports.DEFAULT_DATA_TABLE_THEME, ...theme } : exports.DEFAULT_DATA_TABLE_THEME;
}
const DataTableThemeContext = (0, react_1.createContext)(exports.DEFAULT_DATA_TABLE_THEME);
exports.DataTableThemeProvider = DataTableThemeContext.Provider;
/** 叶子组件读取当前表格主题 */
function useDataTableTheme() {
    return (0, react_1.useContext)(DataTableThemeContext);
}
