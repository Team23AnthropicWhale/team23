import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';

interface Props {
  visible: boolean;
  pin: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PinModal({ visible, pin, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Ionicons name="lock-closed-outline" size={32} color={DashboardColors.info.text} />
          <Text style={styles.title}>Confirm Pairing PIN</Text>
          <Text style={styles.pin}>{pin}</Text>
          <Text style={styles.hint}>Check that this code matches on both devices</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  pin: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 8,
    color: DashboardColors.info.text,
  },
  hint: {
    fontSize: 13,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: DashboardColors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: DashboardColors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: DashboardColors.fab.background,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
