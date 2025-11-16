const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ROUTE : CALCULER DISTANCE + DUREE
app.post("/api/calc-distance", async (req, res) => {
    const { start, end } = req.body;

    if (!start || !end) {
        return res.status(400).json({ error: "Champs manquants" });
    }

    try {
        const ORS_API = process.env.ORS_API_KEY;

        // Étape 1 : Geocoding (convertir adresse → coordonnées)
        const geoStart = await axios.get(
            `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API}&text=${encodeURIComponent(start)}`
        );
        const geoEnd = await axios.get(
            `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API}&text=${encodeURIComponent(end)}`
        );

        const startCoords = geoStart.data.features[0]?.geometry?.coordinates;
        const endCoords = geoEnd.data.features[0]?.geometry?.coordinates;

        if (!startCoords || !endCoords) {
            return res.status(500).json({ error: "Adresse introuvable" });
        }

        // Étape 2 : Directions (distance + durée)
        const route = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            { coordinates: [startCoords, endCoords] },
            { headers: { Authorization: ORS_API, "Content-Type": "application/json" } }
        );

        const data = route.data.features[0].properties.summary;

        res.json({
            distanceKm: (data.distance / 1000).toFixed(2),
            durationMin: Math.round(data.duration / 60)
        });

    } catch (error) {
        console.log("Erreur serveur :", error.response?.data || error);
        res.status(500).json({ error: "Erreur lors du calcul" });
    }
});

// SERVER LAUNCH
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur opérationnel sur port ${PORT}`));
