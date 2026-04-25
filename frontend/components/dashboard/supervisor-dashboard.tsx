import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardColors } from '@/constants/dashboard-colors';
import type { AppUser } from '@/context/user-context';
import { AlertBanner } from './alert-banner';
import { MOCK_ALERT, MOCK_APPROVALS, MOCK_SUPERVISOR_CASES } from '@/data/mock-dashboard';

const SECTOR_STATS = [
  { label: 'Active workers', value: 8, color: 'blue' as const },
  { label: 'Open cases', value: 74, color: 'red' as const },
  { label: 'Pending referrals', value: 23, color: 'neutral' as const },
  { label: 'Closed this month', value: 41, color: 'green' as const },
];

const alertCases = MOCK_SUPERVISOR_CASES.filter(c => c.alertLevel);

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

        <AlertBanner alert={MOCK_ALERT} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>DASHBOARD</Text>
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
          {alertCases.map((c, i) => {
            const colors = COLOR_MAP[c.alertLevel!];
            return (
              <View key={c.id} style={[styles.alertRow, i < alertCases.length - 1 && styles.alertRowBorder]}>
                <View style={[styles.alertBar, { backgroundColor: colors.text }]} />
                <View style={styles.alertInfo}>
                  <Text style={styles.alertWorker}>{c.worker} · {c.sector}</Text>
                  <Text style={styles.alertIssue}>{c.alertIssue} — {c.id}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={DashboardColors.textTertiary} />
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>PENDING APPROVALS ({MOCK_APPROVALS.length})</Text>
        </View>

        <View style={styles.alertsCard}>
          {MOCK_APPROVALS.map((approval, i) => (
            <View key={approval.id} style={[styles.alertRow, i < MOCK_APPROVALS.length - 1 && styles.alertRowBorder]}>
              <View style={[styles.alertBar, { backgroundColor: DashboardColors.info.text }]} />
              <View style={styles.alertInfo}>
                <Text style={styles.alertWorker}>{approval.caseId} · {approval.type}</Text>
                <Text style={styles.alertIssue}>{approval.worker} · {approval.submittedAt}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={DashboardColors.textTertiary} />
            </View>
          ))}
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
});
