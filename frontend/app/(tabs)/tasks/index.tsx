import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskList } from '@/components/dashboard/task-list';
import { DashboardColors } from '@/constants/dashboard-colors';
import { useTaskContext } from '@/context/task-context';
import type { UrgencyLevel } from '@/types/dashboard';

const URGENCY_OPTIONS: { level: UrgencyLevel; label: string; color: string }[] = [
  { level: 'red', label: 'Urgent', color: DashboardColors.critical.text },
  { level: 'amber', label: 'Medium', color: DashboardColors.warning.text },
  { level: 'blue', label: 'Low', color: DashboardColors.info.text },
];

const URGENCY_BG: Record<UrgencyLevel, string> = {
  red: DashboardColors.critical.bg,
  amber: DashboardColors.warning.bg,
  blue: DashboardColors.info.bg,
};

function formatTime(raw: string): string {
  const cleaned = raw.replace(/[^0-9:]/g, '');
  return cleaned || '--:--';
}

export default function TasksScreen() {
  const { tasks, addTask } = useTaskContext();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [caseId, setCaseId] = useState('');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('amber');
  const [error, setError] = useState('');

  const resetForm = () => {
    setTitle('');
    setCaseId('');
    setNotes('');
    setTime('');
    setUrgency('amber');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    setModalVisible(false);
  };

  const handleAdd = () => {
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (!time.trim()) {
      setError('Time is required (e.g. 09:00).');
      return;
    }

    addTask({
      id: caseId.trim() || '—',
      urgency,
      title: title.trim(),
      subtitle: notes.trim() || ' ',
      time: formatTime(time.trim()),
    });

    handleClose();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}>
          <Ionicons name="add" size={20} color={DashboardColors.info.text} />
          <Text style={styles.addButtonLabel}>New task</Text>
        </TouchableOpacity>
      </View>

      {/* Task list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {tasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks yet. Tap "New task" to add one.</Text>
          </View>
        ) : (
          <TaskList tasks={tasks} />
        )}
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}>
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Task</Text>
              <TouchableOpacity onPress={handleAdd} hitSlop={12}>
                <Text style={styles.doneText}>Add</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled">

              {/* Urgency selector */}
              <Text style={styles.fieldLabel}>URGENCY</Text>
              <View style={styles.urgencyRow}>
                {URGENCY_OPTIONS.map((opt) => {
                  const selected = urgency === opt.level;
                  return (
                    <Pressable
                      key={opt.level}
                      style={[
                        styles.urgencyChip,
                        selected && { backgroundColor: URGENCY_BG[opt.level], borderColor: opt.color },
                      ]}
                      onPress={() => setUrgency(opt.level)}>
                      <View style={[styles.urgencyDot, { backgroundColor: opt.color }]} />
                      <Text style={[styles.urgencyLabel, { color: selected ? opt.color : DashboardColors.textSecondary }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Title */}
              <Text style={styles.fieldLabel}>TASK TITLE</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Home visit"
                placeholderTextColor={DashboardColors.textTertiary}
                returnKeyType="next"
              />

              {/* Case ID */}
              <Text style={styles.fieldLabel}>CASE ID (optional)</Text>
              <TextInput
                style={styles.input}
                value={caseId}
                onChangeText={setCaseId}
                placeholder="e.g. CP-0441"
                placeholderTextColor={DashboardColors.textTertiary}
                autoCapitalize="characters"
                returnKeyType="next"
              />

              {/* Notes */}
              <Text style={styles.fieldLabel}>NOTES (optional)</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional context…"
                placeholderTextColor={DashboardColors.textTertiary}
                multiline
                numberOfLines={3}
                returnKeyType="next"
              />

              {/* Time */}
              <Text style={styles.fieldLabel}>TIME</Text>
              <TextInput
                style={styles.input}
                value={time}
                onChangeText={setTime}
                placeholder="09:00"
                placeholderTextColor={DashboardColors.textTertiary}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DashboardColors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: DashboardColors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: DashboardColors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonLabel: {
    fontSize: 14,
    color: DashboardColors.info.text,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  content: {
    padding: 14,
    paddingBottom: 80,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: DashboardColors.textTertiary,
    textAlign: 'center',
  },
  // Modal
  modalWrapper: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: DashboardColors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: DashboardColors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  cancelText: {
    fontSize: 15,
    color: DashboardColors.textTertiary,
  },
  doneText: {
    fontSize: 15,
    fontWeight: '600',
    color: DashboardColors.info.text,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 16,
    gap: 8,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: DashboardColors.textTertiary,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: DashboardColors.surface,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: DashboardColors.textPrimary,
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  urgencyChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    backgroundColor: DashboardColors.surface,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  urgencyLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: DashboardColors.critical.text,
    marginTop: 4,
  },
});
