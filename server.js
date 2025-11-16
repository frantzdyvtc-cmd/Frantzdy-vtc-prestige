const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const ORS_API_KEY = process.env.ORS_API_KEY;

// Convertir adresse → coordonnées
async function geocode(address) {
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}`;

    const response = await axios.get(url);
    const coords = response.data.features[0]?.geometry.coordinates;

    if (!coords) throw new Error("Adresse introuvable");

    return coords; // [lon, lat]
}

app.post("/api/calc-distance", async (req, res) => {
    try {
        const { startAddress, endAddress } = req.body;

        if (!startAddress || !endAddress)
            return res.status(400).json({ error: "Adresses manquantes" });

        // 1️⃣ Géocodage
        const startCoords = await geocode(startAddress);
        const endCoords = await geocode(endAddress);

        // 2️⃣ Appel calcul de distance
        const routeResponse = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            { coordinates: [startCoords, endCoords] },
            {
                headers: {
                    "Authorization": ORS_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        const distanceMeters = routeResponse.data.features[0].properties.summary.distance;
        const distanceKm = distanceMeters / 1000;

        // 3️⃣ Prix (exemple modifiable)
        const baseFare = 15; // frais de prise en charge
        const pricePerKm = 1.8; // tarif van haut de gamme
        const price = baseFare + (distanceKm * pricePerKm);

        res.json({ distanceKm, price });

    } catch (err) {
        console.error("Erreur serveur :", err.message);
        res.status(500).json({ error: "Impossible de traiter la demande" });
    }
});

// Port Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 API en ligne sur port ${PORT}`));
