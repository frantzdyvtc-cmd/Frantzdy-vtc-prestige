const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const ORS_API_KEY = process.env.ORS_API_KEY;

// Tarifs
const TARIFS = {
  van: {
    prixKm: 2.08,
    prixMin: 1.0,
    minimum: 50,
  },
  berline: {
    prixKm: 1.8,
    prixMin: 0.8,
    minimum: 45,
  },
};

// Fonction de géocodage (adresse → [lon, lat])
async function geocode(address) {
  const resp = await axios.get(
    "https://api.openrouteservice.org/geocode/search",
    {
      params: {
        text: address,
        size: 1,
      },
      headers: {
        Authorization: ORS_API_KEY,
      },
    }
  );

  if (!resp.data.features || !resp.data.features[0]) {
    throw new Error("ADRESSE_INTRouvable");
  }

  const [lon, lat] = resp.data.features[0].geometry.coordinates;
  return { lon, lat };
}

// Route principale
app.post("/api/calc-distance", async (req, res) => {
  const { startAddress, endAddress, vehicleType } = req.body || {};

  if (!startAddress || !endAddress) {
    return res
      .status(400)
      .json({ error: "Merci de renseigner une adresse de départ et d’arrivée." });
  }

  try {
    // 1. Géocodage des adresses
    const [start, end] = await Promise.all([
      geocode(startAddress),
      geocode(endAddress),
    ]);

    // 2. Appel directions ORS
    const directionsResp = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        coordinates: [
          [start.lon, start.lat],
          [end.lon, end.lat],
        ],
      },
      {
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const feat = directionsResp.data.features?.[0];
    const summary = feat?.properties?.summary;

    if (!summary) {
      console.error("Réponse ORS inattendue:", directionsResp.data);
      return res
        .status(500)
        .json({ error: "Impossible de récupérer l’itinéraire (ORS)." });
    }

    const distanceMeters = summary.distance; // en mètres
    const durationSeconds = summary.duration; // en secondes

    const distanceKm = distanceMeters / 1000;
    const durationMin = durationSeconds / 60;

    // 3. Calcul du prix selon le type de véhicule
    const tarif =
      TARIFS[vehicleType] || TARIFS.van; // par défaut VAN si rien envoyé

    let prix =
      distanceKm * tarif.prixKm + durationMin * tarif.prixMin;

    if (prix < tarif.minimum) {
      prix = tarif.minimum;
    }

    // 4. Réponse JSON
    res.json({
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMin: Number(durationMin.toFixed(0)),
      price: Number(prix.toFixed(2)),
    });
  } catch (error) {
    console.error(
      "Erreur serveur :",
      error.response?.data || error.message || error
    );

    if (
      error.response?.data?.error === "ADRESSE_INTRouvable" ||
      error.message === "ADRESSE_INTRouvable"
    ) {
      return res
        .status(400)
        .json({ error: "Adresse de départ ou d’arrivée introuvable." });
    }

    // erreur de paramètre ORS (ex: text length > 0, etc.)
    const orsErr = error.response?.data;
    if (orsErr && orsErr.error && orsErr.error.code) {
      return res.status(500).json({
        error: "Erreur OpenRouteService, veuillez vérifier vos adresses.",
        details: orsErr,
      });
    }

    res.status(500).json({ error: "Erreur serveur." });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log("Serveur API opérationnel sur le port " + PORT)
);
