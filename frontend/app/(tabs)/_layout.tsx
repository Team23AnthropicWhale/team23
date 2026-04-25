import { Redirect, Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/dashboard/custom-tab-bar';
import { useUser } from '@/context/user-context';

export default function TabLayout() {
  const { user } = useUser();
  const isSupervisor = user?.role === 'supervisor';

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="home/index" options={{ title: 'Home' }} />
      <Tabs.Screen name="cases/index" options={{ title: 'Cases' }} />
      <Tabs.Screen name="tasks/index" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="sync/index" options={{ title: 'Sync' }} />
      <Tabs.Screen name="upload/index" options={{ title: 'Upload', href: isSupervisor ? undefined : null }} />
      <Tabs.Screen name="explore/index" options={{ href: null }} />
    </Tabs>
  );
}
