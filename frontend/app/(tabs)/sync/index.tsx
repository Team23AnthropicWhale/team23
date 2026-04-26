import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinModal } from '@/components/sync/pin-modal';
import { SelectableRow } from '@/components/sync/selectable-row';
import { SyncFooter } from '@/components/sync/sync-footer';
import { SyncResultCard } from '@/components/sync/sync-result-card';
import { DashboardColors } from '@/constants/dashboard-colors';
import { useUser } from '@/context/user-context';
import { getAllCases } from '@/services/caseService';
import { initReplication, setSelectedCases } from '@/services/replicationManager';
import type { StoredCase } from '@/types/case';
import {
  cancelPairing,
  confirmPairing,
  connectAndSync,
  onError as onBleError,
  onPINGenerated,
  onSyncComplete,
  scanForDevices,
  setRole,
  stopBluetooth,
} from '../../../../secure-sync/syncOrchestrator';

type Phase = 'idle' | 'scanning' | 'selectDevices' | 'selectCases' | 'syncing' | 'done';

interface DeviceInfo {
  deviceId: string;
  deviceName: string;
}

interface SyncOutcome {
  device: DeviceInfo;
  transferred?: number;
  received?: number;
  conflicts?: string[];
  error?: string;
}

export default function SyncScreen() {
  const { user } = useUser();
  const [phase, setPhase] = useState<Phase>('idle');
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  const [cases, setCases] = useState<StoredCase[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [currentPin, setCurrentPin] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, deviceName: '' });
  const [outcomes, setOutcomes] = useState<SyncOutcome[]>([]);
  const syncResultRef = useRef<{ transferred: number; received: number; conflicts: string[] } | null>(null);

  useEffect(() => {
    initReplication();
    if (user) setRole(user.role === 'supervisor' ? 'supervisor' : 'caseworker');
    onPINGenerated(pin => setCurrentPin(pin));
    return () => { stopBluetooth(); };
  }, [user]);

  async function handleScan() {
    setPhase('scanning');
    setDevices([]);
    setSelectedDeviceIds(new Set());
    try {
      const found = await scanForDevices();
      setDevices(found);
      setPhase('selectDevices');
    } catch {
      setPhase('idle');
    }
  }

  function toggleDevice(id: string) {
    setSelectedDeviceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleNext() {
    const loaded = await getAllCases();
    setCases(loaded);
    setSelectedCaseIds(new Set(loaded.map(c => c.id)));
    setPhase('selectCases');
  }

  function toggleCase(id: string) {
    setSelectedCaseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSync() {
    const deviceList = devices.filter(d => selectedDeviceIds.has(d.deviceId));
    setSelectedCases([...selectedCaseIds]);
    setPhase('syncing');
    const results: SyncOutcome[] = [];

    for (let i = 0; i < deviceList.length; i++) {
      const device = deviceList[i];
      setSyncProgress({ current: i + 1, total: deviceList.length, deviceName: device.deviceName });
      syncResultRef.current = null;
      onSyncComplete(r => { syncResultRef.current = r; });
      onBleError(() => {});

      try {
        await connectAndSync(device.deviceId);
        const r = syncResultRef.current;
        results.push({ device, transferred: r?.transferred ?? 0, received: r?.received ?? 0, conflicts: r?.conflicts ?? [] });
      } catch (err) {
        results.push({ device, error: err instanceof Error ? err.message : String(err) });
      }
      setCurrentPin(null);
    }

    setOutcomes(results);
    setPhase('done');
  }

  function handleReset() {
    setPhase('idle');
    setDevices([]);
    setSelectedDeviceIds(new Set());
    setCases([]);
    setSelectedCaseIds(new Set());
    setOutcomes([]);
  }

  const nDevices = selectedDeviceIds.size;
  const nCases = selectedCaseIds.size;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sync</Text>
        <Text style={styles.headerSub}>{phaseLabel(phase)}</Text>
      </View>

      {phase === 'idle' && (
        <View style={styles.center}>
          <TouchableOpacity style={styles.scanBtn} onPress={handleScan}>
            <Ionicons name="bluetooth" size={20} color="#fff" />
            <Text style={styles.scanBtnText}>Start Scan</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'scanning' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DashboardColors.info.text} />
          <Text style={styles.statusText}>Scanning for nearby devices…</Text>
        </View>
      )}

      {phase === 'selectDevices' && (
        <View style={styles.fill}>
          {devices.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="bluetooth-outline" size={40} color={DashboardColors.textTertiary} />
              <Text style={styles.emptyText}>No devices found</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleScan}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={devices}
              keyExtractor={d => d.deviceId}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <SelectableRow
                  title={item.deviceName}
                  subtitle={item.deviceId}
                  selected={selectedDeviceIds.has(item.deviceId)}
                  onPress={() => toggleDevice(item.deviceId)}
                  icon="phone-portrait-outline"
                />
              )}
            />
          )}
          {devices.length > 0 && (
            <SyncFooter
              label={`Next — ${nDevices} device${nDevices !== 1 ? 's' : ''} selected`}
              onPress={handleNext}
              disabled={nDevices === 0}
              icon="arrow-forward"
            />
          )}
        </View>
      )}

      {phase === 'selectCases' && (
        <View style={styles.fill}>
          {cases.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="folder-open-outline" size={40} color={DashboardColors.textTertiary} />
              <Text style={styles.emptyText}>No cases to share</Text>
            </View>
          ) : (
            <FlatList
              data={cases}
              keyExtractor={c => c.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <SelectableRow
                  title={item.name}
                  subtitle={new Date(item.createdAt).toLocaleDateString()}
                  selected={selectedCaseIds.has(item.id)}
                  onPress={() => toggleCase(item.id)}
                />
              )}
            />
          )}
          <SyncFooter
            label={`Sync ${nCases} case${nCases !== 1 ? 's' : ''} to ${nDevices} device${nDevices !== 1 ? 's' : ''}`}
            onPress={handleSync}
            disabled={nCases === 0}
            icon="sync"
          />
        </View>
      )}

      {phase === 'syncing' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DashboardColors.info.text} />
          <Text style={styles.statusText}>
            Device {syncProgress.current} of {syncProgress.total}
          </Text>
          <Text style={styles.deviceNameText}>{syncProgress.deviceName}</Text>
        </View>
      )}

      {phase === 'done' && (
        <View style={styles.fill}>
          <FlatList
            data={outcomes}
            keyExtractor={o => o.device.deviceId}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={<Text style={styles.sectionLabel}>Sync Results</Text>}
            renderItem={({ item }) => (
              <SyncResultCard
                deviceName={item.device.deviceName}
                transferred={item.transferred}
                received={item.received}
                conflicts={item.conflicts}
                error={item.error}
              />
            )}
          />
          <SyncFooter
            label="Sync Again"
            onPress={handleReset}
            icon="refresh"
            variant="secondary"
          />
        </View>
      )}

      <PinModal
        visible={currentPin !== null}
        pin={currentPin}
        onConfirm={() => { confirmPairing(); setCurrentPin(null); }}
        onCancel={() => { cancelPairing(); setCurrentPin(null); }}
      />
    </SafeAreaView>
  );
}

function phaseLabel(phase: Phase): string {
  switch (phase) {
    case 'idle': return 'Find nearby devices';
    case 'scanning': return 'Searching…';
    case 'selectDevices': return 'Select devices';
    case 'selectCases': return 'Select cases';
    case 'syncing': return 'Syncing…';
    case 'done': return 'Complete';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
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
  headerSub: {
    fontSize: 13,
    color: DashboardColors.textSecondary,
  },
  fill: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  statusText: {
    fontSize: 14,
    color: DashboardColors.textSecondary,
    marginTop: 4,
  },
  deviceNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  listContent: {
    padding: 14,
    paddingBottom: 100,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: DashboardColors.textTertiary,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: DashboardColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: DashboardColors.fab.background,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  scanBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  retryBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: DashboardColors.info.text,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: DashboardColors.info.text,
  },
});
