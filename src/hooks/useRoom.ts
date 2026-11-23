import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { RoomDTO } from '../types';

// null = signed in but not in a room yet
export const useRoom = () =>
  useQuery({
    queryKey: ['room'],
    queryFn: async (): Promise<RoomDTO | null> => {
      const { data, error } = await supabase.rpc('get_room_overview');
      if (error) throw error;
      return (data as RoomDTO | null) ?? null;
    },
  });