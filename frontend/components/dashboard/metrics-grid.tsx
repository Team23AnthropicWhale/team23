import { StyleSheet, Text, View } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';
import type { Metric, MetricColor } from '@/types/dashboard';

function getMetricColors(color: MetricColor): { value: string; tag: string } {
  switch (color) {
    case 'red':
      return { value: DashboardColors.critical.text, tag: DashboardColors.critical.text };
    case 'blue':
      return { value: DashboardColors.info.text, tag: DashboardColors.info.text };
    case 'green':
      return { value: DashboardColors.success.text, tag: DashboardColors.success.text };
    case 'neutral':
      return { value: DashboardColors.textPrimary, tag: DashboardColors.warning.text };
  }
}

interface Props {
  metrics: Metric[];
}

export function MetricsGrid({ metrics }: Props) {
  return (
    <View style={styles.grid}>
      {metrics.map((metric, i) => {
        const colors = getMetricColors(metric.color);
        return (
          <View key={i} style={styles.card}>
            <Text style={styles.label}>{metric.label}</Text>
            <Text style={[styles.value, { color: colors.value }]}>{metric.value}</Text>
            <Text style={[styles.tag, { color: colors.tag }]}>{metric.tag}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: '48%',
    backgroundColor: DashboardColors.surface,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: DashboardColors.textTertiary,
  },
  value: {
    fontSize: 26,
    fontWeight: '500',
    lineHeight: 30,
  },
  tag: {
    fontSize: 10,
    fontWeight: '500',
  },
});
