//Librerias

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cheerio = require("cheerio");
const csv = require("csv-parser");
const fs = require("fs");

//Implementacion de Express

const app = express();
const PORT = 3000;
let dominiosLegitimos = new Set();


// MNiddlewares
app.use(cors());
app.use(express.json());

// Cargar lista de dominios legítimos desde el archivo CSV

const lineas = fs.readFileSync("top-1m.csv", "utf8").split("\n");
console.log("Cantidad de líneas:", lineas.length);

for (let linea of lineas) {

    const partes = linea.split(",");

    if (partes.length >= 2) {

        dominiosLegitimos.add(
            partes[1].trim().toLowerCase()
        );

    }

}
console.log("Dominios cargados:", dominiosLegitimos.size);
console.log(dominiosLegitimos.has("google.com"));
console.log(dominiosLegitimos.has("youtube.com"));
console.log(dominiosLegitimos.has("facebook.com"));


// Ruta Principal

app.get("/", (req, res) => {

    res.send("Servidor de SafeLink funcionando correctamente.");

});


// Analisis de enlaces

app.post("/analizar", async (req, res) => {

    try {

        const url = req.body.url;

        const urlObj = new URL(url);

        let dominio = urlObj.hostname
            .replace("www.", "")
            .toLowerCase();

        let dominioLegitimo =
            dominiosLegitimos.has(dominio);

        const respuesta = await axios.get(url);

        const html = respuesta.data;

        let muestraHTML = html.substring(0, 500);

        const $ = cheerio.load(html);

        const titulo = $("title").text();

        let formularios = $("form").length;

        let inputs = $("input").length;

        let camposPassword = $('input[type="password"]').length;

        let botonesSubmit = $('button[type="submit"]').length;

        let inputsSubmit = $('input[type="submit"]').length;

        let botonesEnviar = botonesSubmit + inputsSubmit;

        let cantidadIframes = $("iframe").length;

        let scriptsExternos =
            $('script[src]').length;

        let imagenes =
            $("img").length;

        let videos =
            $("video").length;

        let audios =
            $("audio").length;

        let metaRefresh =
            $('meta[http-equiv="refresh"]').length;

        let redireccionesJavaScript = 0;

        let totalEnlaces = $("a").length;

        let extensionesDescarga = [
            ".pdf",
            ".zip",
            ".rar",
            ".docx",
            ".exe",
            ".apk",
            ".msi",
            ".iso"
        ];

        let archivosDescargables = 0;

        let extensionesEncontradas = [];

        $("a").each((_, element) => {
            const href = $(element).attr("href");
            if (!href) return;
            const hrefLower = href.toLowerCase();
            for (let extension of extensionesDescarga) {
                if (hrefLower.endsWith(extension)) {
                    archivosDescargables++;
                    if (!extensionesEncontradas.includes(extension)) {
                        extensionesEncontradas.push(extension);
                    }
                    break;
                }
            }
        });

        $("script").each((_, element) => {

            const contenidoScript =
                $(element).html();

            if (!contenidoScript) return;

            if (
                contenidoScript.includes("window.location") ||
                contenidoScript.includes("location.href") ||
                contenidoScript.includes("location.replace")
            ) {

                redireccionesJavaScript++;

            }

        });

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
            archivosDescargables: archivosDescargables,
            extensionesEncontradas: extensionesEncontradas,
            cantidadIframes: cantidadIframes,
            scriptsExternos: scriptsExternos,
            metaRefresh: metaRefresh,
            redireccionesJavaScript: redireccionesJavaScript,
            imagenes: imagenes,
            videos: videos,
            audios: audios,
            dominio: dominio,
            esLegitimo: dominioLegitimo,

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje: "No fue posible acceder a la página."

        });

    }

});

// Servidor

app.listen(PORT, () => {

    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);

});