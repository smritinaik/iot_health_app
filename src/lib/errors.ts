const MAP: Record<string, string> = {
  not_enough_beats: 'Not enough clean beats detected. Keep still, press lightly, and retake.',
  invalid_ibi: 'Sensor data looked invalid. Please retake.',
  too_many_beats: 'Scan data was too long. Please retake.',
  join_room_first: 'Join a room first.',
  already_in_room: 'You are already in a room.',
  too_many_attempts: 'Too many wrong codes. Try again in 15 minutes.',
  not_head: 'Only the head of family can do that.',
  cannot_remove_self: "You can't remove yourself.",
};

export function friendly(e?: { message?: string } | null): string {
  const m = e?.message ?? '';
  const k = Object.keys(MAP).find((key) => m.includes(key));
  return k ? MAP[k] : m || 'Something went wrong';
}