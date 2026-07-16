/**
 * 表格主题色契约：组件消费的全部颜色都收敛于此，实现与项目配色解耦。
 * 外部通过 DataTable 的 `theme` prop 注入（Partial，与默认深合并，只覆盖传入的键）。
 */
export interface DataTableTheme {
    /** 表头背景 / 固定表头格底 / 展开区底 / 斑马纹奇数行默认 */
    headerBg: string;
    /** 数据行背景 / 固定数据格底 / Checkbox 底 / 斑马纹偶数行默认 */
    rowBg: string;
    /** 单元格与表头文字 */
    text: string;
    /** 次级文字：加载失败 / 空态面板 */
    textSecondary: string;
    /** 主色：Checkbox 选中、排序箭头激活、加载转圈 */
    primary: string;
    /** 主色浅色：行按压高亮默认色 */
    primaryLight: string;
    /** 主色前景：Checkbox 对勾 / 半选横杠 */
    onPrimary: string;
    /** 边框默认线色 */
    line: string;
    /** 禁用 / 未选态：Checkbox 未选边框、排序箭头未激活 */
    disabled: string;
}
/**
 * 内置默认主题：组件零配置即有合理外观，不依赖项目任何文件。
 * 色值为通用浅色设计系统，项目可经 `theme` prop 覆盖为品牌配色。
 */
export declare const DEFAULT_DATA_TABLE_THEME: DataTableTheme;
/** 合并注入主题与默认主题（浅合并即可，主题为扁平色值表） */
export declare function resolveTheme(theme?: Partial<DataTableTheme>): DataTableTheme;
export declare const DataTableThemeProvider: import("react").Provider<DataTableTheme>;
/** 叶子组件读取当前表格主题 */
export declare function useDataTableTheme(): DataTableTheme;
