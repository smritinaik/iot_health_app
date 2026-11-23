import { ComponentProps, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

export default function Field({
  icon,
  secure,
  style,
  ...rest
}: TextInputProps & { icon: ComponentProps<typeof Ionicons>['name']; secure?: boolean }) {
  const [hidden, setHidden] = useState(!!secure);
  const [focus, setFocus] = useState(false);

  return (
    <View style={[s.wrap, focus && s.focus]}>
      <Ionicons name={icon} size={20} color={focus ? colors.primary : colors.muted} />
      <TextInput
        {...rest}
        secureTextEntry={hidden}
        placeholderTextColor="#B3AFC7"
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[s.input, style]}
      />
      {secure && (
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
          <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 54,
  },
  focus: { borderColor: colors.primary },
  input: { flex: 1, fontSize: 16, color: colors.text },
});