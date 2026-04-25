import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBanner } from '@/components/dashboard/alert-banner';
import { CaseList } from '@/components/dashboard/case-list';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { SectionLabel } from '@/components/dashboard/section-label';
import { DashboardStatusBar } from '@/components/dashboard/status-bar';
import { SupervisorDashboard } from '@/components/dashboard/supervisor-dashboard';
import { TaskList } from '@/components/dashboard/task-list';
import { TopBar } from '@/components/dashboard/top-bar';
import { DashboardColors } from '@/constants/dashboard-colors';
import { useUser } from '@/context/user-context';
import { MOCK_ALERT, MOCK_CASES, MOCK_METRICS, MOCK_TASKS } from '@/data/mock-dashboard';

export default function HomeScreen() {
  const { user } = useUser();

  if (user?.role === 'supervisor') {
    return <SupervisorDashboard user={user} />;
  }

  const worker = user
    ? {
      greeting: 'Good morning,',
      name: user.name,
      sector: user.sector,
      role: user.name,
      avatarInitials: user.avatarInitials,
    }
    : { greeting: 'Good morning,', name: 'Field Worker', sector: 'Sector B', role: 'Field Worker', avatarInitials: 'FW' };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <DashboardStatusBar />
      <TopBar worker={worker} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <AlertBanner alert={MOCK_ALERT} />
        <MetricsGrid metrics={MOCK_METRICS} />
        <View style={styles.section}>
          <SectionLabel>Today's Tasks</SectionLabel>
          <TaskList tasks={MOCK_TASKS} />
        </View>
        <View style={styles.section}>
          <SectionLabel>Priority Cases</SectionLabel>
          <CaseList cases={MOCK_CASES} />
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
  scroll: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  content: {
    padding: 14,
    paddingBottom: 80,
    gap: 14,
  },
  section: {
    gap: 0,
  },
});
