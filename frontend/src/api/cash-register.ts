import { api } from './axios'

export interface Article {
  id: string;
  sku: string;
  name: string;
  price: number;
  taxRate: number;
  category?: string;
  icon?: string;
  sortOrder?: number;
  imageUrl?: string;
  isActive: boolean;
}

export const articlesApi = {
  getAll: () => api.get<Article[]>('/cash-register/articles').then(res => res.data),
  create: (data: Partial<Article>) => api.post<Article>('/cash-register/articles', data).then(res => res.data),
  update: (id: string, data: Partial<Article>) => api.put<Article>(`/cash-register/articles/${id}`, data).then(res => res.data),
  reorder: (items: { id: string, sortOrder: number }[]) => api.post('/cash-register/articles/reorder', items).then(res => res.data),
  remove: (id: string) => api.delete(`/cash-register/articles/${id}`).then(res => res.data)
}

export interface TransactionItemDto {
  articleId: string;
  quantity: number;
}

export interface CreateTransactionDto {
  accountId: string;
  items: TransactionItemDto[];
  description?: string;
}

export interface CreateGuestTransactionDto {
  slotId: string;
  items: TransactionItemDto[];
  paymentMethod: 'CASH' | 'PAYPAL' | 'PENDING';
  paypalReference?: string;
}

export const cashRegisterApi = {
  getAccountMe: () => api.get<any>('/cash-register/accounts/me').then(res => res.data),
  getAccounts: () => api.get<any[]>('/cash-register/accounts').then(res => res.data),
  getAccount: (id: string) => api.get<any>(`/cash-register/accounts/${id}`).then(res => res.data),
  createTransaction: (data: CreateTransactionDto) => api.post('/cash-register/transactions', data).then(res => res.data),
  deleteTransaction: (id: string) => api.delete(`/cash-register/transactions/${id}`).then(res => res.data),
  
  getGlobalTransactions: () => api.get<any[]>('/cash-register/global-transactions').then(res => res.data),

  getGuestSlots: () => api.get<any[]>('/cash-register/guest-slots').then(res => res.data),
  createGuestTransaction: (data: CreateGuestTransactionDto) => api.post('/cash-register/guest-transactions', data).then(res => res.data),
  clearGuestSlot: (id: string) => api.post(`/cash-register/guest-slots/${id}/clear`).then(res => res.data),

  uploadEigenbeleg: (formData: FormData) => api.post('/cash-register/eigenbelege', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),

  getMyInvoices: () => api.get<any[]>('/cash-register/invoices/me').then(res => res.data),

  downloadInvoicePdf: async (id: string) => {
    const res = await api.get(`/cash-register/invoices/${id}/pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Rechnung-${id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  },

  downloadSepaExport: async (invoiceIds: string) => {
    const res = await api.get(`/cash-register/sepa-export?invoiceIds=${invoiceIds}`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'SEPA-Export.xml')
    document.body.appendChild(link)
    link.click()
    link.remove()
  },

  downloadGuestReceiptPdf: async (id: string) => {
    const res = await api.get(`/cash-register/guest-transactions/${id}/receipt`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Quittung-${id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
}
