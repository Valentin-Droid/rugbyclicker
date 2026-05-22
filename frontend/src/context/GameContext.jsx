import { createContext, useState, useCallback } from 'react';
import gameService from '../services/gameService';

export const GameContext = createContext(null);

const COUT_MULTIPLIER = 1.15;
const UPGRADE_COST_MULT = 1.5;

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
      total_argent_genere: parseFloat(data.total_argent_genere || 0),
    });
    setRessources(data.ressources);
    setInfrastructures(data.infrastructures);
    setAmeliorations(data.ameliorations);

    // Calcul de la production avec bonus ameliorations
    const bonusProduction = data.ameliorations.reduce((acc, a) => {
      if (!a.achete) return acc;
      const [type, valeur] = a.effet.split(':');
      const mult = parseFloat(valeur);
      if (type === 'multiplicateur_production' || type === 'multiplicateur_global') {
        return acc * mult;
      }
      return acc;
    }, 1);

    const pps = data.infrastructures.reduce(
      (sum, infra) => sum + (infra.quantite || 0) * infra.production_base * (infra.niveau || 1),
      0
    );
    setProductionParSeconde(pps * bonusProduction);
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
    // Met a jour total_argent_genere et niveau si le backend a change
    if (partie) {
      setPartie((prev) => ({
        ...prev,
        total_argent_genere: prev.total_argent_genere + gain,
      }));
    }
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

  const acheterInfrastructure = useCallback(async (infraId) => {
    if (!partie) return;
    const res = await gameService.acheterInfrastructure(partie.id_partie, infraId);
    await loadGameState(partie.id_partie);
    return res.data;
  }, [partie, loadGameState]);

  const upgraderInfrastructure = useCallback(async (infraId) => {
    if (!partie) return;
    const res = await gameService.upgraderInfrastructure(partie.id_partie, infraId);
    await loadGameState(partie.id_partie);
    return res.data;
  }, [partie, loadGameState]);

  const acheterAmelioration = useCallback(async (amelId) => {
    if (!partie) return;
    const res = await gameService.acheterAmelioration(partie.id_partie, amelId);
    await loadGameState(partie.id_partie);
    return res.data;
  }, [partie, loadGameState]);

  const value = {
    partie,
    ressources,
    infrastructures,
    ameliorations,
    loading,
    error,
    productionParSeconde,
    COUT_MULTIPLIER,
    UPGRADE_COST_MULT,
    loadOrCreatePartie,
    createPartie,
    click,
    tick,
    loadGameState,
    acheterInfrastructure,
    upgraderInfrastructure,
    acheterAmelioration,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
