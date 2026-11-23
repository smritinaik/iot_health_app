import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import Mascot from '../../src/components/Mascot';
import ScreenBackground from '../../src/components/ScreenBackground';
import Field from '../../src/components/Field';
import PrimaryButton from '../../src/components/PrimaryButton';
import { colors, radius, shadow } from '../../src/theme';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const insets = useSafeAreaInsets();

  const submit = async () => {
    setBusy(true);
    setMsg('');
    const { data, error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } });
    if (error) setMsg(error.message);
    else if (mode === 'signup' && !data.session) setMsg('Check your email to confirm, then log in.');
    setBusy(false); // on success the (auth) layout redirects automatically
  };

  const isInfo = msg.startsWith('Check your email');

  return (
    <ScreenBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: insets.top + 12, paddingBottom: 32 }}
        >
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Mascot mood={busy ? 'scanning' : msg && !isInfo ? 'worried' : 'idle'} size={150} />
            <Text style={s.brand}>FamilyPulse</Text>
            <Text style={s.tag}>Keep your family's hearts in sync 💜</Text>
          </View>

          <View style={s.card}>
            <View style={s.toggle}>
              {(['login', 'signup'] as const).map((m) => (
                <Pressable key={m} style={[s.tab, mode === m && s.tabOn]} onPress={() => setMode(m)}>
                  <Text style={[s.tabText, mode === m && s.tabTextOn]}>{m === 'login' ? 'Log in' : 'Sign up'}</Text>
                </Pressable>
              ))}
            </View>

            {mode === 'signup' && (
              <Field icon="person-outline" placeholder="Your name" value={name} onChangeText={setName} />
            )}
            <Field
              icon="mail-outline"
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Field icon="lock-closed-outline" placeholder="Password (8+ chars)" secure value={password} onChangeText={setPassword} />

            {!!msg && (
              <View style={[s.msg, { backgroundColor: isInfo ? colors.primarySoft : '#FDECEC' }]}>
                <Text style={{ color: isInfo ? colors.primary : colors.red, textAlign: 'center', fontWeight: '600' }}>{msg}</Text>
              </View>
            )}

            <PrimaryButton
              title={mode === 'login' ? 'Log in' : 'Create account'}
              icon={mode === 'login' ? 'log-in-outline' : 'sparkles-outline'}
              loading={busy}
              onPress={submit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  brand: { fontSize: 32, fontWeight: '900', color: colors.text, marginTop: 4 },
  tag: { color: colors.muted, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.card + 4, padding: 18, gap: 14, marginTop: 16, ...shadow },
  toggle: { flexDirection: 'row', backgroundColor: colors.primarySoft, borderRadius: 16, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabOn: { backgroundColor: '#fff', ...shadow },
  tabText: { fontWeight: '700', color: colors.muted },
  tabTextOn: { color: colors.primary },
  msg: { borderRadius: 14, padding: 12 },
});