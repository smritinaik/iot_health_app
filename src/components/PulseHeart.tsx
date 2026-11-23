import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PulseHeart({ tick, size = 48, color = '#F25C5C' }: { tick: number; size?: number; color?: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (tick === 0) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.28, duration: 110, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [tick]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name="heart" size={size} color={color} />
    </Animated.View>
  );
}