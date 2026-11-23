export type Status = 'NORMAL' | 'WATCH' | 'CONSULT';

export interface Reading {
  id: string;
  userId: string;
  bpm: number;
  rmssd: number;
  sdnn: number;
  irregularRatio: number;
  beatCount: number;
  status: Status;
  reasons: string[];
  measuredAt: string;
}

export interface RoomDTO {
  id: string;
  name: string;
  myRole: 'HEAD' | 'MEMBER';
  joinCode?: string | null;
  members: { userId: string; name: string; role: 'HEAD' | 'MEMBER'; latest: Reading | null }[];
}