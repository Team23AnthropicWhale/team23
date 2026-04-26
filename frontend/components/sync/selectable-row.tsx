import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';

interface Props {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

export function SelectableRow({ title, subtitle, selected, onPress, icon }: Props) {
  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <View style={styles.iconWrap}>
          <Ionicons
            name={icon}
            size={18}
            color={selected ? DashboardColors.info.text : DashboardColors.textSecondary}
          />
        </View>
      )}
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Ionicons name="checkmark" size={14} color={DashboardColors.info.text} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: DashboardColors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
  },
  rowSelected: {
    borderColor: DashboardColors.info.bar,
    backgroundColor: DashboardColors.info.bg,
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
  },
  text: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: DashboardColors.textSecondary,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: DashboardColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: DashboardColors.info.text,
    backgroundColor: DashboardColors.info.bg,
  },
});
