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

        let muestraHTML = html.substring(0, 500);

        const $ = cheerio.load(html);

        const titulo = $("title").text();

        let formularios = $("form").length;

        let inputs = $("input").length;

        let camposPassword =
            $('input[type="password"]').length;

        let botonesSubmit =
            $('button[type="submit"]').length;

        let inputsSubmit =
            $('input[type="submit"]').length;

        let botonesEnviar =
            botonesSubmit + inputsSubmit;
        
        let totalEnlaces =
            $("a").length;
        
        
        
        res.json({

            mensaje: "HTML obtenido correctamente.",
            longitudHTML: html.length,
            htmlRecibido: muestraHTML,
            titulo: titulo,
            formularios: formularios,
            inputs: inputs,
            camposPassword: camposPassword,
            botonesEnviar: botonesEnviar,
            totalEnlaces: totalEnlaces,

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