import { Status } from './types';

export type Mood = 'idle' | 'scanning' | 'happy' | 'worried' | 'alert';

export const colors = {
  bg: '#F6F4FF',
  card: '#FFFFFF',
  text: '#1F1B2E',
  muted: '#8B87A0',
  border: '#ECE8F8',
  primary: '#7C5CFF',
  primarySoft: '#EEE9FF',
  green: '#2FB67C',
  orange: '#FF8A3D',
  red: '#F25C5C',
};

export const radius = { card: 24, input: 16, pill: 999 };

export const shadow = {
  shadowColor: '#5B3FD6',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const;

export const STATUS: Record<
  Status,
  { label: string; color: string; soft: string; mood: Mood; icon: 'checkmark-circle' | 'eye' | 'medkit'; line: string }
> = {
  NORMAL: { label: 'Normal', color: colors.green, soft: '#E3F6EE', mood: 'happy', icon: 'checkmark-circle', line: 'Looking good!' },
  WATCH: { label: 'Watch', color: colors.orange, soft: '#FFEFE2', mood: 'worried', icon: 'eye', line: 'Keep an eye on this.' },
  CONSULT: { label: 'Consult a doctor', color: colors.red, soft: '#FDEAEA', mood: 'alert', icon: 'medkit', line: 'Consider talking to a doctor.' },
};