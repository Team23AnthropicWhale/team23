import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardColors } from '@/constants/dashboard-colors';

type TabName = 'home' | 'cases' | 'tasks' | 'sync';

const TAB_CONFIG: Record<TabName, { label: string; icon: string; activeIcon: string }> = {
  home: { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  cases: { label: 'Cases', icon: 'people-outline', activeIcon: 'people' },
  tasks: { label: 'Tasks', icon: 'list-outline', activeIcon: 'list' },
  sync: { label: 'Sync', icon: 'sync-outline', activeIcon: 'sync' },
};

const TAB_ORDER: TabName[] = ['home', 'cases', 'tasks', 'sync'];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const activeRouteName = state.routes[state.index]?.name as TabName;

  const navigateTo = (name: TabName) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const isFocused = state.index === state.routes.indexOf(route);
    if (!isFocused) {
      navigation.navigate(name);
    }
  };

  const renderTab = (name: TabName, position: 'left' | 'right') => {
    const config = TAB_CONFIG[name];
    const isActive = activeRouteName === name;
    const color = isActive ? DashboardColors.tabBar.activeTint : DashboardColors.tabBar.inactiveTint;
    const iconName = isActive ? config.activeIcon : config.icon;

    return (
      <TouchableOpacity
        key={name}
        style={styles.tab}
        onPress={() => navigateTo(name)}
        activeOpacity={0.7}>
        <Ionicons name={iconName as any} size={22} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{config.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.barWrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TAB_ORDER.slice(0, 2).map((name) => renderTab(name, 'left'))}

      <View style={styles.fabSlot}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/modal')}
          activeOpacity={0.8}>
          <Ionicons name="add" size={24} color={DashboardColors.fab.icon} />
        </TouchableOpacity>
      </View>

      {TAB_ORDER.slice(2).map((name) => renderTab(name, 'right'))}
    </View>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.tabBar.background,
    borderTopWidth: 0.5,
    borderTopColor: DashboardColors.tabBar.border,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  fabSlot: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: DashboardColors.fab.background,
    borderWidth: 3,
    borderColor: DashboardColors.fab.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
