import React, { useState, useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useVitals } from "../../lib/useVitals";
import { analyze } from "../../lib/risk";
import { saveSession, getSessions, SessionRecord } from "../../lib/storage";

function Spark({ data }: { data: number[] }) {
  const pts = data.slice(-40);
  if (pts.length < 2) return <View style={s.spark} />;
  const min = Math.min(...pts) - 3;
  const max = Math.max(...pts) + 3;
  return (
    <View style={s.spark}>
      {pts.map((p, i) => (
        <View key={i} style={[s.bar, { height: 6 + ((p - min) / (max - min)) * 54 }]} />
      ))}
    </View>
  );
}

export default function Index() {
  const { vitals, connected, history, baseline, calibCount, recalibrate } = useVitals();

  // Scan & Timer State
  const [scanning, setScanning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const scanBpmSum = useRef(0);
  const scanHrvSum = useRef(0);
  const scanCount = useRef(0);
  const [lastSummary, setLastSummary] = useState<SessionRecord | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  // Load history on mount
  useEffect(() => {
    getSessions().then(setSessions);
  }, []);

  const live = connected && !!vitals?.finger && (vitals?.heartRate ?? 0) > 0;
  const bpm = live ? vitals!.heartRate : 0;
  const result = live ? analyze(bpm, baseline, vitals!.ibis) : null;

  // Timer effect for Health Scan
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (scanning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((t) => t - 1);
        if (live && bpm > 0) {
          scanBpmSum.current += bpm;
          if (result?.hrv) scanHrvSum.current += result.hrv;
          scanCount.current += 1;
        }
      }, 1000);
    } else if (scanning && timeLeft === 0) {
      // Finish scan
      setScanning(false);
      if (scanCount.current > 0) {
        const avgBpm = Math.round(scanBpmSum.current / scanCount.current);
        const avgHrv = scanHrvSum.current > 0 ? Math.round(scanHrvSum.current / scanCount.current) : null;
        const finalStress = Math.max(0, Math.min(100, Math.round(100 - ((avgHrv || 30) * 1.5))));
        const finalReadiness = Math.max(0, Math.min(100, Math.round(100 - Math.abs(avgBpm - 70) * 1.5)));

        saveSession({
          avgBpm,
          avgHrv,
          stressIndex: finalStress,
          readiness: finalReadiness,
          durationSec: 30,
        }).then(setSessions);

        setLastSummary({
          id: 'temp',
          date: 'Just now',
          avgBpm,
          avgHrv,
          stressIndex: finalStress,
          readiness: finalReadiness,
          durationSec: 30,
        });
      }
    }
    return () => clearInterval(timer);
  }, [scanning, timeLeft, live, bpm, result]);

  const startScan = () => {
    scanBpmSum.current = 0;
    scanHrvSum.current = 0;
    scanCount.current = 0;
    setTimeLeft(30);
    setLastSummary(null);
    setScanning(true);
  };

  const cancelScan = () => {
    setScanning(false);
    setTimeLeft(30);
  };

  let hint = "";
  if (!connected) hint = "Connect your phone to WiFi 'Astra-ESP32' (password astra1234)";
  else if (scanning && !vitals?.finger) hint = "Place fingertip on sensor to record scan...";
  else if (scanning) hint = `Scanning in progress... hold still (${timeLeft}s remaining)`;
  else if (!vitals?.finger) hint = "Place a fingertip lightly on the sensor";
  else if (bpm === 0) hint = "Reading... hold still for about 5 seconds";

  const levelColor = { ok: "#2E9E5B", watch: "#C98A00", alert: "#D64545" } as const;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Astra Health</Text>
          <View style={[s.pill, { backgroundColor: connected ? "#D6EDDD" : "#F3D6D6" }]}>
            <Text style={{ color: connected ? "#2E9E5B" : "#D64545", fontWeight: "600", fontSize: 12 }}>
              {connected ? "● ESP32 connected" : "● Offline"}
            </Text>
          </View>
        </View>

        {/* Live Heart Rate Card */}
        <Text style={s.section}>Live Telemetry</Text>
        <View style={[s.card, { backgroundColor: "#DCE8F8" }]}>
          <Text style={s.big}>{live || scanning ? Math.round(bpm) : "--"} bpm</Text>
          <Text style={s.sub}>{hint}</Text>
          <Spark data={history} />
          
          {/* Scan Control Button */}
          {!scanning ? (
            <TouchableOpacity style={s.scanBtn} onPress={startScan} disabled={!connected}>
              <Text style={s.scanBtnText}>Start 30s Health Scan</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.scanBtn, { backgroundColor: "#D64545" }]} onPress={cancelScan}>
              <Text style={[s.scanBtnText, { color: "#FFF" }]}>Cancel Scan ({timeLeft}s)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Last Scan Summary Card (if completed) */}
        {lastSummary && (
          <>
            <Text style={s.section}>Scan Summary Result</Text>
            <View style={[s.card, { backgroundColor: "#E3DDF3" }]}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#1B1D21", marginBottom: 8 }}>30-Second Check Complete</Text>
              <Text style={s.sub}>Avg Heart Rate: <Text style={{ fontWeight: "700" }}>{lastSummary.avgBpm} bpm</Text></Text>
              <Text style={s.sub}>Avg HRV: <Text style={{ fontWeight: "700" }}>{lastSummary.avgHrv ?? "--"} ms</Text></Text>
              <Text style={s.sub}>Stress Index: <Text style={{ fontWeight: "700" }}>{lastSummary.stressIndex} / 100</Text></Text>
              <Text style={s.sub}>Readiness Score: <Text style={{ fontWeight: "700" }}>{lastSummary.readiness} / 100</Text></Text>
            </View>
          </>
        )}

        {/* Real-time Vitals */}
        <Text style={s.section}>Current Vitals</Text>
        <View style={s.row}>
          <View style={[s.small, { backgroundColor: "#E3DDF3" }]}>
            <Text style={s.smallVal}>{result?.stressIndex ?? "--"}</Text>
            <Text style={s.sub}>/ 100</Text>
            <Text style={s.sub}>Stress Index</Text>
          </View>
          <View style={[s.small, { backgroundColor: "#D6EDDD" }]}>
            <Text style={s.smallVal}>{result?.hrv ?? "--"}</Text>
            <Text style={s.sub}>ms</Text>
            <Text style={s.sub}>HRV (RMSSD)</Text>
          </View>
          <View style={[s.small, { backgroundColor: "#F5EBC8" }]}>
            <Text style={s.smallVal}>{result ? result.readiness : "--"}</Text>
            <Text style={s.sub}>/ 100</Text>
            <Text style={s.sub}>Readiness</Text>
          </View>
        </View>

        {/* Health Insights */}
        <Text style={s.section}>Predictive Risk Insights</Text>
        <View style={[s.card, { backgroundColor: "#222428" }]}>
          {result ? (
            <>
              <View style={{ marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#33373D" }}>
                <Text style={{ color: "#8A8F98", fontSize: 12, textTransform: "uppercase", fontWeight: "700" }}>Strain Forecast</Text>
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginTop: 2 }}>{result.fatiguePrediction}</Text>
              </View>
              {result.insights.map((i, idx) => (
                <View key={idx} style={{ marginBottom: 14 }}>
                  <Text style={{ color: levelColor[i.level], fontWeight: "700", fontSize: 15 }}>{i.title}</Text>
                  <Text style={{ color: "#B9BCC2", marginTop: 4, lineHeight: 19 }}>{i.tip}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={{ color: "#B9BCC2" }}>Predictive models will analyze data once a heart rate is locked.</Text>
          )}
          <TouchableOpacity style={s.btn} onPress={recalibrate}>
            <Text style={s.btnText}>Recalibrate Baseline</Text>
          </TouchableOpacity>
        </View>

        {/* Past Sessions History Log */}
        <Text style={s.section}>Past Session Logs ({sessions.length})</Text>
        <View style={[s.card, { backgroundColor: "#F3F4F6" }]}>
          {sessions.length === 0 ? (
            <Text style={s.sub}>No saved sessions yet. Run a 30s Health Scan to record one!</Text>
          ) : (
            sessions.map((ses) => (
              <View key={ses.id} style={s.historyRow}>
                <View>
                  <Text style={{ fontWeight: "700", color: "#1B1D21" }}>{ses.date}</Text>
                  <Text style={s.sub}>Avg: {ses.avgBpm} bpm | Stress: {ses.stressIndex}/100</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontWeight: "800", color: "#2E9E5B" }}>{ses.readiness} readiness</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={s.foot}>
          Prototype wellness predictor, not an official clinical diagnostic tool.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 30, fontWeight: "800", color: "#1B1D21" },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  section: { fontSize: 16, fontWeight: "700", color: "#1B1D21", marginTop: 18, marginBottom: 10 },
  card: { borderRadius: 28, padding: 20 },
  big: { fontSize: 44, fontWeight: "800", color: "#1B1D21" },
  sub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  spark: { height: 64, flexDirection: "row", alignItems: "flex-end", gap: 2, marginVertical: 14 },
  bar: { flex: 1, backgroundColor: "#4A86D8", borderRadius: 2 },
  row: { flexDirection: "row", gap: 10 },
  small: { flex: 1, borderRadius: 24, padding: 14 },
  smallVal: { fontSize: 26, fontWeight: "800", color: "#1B1D21" },
  scanBtn: { backgroundColor: "#1B1D21", borderRadius: 20, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  scanBtnText: { fontWeight: "700", color: "#FFFFFF" },
  btn: { backgroundColor: "#BBD7F7", borderRadius: 20, paddingVertical: 12, alignItems: "center", marginTop: 4 },
  btnText: { fontWeight: "700", color: "#1B1D21" },
  historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  foot: { fontSize: 11, color: "#8A8F98", marginTop: 20 },
});