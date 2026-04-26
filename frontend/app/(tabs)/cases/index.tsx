import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CaseCard } from '@/components/cases/case-card';
import { CreateCaseModal } from '@/components/cases/create-case-modal';
import { DashboardColors } from '@/constants/dashboard-colors';
import { useCases } from '@/context/case-context';
import type { StoredCase } from '@/types/case';

export default function CasesScreen() {
  const { cases, loading, createCase, deleteCase } = useCases();
  const [modalVisible, setModalVisible] = useState(false);

  async function handleCreate(name: string) {
    setModalVisible(false);
    try {
      await createCase(name);
    } catch {
      Alert.alert('Error', 'Could not create case.');
    }
  }

  function handleDelete(item: StoredCase) {
    Alert.alert('Delete Case', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCase(item.id),
      },
    ]);
  }

  function handlePress(item: StoredCase) {
    Alert.alert('Open Case', item.name);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cases</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={26} color={DashboardColors.info.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={DashboardColors.info.text} style={styles.spinner} />
        ) : cases.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={40} color={DashboardColors.textTertiary} />
            <Text style={styles.emptyText}>No cases yet. Tap + to create one.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {cases.map((c) => (
              <CaseCard key={c.id} item={c} onPress={handlePress} onDelete={handleDelete} />
            ))}
          </View>
        )}
      </ScrollView>

      <CreateCaseModal
        visible={modalVisible}
        onConfirm={handleCreate}
        onCancel={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  scroll: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 80,
  },
  spinner: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: DashboardColors.textTertiary,
    textAlign: 'center',
  },
  list: {
    gap: 7,
  },
});
