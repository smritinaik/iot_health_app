import { Alert, FlatList, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { friendly } from '../../src/lib/errors';
import { useRoom } from '../../src/hooks/useRoom';
import { useAuth } from '../../src/store/auth';
import Mascot from '../../src/components/Mascot';
import ScreenBackground from '../../src/components/ScreenBackground';
import PrimaryButton from '../../src/components/PrimaryButton';
import { colors, radius, shadow } from '../../src/theme';

export default function RoomScreen() {
  const { data } = useRoom();
  const qc = useQueryClient();
  const myId = useAuth((s) => s.session?.user.id);
  const insets = useSafeAreaInsets();
  if (!data) return null;

  const isHead = data.myRole === 'HEAD';
  const refresh = () => qc.invalidateQueries({ queryKey: ['room'] });

  return (
    <ScreenBackground>
      <FlatList
        data={data.members}
        keyExtractor={(m) => m.userId}
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: 24, gap: 12 }}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <Text style={s.h}>{data.name}</Text>

            {isHead && (
              <View style={s.card}>
                <Text style={s.label}>Invite code</Text>
                <View style={s.codeRow}>
                  {(data.joinCode ?? '').split('').map((c, i) => (
                    <View key={i} style={s.codeBox}><Text style={s.codeChar}>{c}</Text></View>
                  ))}
                </View>
                <PrimaryButton
                  title="Share code"
                  icon="share-outline"
                  onPress={() => Share.share({ message: `Join my family on FamilyPulse with code ${data.joinCode}` })}
                />
                <PrimaryButton
                  title="Regenerate code"
                  variant="soft"
                  icon="refresh-outline"
                  onPress={async () => {
                    const { error } = await supabase.rpc('regenerate_code');
                    if (error) Alert.alert('Error', friendly(error));
                    refresh();
                  }}
                />
              </View>
            )}

            <Text style={s.section}>Members ({data.members.length})</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.member}>
            <Mascot mood="idle" size={52} bounce={false} blink={false} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={item.role === 'HEAD' ? 'shield-checkmark' : 'person'} size={13} color={colors.primary} />
                <Text style={s.role}>{item.role === 'HEAD' ? 'Head of family' : 'Member'}</Text>
              </View>
            </View>
            {isHead && item.userId !== myId && (
              <PrimaryButton
                title="Remove"
                variant="danger"
                icon="trash-outline"
                onPress={() =>
                  Alert.alert('Remove member?', item.name, [
                    { text: 'Cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: async () => {
                        const { error } = await supabase.rpc('remove_member', { p_user: item.userId });
                        if (error) Alert.alert('Error', friendly(error));
                        refresh();
                      },
                    },
                  ])
                }
              />
            )}
          </View>
        )}
        ListFooterComponent={
          <View style={{ marginTop: 12 }}>
            <PrimaryButton
              title="Log out"
              variant="ghost"
              icon="log-out-outline"
              onPress={async () => {
                await supabase.auth.signOut();
                qc.clear();
              }}
            />
          </View>
        }
      />
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 28, fontWeight: '900', color: colors.text },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 6 },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 18, gap: 12, ...shadow },
  label: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.6 },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  codeBox: { width: 44, height: 56, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  codeChar: { fontSize: 26, fontWeight: '900', color: colors.primary },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.card, padding: 12, ...shadow },
  name: { fontSize: 17, fontWeight: '800', color: colors.text },
  role: { fontSize: 12, color: colors.muted },
});