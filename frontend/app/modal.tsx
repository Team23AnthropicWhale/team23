import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormWizard } from '@/components/forms/form-wizard';
import { DashboardColors } from '@/constants/dashboard-colors';
import { FORMS } from '@/data/forms';
import type { FormDefinition } from '@/types/form';

const FORM_DESCRIPTIONS: Record<string, string> = {
  '1A': 'Consent and data collection permissions',
  '1B': 'Registration, risk assessment, and family details',
  '2': 'In-depth situation and needs assessment',
};

export default function ModalScreen() {
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<FormDefinition | null>(null);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {activeForm ? (
          <FormWizard form={activeForm} onClose={() => router.back()} />
        ) : (
          <View style={styles.container}>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>New Entry</Text>
                <Text style={styles.headerSubtitle}>Select a form to complete</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={8}>
                <Ionicons name="close" size={20} color={DashboardColors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {FORMS.map((form) => (
                <Pressable
                  key={form.form_id}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  onPress={() => setActiveForm(form)}>
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>{form.form_id}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{form.title}</Text>
                    <Text style={styles.cardDescription}>{FORM_DESCRIPTIONS[form.form_id]}</Text>
                    <Text style={styles.cardMeta}>{form.sections.length} sections</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={DashboardColors.textTertiary} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: DashboardColors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: DashboardColors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: DashboardColors.textTertiary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DashboardColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: DashboardColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: DashboardColors.info.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: DashboardColors.info.text,
    letterSpacing: 0.3,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  cardDescription: {
    fontSize: 12,
    color: DashboardColors.textSecondary,
    lineHeight: 16,
  },
  cardMeta: {
    fontSize: 11,
    color: DashboardColors.textTertiary,
    marginTop: 2,
  },
});
