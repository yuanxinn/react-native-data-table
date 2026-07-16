"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Checkbox = Checkbox;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const theme_1 = require("./theme");
/** 极简跨端 Checkbox：无第三方依赖，支持选中 / 半选 / 禁用；配色取自表格主题 */
function Checkbox({ checked, indeterminate, disabled, onPress, }) {
    const theme = (0, theme_1.useDataTableTheme)();
    const on = checked || indeterminate;
    return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { accessibilityRole: "checkbox", accessibilityState: { checked: indeterminate ? 'mixed' : checked, disabled }, disabled: disabled, hitSlop: 8, onPress: onPress, style: [
            styles.checkbox,
            { borderColor: theme.disabled, backgroundColor: theme.rowBg },
            on && { backgroundColor: theme.primary, borderColor: theme.primary },
            disabled && styles.checkboxDisabled,
        ], children: indeterminate ? ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.checkboxDash, { backgroundColor: theme.onPrimary }] })) : checked ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.checkboxTick, { color: theme.onPrimary }], children: "\u2713" })) : null }));
}
const styles = react_native_1.StyleSheet.create({
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxDisabled: {
        opacity: 0.4,
    },
    checkboxTick: {
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 14,
    },
    checkboxDash: {
        width: 10,
        height: 2,
        borderRadius: 1,
    },
});
