const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const ORS_KEY = process.env.ORS_API_KEY;

// Fonction pour obtenir les coordonnées avec ORS geocoding
async function geocode(address) {
    const url = `https://api.openrouteservice.org/geocode/search`;
    const response = await axios.get(url, {
        params: { text: address },
        headers: { Authorization: ORS_KEY }
    });

    if (!response.data.features || response.data.features.length === 0) return null;

    return response.data.features[0].geometry.coordinates; // [lon, lat]
}

app.post("/api/calc-distance", async (req, res) => {
    const { start, end } = req.body;

    try {
        const startCoords = await geocode(start);
        const endCoords = await geocode(end);

        if (!startCoords || !endCoords) {
            return res.status(400).json({ error: "Adresse non trouvée" });
        }

        const response = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            { coordinates: [startCoords, endCoords] },
            {
                headers: {
                    Authorization: ORS_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        const distanceMeters = response.data.features[0].properties.summary.distance;
        const durationSeconds = response.data.features[0].properties.summary.duration;

        return res.json({
            distanceKm: (distanceMeters / 1000).toFixed(2),
            durationMin: Math.round(durationSeconds / 60)
        });

    } catch (err) {
        console.error("Erreur serveur :", err?.response?.data || err);
        res.status(500).json({ error: "Erreur interne API" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("API opérationnelle sur le port " + PORT));
