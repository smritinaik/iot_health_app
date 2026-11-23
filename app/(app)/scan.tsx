import { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Device } from 'react-native-ble-plx';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { friendly } from '../../src/lib/errors';
import { Reading } from '../../src/types';
import { ensureBlePermissions } from '../../src/ble/permissions';
import { connectToPulseDevice, runScan } from '../../src/ble/pulseDevice';
import { StatusBadge } from '../../src/components/StatusBadge';
import { Disclaimer } from '../../src/components/Disclaimer';
import Mascot from '../../src/components/Mascot';
import PulseHeart from '../../src/components/PulseHeart';
import HeartbeatLine from '../../src/components/HeartbeatLine';
import ScreenBackground from '../../src/components/ScreenBackground';
import PrimaryButton from '../../src/components/PrimaryButton';
import { colors, Mood, radius, shadow, STATUS } from '../../src/theme';

type Phase = 'idle' | 'connecting' | 'scanning' | 'uploading' | 'done' | 'error';

const TIPS = [
  { icon: 'hand-left-outline', text: 'Rest your fingertip lightly on the sensor' },
  { icon: 'body-outline', text: 'Sit still and breathe normally' },
  { icon: 'time-outline', text: 'It takes about 30 seconds' },
] as const;

export default function Scan() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [sec, setSec] = useState(0);
  const [live, setLive] = useState<number | null>(null);
  const [noFinger, setNoFinger] = useState(false);
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState<Reading | null>(null);
  const [beatTick, setBeatTick] = useState(0); // UI only: counts beats for the animations
  const dev = useRef<Device | null>(null);
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const lineW = width - 40 - 36;

  const start = async () => {
    setResult(null); setMsg(''); setSec(0); setLive(null); setBeatTick(0);
    try {
      setPhase('connecting');
      if (!(await ensureBlePermissions())) throw new Error('Bluetooth permission denied');
      dev.current = await connectToPulseDevice();

      const startedAt = new Date().toISOString();
      setPhase('scanning');
      const ibis = await runScan(dev.current, (e) => {
        if (e.type === 'progress') { setSec(e.sec); setNoFinger(false); }
        if (e.type === 'beat') { setLive(Math.round(60000 / e.ibi)); setNoFinger(false); setBeatTick((t) => t + 1); }
        if (e.type === 'nofinger') setNoFinger(true);
      });

      // free the sensor right away so the next family member can connect
      await dev.current.cancelConnection().catch(() => {});

      setPhase('uploading');
      const { data, error } = await supabase.rpc('submit_reading', { p_ibis: ibis, p_measured_at: startedAt });
      if (error) throw new Error(friendly(error));
      setResult(data as Reading);
      setPhase('done');
      qc.invalidateQueries({ queryKey: ['room'] });
    } catch (e: any) {
      dev.current?.cancelConnection().catch(() => {});
      setMsg(e?.message ?? 'Something went wrong');
      setPhase('error');
    }
  };

  const mood: Mood =
    phase === 'done' && result
      ? STATUS[result.status].mood
      : phase === 'error'
        ? 'worried'
        : phase === 'connecting' || phase === 'scanning' || phase === 'uploading'
          ? 'scanning'
          : 'idle';

  const title =
    phase === 'idle' ? 'Ready when you are!'
    : phase === 'connecting' ? 'Finding your sensor…'
    : phase === 'scanning' ? 'Hold still…'
    : phase === 'uploading' ? 'Saving your scan…'
    : phase === 'done' && result ? STATUS[result.status].line
    : 'Oops!';

  const progress = `${Math.round(Math.min(sec / 30, 1) * 100)}%` as `${number}%`;

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 20, paddingTop: insets.top + 12, paddingBottom: 28, gap: 16 }}
      >
        <View style={{ alignItems: 'center' }}>
          <Mascot mood={mood} size={phase === 'scanning' ? 120 : 150} />
          <Text style={s.title}>{title}</Text>
        </View>

        {phase === 'idle' && (
          <View style={s.card}>
            {TIPS.map((t) => (
              <View key={t.text} style={s.tip}>
                <View style={s.tipIcon}><Ionicons name={t.icon} size={20} color={colors.primary} /></View>
                <Text style={s.tipText}>{t.text}</Text>
              </View>
            ))}
          </View>
        )}

        {phase === 'connecting' && (
          <View style={[s.card, { alignItems: 'center', gap: 10 }]}>
            <Ionicons name="bluetooth" size={30} color={colors.primary} />
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.muted }}>Make sure the sensor is powered on and close by</Text>
          </View>
        )}

        {phase === 'scanning' && (
          <View style={s.card}>
            <View style={s.bpmRow}>
              <PulseHeart tick={beatTick} size={46} color={colors.red} />
              <Text style={s.bpm}>{live ?? '--'}</Text>
              <Text style={s.bpmUnit}>BPM</Text>
            </View>
            <HeartbeatLine tick={beatTick} active={!noFinger} width={lineW} height={90} color={colors.primary} />
            <View style={s.track}><View style={[s.fill, { width: progress }]} /></View>
            <Text style={s.small}>{sec} / 30 s</Text>
            {noFinger && (
              <View style={s.warn}>
                <Ionicons name="hand-left-outline" size={18} color={colors.orange} />
                <Text style={{ color: colors.orange, fontWeight: '700' }}>Place your fingertip on the sensor</Text>
              </View>
            )}
          </View>
        )}

        {phase === 'uploading' && (
          <View style={[s.card, { alignItems: 'center', gap: 10 }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.muted }}>Sharing with your family…</Text>
          </View>
        )}

        {phase === 'done' && result && (
          <View style={[s.card, { gap: 14 }]}>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <View style={s.bpmRow}>
                <Ionicons name="heart" size={34} color={colors.red} />
                <Text style={s.bpm}>{result.bpm}</Text>
                <Text style={s.bpmUnit}>BPM</Text>
              </View>
              <StatusBadge status={result.status} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={s.tile}>
                <Text style={s.tileVal}>{result.rmssd}</Text>
                <Text style={s.tileLabel}>HRV (RMSSD) ms</Text>
              </View>
              <View style={s.tile}>
                <Text style={s.tileVal}>{result.beatCount}</Text>
                <Text style={s.tileLabel}>Beats counted</Text>
              </View>
            </View>
            {result.reasons.map((r) => (
              <View key={r} style={s.reason}>
                <Ionicons name="bulb-outline" size={18} color={STATUS[result.status].color} />
                <Text style={{ flex: 1, color: colors.text }}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {phase === 'error' && (
          <View style={[s.card, { backgroundColor: '#FDECEC' }]}>
            <Text style={{ color: colors.red, textAlign: 'center', fontWeight: '600' }}>{msg}</Text>
          </View>
        )}

        {(phase === 'idle' || phase === 'done' || phase === 'error') && (
          <PrimaryButton title={phase === 'done' ? 'Scan again' : phase === 'error' ? 'Try again' : 'Start scan'} icon="pulse" onPress={start} />
        )}

        <Disclaimer />
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '900', color: colors.text, marginTop: 6, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 18, gap: 12, ...shadow },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, color: colors.text, fontSize: 15 },
  bpmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  bpm: { fontSize: 64, fontWeight: '900', color: colors.text },
  bpmUnit: { fontSize: 16, fontWeight: '700', color: colors.muted, marginTop: 24 },
  track: { height: 10, backgroundColor: colors.primarySoft, borderRadius: 999, overflow: 'hidden' },
  fill: { height: 10, backgroundColor: colors.primary, borderRadius: 999 },
  small: { textAlign: 'center', color: colors.muted, fontSize: 12 },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFEFE2', borderRadius: 14, padding: 10, justifyContent: 'center' },
  tile: { flex: 1, backgroundColor: colors.bg, borderRadius: 18, padding: 14, alignItems: 'center' },
  tileVal: { fontSize: 24, fontWeight: '900', color: colors.text },
  tileLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  reason: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.bg, borderRadius: 14, padding: 12 },
});