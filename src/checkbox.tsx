import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDataTableTheme } from './theme';

/** 极简跨端 Checkbox：无第三方依赖，支持选中 / 半选 / 禁用；配色取自表格主题 */
export function Checkbox({
  checked,
  indeterminate,
  disabled,
  onPress,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useDataTableTheme();
  const on = checked || indeterminate;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: indeterminate ? 'mixed' : checked, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={[
        styles.checkbox,
        { borderColor: theme.disabled, backgroundColor: theme.rowBg },
        on && { backgroundColor: theme.primary, borderColor: theme.primary },
        disabled && styles.checkboxDisabled,
      ]}
    >
      {indeterminate ? (
        <View style={[styles.checkboxDash, { backgroundColor: theme.onPrimary }]} />
      ) : checked ? (
        <Text style={[styles.checkboxTick, { color: theme.onPrimary }]}>✓</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
