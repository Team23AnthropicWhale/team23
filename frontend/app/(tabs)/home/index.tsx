import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBanner } from '@/components/dashboard/alert-banner';
import { CaseList } from '@/components/dashboard/case-list';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { SectionLabel } from '@/components/dashboard/section-label';
import { DashboardStatusBar } from '@/components/dashboard/status-bar';
import { TaskList } from '@/components/dashboard/task-list';
import { TopBar } from '@/components/dashboard/top-bar';
import { DashboardColors } from '@/constants/dashboard-colors';
import { useTaskContext } from '@/context/task-context';
import { useUser } from '@/context/user-context';
import { getAllCases, toCaseView } from '@/services/caseService';
import type { Case } from '@/types/dashboard';

import {
  MOCK_ALERT,
  MOCK_APPROVALS,
  MOCK_METRICS,
  MOCK_SUPERVISOR_CASES,
  MOCK_TASKS,
} from '@/data/mock-dashboard';



const SECTOR_STATS = [
  { label: 'Active workers', value: 8, color: 'blue' as const },
  { label: 'Open cases', value: 74, color: 'red' as const },
  { label: 'Pending referrals', value: 23, color: 'neutral' as const },
  { label: 'Closed this month', value: 41, color: 'green' as const },
];

const COLOR_MAP = {
  red: DashboardColors.critical,
  amber: DashboardColors.warning,
  blue: DashboardColors.info,
  green: DashboardColors.success,
  neutral: { text: DashboardColors.textPrimary, bg: DashboardColors.background },
};

const alertCases = MOCK_SUPERVISOR_CASES.filter(c => c.alertLevel);


export default function HomeScreen() {
  const { user } = useUser();
  const { tasks } = useTaskContext();
  const isSupervisor = user?.role === 'supervisor';

  const [cases, setCases] = useState<Case[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const stored = await getAllCases();
        const converted = await Promise.all(stored.map(toCaseView));
        setCases(converted);
      })();
    }, []),
  );

  const worker = user
    ? { greeting: 'Good morning,', name: user.name, sector: user.sector, role: user.name, avatarInitials: user.avatarInitials }
    : { greeting: 'Good morning,', name: 'Field Worker', sector: 'Sector B', role: 'Field Worker', avatarInitials: 'FW' };

  const urgentTasks = tasks.filter((t) => t.urgency === 'red');
  const urgentAlert = urgentTasks.length > 0
    ? {
      count: urgentTasks.length,
      cases: urgentTasks.slice(0, 3).map((t) => t.id),
      action: 'action required today',
    }
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {isSupervisor ? (
        <View style={styles.supHeader}>
          <View style={styles.supHeaderInfo}>
            <Text style={styles.supGreeting}>{user!.name}</Text>
            <Text style={styles.supRole}>Supervisor · {user!.sector}</Text>
          </View>
          <View style={styles.supAvatar}>
            <Text style={styles.supAvatarText}>{user!.avatarInitials}</Text>
          </View>
        </View>
      ) : (
        <>
          <DashboardStatusBar />
          <TopBar worker={worker} />
        </>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={isSupervisor ? styles.contentSupervisor : styles.content}
        showsVerticalScrollIndicator={false}>
        {urgentAlert && <AlertBanner alert={urgentAlert} />}

        {isSupervisor ? (
          <>
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
          </>
        ) : (
          <>
            <MetricsGrid metrics={MOCK_METRICS} />
            <View style={styles.section}>
              <SectionLabel>Today's Tasks</SectionLabel>
              <TaskList tasks={MOCK_TASKS} />
            </View>
            <View style={styles.section}>
              <SectionLabel>Priority Cases</SectionLabel>
              <CaseList cases={cases} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DashboardColors.surface,
  },
  scroll: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  content: {
    padding: 14,
    paddingBottom: 80,
    gap: 14,
  },
  contentSupervisor: {
    padding: 14,
    paddingBottom: 80,
    gap: 10,
  },
  section: {
    gap: 0,
  },
  // Supervisor header
  supHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: DashboardColors.border,
  },
  supHeaderInfo: {
    gap: 2,
  },
  supGreeting: {
    fontSize: 15,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
  },
  supRole: {
    fontSize: 12,
    color: DashboardColors.textTertiary,
  },
  supAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DashboardColors.info.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supAvatarText: {
    fontSize: 12,
    fontWeight: '500',
    color: DashboardColors.info.avatarText,
  },
  // Shared supervisor content styles
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
