import { ComponentProps } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { friendly } from '../../src/lib/errors';
import { useAuth } from '../../src/store/auth';
import { useRoom } from '../../src/hooks/useRoom';
import { useRoomRealtime } from '../../src/hooks/useRoomRealtime';
import RoomSetup from '../../src/components/RoomSetup';
import Mascot from '../../src/components/Mascot';
import ScreenBackground from '../../src/components/ScreenBackground';
import PrimaryButton from '../../src/components/PrimaryButton';
import { colors } from '../../src/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

// builds a tab icon; `color: any` avoids the ColorValue type clash between the tab bar and Ionicons
const tabIcon =
  (on: IconName, off: IconName, extra = 0) =>
  ({ color, size, focused }: { color: any; size: number; focused: boolean }) => (
    <Ionicons name={focused ? on : off} size={size + extra} color={color} />
  );

export default function AppLayout() {
  const ready = useAuth((s) => s.ready);
  const session = useAuth((s) => s.session);
  const { data, isLoading, error, refetch } = useRoom();
  const qc = useQueryClient();
  useRoomRealtime(data?.id);

  if (!ready) return null;
  if (!session) return <Redirect href="/login" />;

  if (isLoading) {
    return (
      <ScreenBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Mascot mood="scanning" size={140} />
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.muted }}>Loading your family…</Text>
        </View>
      </ScreenBackground>
    );
  }

  if (error) {
    return (
      <ScreenBackground>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <Mascot mood="alert" size={130} />
          </View>
          <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.text }}>Could not load your room</Text>
          <Text style={{ textAlign: 'center', color: colors.red }}>{friendly(error as { message?: string })}</Text>
          <PrimaryButton title="Retry" icon="refresh-outline" onPress={() => refetch()} />
          <PrimaryButton
            title="Log out"
            variant="ghost"
            icon="log-out-outline"
            onPress={async () => {
              await supabase.auth.signOut();
              qc.clear();
            }}
          />
        </View>
      </ScreenBackground>
    );
  }

  // signed in, but not in a room yet: show create/join (no navigation, so no redirect loop)
  if (data === null) return <RoomSetup />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#B3AFC7',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0, elevation: 12, height: 64, paddingTop: 6, paddingBottom: 8 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Family', tabBarIcon: tabIcon('people', 'people-outline') }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan', tabBarIcon: tabIcon('pulse', 'pulse-outline', 2) }} />
      <Tabs.Screen name="room" options={{ title: 'Room', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen name="member/[id]" options={{ href: null }} />
    </Tabs>
  );
}