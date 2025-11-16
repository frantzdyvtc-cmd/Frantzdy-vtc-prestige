const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const ORS_API_KEY = process.env.ORS_API_KEY;

// Fonction pour géocoder une adresse et obtenir lat/lon
async function geocode(address) {
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}`;

    const response = await axios.get(url);
    const features = response.data.features;

    if (!features || features.length === 0) {
        throw new Error("Adresse introuvable");
    }

    const [lon, lat] = features[0].geometry.coordinates;
    return { lat, lon };
}

app.post("/api/calc-distance", async (req, res) => {
    const { start, end } = req.body;

    try {
        const startCoord = await geocode(start);
        const endCoord = await geocode(end);

        const body = {
            coordinates: [
                [startCoord.lon, startCoord.lat],
                [endCoord.lon, endCoord.lat]
            ]
        };

        const result = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            body,
            {
                headers: {
                    Authorization: ORS_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        const summary = result.data.features[0].properties.summary;
        const distanceKm = summary.distance / 1000;
        const durationMin = Math.round(summary.duration / 60);

        res.json({ distanceKm, durationMin });

    } catch (error) {
        console.error("Erreur API :", error.message || error);
        res.status(500).json({ error: "Impossible de calculer la distance" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🚀 Serveur API prêt sur port", PORT));
