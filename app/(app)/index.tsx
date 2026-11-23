import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoom } from '../../src/hooks/useRoom';
import { useAuth } from '../../src/store/auth';
import { StatusBadge } from '../../src/components/StatusBadge';
import { Disclaimer } from '../../src/components/Disclaimer';
import Mascot from '../../src/components/Mascot';
import ScreenBackground from '../../src/components/ScreenBackground';
import PrimaryButton from '../../src/components/PrimaryButton';
import { timeAgo } from '../../src/lib/format';
import { colors, Mood, radius, shadow, STATUS } from '../../src/theme';

const RANK = { NORMAL: 0, WATCH: 1, CONSULT: 2 } as const;

export default function Dashboard() {
  const { data, refetch, isFetching } = useRoom();
  const myName = useAuth((s) => s.session?.user.user_metadata?.name as string | undefined);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!data) return null; // the layout already handles loading, errors and "no room"

  const scanned = data.members.filter((m) => m.latest);
  const worst = scanned.reduce<(typeof scanned)[number] | null>(
    (w, m) => (!w || RANK[m.latest!.status] > RANK[w.latest!.status] ? m : w),
    null,
  );
  const mood: Mood = worst ? STATUS[worst.latest!.status].mood : 'idle';
  const headline = !worst
    ? 'No scans yet. Take the first one!'
    : worst.latest!.status === 'NORMAL'
      ? 'Everyone is looking good 🎉'
      : `${worst.name}: ${STATUS[worst.latest!.status].line}`;

  return (
    <ScreenBackground>
      <FlatList
        data={data.members}
        keyExtractor={(m) => m.userId}
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: 24, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              refetch();
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <View>
              <Text style={s.hello}>Hello, {myName ?? 'there'} 👋</Text>
              <Text style={s.room}>{data.name}</Text>
            </View>

            <LinearGradient colors={['#EFE9FF', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.banner}>
              <Mascot mood={mood} size={104} />
              <View style={{ flex: 1, gap: 10 }}>
                <Text style={s.bannerTitle}>Family mood</Text>
                <Text style={s.bannerText}>{headline}</Text>
                <PrimaryButton title="Take my scan" icon="pulse" onPress={() => router.push('/scan')} />
              </View>
            </LinearGradient>

            <Text style={s.section}>Family members</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}
            onPress={() => router.push({ pathname: '/member/[id]', params: { id: item.userId } })}
          >
            <Mascot mood={item.latest ? STATUS[item.latest.status].mood : 'idle'} size={64} bounce={false} blink={false} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.name}>{item.name}</Text>
                {item.role === 'HEAD' && <Ionicons name="shield-checkmark" size={16} color={colors.primary} />}
              </View>
              {item.latest ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="heart" size={16} color={colors.red} />
                    <Text style={s.bpm}>{item.latest.bpm}</Text>
                    <Text style={s.unit}>BPM · HRV {item.latest.rmssd} ms</Text>
                  </View>
                  <Text style={s.time}>{timeAgo(item.latest.measuredAt)}</Text>
                </>
              ) : (
                <Text style={s.time}>No scans yet</Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              {item.latest && <StatusBadge status={item.latest.status} />}
              <Ionicons name="chevron-forward" size={18} color="#C4C0D6" />
            </View>
          </Pressable>
        )}
        ListFooterComponent={<Disclaimer />}
      />
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  hello: { color: colors.muted, fontSize: 15 },
  room: { fontSize: 28, fontWeight: '900', color: colors.text },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.card + 4, padding: 16, ...shadow },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.6 },
  bannerText: { fontSize: 16, fontWeight: '700', color: colors.text },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 6 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.card, padding: 14, ...shadow },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  bpm: { fontSize: 20, fontWeight: '800', color: colors.text },
  unit: { fontSize: 12, color: colors.muted },
  time: { color: colors.muted, fontSize: 12 },
});