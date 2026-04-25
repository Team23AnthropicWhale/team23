import { StyleSheet, Text, View } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';
import { Fonts } from '@/constants/theme';
import type { Task, UrgencyLevel } from '@/types/dashboard';

function getUrgencyBarColor(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'red':
      return DashboardColors.critical.bar;
    case 'amber':
      return DashboardColors.warning.bar;
    case 'blue':
      return DashboardColors.info.bar;
  }
}

interface Props {
  tasks: Task[];
}

export function TaskList({ tasks }: Props) {
  return (
    <View style={styles.card}>
      {tasks.map((task, i) => (
        <View
          key={i}
          style={[
            styles.row,
            i < tasks.length - 1 && styles.rowBorder,
          ]}>
          <View style={[styles.urgencyBar, { backgroundColor: getUrgencyBarColor(task.urgency) }]} />
          <Text style={styles.taskId}>{task.id}</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
            <Text style={styles.subtitle}>{task.subtitle}</Text>
          </View>
          <Text style={styles.time}>{task.time}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DashboardColors.surface,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  rowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: DashboardColors.border,
  },
  urgencyBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
  },
  taskId: {
    fontSize: 10,
    color: DashboardColors.textTertiary,
    fontFamily: Fonts?.mono ?? 'monospace',
    minWidth: 48,
  },
  infoBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: DashboardColors.textSecondary,
  },
  time: {
    fontSize: 11,
    color: DashboardColors.textTertiary,
    flexShrink: 0,
  },
});
