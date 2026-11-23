import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { friendly } from '../lib/errors';
import Mascot from './Mascot';
import ScreenBackground from './ScreenBackground';
import Field from './Field';
import PrimaryButton from './PrimaryButton';
import { colors, radius, shadow } from '../theme';

export default function RoomSetup() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();

  // once the room exists, the layout re-renders and shows the tabs automatically
  const done = async (error: { message?: string } | null) => {
    if (error) { setErr(friendly(error)); return; }
    await qc.invalidateQueries({ queryKey: ['room'] });
  };

  const create = async () => {
    setErr('');
    const { error } = await supabase.rpc('create_room', { p_name: name });
    await done(error);
  };

  const join = async () => {
    setErr('');
    const { data, error } = await supabase.rpc('join_room', { p_code: code });
    if (!error && !data) { setErr('Invalid code'); return; }
    await done(error);
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: 40, gap: 16 }}
        >
          <View style={{ alignItems: 'center' }}>
            <Mascot mood={err ? 'worried' : 'idle'} size={130} />
            <Text style={s.h}>Your family room</Text>
            <Text style={s.sub}>Create one for your family, or join with a code.</Text>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Create a room</Text>
            <Text style={s.cardSub}>You'll be the head of the family.</Text>
            <Field icon="people-outline" placeholder="Family name" value={name} onChangeText={setName} />
            <PrimaryButton title="Create room" icon="add-circle-outline" onPress={create} />
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Join a room</Text>
            <Text style={s.cardSub}>Ask the head of family for the 6-character code.</Text>
            <Field
              icon="key-outline"
              placeholder="ABC123"
              autoCapitalize="characters"
              maxLength={6}
              value={code}
              onChangeText={setCode}
              style={{ letterSpacing: 4, fontWeight: '700' }}
            />
            <PrimaryButton title="Join with code" variant="soft" icon="enter-outline" onPress={join} />
          </View>

          {!!err && (
            <View style={s.err}>
              <Text style={{ color: colors.red, textAlign: 'center', fontWeight: '600' }}>{err}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 4 },
  sub: { color: colors.muted, textAlign: 'center', marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 18, gap: 12, ...shadow },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  cardSub: { color: colors.muted, marginTop: -6 },
  err: { backgroundColor: '#FDECEC', borderRadius: 16, padding: 12 },
});