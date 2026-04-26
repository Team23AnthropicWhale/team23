import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardColors } from '@/constants/dashboard-colors';
import { useUser } from '@/context/user-context';

const PENDING_FILES = [
  { id: 1, name: 'FW-01_CP-0312_2026-04-26.csv', worker: 'FW-01', sector: 'Sector A', received: 'Today, 08:14' },
  { id: 2, name: 'FW-05_CP-0441_2026-04-26.csv', worker: 'FW-05', sector: 'Sector B', received: 'Today, 09:02' },
  { id: 3, name: 'FW-07_CP-0388_2026-04-25.csv', worker: 'FW-07', sector: 'Sector C', received: 'Yesterday, 17:45' },
];

export default function UploadScreen() {
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);

  if (user?.role !== 'supervisor') {
    return <Redirect href="/(tabs)/home" />;
  }
  const [uploaded, setUploaded] = useState<number[]>([]);

  const handleUpload = async () => {
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setUploaded(PENDING_FILES.map((f) => f.id));
    setUploading(false);
  };

  const pending = PENDING_FILES.filter((f) => !uploaded.includes(f.id));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload to Cloud</Text>
        <Text style={styles.headerSub}>Approved files ready for upload</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionLabel}>PENDING FILES</Text>

        {pending.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={40} color={DashboardColors.success.text} />
            <Text style={styles.emptyText}>All files uploaded</Text>
          </View>
        ) : (
          <View style={styles.fileList}>
            {pending.map((file, i) => (
              <View
                key={file.id}
                style={[styles.fileRow, i < pending.length - 1 && styles.fileRowBorder]}>
                <View style={styles.fileIcon}>
                  <Ionicons name="document-text-outline" size={20} color={DashboardColors.info.text} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={styles.fileMeta}>{file.worker} · {file.sector} · {file.received}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {pending.length > 0 && (
          <Pressable
            style={({ pressed }) => [styles.uploadButton, pressed && styles.uploadButtonPressed]}
            onPress={handleUpload}
            disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload {pending.length} file{pending.length !== 1 ? 's' : ''} to cloud</Text>
              </>
            )}
          </Pressable>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DashboardColors.surface,
  },
  header: {
    backgroundColor: DashboardColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: DashboardColors.border,
    gap: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: DashboardColors.textTertiary,
  },
  scroll: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  content: {
    padding: 14,
    paddingBottom: 80,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: DashboardColors.textTertiary,
    marginBottom: 4,
  },
  fileList: {
    backgroundColor: DashboardColors.surface,
    borderWidth: 0.5,
    borderColor: DashboardColors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fileRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: DashboardColors.border,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: DashboardColors.info.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
  },
  fileMeta: {
    fontSize: 11,
    color: DashboardColors.textTertiary,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DashboardColors.info.text,
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 6,
  },
  uploadButtonPressed: {
    opacity: 0.85,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: DashboardColors.success.text,
    fontWeight: '500',
  },
});
