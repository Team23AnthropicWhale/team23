import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';
import type { StoredCase } from '@/types/case';

interface Props {
  item: StoredCase;
  onPress: (item: StoredCase) => void;
  onDelete: (item: StoredCase) => void;
}

function getInitials(name: string | undefined): string {
  return name?.trim().slice(0, 2).toUpperCase() || '??';
}

export function CaseCard({ item, onPress, onDelete }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.date}>Updated {new Date(item.updatedAt).toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity onPress={() => onDelete(item)} hitSlop={8} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={DashboardColors.critical.bar} />
      </TouchableOpacity>
      <Ionicons name="chevron-forward" size={16} color={DashboardColors.textTertiary} />
    </TouchableOpacity>
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
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DashboardColors.info.avatarBg,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '500',
    color: DashboardColors.info.avatarText,
  },
  infoBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
  },
  date: {
    fontSize: 11,
    color: DashboardColors.textTertiary,
  },
  deleteBtn: {
    padding: 4,
    flexShrink: 0,
  },
});
