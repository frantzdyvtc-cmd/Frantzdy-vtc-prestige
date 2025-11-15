const express = require("express");
const axios = require("axios");
const app = express();
const path = require("path");
require("dotenv").config();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/calc-distance", async (req, res) => {
    const { start, end } = req.body;

    try {
        const response = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            {
                coordinates: [start, end]
            },
            {
                headers: {
                    Authorization: process.env.ORS_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        const distanceMeters = response.data.features[0].properties.summary.distance;
        const distanceKm = distanceMeters / 1000;

        res.json({ distanceKm });
    } catch (error) {
        console.error("Erreur ORS:", error.response?.data || error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.listen(10000, () => {
    console.log("Serveur en ligne sur port 10000");
});
