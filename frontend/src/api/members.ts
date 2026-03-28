import { api } from './axios'

export interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  status: string;
  birthDate?: string;
  roles?: string[];
  user?: {
    id: string;
    username: string;
    roles: string[];
    isActive: boolean;
  };
}

export const membersApi = {
  getAll: () => api.get<Member[]>('/members').then(res => res.data),
  getOne: (id: string) => api.get<Member>(`/members/${id}`).then(res => res.data),
  create: (data: Partial<Member>) => api.post<Member>('/members', data).then(res => res.data),
  update: (id: string, data: Partial<Member>) => api.put<Member>(`/members/${id}`, data).then(res => res.data),
  deactivate: (id: string) => api.delete(`/members/${id}`).then(res => res.data)
}
