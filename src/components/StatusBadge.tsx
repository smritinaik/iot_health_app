import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Status } from '../types';
import { STATUS } from '../theme';

export const StatusBadge = ({ status }: { status: Status }) => {
  const m = STATUS[status];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: m.soft,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        alignSelf: 'flex-start',
      }}
    >
      <Ionicons name={m.icon} size={14} color={m.color} />
      <Text style={{ color: m.color, fontWeight: '700', fontSize: 12 }}>{m.label}</Text>
    </View>
  );
};