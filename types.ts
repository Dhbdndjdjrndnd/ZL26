
export type UserRole = 'ADMIN' | 'LEITER';

export interface TimeSlotConfig {
  name: string;
  defaultStart: string;
  defaultEnd: string;
}

export const DEFAULT_TIME_SLOTS: TimeSlotConfig[] = [
  { name: 'Frühstück', defaultStart: '08:00', defaultEnd: '09:00' },
  { name: 'Morgenrunde', defaultStart: '09:00', defaultEnd: '09:30' },
  { name: 'Morgenprogramm', defaultStart: '09:30', defaultEnd: '12:00' },
  { name: 'Mittagessen', defaultStart: '12:00', defaultEnd: '13:30' },
  { name: 'Siesta', defaultStart: '13:30', defaultEnd: '14:30' },
  { name: 'Nachmittagsprogramm', defaultStart: '14:30', defaultEnd: '17:30' },
  { name: 'Abendessen', defaultStart: '18:00', defaultEnd: '19:30' },
  { name: 'Abendprogramm', defaultStart: '20:00', defaultEnd: '22:00' },
  { name: 'Nachtruhe', defaultStart: '22:30', defaultEnd: '07:30' }
];

export const TIME_SLOTS = DEFAULT_TIME_SLOTS.map(slot => slot.name);

export interface GroupMarker {
  id: string;
  label: string;
  color: string;
  standardLeaderIds?: string[];
}

export const DEFAULT_MARKERS: GroupMarker[] = [
  { id: '1', label: 'Leiter', color: '#1E293B', standardLeaderIds: [] },
  { id: '2', label: 'XL', color: '#3B82F6', standardLeaderIds: [] },
  { id: '3', label: 'Kleine', color: '#F59E0B', standardLeaderIds: [] },
  { id: '4', label: 'Alle', color: '#6366F1', standardLeaderIds: [] },
  { id: '5', label: 'Küche', color: '#F97316', standardLeaderIds: [] },
  { id: '6', label: 'HL', color: '#10B981', standardLeaderIds: [] }
];

export interface User {
  id: string;
  username: string;
  displayName: string;
  password?: string;
  role: UserRole;
}

export type ProcurementType = 'Kaufen' | 'Vorbereiten';

export interface Material {
  id: string;
  name: string;
  quantity: string;
  category: 'Küche' | 'Basteln' | 'Technik' | 'Sonstiges';
  procurementType: ProcurementType;
  checked?: boolean;
}

export interface GlobalLeader {
  id: string;
  name: string;
  role: string;
}

export type LeaderAvailability = Record<string, string[]>;

export interface GlobalGroup {
  id: string;
  name: string;
  kidsCount: number;
  ageRange: string;
}

export interface ProgramPoint {
  id: string;
  day: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  location?: string;
  markerId?: string;
  title: string;
  description: string;
  leaders: GlobalLeader[];
  groups: GlobalGroup[];
  materials: Material[];
  groupHint?: string;
}

/**
 * Generiert die Liste der Tage als Strings (z.B. "Fr, 31.07.") basierend auf Start- und Enddatum.
 */
export function generateDaysArray(startDateStr: string, endDateStr: string): string[] {
  if (!startDateStr || !endDateStr) return [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const result: string[] = [];
  
  let current = new Date(start);
  while (current <= end) {
    result.push(current.toLocaleDateString('de-DE', { 
      weekday: 'short', 
      day: '2-digit', 
      month: '2-digit' 
    }));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

export const DEFAULT_START_DATE = "2025-07-31";
export const DEFAULT_END_DATE = "2025-08-09";
