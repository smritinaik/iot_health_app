import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useRoomRealtime(roomId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'readings', filter: `room_id=eq.${roomId}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ['room'] });
          qc.invalidateQueries({ queryKey: ['history', (payload.new as { user_id: string }).user_id] });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'memberships', filter: `room_id=eq.${roomId}` },
        () => qc.invalidateQueries({ queryKey: ['room'] }),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') qc.invalidateQueries({ queryKey: ['room'] });
      });

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);
}