import { createContext, useState, useCallback } from 'react';
import gameService from '../services/gameService';

export const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [partie, setPartie] = useState(null);
  const [ressources, setRessources] = useState([]);
  const [infrastructures, setInfrastructures] = useState([]);
  const [ameliorations, setAmeliorations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productionParSeconde, setProductionParSeconde] = useState(0);

  const loadGameState = useCallback(async (partieId) => {
    await gameService.sync(partieId);

    const res = await gameService.getFullState(partieId);
    const data = res.data;

    setPartie({
      id_partie: data.id_partie,
      nom_club: data.nom_club,
      niveau: data.niveau,
    });
    setRessources(data.ressources);
    setInfrastructures(data.infrastructures);
    setAmeliorations(data.ameliorations);

    const pps = data.infrastructures.reduce(
      (sum, infra) => sum + (infra.quantite || 0) * infra.production_base * (infra.niveau || 1),
      0
    );
    setProductionParSeconde(pps);
  }, []);

  const loadOrCreatePartie = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const partiesRes = await gameService.listParties();
      const parties = partiesRes.data.parties || partiesRes.data;

      if (parties.length > 0) {
        const partieId = parties[0].id_partie;
        await loadGameState(partieId);
      } else {
        setPartie(null);
        setRessources([]);
        setInfrastructures([]);
        setAmeliorations([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de charger la partie');
    } finally {
      setLoading(false);
    }
  }, [loadGameState]);

  const createPartie = async (nomClub) => {
    const res = await gameService.createPartie(nomClub);
    const nouvellePartie = res.data.partie || res.data;
    await loadGameState(nouvellePartie.id_partie);
    return nouvellePartie;
  };

  const click = async () => {
    if (!partie) return;
    const res = await gameService.click(partie.id_partie);
    const { gain } = res.data;
    setRessources((prev) =>
      prev.map((r) =>
        r.id_ressource === 1 ? { ...r, quantite: r.quantite + gain } : r
      )
    );
    return gain;
  };

  const tick = useCallback(() => {
    if (!partie) return;
    setRessources((prev) =>
      prev.map((r) =>
        r.id_ressource === 1
          ? { ...r, quantite: r.quantite + productionParSeconde }
          : r
      )
    );
  }, [partie, productionParSeconde]);

  const value = {
    partie,
    ressources,
    infrastructures,
    ameliorations,
    loading,
    error,
    productionParSeconde,
    loadOrCreatePartie,
    createPartie,
    click,
    tick,
    loadGameState,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
