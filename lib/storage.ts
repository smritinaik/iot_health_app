import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@astra_health_sessions';

export type SessionRecord = {
  id: string;
  date: string;
  avgBpm: number;
  avgHrv: number | null;
  stressIndex: number;
  readiness: number;
  durationSec: number;
};

export async function saveSession(session: Omit<SessionRecord, 'id' | 'date'>) {
  try {
    const existing = await getSessions();
    const newRecord: SessionRecord = {
      ...session,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [newRecord, ...existing].slice(0, 20); // Keep last 20 sessions max
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save session', e);
    return [];
  }
}

export async function getSessions(): Promise<SessionRecord[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load sessions', e);
    return [];
  }
}

export async function clearSessions() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear sessions', e);
  }
}