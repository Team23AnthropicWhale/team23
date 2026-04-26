import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';
import { useUser } from '@/context/user-context';
import type { Worker } from '@/types/dashboard';
import { ProfileMenu } from './profile-menu';

interface Props {
  worker: Worker;
}

export function TopBar({ worker }: Props) {
  const { user, logout } = useUser();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.greeting}>{worker.greeting}</Text>
          <Text style={styles.role}>
            {worker.role} · {worker.sector}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.8}>
          <Text style={styles.avatarText}>{worker.avatarInitials}</Text>
        </TouchableOpacity>
      </View>
      {user && (
        <ProfileMenu
          user={user}
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onLogout={logout}
        />
      )}
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
