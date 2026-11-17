export type Level = "ok" | "watch" | "alert";
export type Insight = { level: Level; title: string; tip: string };

// Rough HRV (RMSSD) from beat gaps in ms
export function rmssd(ibis: number[]): number | null {
  if (ibis.length < 5) return null;
  let s = 0;
  for (let i = 1; i < ibis.length; i++) {
    const d = ibis[i] - ibis[i - 1];
    s += d * d;
  }
  return Math.sqrt(s / (ibis.length - 1));
}

// How uneven the beat gaps are (0 = perfectly steady)
export function irregularity(ibis: number[]): number | null {
  if (ibis.length < 5) return null;
  const mean = ibis.reduce((a, b) => a + b, 0) / ibis.length;
  const variance = ibis.reduce((a, b) => a + (b - mean) ** 2, 0) / ibis.length;
  return Math.sqrt(variance) / mean;
}

export function analyze(bpm: number, baseline: number | null, ibis: number[]) {
  const hrv = rmssd(ibis);
  const irr = irregularity(ibis);
  const insights: Insight[] = [];
  let score = 100;

  // Predictive metrics calculation
  let stressIndex = 0; // 0 to 100 scale
  let fatiguePrediction = "Normal";

  if (hrv !== null) {
    // Lower HRV typically correlates with higher stress/sympathetic activation
    stressIndex = Math.max(0, Math.min(100, Math.round(100 - (hrv * 1.5))));
  } else {
    stressIndex = bpm > 90 ? 70 : 30;
  }

  // --- Core Risk & Pattern Analysis ---

  if (bpm > 100) {
    score -= 25;
    insights.push({
      level: "alert",
      title: "Predictive Alert: Elevated Cardiac Load",
      tip: "Heart rate is significantly above resting thresholds. Risk of physical strain or acute stress. Sit down, hydrate, and practice slow breathing.",
    });
  } else if (bpm > 0 && bpm < 50) {
    score -= 15;
    insights.push({
      level: "watch",
      title: "Pattern Watch: Bradycardia Tendency",
      tip: "Low resting heart rate detected. Normal for conditioned athletes, but watch out for dizziness or sudden fatigue.",
    });
  }

  if (baseline && bpm > 0) {
    const dev = (bpm - baseline) / baseline;
    score -= Math.min(40, Math.abs(dev) * 200);
    
    if (dev > 0.2) {
      fatiguePrediction = "Elevated Strain / Stress";
      insights.push({
        level: "watch",
        title: "Prediction: Elevated Baseline Deviation",
        tip: "Your heart rate is >20% above your learned personal baseline. This often precedes physical burnout, caffeine jitters, or sleep deficit.",
      });
    } else if (dev < -0.2) {
      fatiguePrediction = "Deep Recovery State";
      insights.push({
        level: "ok",
        title: "Prediction: Deep Rest State",
        tip: "Readings indicate deep parasympathetic recovery. Good state for rest or meditation.",
      });
    }
  }

  if (hrv !== null && hrv < 20) {
    score -= 20;
    insights.push({
      level: "watch",
      title: "Risk Pattern: Suppressed HRV",
      tip: "Low Heart Rate Variability indicates autonomic nervous system fatigue. Consider reducing high-intensity work today.",
    });
  }

  if (irr !== null && irr > 0.15) {
    score -= 20;
    insights.push({
      level: "watch",
      title: "Anomaly: Irregular Beat Rhythm",
      tip: "Noticeable variance in beat-to-beat intervals. Try keeping your fingertip completely still. If persistent, consult a clinician.",
    });
  }

  if (insights.length === 0 && bpm > 0) {
    insights.push({
      level: "ok",
      title: "Status: Optimal Balance",
      tip: "Vitals are tracking smoothly within normal parameters. No immediate risk patterns detected.",
    });
  }

  return {
    hrv: hrv === null ? null : Math.round(hrv),
    readiness: Math.max(0, Math.min(100, Math.round(score))),
    stressIndex,
    fatiguePrediction,
    insights,
  };
}