const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Geocoding OpenRouteService request
async function geocode(address) {
  try {
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${process.env.ORS_API_KEY}&text=${encodeURIComponent(address)}`;
    const res = await axios.get(url);

    if (
      !res.data.features ||
      res.data.features.length === 0 ||
      !res.data.features[0].geometry
    ) {
      return null;
    }

    const [lon, lat] = res.data.features[0].geometry.coordinates;
    return { lat, lon };
  } catch (error) {
    console.error("Geocode error:", error.response?.data || error);
    return null;
  }
}

app.post("/api/calc", async (req, res) => {
  const { start, end, type } = req.body;

  if (!start || !end || !type) return res.status(400).json({ error: "Missing fields" });

  // Convert addresses to coordinates
  const startCoord = await geocode(start);
  const endCoord = await geocode(end);

  if (!startCoord || !endCoord) {
    return res.status(500).json({ error: "Adresse non trouvée" });
  }

  try {
    // Route request
    const orsResponse = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        coordinates: [
          [startCoord.lon, startCoord.lat],
          [endCoord.lon, endCoord.lat]
        ]
      },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    const summary = orsResponse.data.features[0].properties.summary;
    const distanceKm = summary.distance / 1000;
    const durationMin = Math.round(summary.duration / 60);

    // Price calculation
    let baseKm, baseMin, minFare;

    if (type === "van") {
      baseKm = 2.08;
      baseMin = 1;
      minFare = 50;
    } else if (type === "berline") {
      baseKm = 1.8;
      baseMin = 0.8;
      minFare = 45;
    } else {
      return res.status(400).json({ error: "Type véhicule invalide" });
    }

    let price = distanceKm * baseKm + durationMin * baseMin;

    if (price < minFare) price = minFare;

    res.json({
      distanceKm: distanceKm.toFixed(2),
      durationMin,
      price: price.toFixed(2),
    });

  } catch (error) {
    console.error("ORS error:", error.response?.data || error);
    res.status(500).json({ error: "Erreur lors du calcul de l'itinéraire" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🚀 API opérationnelle sur le port", PORT));
