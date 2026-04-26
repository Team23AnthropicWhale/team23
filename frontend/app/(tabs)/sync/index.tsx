import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardColors } from '@/constants/dashboard-colors';
import { useUser } from '@/context/user-context';
import { getAllCases } from '@/services/caseService';
import type { StoredCase } from '@/types/case';

type ItemStatus = 'idle' | 'syncing' | 'complete';
type OverallState = 'idle' | 'syncing' | 'complete';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function CaseRow({ item, status }: { item: StoredCase; status: ItemStatus }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (status === 'syncing') {
      rotation.setValue(0);
      spinAnim.current = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      spinAnim.current.start();
    } else {
      spinAnim.current?.stop();
      rotation.setValue(0);
    }
    return () => { spinAnim.current?.stop(); };
  }, [status]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const initials = (item.name ?? '').slice(0, 2).toUpperCase() || '??';

  return (
    <View style={styles.caseRow}>
      <View style={styles.caseAvatar}>
        <Text style={styles.caseAvatarText}>{initials}</Text>
      </View>
      <View style={styles.caseInfo}>
        <Text style={styles.caseName} numberOfLines={1}>{item.name || 'Unnamed case'}</Text>
        <Text style={styles.caseDate}>Created {formatDate(item.createdAt)}</Text>
      </View>
      {status === 'idle' && (
        <Ionicons name="ellipse-outline" size={20} color={DashboardColors.border} />
      )}
      {status === 'syncing' && (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="sync" size={20} color={DashboardColors.critical.text} />
        </Animated.View>
      )}
      {status === 'complete' && (
        <View style={styles.caseCheck}>
          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

export default function SyncScreen() {
  const { user } = useUser();
  const isSupervisor = user?.role === 'supervisor';

  const [cases, setCases] = useState<StoredCase[]>([]);
  const [caseStatuses, setCaseStatuses] = useState<Record<string, ItemStatus>>({});
  const [overallState, setOverallState] = useState<OverallState>('idle');

  // For supervisor card / button spinner
  const rotation = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef<Animated.CompositeAnimation | null>(null);

  useFocusEffect(
    useCallback(() => {
      getAllCases().then(setCases);
    }, []),
  );

  const startButtonSpin = () => {
    rotation.setValue(0);
    spinAnim.current = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    spinAnim.current.start();
  };

  const stopButtonSpin = () => {
    spinAnim.current?.stop();
    rotation.setValue(0);
  };

  const startSync = () => {
    if (overallState !== 'idle') return;
    setOverallState('syncing');
    startButtonSpin();

    // All cases start spinning immediately
    setCaseStatuses(Object.fromEntries(cases.map((c) => [c.id, 'syncing' as ItemStatus])));

    // Complete each case staggered at 600ms intervals
    cases.forEach((c, i) => {
      setTimeout(() => {
        setCaseStatuses((prev) => ({ ...prev, [c.id]: 'complete' }));
        if (i === cases.length - 1) {
          stopButtonSpin();
          setOverallState('complete');
        }
      }, (i + 1) * 600);
    });
  };

  const reset = () => {
    setOverallState('idle');
    setCaseStatuses({});
  };

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!isSupervisor ? (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Cases to Sync</Text>
            <Text style={styles.headerCount}>{cases.length} case{cases.length !== 1 ? 's' : ''}</Text>
          </View>

          {cases.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={36} color={DashboardColors.textTertiary} />
              <Text style={styles.emptyText}>No cases yet</Text>
            </View>
          ) : (
            <FlatList
              data={cases}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CaseRow item={item} status={caseStatuses[item.id] ?? 'idle'} />
              )}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}

          <View style={styles.footer}>
            {overallState === 'complete' && (
              <View style={styles.completeRow}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.completeText}>Sync Complete</Text>
                  <Text style={styles.completeSubText}>Sync with supervisor complete</Text>
                </View>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                overallState === 'syncing' && styles.buttonDisabled,
              ]}
              onPress={overallState === 'complete' ? reset : startSync}
              disabled={overallState === 'syncing'}>
              {overallState === 'syncing' && (
                <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 8 }}>
                  <Ionicons name="sync" size={18} color="#FFFFFF" />
                </Animated.View>
              )}
              <Text style={styles.buttonText}>
                {overallState === 'complete' ? 'Sync Again' : overallState === 'syncing' ? 'Syncing…' : 'Sync Now'}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        // Supervisor — simple card
        <View style={styles.center}>
          <View style={styles.card}>
            {overallState === 'complete' ? (
              <View style={styles.checkCircleLarge}>
                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
              </View>
            ) : (
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons
                  name="sync"
                  size={48}
                  color={overallState === 'syncing' ? DashboardColors.critical.text : DashboardColors.textTertiary}
                />
              </Animated.View>
            )}
            <View style={styles.textBlock}>
              <Text style={[styles.statusText, overallState === 'complete' && styles.statusTextComplete]}>
                {overallState === 'complete' ? 'Sync Complete' : overallState === 'syncing' ? 'Syncing…' : 'Not synced yet'}
              </Text>
              {overallState === 'complete' && (
                <Text style={styles.subText}>Sync with supervisor complete</Text>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                overallState === 'syncing' && styles.buttonDisabled,
              ]}
              onPress={overallState === 'complete' ? reset : startSync}
              disabled={overallState === 'syncing'}>
              <Text style={styles.buttonText}>
                {overallState === 'complete' ? 'Sync Again' : overallState === 'syncing' ? 'Syncing…' : 'Sync Now'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DashboardColors.background },

  // Caseworker layout
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: DashboardColors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: DashboardColors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  headerCount: {
    fontSize: 13,
    color: DashboardColors.textTertiary,
  },
  list: { flex: 1 },
  listContent: { paddingVertical: 8 },
  caseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: DashboardColors.surface,
  },
  caseAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DashboardColors.critical.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseAvatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: DashboardColors.critical.avatarText,
  },
  caseInfo: { flex: 1 },
  caseName: {
    fontSize: 14,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
  },
  caseDate: {
    fontSize: 12,
    color: DashboardColors.textTertiary,
    marginTop: 2,
  },
  caseCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DashboardColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 0.5,
    backgroundColor: DashboardColors.border,
    marginLeft: 68,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: DashboardColors.textTertiary,
  },
  footer: {
    padding: 16,
    gap: 12,
    backgroundColor: DashboardColors.surface,
    borderTopWidth: 0.5,
    borderTopColor: DashboardColors.border,
  },
  completeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DashboardColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeText: {
    fontSize: 14,
    fontWeight: '600',
    color: DashboardColors.success.text,
  },
  completeSubText: {
    fontSize: 12,
    color: DashboardColors.textTertiary,
  },

  // Supervisor card
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    paddingVertical: 36,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  checkCircleLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: DashboardColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { alignItems: 'center', gap: 4 },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
  },
  statusTextComplete: {
    color: DashboardColors.success.text,
    fontWeight: '600',
  },
  subText: { fontSize: 13, color: DashboardColors.textTertiary },

  // Shared
  button: {
    backgroundColor: DashboardColors.critical.text,
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 36,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { backgroundColor: DashboardColors.textTertiary },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
