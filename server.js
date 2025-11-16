const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Fonction pour géocoder une adresse
async function geocode(address) {
    const url = `https://api.openrouteservice.org/geocode/search`;
    const response = await axios.get(url, {
        params: {
            api_key: process.env.ORS_API_KEY,
            text: address,
            size: 1
        }
    });

    if (!response.data.features.length) throw new Error("Adresse introuvable");

    const [lng, lat] = response.data.features[0].geometry.coordinates;
    return { lat, lng };
}

app.post("/api/calc-distance", async (req, res) => {
    const { start, end } = req.body;

    try {
        // Géocodage
        const startCoord = await geocode(start);
        const endCoord = await geocode(end);

        // Appel à l’API Directions
        const route = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            {
                coordinates: [
                    [startCoord.lng, startCoord.lat],
                    [endCoord.lng, endCoord.lat]
                ]
            },
            {
                headers: {
                    Authorization: process.env.ORS_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        const distanceMeters = route.data.features[0].properties.summary.distance;
        const distanceKm = distanceMeters / 1000;

        res.json({ distanceKm });

    } catch (error) {
        console.error("Erreur serveur :", error.response?.data || error.message);
        res.status(500).json({ error: "Impossible de calculer la distance." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🚀 Serveur API opérationnel sur le port " + PORT));
