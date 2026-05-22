import api from './api';

const gameService = {
  listParties: () => api.get('/parties'),

  createPartie: (nomClub) => api.post('/parties', { nom_club: nomClub }),

  getFullState: (partieId) => api.get(`/parties/${partieId}`),

  click: (partieId) => api.post(`/parties/${partieId}/click`),

  sync: (partieId) => api.post(`/parties/${partieId}/sync`),
};

export default gameService;
