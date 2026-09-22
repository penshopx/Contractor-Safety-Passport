import { useSignIn } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    const { error } = await signIn.password({ emailAddress, password });
    if (!error && signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl('/');
          router.replace((url.startsWith('http') ? '/' : url) as Href);
        },
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.logo, { backgroundColor: colors.primary }]}><Feather name="shield" size={34} color={colors.primaryForeground} /></View>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>SAFETY PASSPORT</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Masuk untuk bekerja aman di lapangan.</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Gunakan akun yang sama dengan dasbor kontraktor.</Text>
      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
        <TextInput testID="email-input" value={emailAddress} onChangeText={setEmailAddress} autoCapitalize="none" keyboardType="email-address" placeholder="nama@perusahaan.co.id" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>Kata sandi</Text>
        <TextInput testID="password-input" value={password} onChangeText={setPassword} secureTextEntry placeholder="Kata sandi" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} />
        {errors.fields.identifier || errors.fields.password ? <Text style={[styles.error, { color: colors.destructive }]}>{errors.fields.identifier?.message ?? errors.fields.password?.message}</Text> : null}
        <Pressable testID="sign-in-button" disabled={!emailAddress || !password || fetchStatus === 'fetching'} onPress={submit} style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed || fetchStatus === 'fetching' ? 0.7 : 1 }]}>
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{fetchStatus === 'fetching' ? 'Memeriksa…' : 'Masuk'}</Text>
        </Pressable>
      </View>
      <Text style={[styles.footnote, { color: colors.mutedForeground }]}>Aktivitas tetap tersimpan di perangkat ketika koneksi terputus.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  logo: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  eyebrow: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, letterSpacing: 2 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 32, lineHeight: 39, marginTop: 10, maxWidth: 340 },
  subtitle: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, lineHeight: 22, marginTop: 12 },
  form: { marginTop: 36, gap: 10 },
  label: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, marginTop: 6 },
  input: { height: 52, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15 },
  button: { height: 54, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  buttonText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 },
  error: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13 },
  footnote: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, lineHeight: 18, marginTop: 'auto' },
});