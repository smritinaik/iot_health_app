import { useEffect, useRef, useState } from "react";

const ESP_URL = "http://192.168.4.1/vitals"; // fixed address of the ESP32 hotspot

export type Vitals = { heartRate: number; finger: boolean; ibis: number[] };

export function useVitals() {
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [baseline, setBaseline] = useState<number | null>(null);
  const [calibCount, setCalibCount] = useState(0);
  const calib = useRef<number[]>([]);

  const recalibrate = () => {
    calib.current = [];
    setCalibCount(0);
    setBaseline(null);
  };

  useEffect(() => {
    let alive = true;

    const poll = async () => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2000);
      try {
        const res = await fetch(ESP_URL, { signal: ctrl.signal });
        const d = await res.json();
        if (!alive) return;

        const v: Vitals = {
          heartRate: Number(d.heartRate) || 0,
          finger: !!d.finger,
          ibis: Array.isArray(d.ibis) ? d.ibis.map(Number) : [],
        };
        setVitals(v);
        setConnected(true);

        if (v.finger && v.heartRate > 0) {
          setHistory((h) => [...h.slice(-59), v.heartRate]);
          if (calib.current.length < 30) {
            calib.current.push(v.heartRate);
            setCalibCount(calib.current.length);
            if (calib.current.length === 30) {
              const avg = calib.current.reduce((a, b) => a + b, 0) / 30;
              setBaseline(avg);
            }
          }
        }
      } catch {
        if (alive) setConnected(false);
      } finally {
        clearTimeout(timer);
      }
    };

    poll();
    const id = setInterval(poll, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return { vitals, connected, history, baseline, calibCount, recalibrate };
}