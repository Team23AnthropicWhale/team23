import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';
import type { AvatarVariant, Case, PillVariant } from '@/types/dashboard';

interface Props {
  item: Case;
  onPress?: (item: Case) => void;
  onDelete?: (item: Case) => void;
}

function getAvatarColors(variant: AvatarVariant): { bg: string; text: string } {
  switch (variant) {
    case 'red': return { bg: DashboardColors.critical.avatarBg, text: DashboardColors.critical.avatarText };
    case 'blue': return { bg: DashboardColors.info.avatarBg, text: DashboardColors.info.avatarText };
    case 'amber': return { bg: DashboardColors.warning.avatarBg, text: DashboardColors.warning.avatarText };
    case 'teal': return { bg: DashboardColors.success.avatarBg, text: DashboardColors.success.avatarText };
  }
}

function getPillColors(status: PillVariant): { bg: string; text: string; label: string } {
  switch (status) {
    case 'urgent': return { bg: DashboardColors.critical.bg, text: DashboardColors.critical.text, label: 'Urgent' };
    case 'active': return { bg: DashboardColors.info.bg, text: DashboardColors.info.text, label: 'Active' };
    case 'pending': return { bg: DashboardColors.warning.bg, text: DashboardColors.warning.text, label: 'Pending' };
    case 'closed': return { bg: '#EAF3DE', text: '#3B6D11', label: 'Closed' };
  }
}

export function CaseCard({ item, onPress, onDelete }: Props) {
  const avatarColors = getAvatarColors(item.avatar.variant);
  const pill = getPillColors(item.status);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && onPress && styles.cardPressed]}
      onPress={() => onPress?.(item)}>
      <View style={[styles.avatar, { backgroundColor: avatarColors.bg }]}>
        <Text style={[styles.avatarText, { color: avatarColors.text }]}>{item.avatar.initials}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.caseId}>{`${item.name} - ${item.id}`}</Text>
        <Text style={styles.caseType} numberOfLines={1}>{item.type}</Text>
        <View style={styles.lockRow}>
          <Ionicons name="lock-closed" size={10} color={DashboardColors.textTertiary} />
          <Text style={styles.encryptedText}>Encrypted · Day {item.encryptionDay}</Text>
        </View>
      </View>
      <View style={[styles.pill, { backgroundColor: pill.bg }]}>
        <Text style={[styles.pillText, { color: pill.text }]}>{pill.label}</Text>
      </View>
      {onDelete && (
        <Pressable onPress={() => onDelete(item)} hitSlop={8} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={DashboardColors.critical.bar} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: DashboardColors.surface,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  cardPressed: {
    opacity: 0.75,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '500',
  },
  infoBlock: {
    flex: 1,
    gap: 2,
  },
  caseId: {
    fontSize: 13,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
  },
  caseType: {
    fontSize: 11,
    color: DashboardColors.textSecondary,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  encryptedText: {
    fontSize: 10,
    color: DashboardColors.textTertiary,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 4,
    flexShrink: 0,
  },
});
