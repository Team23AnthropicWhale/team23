import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  variant?: 'primary' | 'secondary';
}

export function SyncFooter({ label, onPress, disabled, icon, variant = 'primary' }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[
          styles.btn,
          isPrimary ? styles.btnPrimary : styles.btnSecondary,
          disabled && styles.btnDisabled,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={16}
            color={isPrimary ? '#fff' : DashboardColors.info.text}
          />
        )}
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: DashboardColors.surface,
    borderTopWidth: 0.5,
    borderTopColor: DashboardColors.border,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  btnPrimary: {
    backgroundColor: DashboardColors.fab.background,
  },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: DashboardColors.info.text,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  labelPrimary: {
    color: '#fff',
  },
  labelSecondary: {
    color: DashboardColors.info.text,
  },
});
