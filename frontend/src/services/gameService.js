import api from './api';

const gameService = {
  listParties: () => api.get('/parties'),

  createPartie: (nomClub) => api.post('/parties', { nom_club: nomClub }),

  getFullState: (partieId) => api.get(`/parties/${partieId}`),

  click: (partieId) => api.post(`/parties/${partieId}/click`),

  sync: (partieId) => api.post(`/parties/${partieId}/sync`),

  acheterInfrastructure: (partieId, infraId) =>
    api.post(`/parties/${partieId}/infrastructures/${infraId}/acheter`),

  upgraderInfrastructure: (partieId, infraId) =>
    api.post(`/parties/${partieId}/infrastructures/${infraId}/upgrader`),

  acheterAmelioration: (partieId, amelId) =>
    api.post(`/parties/${partieId}/ameliorations/${amelId}/acheter`),

  getCoachRecommendation: (partieId) =>
    api.post(`/parties/${partieId}/coach`),
};

export default gameService;
