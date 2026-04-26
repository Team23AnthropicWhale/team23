import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardColors } from '@/constants/dashboard-colors';
import { useUser } from '@/context/user-context';

export default function AccountScreen() {
  const { user } = useUser();
  const router = useRouter();

  if (!user) return null;

  const fields = [
    { label: 'Name', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Role', value: user.role === 'supervisor' ? 'Supervisor' : 'Field Worker' },
    { label: 'Sector', value: user.sector },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={DashboardColors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Account</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.content}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.avatarInitials}</Text>
            </View>
            <Text style={styles.avatarName}>{user.name}</Text>
            <Text style={styles.avatarRole}>
              {user.role === 'supervisor' ? 'Supervisor' : 'Field Worker'} · {user.sector}
            </Text>
          </View>

          <View style={styles.card}>
            {fields.map((field, i) => (
              <View key={field.label}>
                {i > 0 && <View style={styles.rowDivider} />}
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>{field.label}</Text>
                  <Text style={styles.rowValue}>{field.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DashboardColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: DashboardColors.border,
  },
  backBtn: {
    width: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: DashboardColors.info.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '600',
    color: DashboardColors.info.avatarText,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  avatarRole: {
    fontSize: 13,
    color: DashboardColors.textTertiary,
  },
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    overflow: 'hidden',
  },
  rowDivider: {
    height: 0.5,
    backgroundColor: DashboardColors.border,
    marginLeft: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  rowLabel: {
    fontSize: 14,
    color: DashboardColors.textSecondary,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
});
