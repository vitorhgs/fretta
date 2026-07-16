const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/rota", async (req, res) => {
  try {
    const { coordinates } = req.body;

    if (!coordinates || coordinates.length < 2) {
      return res.status(400).json({ error: "Coordenadas inválidas" });
    }

    // OSRM espera: lng,lat;lng,lat;lng,lat
    const coordsString = coordinates
      .map((c) => `${c[0]},${c[1]}`)
      .join(";");

    const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return res.status(400).json({ error: "Rota não encontrada" });
    }

    res.json(data);
  } catch (error) {
    console.error("Erro backend:", error);
    res.status(500).json({ error: "Erro ao calcular rota" });
  }
});

app.listen(3001, () => {
  console.log("Servidor rodando em http://localhost:3001");
}); 