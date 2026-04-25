import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardColors } from '@/constants/dashboard-colors';
import type { AppUser } from '@/context/user-context';

const SECTOR_STATS = [
  { label: 'Active workers', value: 8, color: 'blue' as const },
  { label: 'Open cases', value: 74, color: 'red' as const },
  { label: 'Pending referrals', value: 23, color: 'neutral' as const },
  { label: 'Closed this month', value: 41, color: 'green' as const },
];

const WORKER_ALERTS = [
  { worker: 'FW-01', sector: 'Sector A', issue: 'Overdue visit — CP-0312', level: 'red' as const },
  { worker: 'FW-05', sector: 'Sector B', issue: 'Form incomplete — CP-0441', level: 'amber' as const },
  { worker: 'FW-07', sector: 'Sector C', issue: 'Referral awaiting sign-off', level: 'amber' as const },
];

const COLOR_MAP = {
  red: DashboardColors.critical,
  amber: DashboardColors.warning,
  blue: DashboardColors.info,
  green: DashboardColors.success,
  neutral: { text: DashboardColors.textPrimary, bg: DashboardColors.background },
};

interface Props {
  user: AppUser;
}

export function SupervisorDashboard({ user }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>{user.name}</Text>
          <Text style={styles.role}>Supervisor · {user.sector}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.avatarInitials}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>SECTOR OVERVIEW</Text>
        </View>

        <View style={styles.statsGrid}>
          {SECTOR_STATS.map((stat, i) => {
            const colors = COLOR_MAP[stat.color];
            return (
              <View key={i} style={styles.statCard}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>WORKER ALERTS</Text>
        </View>

        <View style={styles.alertsCard}>
          {WORKER_ALERTS.map((alert, i) => {
            const colors = COLOR_MAP[alert.level];
            return (
              <View key={i} style={[styles.alertRow, i < WORKER_ALERTS.length - 1 && styles.alertRowBorder]}>
                <View style={[styles.alertBar, { backgroundColor: colors.text }]} />
                <View style={styles.alertInfo}>
                  <Text style={styles.alertWorker}>{alert.worker} · {alert.sector}</Text>
                  <Text style={styles.alertIssue}>{alert.issue}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={DashboardColors.textTertiary} />
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>PENDING APPROVALS</Text>
        </View>

        <View style={styles.approvalCard}>
          <Ionicons name="document-text-outline" size={20} color={DashboardColors.info.text} />
          <View style={styles.approvalInfo}>
            <Text style={styles.approvalTitle}>3 referrals awaiting sign-off</Text>
            <Text style={styles.approvalSub}>Tap to review and approve</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DashboardColors.textTertiary} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DashboardColors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: DashboardColors.border,
  },
  headerInfo: {
    gap: 2,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
  },
  role: {
    fontSize: 12,
    color: DashboardColors.textTertiary,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DashboardColors.info.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '500',
    color: DashboardColors.info.avatarText,
  },
  scroll: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  content: {
    padding: 14,
    paddingBottom: 80,
    gap: 10,
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: DashboardColors.textTertiary,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: DashboardColors.surface,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: DashboardColors.textTertiary,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '500',
    lineHeight: 30,
  },
  alertsCard: {
    backgroundColor: DashboardColors.surface,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  alertRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: DashboardColors.border,
  },
  alertBar: {
    width: 3,
    height: 32,
    borderRadius: 2,
  },
  alertInfo: {
    flex: 1,
    gap: 2,
  },
  alertWorker: {
    fontSize: 13,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
  },
  alertIssue: {
    fontSize: 11,
    color: DashboardColors.textSecondary,
  },
  approvalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DashboardColors.info.bg,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  approvalInfo: {
    flex: 1,
    gap: 2,
  },
  approvalTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: DashboardColors.info.text,
  },
  approvalSub: {
    fontSize: 11,
    color: DashboardColors.info.text,
  },
});
