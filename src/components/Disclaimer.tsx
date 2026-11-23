import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export const Disclaimer = () => (
  <View style={s.box}>
    <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
    <Text style={s.t}>
      Not a medical diagnosis. FamilyPulse is a wellness tool using a hobby-grade sensor. If you feel unwell or are
      worried, contact a doctor or emergency services.
    </Text>
  </View>
);

const s = StyleSheet.create({
  box: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(124,92,255,0.07)', borderRadius: 16, padding: 12, marginTop: 8 },
  t: { flex: 1, fontSize: 12, lineHeight: 17, color: colors.muted },
});