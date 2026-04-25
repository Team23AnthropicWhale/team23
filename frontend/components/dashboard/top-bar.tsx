import { StyleSheet, Text, View } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';
import type { Worker } from '@/types/dashboard';

interface Props {
  worker: Worker;
}

export function TopBar({ worker }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.greeting}>{worker.greeting}</Text>
          <Text style={styles.role}>
            {worker.role} · {worker.sector}
          </Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{worker.avatarInitials}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DashboardColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: DashboardColors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    gap: 2,
  },
  greeting: {
    fontSize: 12,
    color: DashboardColors.textTertiary,
  },
  role: {
    fontSize: 15,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DashboardColors.success.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '500',
    color: DashboardColors.success.avatarText,
  },
});
