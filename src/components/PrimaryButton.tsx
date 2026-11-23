import { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

type Variant = 'primary' | 'soft' | 'danger' | 'ghost';

export default function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
}) {
  const textColor =
    variant === 'primary' ? '#fff' : variant === 'danger' ? colors.red : variant === 'ghost' ? colors.muted : colors.primary;

  const inner = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <>
      {icon && <Ionicons name={icon} size={20} color={textColor} />}
      <Text style={[s.t, { color: textColor }]}>{title}</Text>
    </>
  );

  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => ({ opacity: disabled ? 0.5 : pressed ? 0.85 : 1 })}>
      {variant === 'primary' ? (
        <LinearGradient colors={['#8B6CFF', '#6A4BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btn}>
          {inner}
        </LinearGradient>
      ) : (
        <View
          style={[
            s.btn,
            variant === 'soft' && { backgroundColor: colors.primarySoft },
            variant === 'danger' && { backgroundColor: '#FDECEC' },
          ]}
        >
          {inner}
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { height: 52, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  t: { fontSize: 16, fontWeight: '700' },
});