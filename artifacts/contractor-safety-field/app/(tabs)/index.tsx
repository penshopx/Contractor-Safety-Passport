import { Feather } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useDraftFieldActivityNotes, useListProjects, type FieldActivityInputType } from '@workspace/api-client-react';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { SignaturePad } from '@/components/SignaturePad';
import { useFieldActivities } from '@/context/FieldActivityContext';
import { useColors } from '@/hooks/useColors';

const types: { value: FieldActivityInputType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: 'Toolbox', label: 'TBM', icon: 'volume-2' },
  { value: 'Inspection', label: 'Inspeksi', icon: 'search' },
  { value: 'Permit to work', label: 'PTW', icon: 'file-text' },
  { value: 'Near miss', label: 'Nyaris celaka', icon: 'alert-triangle' },
];

export default function CreateActivityScreen() {
  const colors = useColors();
  const { addActivity, syncNow } = useFieldActivities();
  const { data: projects, isLoading: isLoadingProjects } = useListProjects();
  const [type, setType] = useState<FieldActivityInputType>('Toolbox');
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<number>();
  const [actor, setActor] = useState('');
  const [notes, setNotes] = useState('');
  const [suggestedNotes, setSuggestedNotes] = useState<string>();
  const draftRequest = useRef(0);
  const draftNotes = useDraftFieldActivityNotes();
  const [photoUri, setPhotoUri] = useState<string>();
  const [photoContentType, setPhotoContentType] = useState<'image/jpeg' | 'image/png' | 'image/webp'>();
  const [location, setLocation] = useState<Location.LocationObjectCoords>();
  const [signatureSvg, setSignatureSvg] = useState<string>();
  const [signatureKey, setSignatureKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const clearSuggestion = () => {
    draftRequest.current += 1;
    setSuggestedNotes(undefined);
  };

  const generateDraft = async () => {
    if (!title.trim() || notes.trim().length < 10) {
      Alert.alert('Catatan belum cukup', 'Isi judul dan setidaknya 10 karakter catatan terlebih dahulu.');
      return;
    }
    if (title.trim().length > 200 || notes.trim().length > 2000) {
      Alert.alert('Teks terlalu panjang', 'Draf AI menerima judul hingga 200 karakter dan catatan hingga 2.000 karakter. Catatan asli tidak diubah.');
      return;
    }
    clearSuggestion();
    const request = draftRequest.current;
    try {
      const network = await NetInfo.fetch();
      if (!network.isConnected || network.isInternetReachable === false) {
        Alert.alert('Sedang luring', 'Bantuan AI membutuhkan koneksi. Laporan tetap bisa disimpan di perangkat.');
        return;
      }
      const result = await draftNotes.mutateAsync({
        data: { type, title: title.trim(), notes: notes.trim() },
      });
      if (request === draftRequest.current) setSuggestedNotes(result.draft);
    } catch {
      if (request === draftRequest.current) {
        Alert.alert('Bantuan belum tersedia', 'Periksa koneksi dan coba lagi. Catatan asli tetap bisa disimpan.');
      }
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin kamera dibutuhkan', 'Aktifkan izin kamera untuk mengambil foto bukti.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.55, base64: false, allowsEditing: false });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri) {
      setPhotoUri(asset.uri);
      const mimeType = asset.mimeType;
      setPhotoContentType(
        mimeType === 'image/png' || mimeType === 'image/webp' ? mimeType : 'image/jpeg',
      );
    }
  };

  const captureLocation = async () => {
    if (Platform.OS === 'web') {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, altitude: position.coords.altitude, accuracy: position.coords.accuracy, altitudeAccuracy: position.coords.altitudeAccuracy, heading: position.coords.heading, speed: position.coords.speed }),
        () => Alert.alert('Lokasi tidak tersedia', 'Pastikan izin lokasi aktif.'),
      );
      return;
    }
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin lokasi dibutuhkan', 'Aktifkan izin lokasi agar bukti lapangan memiliki koordinat.');
      return;
    }
    const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation(result.coords);
  };

  const save = async () => {
    const project = projects?.find((item) => item.id === projectId);
    if (!title.trim() || !project || !actor.trim()) {
      Alert.alert('Data belum lengkap', 'Isi judul, proyek, dan penanggung jawab.');
      return;
    }
    setSaving(true);
    const occurredAt = new Date().toISOString();
    await addActivity({
      clientId: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type,
      title: title.trim(),
      projectId: project.id,
      project: project.name,
      actor: actor.trim(),
      status: type === 'Near miss' ? 'open' : 'complete',
      notes: notes.trim() || undefined,
      localPhotoUri: photoUri,
      photoContentType,
      latitude: location?.latitude,
      longitude: location?.longitude,
      locationAccuracy: location?.accuracy ?? undefined,
      signatureSvg,
      occurredAt,
    });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clearSuggestion();
    setTitle(''); setProjectId(undefined); setActor(''); setNotes(''); setPhotoUri(undefined); setPhotoContentType(undefined); setLocation(undefined); setSignatureSvg(undefined); setSignatureKey((value) => value + 1);
    setSaving(false);
    Alert.alert('Tersimpan di perangkat', 'Laporan aman disimpan dan akan disinkronkan saat koneksi tersedia.');
    void syncNow();
  };

  return (
    <KeyboardAwareScrollViewCompat style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'web' ? 67 : 16, paddingBottom: Platform.OS === 'web' ? 120 : 100 }]} bottomOffset={20}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>CATAT AKTIVITAS</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Bukti lapangan, tetap jalan tanpa sinyal.</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Waktu dicatat otomatis dan antrean akan dikirim saat daring.</Text>

      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Jenis kegiatan</Text>
      <View style={styles.typeGrid}>
        {types.map((item) => {
          const active = item.value === type;
          return <Pressable testID={`type-${item.label}`} key={item.value} onPress={() => { clearSuggestion(); setType(item.value); void Haptics.selectionAsync(); }} style={({ pressed }) => [styles.typeCard, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1 }]}><Feather name={item.icon} size={21} color={active ? colors.primaryForeground : colors.foreground} /><Text style={[styles.typeLabel, { color: active ? colors.primaryForeground : colors.foreground }]}>{item.label}</Text></Pressable>;
        })}
      </View>

      <View style={styles.form}>
        <Field label="Judul laporan" value={title} onChangeText={(value) => { clearSuggestion(); setTitle(value); }} placeholder="Rapat toolbox pekerjaan di ketinggian" colors={colors} />
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Proyek</Text>
        <View style={styles.projectList}>
          {projects?.map((project) => {
            const selected = project.id === projectId;
            return <Pressable key={project.id} testID={`project-${project.id}`} onPress={() => setProjectId(project.id)} style={[styles.projectOption, { backgroundColor: selected ? colors.secondary : colors.input, borderColor: selected ? colors.primary : colors.border }]}><Text style={[styles.projectOptionText, { color: colors.foreground }]}>{project.name}</Text><Text style={[styles.projectOptionMeta, { color: colors.mutedForeground }]}>{project.location}</Text></Pressable>;
          })}
          {!isLoadingProjects && projects?.length === 0 ? <Text style={{ color: colors.mutedForeground }}>Belum ada proyek di ruang kerja ini.</Text> : null}
        </View>
        <Field label="Penanggung jawab" value={actor} onChangeText={setActor} placeholder="Nama mandor / petugas K3" colors={colors} />
        <Field label="Catatan temuan" value={notes} onChangeText={(value) => { clearSuggestion(); setNotes(value); }} placeholder="Topik, temuan, tindakan koreksi…" colors={colors} multiline />
        <View style={[styles.aiBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.aiHeading}>
            <Feather name="edit-3" size={17} color={colors.primary} />
            <Text style={[styles.aiTitle, { color: colors.foreground }]}>Bantu susun catatan</Text>
          </View>
          <Text style={[styles.aiHint, { color: colors.mutedForeground }]}>
            Opsional saat daring. Hanya jenis kegiatan, judul, dan catatan di atas yang dikirim ke AI. Periksa faktanya sebelum memakai draf.
          </Text>
          <Pressable testID="generate-field-draft" accessibilityRole="button" disabled={draftNotes.isPending || saving || !title.trim() || notes.trim().length < 10} onPress={() => void generateDraft()} style={({ pressed }) => [styles.aiAction, { borderColor: colors.primary, opacity: pressed || draftNotes.isPending || saving || !title.trim() || notes.trim().length < 10 ? 0.55 : 1 }]}>
            <Text style={[styles.aiActionText, { color: colors.primary }]}>{draftNotes.isPending ? 'Menyusun draf…' : 'Buat usulan draf'}</Text>
          </Pressable>
          {suggestedNotes ? (
            <View style={[styles.draftPreview, { borderColor: colors.border, backgroundColor: colors.input }]}>
              <Text style={[styles.draftLabel, { color: colors.primary }]}>USULAN — BELUM DISIMPAN</Text>
              <Text selectable style={[styles.draftText, { color: colors.foreground }]}>{suggestedNotes}</Text>
              <View style={styles.draftActions}>
                <Pressable testID="discard-field-draft" accessibilityRole="button" onPress={clearSuggestion} style={styles.draftAction}><Text style={{ color: colors.mutedForeground }}>Abaikan</Text></Pressable>
                <Pressable testID="apply-field-draft" accessibilityRole="button" onPress={() => { setNotes(suggestedNotes); clearSuggestion(); }} style={styles.draftAction}><Text style={{ color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>Gunakan draf</Text></Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Bukti pendukung</Text>
      <View style={styles.actions}>
        <Pressable testID="camera-button" onPress={takePhoto} style={({ pressed }) => [styles.action, { backgroundColor: colors.card, borderColor: photoUri ? colors.success : colors.border, opacity: pressed ? 0.7 : 1 }]}>{photoUri ? <Image source={{ uri: photoUri }} style={styles.thumbnail} contentFit="cover" /> : <Feather name="camera" size={23} color={colors.primary} />}<Text style={[styles.actionLabel, { color: colors.foreground }]}>{photoUri ? 'Foto siap' : 'Ambil foto'}</Text></Pressable>
        <Pressable testID="location-button" onPress={captureLocation} style={({ pressed }) => [styles.action, { backgroundColor: colors.card, borderColor: location ? colors.success : colors.border, opacity: pressed ? 0.7 : 1 }]}><Feather name="map-pin" size={23} color={location ? colors.success : colors.primary} /><Text style={[styles.actionLabel, { color: colors.foreground }]}>{location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Ambil lokasi'}</Text></Pressable>
      </View>
      <Text style={[styles.signatureLabel, { color: colors.foreground }]}>Tanda tangan petugas</Text>
      <SignaturePad key={signatureKey} onChange={setSignatureSvg} />
      <Pressable testID="save-activity-button" disabled={saving} onPress={save} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed || saving ? 0.7 : 1 }]}><Feather name="check" size={20} color={colors.primaryForeground} /><Text style={[styles.saveText, { color: colors.primaryForeground }]}>{saving ? 'Menyimpan…' : 'Simpan aktivitas'}</Text></Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

function Field({ label, colors, multiline, ...props }: { label: string; colors: ReturnType<typeof useColors>; multiline?: boolean; value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text><TextInput {...props} multiline={multiline} placeholderTextColor={colors.mutedForeground} style={[styles.input, multiline && styles.multiline, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} /></View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18 },
  eyebrow: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 1.8 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 28, lineHeight: 35, marginTop: 7, maxWidth: 355 },
  subtitle: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: 345 },
  sectionLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginTop: 24, marginBottom: 10 },
  typeGrid: { flexDirection: 'row', gap: 8 },
  typeCard: { flex: 1, height: 68, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6 },
  typeLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10 },
  form: { marginTop: 18, gap: 13 },
  field: { gap: 7 },
  fieldLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 },
  projectList: { gap: 8 },
  projectOption: { minHeight: 54, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, justifyContent: 'center' },
  projectOptionText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
  projectOptionMeta: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, marginTop: 2 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
  multiline: { height: 92, paddingTop: 13, textAlignVertical: 'top' },
  aiBox: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 10 },
  aiHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },
  aiHint: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, lineHeight: 18 },
  aiAction: { minHeight: 40, borderWidth: 1, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  aiActionText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 },
  draftPreview: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 8 },
  draftLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 1 },
  draftText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, lineHeight: 20 },
  draftActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  draftAction: { minHeight: 40, paddingHorizontal: 6, justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, minHeight: 82, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', padding: 8, gap: 7, overflow: 'hidden' },
  actionLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10, textAlign: 'center' },
  thumbnail: { width: 38, height: 38, borderRadius: 6 },
  signatureLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, marginTop: 16, marginBottom: 7 },
  saveButton: { height: 56, borderRadius: 8, marginTop: 18, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
});
