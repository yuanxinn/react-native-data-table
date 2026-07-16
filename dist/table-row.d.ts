import React from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ExpandedAreaProps } from './expanded-area';
import type { RowSelectionConfig } from './types';
interface RowProps<T> extends ExpandedAreaProps<T> {
    cellStyle?: StyleProp<ViewStyle>;
    cellTextStyle?: StyleProp<TextStyle>;
    expanded: boolean;
    expandable: boolean;
    onToggleExpand: (key: string) => void;
    rowStyle?: StyleProp<ViewStyle>;
    rowBackground?: string;
    highlightColor?: string;
    selected: boolean;
    selectionDisabled?: boolean;
    onToggleSelect: (key: string) => void;
    renderCheckbox?: RowSelectionConfig<T>['renderCheckbox'];
    checkboxAlign?: 'top' | 'center' | 'bottom';
}
declare const TableRowInner: <T>(props: RowProps<T>) => React.JSX.Element;
export declare const TableRow: typeof TableRowInner;
export {};
