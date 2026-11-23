import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { Mood } from '../theme';

const BODY: Record<Mood, { main: string; shade: string }> = {
  idle: { main: '#8B6CFF', shade: '#6F4FEF' },
  scanning: { main: '#8B6CFF', shade: '#6F4FEF' },
  happy: { main: '#3CC98C', shade: '#27AC72' },
  worried: { main: '#FF9A4D', shade: '#F07B26' },
  alert: { main: '#F36B6B', shade: '#DC4A4A' },
};
const INK = '#2A2340';

const MOUTH: Record<Mood, string> = {
  idle: 'M52 80 Q60 88 68 80',
  scanning: '',
  happy: 'M48 79 Q60 94 72 79',
  worried: 'M50 87 Q60 79 70 87',
  alert: 'M48 89 Q60 78 72 89',
};

export default function Mascot({
  mood = 'idle',
  size = 140,
  bounce = true,
  blink = true,
}: {
  mood?: Mood;
  size?: number;
  bounce?: boolean;
  blink?: boolean;
}) {
  const y = useRef(new Animated.Value(0)).current;
  const [closed, setClosed] = useState(false);
  const { main, shade } = BODY[mood];
  const worried = mood === 'worried' || mood === 'alert';
  const pupil = mood === 'scanning' ? 7 : mood === 'alert' ? 4.5 : 6;

  useEffect(() => {
    if (!bounce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -6, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounce]);

  useEffect(() => {
    if (!blink) return;
    const id = setInterval(() => {
      setClosed(true);
      setTimeout(() => setClosed(false), 140);
    }, 3200);
    return () => clearInterval(id);
  }, [blink]);

  return (
    <Animated.View style={{ transform: [{ translateY: y }] }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Ellipse cx={60} cy={113} rx={30} ry={5} fill="#000" opacity={0.08} />
        <Circle cx={38} cy={32} r={10} fill={main} />
        <Circle cx={82} cy={32} r={10} fill={main} />
        <Ellipse cx={13} cy={76} rx={9} ry={15} fill={shade} transform={mood === 'happy' ? 'rotate(-35 13 76)' : undefined} />
        <Ellipse cx={107} cy={76} rx={9} ry={15} fill={shade} transform={mood === 'happy' ? 'rotate(35 107 76)' : undefined} />
        <Ellipse cx={44} cy={108} rx={13} ry={6} fill={shade} />
        <Ellipse cx={76} cy={108} rx={13} ry={6} fill={shade} />
        <Ellipse cx={60} cy={68} rx={46} ry={42} fill={main} />
        <Ellipse cx={60} cy={82} rx={28} ry={22} fill="#fff" opacity={0.16} />

        {closed ? (
          <>
            <Path d="M40 58 H56" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
            <Path d="M64 58 H80" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
          </>
        ) : (
          <>
            <Circle cx={48} cy={58} r={11} fill="#fff" />
            <Circle cx={72} cy={58} r={11} fill="#fff" />
            <Circle cx={49} cy={59} r={pupil} fill={INK} />
            <Circle cx={73} cy={59} r={pupil} fill={INK} />
            <Circle cx={51.5} cy={56.5} r={2} fill="#fff" />
            <Circle cx={75.5} cy={56.5} r={2} fill="#fff" />
          </>
        )}

        {worried && (
          <>
            <Path d="M37 44 L56 49" stroke={INK} strokeWidth={3} strokeLinecap="round" />
            <Path d="M83 44 L64 49" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          </>
        )}

        {mood === 'scanning' ? (
          <Ellipse cx={60} cy={83} rx={5} ry={4} fill={INK} />
        ) : (
          <Path d={MOUTH[mood]} stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
        )}

        {(mood === 'idle' || mood === 'happy') && (
          <>
            <Circle cx={34} cy={73} r={5} fill="#FF8FB1" opacity={0.55} />
            <Circle cx={86} cy={73} r={5} fill="#FF8FB1" opacity={0.55} />
          </>
        )}

        {mood === 'alert' && <Path d="M35 68 Q30 76 35 80 Q40 76 35 68 Z" fill="#7CC4FF" />}
      </Svg>
    </Animated.View>
  );
}