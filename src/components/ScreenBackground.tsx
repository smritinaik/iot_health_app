import { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

export default function ScreenBackground({ children }: { children: ReactNode }) {
  return (
    <LinearGradient colors={['#EDE7FF', '#F8F6FF', '#FFF3E8']} locations={[0, 0.5, 1]} style={{ flex: 1 }}>
      {children}
    </LinearGradient>
  );
}