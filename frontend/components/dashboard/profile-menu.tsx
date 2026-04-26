import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardColors } from '@/constants/dashboard-colors';
import type { AppUser } from '@/context/user-context';

interface Props {
  user: AppUser;
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function ProfileMenu({ user, visible, onClose, onLogout }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          onClose();
          onLogout();
        },
      },
    ]);
  }

  function handleAccount() {
    onClose();
    router.push('/account');
  }

  const menuTop = insets.top + 60;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.menu, { top: menuTop }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.avatarInitials}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
              <Text style={styles.userMeta}>
                {user.role === 'supervisor' ? 'Supervisor' : 'Field Worker'} · {user.sector}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleAccount} activeOpacity={0.7}>
            <Ionicons name="person-outline" size={17} color={DashboardColors.textPrimary} />
            <Text style={styles.menuItemText}>My Account</Text>
            <Ionicons name="chevron-forward" size={15} color={DashboardColors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={17} color={DashboardColors.critical.text} />
            <Text style={[styles.menuItemText, styles.logoutText]}>Log out</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menu: {
    position: 'absolute',
    right: 14,
    width: 240,
    backgroundColor: DashboardColors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DashboardColors.info.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: DashboardColors.info.avatarText,
  },
  userDetails: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  userEmail: {
    fontSize: 11,
    color: DashboardColors.textTertiary,
  },
  userMeta: {
    fontSize: 11,
    color: DashboardColors.textSecondary,
  },
  divider: {
    height: 0.5,
    backgroundColor: DashboardColors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    color: DashboardColors.textPrimary,
  },
  logoutText: {
    color: DashboardColors.critical.text,
  },
});
