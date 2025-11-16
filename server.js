const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const ORS_API_KEY = process.env.ORS_API_KEY;

// Fonction pour convertir une adresse en coordonnées
async function geocode(address) {
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}`;
    const response = await axios.get(url);
    return response.data.features[0].geometry.coordinates; // [lon, lat]
}

app.post("/api/calc-distance", async (req, res) => {
    const { startAddress, endAddress } = req.body;

    if (!startAddress || !endAddress) {
        return res.status(400).json({ error: "Les adresses sont obligatoires." });
    }

    try {
        // 1️⃣ Géocodage des adresses
        const startCoord = await geocode(startAddress);
        const endCoord = await geocode(endAddress);

        // 2️⃣ Calcul de l'itinéraire
        const response = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            { coordinates: [startCoord, endCoord] },
            {
                headers: {
                    Authorization: ORS_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        const distanceMeters = response.data.features[0].properties.summary.distance;
        const distanceKm = distanceMeters / 1000;
        const price = distanceKm * 2.08; // Ton tarif km

        res.json({ distanceKm, price });

    } catch (error) {
        console.error("Erreur ORS:", error.response?.data || error);
        res.status(500).json({ error: "Impossible de calculer la distance." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Serveur API opérationnel sur le port " + PORT));
