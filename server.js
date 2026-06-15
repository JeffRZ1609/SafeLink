//Librerias

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cheerio = require("cheerio");

//Implementacion de Express

const app = express();
const PORT = 3000;


// MNiddlewares

app.use(cors());
app.use(express.json());


// Ruta Principal

app.get("/", (req, res) => {

    res.send("Servidor de SafeLink funcionando correctamente.");

});


// Analisis del Analisis

app.post("/analizar", async (req, res) => {

    try {

        const url = req.body.url;

        const respuesta = await axios.get(url);

        const html = respuesta.data;

        const $ = cheerio.load(html);

        const titulo = $("title").text();

        res.json({

            mensaje: "HTML obtenido correctamente.",
            longitudHTML: html.length,
            titulo: titulo

        });

    } catch (error) {

        res.status(500).json({

            mensaje: "No fue posible acceder a la página."

        });

    }

});

// Servidor

app.listen(PORT, () => {

    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);

});