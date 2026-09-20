import { Feather } from '@expo/vector-icons';
import { useListFieldActivities } from '@workspace/api-client-react';
import { useFieldActivities } from '@/context/FieldActivityContext';
import { useColors } from '@/hooks/useColors';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const statusLabel = { pending: 'Menunggu', syncing: 'Mengirim', synced: 'Tersinkron', failed: 'Coba lagi' } as const;

export default function HistoryScreen() {
  const colors = useColors();
  const { queue, isSyncing, syncNow } = useFieldActivities();
  const { data: serverActivities, isLoading } = useListFieldActivities();
  const pending = queue.filter((item) => item.localStatus !== 'synced');
  const syncedIds = new Set(queue.filter((item) => item.localStatus === 'synced').map((item) => item.clientId));
  const rows = [
    ...pending.map((item) => ({ ...item, id: item.clientId, local: true })),
    ...(serverActivities ?? []).filter((item) => !syncedIds.has(item.clientId)).map((item) => ({ ...item, local: false })),
    ...(serverActivities ?? []).filter((item) => syncedIds.has(item.clientId)).map((item) => ({ ...item, local: false })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 67 : 16 }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>RIWAYAT LAPANGAN</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Aktivitas & sinkronisasi</Text>
        </View>
        <Pressable testID="sync-button" onPress={() => void syncNow()} disabled={isSyncing} style={({ pressed }) => [styles.syncButton, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
          {isSyncing ? <ActivityIndicator size="small" color={colors.primary} /> : <Feather name="refresh-cw" size={20} color={colors.primary} />}
        </Pressable>
      </View>
      <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View><Text style={[styles.summaryNumber, { color: colors.foreground }]}>{pending.length}</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>belum terkirim</Text></View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View><Text style={[styles.summaryNumber, { color: colors.foreground }]}>{serverActivities?.length ?? 0}</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>di dashboard</Text></View>
      </View>
      {isLoading && rows.length === 0 ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={rows.length === 0 ? styles.emptyContainer : styles.list}
          scrollEnabled={rows.length > 0}
          ListEmptyComponent={<View style={styles.empty}><Feather name="clipboard" size={32} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Belum ada aktivitas</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Laporan yang dibuat akan muncul di sini.</Text></View>}
          renderItem={({ item }) => {
            const localStatus = 'localStatus' in item ? item.localStatus : 'synced';
            const statusColor = localStatus === 'failed' ? colors.destructive : localStatus === 'synced' ? colors.success : colors.warning;
            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.typeIcon, { backgroundColor: colors.secondary }]}><Feather name={item.type === 'Inspection' ? 'search' : item.type === 'Near miss' ? 'alert-triangle' : item.type === 'Permit to work' ? 'file-text' : 'volume-2'} size={18} color={colors.primary} /></View>
                  <View style={styles.cardTitleWrap}><Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.project} · {item.actor}</Text></View>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                </View>
                <View style={styles.evidence}>
                  {('localPhotoUri' in item && item.localPhotoUri) || item.photoObjectPath ? <Feather name="camera" size={15} color={colors.mutedForeground} /> : null}
                  {item.latitude != null ? <Feather name="map-pin" size={15} color={colors.mutedForeground} /> : null}
                  {item.signatureSvg ? <Feather name="edit-3" size={15} color={colors.mutedForeground} /> : null}
                  <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel[localStatus]}</Text>
                  <Text style={[styles.time, { color: colors.mutedForeground }]}>{new Date(item.occurredAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  eyebrow: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 1.6 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 24, marginTop: 4 },
  syncButton: { width: 44, height: 44, borderWidth: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  summary: { borderWidth: 1, borderRadius: 12, padding: 16, flexDirection: 'row', marginBottom: 14, gap: 28 },
  summaryNumber: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22 },
  summaryLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, marginTop: 2 },
  divider: { width: 1 },
  list: { paddingBottom: Platform.OS === 'web' ? 110 : 90, gap: 10 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeIcon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, lineHeight: 19 },
  meta: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, marginTop: 3 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  evidence: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 },
  statusText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 },
  time: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, marginLeft: 'auto' },
  loader: { marginTop: 60 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingBottom: 90 },
  emptyTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, marginTop: 14 },
  emptyText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, marginTop: 6 },
});