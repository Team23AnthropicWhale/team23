import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';

import { DashboardColors } from '@/constants/dashboard-colors';
import type { ArrayField, FormField, FormValues } from '@/types/form';
import { DatePickerModal } from './date-picker';

function formatLabel(option: string): string {
  return option
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function isVisible(field: FormField, allValues: FormValues): boolean {
  if (!field.conditional) return true;
  return allValues[field.conditional.field] === field.conditional.value;
}

// ─── Field renderers ──────────────────────────────────────────────────────────

function StringInput({ field, value, onChange }: FieldProps) {
  const isMultiline = field.type === 'text';
  return (
    <TextInput
      style={[styles.input, isMultiline && styles.textArea]}
      value={(value as string) ?? ''}
      onChangeText={onChange}
      multiline={isMultiline}
      numberOfLines={isMultiline ? 4 : 1}
      textAlignVertical={isMultiline ? 'top' : 'center'}
      placeholderTextColor={DashboardColors.textTertiary}
    />
  );
}

function DateInput({ field, value, onChange }: FieldProps) {
  const [open, setOpen] = useState(false);
  const dateStr = (value as string) ?? '';
  return (
    <>
      <Pressable
        style={[styles.input, styles.dateButton]}
        onPress={() => setOpen(true)}>
        <Ionicons
          name="calendar-outline"
          size={16}
          color={dateStr ? DashboardColors.info.text : DashboardColors.textTertiary}
        />
        <Text style={[styles.dateText, !dateStr && styles.datePlaceholder]}>
          {dateStr || 'DD/MM/YYYY'}
        </Text>
      </Pressable>
      <DatePickerModal
        visible={open}
        value={dateStr}
        onConfirm={(d) => {
          onChange(d);
          setOpen(false);
        }}
        onDismiss={() => setOpen(false)}
      />
    </>
  );
}

function IntegerInput({ field, value, onChange }: FieldProps) {
  return (
    <TextInput
      style={styles.input}
      value={value !== undefined && value !== null ? String(value) : ''}
      onChangeText={(t) => onChange(t === '' ? undefined : parseInt(t, 10))}
      keyboardType="number-pad"
      placeholderTextColor={DashboardColors.textTertiary}
    />
  );
}

function BooleanInput({ field, value, onChange }: FieldProps) {
  return (
    <View style={styles.boolRow}>
      {(['Yes', 'No'] as const).map((label) => {
        const boolVal = label === 'Yes';
        const active = value === boolVal;
        return (
          <Pressable
            key={label}
            style={[styles.boolOption, active && styles.boolOptionActive]}
            onPress={() => onChange(boolVal)}>
            <Text style={[styles.boolOptionText, active && styles.boolOptionTextActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function EnumInput({ field, value, onChange }: FieldProps) {
  if (field.type !== 'enum') return null;
  return (
    <View style={styles.optionList}>
      {field.options.map((option) => {
        const active = value === option;
        return (
          <Pressable
            key={option}
            style={[styles.optionRow, active && styles.optionRowActive]}
            onPress={() => onChange(option)}>
            <View style={[styles.radio, active && styles.radioActive]}>
              {active && <View style={styles.radioDot} />}
            </View>
            <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
              {formatLabel(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MultiSelectInput({ field, value, onChange }: FieldProps) {
  if (field.type !== 'multiselect') return null;
  const selected = (value as string[]) ?? [];
  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((s) => s !== option)
      : [...selected, option];
    onChange(next);
  };
  return (
    <View style={styles.optionList}>
      {field.options.map((option) => {
        const active = selected.includes(option);
        return (
          <Pressable
            key={option}
            style={[styles.optionRow, active && styles.optionRowActive]}
            onPress={() => toggle(option)}>
            <View style={[styles.checkbox, active && styles.checkboxActive]}>
              {active && <Ionicons name="checkmark" size={11} color="#fff" />}
            </View>
            <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
              {formatLabel(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SignatureInput({ field, value, onChange }: FieldProps) {
  const signed = !!value;

  const handleSign = async () => {
    if (signed) {
      onChange(null);
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      onChange('__signed__');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Sign: ${field.label}`,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      onChange('__signed__');
    }
  };

  return (
    <Pressable
      style={[styles.signatureBox, signed && styles.signatureBoxSigned]}
      onPress={handleSign}>
      <Ionicons
        name={signed ? 'checkmark-circle' : 'pencil-outline'}
        size={22}
        color={signed ? DashboardColors.success.text : DashboardColors.textTertiary}
      />
      <Text style={[styles.signatureText, signed && styles.signatureTextSigned]}>
        {signed ? 'Signed — tap to clear' : 'Tap to sign'}
      </Text>
    </Pressable>
  );
}

function ArrayInput({ field, value, onChange, allValues }: FieldProps) {
  const arrayField = field as ArrayField;

  if (arrayField.items === 'string') {
    const list = (value as string[]) ?? [];
    return (
      <TextInput
        style={styles.input}
        value={list.join(', ')}
        onChangeText={(t) =>
          onChange(
            t
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        placeholder="Separate multiple values with commas"
        placeholderTextColor={DashboardColors.textTertiary}
      />
    );
  }

  const itemDef = arrayField.items as { type: 'object'; fields: FormField[] };
  const items = (value as FormValues[]) ?? [];

  return (
    <View style={styles.arrayContainer}>
      {items.map((item, idx) => (
        <View key={idx} style={styles.arrayItem}>
          <View style={styles.arrayItemHeader}>
            <Text style={styles.arrayItemTitle}>#{idx + 1}</Text>
            <Pressable
              style={styles.removeBtn}
              onPress={() => onChange(items.filter((_, i) => i !== idx))}>
              <Ionicons name="trash-outline" size={14} color={DashboardColors.critical.text} />
            </Pressable>
          </View>
          {itemDef.fields.map((subField) => (
            <FormFieldInput
              key={subField.id}
              field={subField}
              value={item[subField.id]}
              onChange={(v) => {
                const next = [...items];
                next[idx] = { ...item, [subField.id]: v };
                onChange(next);
              }}
              allValues={item}
            />
          ))}
        </View>
      ))}
      <Pressable style={styles.addBtn} onPress={() => onChange([...items, {}])}>
        <Ionicons name="add-circle-outline" size={16} color={DashboardColors.info.text} />
        <Text style={styles.addBtnText}>Add entry</Text>
      </Pressable>
    </View>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface FieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  allValues: FormValues;
}

export function FormFieldInput({ field, value, onChange, allValues }: FieldProps) {
  if (!isVisible(field, allValues)) return null;

  const renderInput = () => {
    switch (field.type) {
      case 'string':
      case 'text':
        return <StringInput field={field} value={value} onChange={onChange} allValues={allValues} />;
      case 'date':
        return <DateInput field={field} value={value} onChange={onChange} allValues={allValues} />;
      case 'integer':
        return <IntegerInput field={field} value={value} onChange={onChange} allValues={allValues} />;
      case 'boolean':
        return <BooleanInput field={field} value={value} onChange={onChange} allValues={allValues} />;
      case 'enum':
        return <EnumInput field={field} value={value} onChange={onChange} allValues={allValues} />;
      case 'multiselect':
        return <MultiSelectInput field={field} value={value} onChange={onChange} allValues={allValues} />;
      case 'signature':
        return <SignatureInput field={field} value={value} onChange={onChange} allValues={allValues} />;
      case 'array':
        return <ArrayInput field={field} value={value} onChange={onChange} allValues={allValues} />;
    }
  };

  return (
    <View style={styles.fieldWrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{field.label.toUpperCase()}</Text>
        {field.optional && <Text style={styles.optional}>OPTIONAL</Text>}
      </View>
      {renderInput()}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrapper: {
    gap: 6,
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: DashboardColors.textTertiary,
  },
  optional: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.4,
    color: DashboardColors.warning.text,
    backgroundColor: DashboardColors.warning.bg,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  input: {
    backgroundColor: DashboardColors.surface,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: DashboardColors.textPrimary,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 11,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 15,
    color: DashboardColors.textPrimary,
  },
  datePlaceholder: {
    color: DashboardColors.textTertiary,
  },
  boolRow: {
    flexDirection: 'row',
    gap: 8,
  },
  boolOption: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    backgroundColor: DashboardColors.surface,
  },
  boolOptionActive: {
    backgroundColor: DashboardColors.info.bg,
    borderColor: DashboardColors.info.bar,
  },
  boolOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
  },
  boolOptionTextActive: {
    color: DashboardColors.info.text,
  },
  optionList: {
    gap: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    backgroundColor: DashboardColors.surface,
  },
  optionRowActive: {
    backgroundColor: DashboardColors.info.bg,
    borderColor: DashboardColors.info.bar,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: DashboardColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DashboardColors.surface,
  },
  radioActive: {
    borderColor: DashboardColors.info.bar,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DashboardColors.info.bar,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: DashboardColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DashboardColors.surface,
  },
  checkboxActive: {
    backgroundColor: DashboardColors.info.bar,
    borderColor: DashboardColors.info.bar,
  },
  optionLabel: {
    fontSize: 14,
    color: DashboardColors.textSecondary,
    flex: 1,
  },
  optionLabelActive: {
    color: DashboardColors.info.text,
    fontWeight: '500',
  },
  signatureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    borderStyle: 'dashed',
    backgroundColor: DashboardColors.surface,
    justifyContent: 'center',
  },
  signatureBoxSigned: {
    borderStyle: 'solid',
    borderColor: DashboardColors.success.text,
    backgroundColor: DashboardColors.success.bg,
  },
  signatureText: {
    fontSize: 14,
    color: DashboardColors.textTertiary,
  },
  signatureTextSigned: {
    color: DashboardColors.success.text,
    fontWeight: '500',
  },
  arrayContainer: {
    gap: 8,
  },
  arrayItem: {
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: DashboardColors.surface,
  },
  arrayItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  arrayItemTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: DashboardColors.textTertiary,
    letterSpacing: 0.4,
  },
  removeBtn: {
    padding: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: DashboardColors.info.bar,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontSize: 13,
    color: DashboardColors.info.text,
    fontWeight: '500',
  },
});
