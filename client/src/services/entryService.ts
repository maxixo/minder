import api from './api';

const entryService = {
  getEntries:      async (p: any = {}) => (await api.get('/entries', { params: p })).data,
  getEntry:        async (id: string)     => (await api.get(`/entries/${id}`)).data,
  getEntryByDate:  async (date: string)   => (await api.get(`/entries/date/${date}`)).data,
  getTodayEntry:   async ()       => (await api.get('/entries/today')).data,
  getRecentEntries:async (days=7) => (await api.get('/entries/recent', { params:{ days } })).data,
  createEntry:     async (data: any)   => (await api.post('/entries', data)).data,
  updateEntry:     async (id: string, d: any)  => (await api.put(`/entries/${id}`, d)).data,
  autoSaveEntry:   async (id: string, d: any)  => (await api.patch(`/entries/${id}/autosave`, d)).data,
  deleteEntry:     async (id: string)     => (await api.delete(`/entries/${id}`)).data,
};

export default entryService;
