import React from 'react';
/** 极简跨端 Checkbox：无第三方依赖，支持选中 / 半选 / 禁用；配色取自表格主题 */
export declare function Checkbox({ checked, indeterminate, disabled, onPress, }: {
    checked: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    onPress: () => void;
}): React.JSX.Element;
