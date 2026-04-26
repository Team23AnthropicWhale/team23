import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DashboardColors } from '@/constants/dashboard-colors';

const ITEM_HEIGHT = 48;
const VISIBLE = 5;
const PAD = ITEM_HEIGHT * 2;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function parseDate(value: string): { day: number; month: number; year: number } | null {
  const parts = value.split('/').map(Number);
  if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
    return { day: parts[0], month: parts[1] - 1, year: parts[2] };
  }
  return null;
}

// ─── Scroll column ────────────────────────────────────────────────────────────

interface ColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  flex?: number;
}

function PickerColumn({ items, selectedIndex, onSelect, flex = 1 }: ColumnProps) {
  const ref = useRef<ScrollView>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      ref.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: true });
    }
  }, [selectedIndex]);

  return (
    <View style={{ flex, position: 'relative' }}>
      {/* Selection highlight */}
      <View style={styles.selectionHighlight} pointerEvents="none" />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: selectedIndex * ITEM_HEIGHT }}
        contentContainerStyle={{ paddingVertical: PAD }}
        onLayout={() => {
          if (!hasInitialized.current) {
            ref.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
            hasInitialized.current = true;
          }
        }}
        onMomentumScrollEnd={(e) => {
          const raw = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          onSelect(Math.max(0, Math.min(raw, items.length - 1)));
        }}
        onScrollEndDrag={(e) => {
          const raw = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          onSelect(Math.max(0, Math.min(raw, items.length - 1)));
        }}
        style={{ height: ITEM_HEIGHT * VISIBLE }}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.pickerItem}>
            <Text style={styles.pickerItemText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DatePickerModalProps {
  visible: boolean;
  value: string;
  onConfirm: (date: string) => void;
  onDismiss: () => void;
}

export function DatePickerModal({ visible, value, onConfirm, onDismiss }: DatePickerModalProps) {
  const now = new Date();
  const parsed = parseDate(value);

  const [day, setDay] = useState(parsed?.day ?? now.getDate());
  const [month, setMonth] = useState(parsed?.month ?? now.getMonth());
  const [year, setYear] = useState(parsed?.year ?? now.getFullYear());

  const currentYear = now.getFullYear();
  const years = Array.from({ length: currentYear + 6 - 1900 }, (_, i) =>
    String(currentYear + 5 - i),
  );

  const maxDay = daysInMonth(month, year);
  const days = Array.from({ length: maxDay }, (_, i) => String(i + 1).padStart(2, '0'));

  const clampedDay = Math.min(day, maxDay);
  useEffect(() => {
    if (day > maxDay) setDay(maxDay);
  }, [month, year]);

  const yearIndex = years.findIndex((y) => y === String(year));

  const handleConfirm = () => {
    const dd = String(clampedDay).padStart(2, '0');
    const mm = String(month + 1).padStart(2, '0');
    onConfirm(`${dd}/${mm}/${year}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={styles.sheet}>
        <View style={styles.dragHandle} />
        <Text style={styles.sheetTitle}>Select Date</Text>

        <View style={styles.columnsRow}>
          <PickerColumn
            items={days}
            selectedIndex={clampedDay - 1}
            onSelect={(i) => setDay(i + 1)}
            flex={2}
          />
          <View style={styles.columnDivider} />
          <PickerColumn
            items={MONTHS}
            selectedIndex={month}
            onSelect={setMonth}
            flex={3}
          />
          <View style={styles.columnDivider} />
          <PickerColumn
            items={years}
            selectedIndex={yearIndex >= 0 ? yearIndex : 0}
            onSelect={(i) => setYear(parseInt(years[i], 10))}
            flex={3}
          />
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.cancelBtn} onPress={onDismiss}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>Confirm</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: DashboardColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: DashboardColors.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  columnDivider: {
    width: 1,
    height: ITEM_HEIGHT * VISIBLE,
    backgroundColor: DashboardColors.border,
    opacity: 0.4,
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    backgroundColor: DashboardColors.info.bg,
    borderRadius: 8,
    zIndex: -1,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemText: {
    fontSize: 18,
    color: DashboardColors.textPrimary,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: DashboardColors.background,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: DashboardColors.info.text,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});
