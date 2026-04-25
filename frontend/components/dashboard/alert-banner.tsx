import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';
import type { AlertData } from '@/types/dashboard';

interface Props {
  alert: AlertData;
}

export function AlertBanner({ alert }: Props) {
  const subtitle = `${alert.cases.join(', ')} — ${alert.action}`;

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="warning" size={16} color={DashboardColors.critical.text} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{alert.count} urgent cases need action</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: DashboardColors.critical.bg,
    borderWidth: 0.5,
    borderColor: DashboardColors.critical.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DashboardColors.critical.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: '#791F1F',
  },
  subtitle: {
    fontSize: 11,
    color: DashboardColors.critical.text,
  },
  arrow: {
    fontSize: 16,
    color: DashboardColors.critical.text,
  },
});
