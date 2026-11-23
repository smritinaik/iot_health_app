import { useEffect, useRef, useState } from 'react';
import Svg, { Line, Polyline } from 'react-native-svg';

const N = 90; // points across the screen
// a stylised P-QRS-T wave
const TEMPLATE = [0, 0.04, 0.1, 0.04, 0, -0.12, 0.95, -0.3, 0, 0.06, 0.2, 0.26, 0.12, 0.02];

export default function HeartbeatLine({
  tick,
  active,
  width = 300,
  height = 90,
  color = '#7C5CFF',
}: {
  tick: number;
  active: boolean;
  width?: number;
  height?: number;
  color?: string;
}) {
  const buf = useRef<number[]>(Array(N).fill(0));
  const queue = useRef<number[]>([]);
  const [, force] = useState(0);

  // every real beat restarts a heartbeat spike
  useEffect(() => {
    if (tick > 0 && active) queue.current = [...TEMPLATE];
  }, [tick]);

  useEffect(() => {
    const id = setInterval(() => {
      const next = queue.current.length ? (queue.current.shift() as number) : active ? (Math.random() - 0.5) * 0.03 : 0;
      buf.current.push(next);
      buf.current.shift();
      force((n) => n + 1);
    }, 45);
    return () => clearInterval(id);
  }, [active]);

  const points = buf.current
    .map((v, i) => `${((i / (N - 1)) * width).toFixed(1)},${(height / 2 - v * height * 0.42).toFixed(1)}`)
    .join(' ');

  return (
    <Svg width={width} height={height}>
      <Line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeOpacity={0.12} strokeWidth={1} />
      <Polyline points={points} fill="none" stroke={color} strokeOpacity={0.2} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points={points} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}