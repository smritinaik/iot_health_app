import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LineChart } from 'react-native-gifted-charts';
import { supabase } from '../../../src/lib/supabase';
import { useRoom } from '../../../src/hooks/useRoom';
import { Reading } from '../../../src/types';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { Disclaimer } from '../../../src/components/Disclaimer';
import Mascot from '../../../src/components/Mascot';
import ScreenBackground from '../../../src/components/ScreenBackground';
import { timeAgo } from '../../../src/lib/format';
import { colors, radius, shadow, STATUS } from '../../../src/theme';

type Point = { value: number; label: string };

function ChartCard({ title, icon, data, color, width }: { title: string; icon: 'heart' | 'pulse'; data: Point[]; color: string; width: number }) {
  const spacing = Math.max(28, width / Math.max(data.length - 1, 1));
  return (
    <View style={s.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      {data.length > 1 ? (
        <LineChart
          data={data}
          width={width}
          height={170}
          spacing={spacing}
          initialSpacing={10}
          endSpacing={10}
          thickness={3}
          color={color}
          curved
          areaChart
          startFillColor={color}
          endFillColor="#ffffff"
          startOpacity={0.25}
          endOpacity={0.02}
          hideRules
          yAxisThickness={0}
          xAxisThickness={0}
          dataPointsColor={color}
          dataPointsRadius={4}
          yAxisTextStyle={{ color: colors.muted, fontSize: 11 }}
          xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
        />
      ) : (
        <Text style={{ color: colors.muted }}>Need 2+ scans to draw a chart.</Text>
      )}
    </View>
  );
}

export default function MemberHistory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data: room } = useRoom();
  const member = room?.members.find((m) => m.userId === id);

  const { data = [] } = useQuery({
    queryKey: ['history', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('readings')
        .select('id, userId:user_id, bpm, rmssd, sdnn, irregularRatio:irregular_ratio, beatCount:beat_count, status, reasons, measuredAt:measured_at')
        .eq('user_id', id)
        .order('measured_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as Reading[];
    },
  });

  const chrono = [...data].reverse();
  const label = (r: Reading) => new Date(r.measuredAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const bpm = chrono.map((r) => ({ value: r.bpm, label: label(r) }));
  const hrv = chrono.map((r) => ({ value: r.rmssd, label: label(r) }));
  const latest = data[0];
  const chartW = width - 40 - 36 - 50;

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: 28, gap: 14 }}>
        <Pressable onPress={() => router.back()} style={s.back} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={s.hero}>
          <Mascot mood={latest ? STATUS[latest.status].mood : 'idle'} size={110} />
          <Text style={s.name}>{member?.name ?? 'Member'}</Text>
          {latest ? (
            <>
              <StatusBadge status={latest.status} />
              <Text style={{ color: colors.muted }}>Last scan {timeAgo(latest.measuredAt)}</Text>
            </>
          ) : (
            <Text style={{ color: colors.muted }}>No scans yet</Text>
          )}
        </View>

        <ChartCard title="Heart rate (BPM)" icon="heart" data={bpm} color={colors.red} width={chartW} />
        <ChartCard title="HRV (RMSSD, ms)" icon="pulse" data={hrv} color={colors.primary} width={chartW} />

        <Text style={s.section}>History</Text>
        {data.map((r) => (
          <View key={r.id} style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{r.bpm} BPM</Text>
              <Text style={s.rowSub}>{new Date(r.measuredAt).toLocaleString()}</Text>
            </View>
            <StatusBadge status={r.status} />
          </View>
        ))}
        <Disclaimer />
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow },
  hero: { alignItems: 'center', gap: 6 },
  name: { fontSize: 26, fontWeight: '900', color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 18, gap: 12, ...shadow },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 18, padding: 14, ...shadow },
  rowTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  rowSub: { fontSize: 12, color: colors.muted },
});