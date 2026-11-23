import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/store/auth';

export default function AuthLayout() {
  const ready = useAuth((s) => s.ready);
  const session = useAuth((s) => s.session);

  if (!ready) return null;
  if (session) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}