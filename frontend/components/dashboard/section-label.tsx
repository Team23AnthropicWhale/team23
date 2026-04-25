import { StyleSheet, Text, type TextStyle } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';

interface Props {
  children: string;
  style?: TextStyle;
}

export function SectionLabel({ children, style }: Props) {
  return <Text style={[styles.label, style]}>{children.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: DashboardColors.textTertiary,
    marginBottom: 8,
  },
});
