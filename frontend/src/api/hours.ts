import { api } from './axios';

export interface HoursQuota {
  id: string;
  year: number;
  requiredHours: number;
  description?: string;
}

export interface HoursEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  maxSlots?: number;
  hoursValue: number;
  location?: string;
  _count?: { entries: number };
}

export interface HoursEntry {
  id: string;
  memberId: string;
  eventId?: string;
  date: string;
  hours: number;
  description?: string;
  status: 'PLANNED' | 'COMPLETED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  confirmedBy?: string;
  confirmedAt?: string;
  year: number;
  event?: HoursEvent;
  member?: { firstName: string, lastName: string, memberNumber: string };
}

export const hoursApi = {
  getQuota: (year: number) => api.get<HoursQuota>(`/hours/quota/${year}`).then(r => r.data),
  setQuota: (data: Partial<HoursQuota>) => api.post('/hours/quota', data).then(r => r.data),
  
  getEvents: () => api.get<HoursEvent[]>('/hours/events').then(r => r.data),
  createEvent: (data: any) => api.post('/hours/events', data).then(r => r.data),
  deleteEvent: (id: string) => api.delete(`/hours/events/${id}`).then(r => r.data),
  
  getMyEntries: (year?: number) => api.get<{ entries: HoursEntry[], stats: any }>(`/hours/entries/my`, { params: { year } }).then(r => r.data),
  signupToEvent: (eventId: string) => api.post(`/hours/signup/${eventId}`).then(r => r.data),
  createManualEntry: (data: any) => api.post('/hours/entries/manual', data).then(r => r.data),
  
  getPendingEntries: () => api.get<HoursEntry[]>('/hours/entries/pending').then(r => r.data),
  updateStatus: (id: string, status: string) => api.put(`/hours/entries/${id}/status`, { status }).then(r => r.data),
  deleteEntry: (id: string) => api.delete(`/hours/entries/${id}`).then(r => r.data),
  getSummary: (year: number) => api.get<any[]>(`/hours/summary/${year}`).then(r => r.data),
};
