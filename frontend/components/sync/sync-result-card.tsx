import { StyleSheet, Text, View } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';

interface Props {
  deviceName: string;
  transferred?: number;
  received?: number;
  conflicts?: string[];
  error?: string;
}

export function SyncResultCard({ deviceName, transferred, received, conflicts, error }: Props) {
  const hasError = !!error;
  return (
    <View style={[styles.card, hasError ? styles.cardError : styles.cardSuccess]}>
      <Text style={styles.name}>{deviceName}</Text>
      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.meta}>
          Sent {transferred} · Received {received}
          {conflicts && conflicts.length > 0
            ? ` · ${conflicts.length} conflict${conflicts.length !== 1 ? 's' : ''}`
            : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 12,
    gap: 4,
    borderWidth: 0.5,
  },
  cardSuccess: {
    backgroundColor: DashboardColors.success.bg,
    borderColor: DashboardColors.success.avatarBg,
  },
  cardError: {
    backgroundColor: DashboardColors.critical.bg,
    borderColor: DashboardColors.critical.border,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: DashboardColors.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: DashboardColors.critical.text,
  },
});
