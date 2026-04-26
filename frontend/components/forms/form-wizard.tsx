import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';
import { useUser } from '@/context/user-context';
import type { FormDefinition, FormField, FormValues } from '@/types/form';
import { FormFieldInput } from './form-field';

// ─── Auto-fill helpers ────────────────────────────────────────────────────────

const AUTO_DATE_IDS = new Set([
  'date_completed',
  'date_started',
  'date_identified',
  'date_registered',
  'caseworker_date',
  'caseworker_date_auth',
]);

const AUTO_NAME_IDS = new Set(['caseworker_name', 'caseworker_name_auth']);

function todayString(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function buildInitialValues(form: FormDefinition, workerName: string | null): FormValues {
  const today = todayString();
  const values: FormValues = {};

  const fill = (field: FormField) => {
    if (field.type === 'date' && AUTO_DATE_IDS.has(field.id)) {
      values[field.id] = today;
    }
    if (field.type === 'string' && AUTO_NAME_IDS.has(field.id) && workerName) {
      values[field.id] = workerName;
    }
    if (field.type === 'array' && typeof field.items === 'object') {
      // no defaults for arrays
    }
  };

  for (const section of form.sections) {
    for (const field of section.fields) {
      fill(field);
    }
  }

  return values;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface FormWizardProps {
  form: FormDefinition;
  onClose: () => void;
}

export function FormWizard({ form, onClose }: FormWizardProps) {
  const { user } = useUser();

  const initialValues = useMemo(
    () => buildInitialValues(form, user?.name ?? null),
    [form, user],
  );

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>(initialValues);

  const section = form.sections[step];
  const totalSteps = form.sections.length;
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;
  const progress = (step + 1) / totalSteps;

  const updateField = (id: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.formBadge}>
            <Text style={styles.formBadgeText}>{form.form_id}</Text>
          </View>
          <Text style={styles.formTitle} numberOfLines={1}>
            {form.title}
          </Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={20} color={DashboardColors.textSecondary} />
        </Pressable>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          Step {step + 1} of {totalSteps}
        </Text>
      </View>

      {/* Section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.note && <Text style={styles.sectionNote}>{section.note}</Text>}
      </View>

      {/* Fields */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {section.fields.map((field) => (
          <FormFieldInput
            key={field.id}
            field={field}
            value={values[field.id]}
            onChange={(v) => updateField(field.id, v)}
            allValues={values}
          />
        ))}
        <View style={styles.scrollPadding} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, styles.btnSecondary, isFirst && styles.btnGhost]}
          onPress={() => setStep((s) => s - 1)}
          disabled={isFirst}>
          <Ionicons
            name="chevron-back"
            size={16}
            color={isFirst ? DashboardColors.textTertiary : DashboardColors.textSecondary}
          />
          <Text style={[styles.btnSecondaryText, isFirst && styles.btnGhostText]}>Previous</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, styles.btnPrimary, isLast && styles.btnSuccess]}
          onPress={() => (isLast ? onClose() : setStep((s) => s + 1))}>
          <Text style={styles.btnPrimaryText}>{isLast ? 'Complete' : 'Next'}</Text>
          {!isLast && <Ionicons name="chevron-forward" size={16} color="#fff" />}
          {isLast && <Ionicons name="checkmark" size={16} color="#fff" />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: DashboardColors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: DashboardColors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  formBadge: {
    backgroundColor: DashboardColors.info.bg,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: DashboardColors.info.text,
    letterSpacing: 0.3,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DashboardColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: DashboardColors.surface,
    gap: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: DashboardColors.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: DashboardColors.info.bar,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: DashboardColors.textTertiary,
    fontWeight: '500',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
  },
  sectionNote: {
    fontSize: 12,
    color: DashboardColors.warning.text,
    backgroundColor: DashboardColors.warning.bg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  scrollPadding: {
    height: 24,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: DashboardColors.surface,
    borderTopWidth: 0.5,
    borderTopColor: DashboardColors.border,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: DashboardColors.background,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: DashboardColors.textSecondary,
  },
  btnGhost: {
    opacity: 0.4,
  },
  btnGhostText: {
    color: DashboardColors.textTertiary,
  },
  btnPrimary: {
    flex: 2,
    backgroundColor: DashboardColors.info.text,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  btnSuccess: {
    backgroundColor: DashboardColors.success.text,
  },
});
